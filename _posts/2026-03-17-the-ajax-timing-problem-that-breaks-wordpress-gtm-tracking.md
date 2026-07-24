---
date: 2026-03-17
layout: post
title: "The AJAX Timing Problem That Breaks WordPress GTM Tracking"
introduction: "Most WordPress GTM plugins push events from the wrong side of an AJAX request. The data layer fires, but GTM never sees it. This is the problem I set out to fix with WP Clean Data Layer, and the integration-specific timing solutions I built for Contact Form 7, Gravity Forms, and WooCommerce."
seo_title: "The AJAX Timing Problem That Breaks WordPress GTM Tracking"
seo_description: "Why Contact Form 7, Gravity Forms, and WooCommerce conversions go missing in GA4, and the WordPress plugin I built to fix the data layer timing for each one."
categories: ["architecture", "github projects"]
tags: []
---

Every WordPress GTM plugin I have used or audited makes the same architectural mistake. They hook PHP submission handlers and push to the data layer from the server side, assuming the push will reach GTM before the user sees a confirmation or the browser navigates away. That assumption is wrong for every major form plugin and for WooCommerce's AJAX cart flow. The data layer fires in a context where GTM is not listening, and the conversion vanishes.

I built [WP Clean Data Layer](https://github.com/d-voorhees/wp-clean-datalayer) to fix this for the integrations I kept encountering across client sites: Contact Form 7, Gravity Forms, and WooCommerce ecommerce events. The plugin is small (roughly 1,400 lines of PHP and 260 lines of JavaScript), and the interesting part is not the code itself but the reason each integration needs a different solution to the same timing problem.

## Schema is documented. Timing is where tracking breaks.

GA4's event specification is well documented. The required fields for a `purchase` event or a `form_submit` event are not ambiguous. Most plugins get the schema right. What they get wrong is the moment the push happens.

GTM reads `window.dataLayer` on the page where the event fires. If a PHP hook pushes an event during an AJAX request, GTM is not re-initialized on the response, and inline scripts in the AJAX response body may not execute in a GTM-compatible context. If the event fires right before a redirect (checkout to thank-you page, login to dashboard), the push lands on a document that is about to be replaced. GTM processes events on the current page. There is no carryover.

Pushing everything from PHP hooks and hoping for the best does not hold up. Getting tracking right requires understanding the async lifecycle of each plugin and choosing the right client-side event to listen for.

## What I tried first

Before building a plugin, I looked at what already existed. The GTM4WP plugin by Thomas Geiger is the most widely installed option and handles WooCommerce ecommerce tracking well. For sites that only need WooCommerce events, it is a reasonable choice. Where it fell short for me was form tracking. The plugin focuses on ecommerce and does not provide the same depth of integration for Contact Form 7 or Gravity Forms, which meant layering a second plugin for forms on top of GTM4WP and hoping the two did not conflict on event naming or data layer initialization order.

Google's own Site Kit plugin provides basic GA4 integration without GTM. It does not expose a data layer at all, which makes it useless for anyone who needs GTM triggers, custom event parameters, or ecommerce tracking beyond pageviews.

I also considered building the tracking outside a plugin entirely, using custom JavaScript in the theme or a GTM custom HTML tag. That works for a single site where you control the theme and the GTM container. It does not generalize across client sites with different themes, different form plugins, and different WooCommerce configurations. The value of a plugin here is that the timing logic is encapsulated and tested once, and every site gets the same behavior.

## Contact Form 7: the DOM event is the only reliable signal

Hooking `wpcf7_mail_sent` in PHP and pushing to the data layer from the AJAX response does not work. The response is not a full page load. GTM does not re-initialize, and the push lands nowhere useful.

The `wpcf7mailsent` DOM event in JavaScript is the reliable signal. CF7 fires this event after the mail is sent successfully, and it fires in the browser context where GTM is already running. The listener reads `event.detail.contactFormId` and pushes a `form_submit` event with the form ID and title.

The complication is that CF7 can be configured to skip AJAX entirely. When a site uses CF7's non-AJAX mode, the form submission is a standard POST, the page reloads, and the `wpcf7mailsent` event never fires. For that case, the plugin retains the PHP hook as a fallback: `wpcf7_mail_sent` stores the event payload in a short-lived cookie, and the core data layer script reads and clears that cookie on the next page load. The tradeoff is a one-pageload delay in tracking for non-AJAX submissions, but losing the conversion entirely is worse.

## Gravity Forms: the confirmation is the real event

Gravity Forms has a similar AJAX problem with different mechanics. The PHP hook `gform_after_submission` fires during the AJAX request, before the confirmation message renders. The user has not seen a success state yet, and the front end has no reliable signal that tracking should fire.

The correct listener is `gform_confirmation_loaded`, which fires after Gravity Forms injects the confirmation markup into the page. At that point, the user has seen the confirmation, the form ID is available, and GTM is running in the same browser context.

The secondary problem is that `gform_confirmation_loaded` does not carry entry metadata by default. The form ID is available, but the entry ID and form title are not. I solved this by hooking the `gform_confirmation` filter on the PHP side to inject entry metadata into the confirmation response HTML as a data attribute, so the JavaScript listener can read it when the confirmation loads. This keeps the listener's data source in the DOM rather than requiring a separate AJAX call to fetch entry details.

## WooCommerce: three different timing problems in one integration

WooCommerce is the most complex integration because the ecommerce funnel crosses multiple pages and multiple interaction types.

Add-to-cart on most themes is AJAX. The PHP `woocommerce_add_to_cart` action runs server-side, but no page load occurs. The plugin listens for WooCommerce's `added_to_cart` jQuery event, which fires after the cart fragments update. For themes that bypass jQuery's AJAX handling, there is a `fetch` observer fallback that watches for requests to the WooCommerce add-to-cart endpoint.

The purchase event has the opposite problem. The checkout page and the thank-you page are two different documents. Anything pushed to the data layer on the checkout page is gone when the thank-you page loads. The plugin handles this by queuing the purchase payload server-side (via the `DataLayer::queue` method) and injecting it into the thank-you page HTML before GTM's container snippet. The push is already in `window.dataLayer` when GTM initializes, so there is no timing gap.

Login and signup follow the same pattern as purchase. Authentication redirects to a new page, so the plugin stores a short-lived transient during the authentication hook and outputs the event payload on the next page load.

## The dead end: a generic AJAX interceptor

Before settling on per-integration listeners, I spent time on what seemed like a cleaner approach: a generic JavaScript layer that would intercept all AJAX responses, detect form submissions by response content, and push events automatically. The appeal was obvious. One piece of code covering all form plugins without needing to know their internal event names or confirmation flows.

It failed for two reasons. First, detecting "this AJAX response was a successful form submission" from the response body alone is unreliable. CF7 returns JSON with a `status` field. Gravity Forms returns HTML confirmation markup. Other form plugins return different structures. Parsing all of them generically meant maintaining a brittle detection layer that was more complex than the per-integration listeners it was supposed to replace.

Second, and more fundamentally, the generic approach could not distinguish between a successful submission and an intermediate step. Gravity Forms multi-step forms fire AJAX requests between steps. WooCommerce fires AJAX requests for coupon application, shipping calculation, and cart updates. A generic interceptor would need negative rules for every interaction type that is not a conversion, and that list grows every time a plugin updates its AJAX behavior.

Per-integration listeners are more code to maintain, but each one is small, obvious, and testable in isolation. The maintenance cost is predictable; the generic approach's maintenance cost would have grown with every plugin update.

## Schema enforcement as a design choice

Every data layer push routes through a central `EventPayload` value object, and that constraint turned out to be one of the most useful decisions in the plugin. Each integration builds a payload, passes it to `DataLayer`, and `DataLayer` validates the required fields against the GA4 spec before pushing. If a required field is missing, the push fails at the PHP layer with a logged error rather than silently sending a malformed event to GA4.

GA4 accepts almost anything you push to it. That flexibility is useful during development and dangerous in production. A purchase event with no `transaction_id` will show up in GA4 reports as a conversion with no associated revenue. A form submission with no `form_id` will count but will be impossible to segment. The schema enforcement layer catches these before they become reporting problems.

## What changed

The plugin runs on client sites where I previously had to diagnose and fix tracking gaps on a per-site basis. The pattern that used to take a few hours of per-site debugging (figure out which form plugin, find the right client-side event, write the listener, test in GTM Preview) is now a plugin activation and a settings toggle. The event reference in the docs gives the GTM trigger configuration for every event, so the setup on the GTM side is documented rather than tribal knowledge.

## The transferable part

The lesson from this project is that "data layer" problems are almost never about the data. The schema is documented. The fields are known. The problem is timing, and timing is integration-specific. There is no generic solution to "when does this plugin consider a form successfully submitted from the browser's perspective." Each plugin has its own answer, and the only way to get tracking right is to listen for that specific answer in the specific context where GTM can hear it.

The code is at [github.com/d-voorhees/wp-clean-datalayer](https://github.com/d-voorhees/wp-clean-datalayer).
