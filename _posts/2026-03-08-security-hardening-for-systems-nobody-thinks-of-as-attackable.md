---
date: 2026-03-08
layout: post
title: "Security Hardening for Systems Nobody Thinks of as Attackable"
introduction: "The systems that get breached are rarely the ones everyone was already worried about. They are the internal tools nobody thought to harden, because they were not customer-facing. That is where the real exposure lives."
seo_title: "Security Hardening for Internal Systems and Integration Layers"
seo_description: "Public-facing sites get security attention by default. Internal tools, webhook handlers, and integration endpoints often do not. This is where the real exposure lives, and why it matters more for internal tooling, not less."
categories: ["methods & strategy", "integrations"]
---

# Security Hardening for Systems Nobody Thinks of as Attackable

Public-facing websites have a certain kind of security discipline built into how they get budgeted and how they get built. There is a login page, so somebody thinks about password policy. There is a checkout form, so somebody thinks about PCI compliance. There is a contact form, so somebody thinks about spam and bots. 

Internal systems do not get that same treatment, and this is where the actual potential exposure often lives.

The webhook handler that receives inventory updates from the fulfillment platform. The admin panel that only three people use, protected by a password one of them wrote on a sticky note. The API endpoint that pulls customer data into the CRM every night, authenticated with a token that was generated three years ago and has never been rotated. None of these are customer-facing. All of them, in my experience, are the places where the security work is thinnest and the potential blast radius is widest.

## The webhook that had no authentication

A client had a WooCommerce store integrated with an external fulfillment platform. Orders placed on the store were sent to the fulfillment platform via a webhook, and the fulfillment platform sent status updates back the same way. The system had been running for two years when I was brought in to work on something unrelated, and in the course of tracing an unrelated bug I looked at the return webhook and noticed there was no authentication on it at all. Any request that arrived at the endpoint URL, from any source, would be processed as if it had come from the fulfillment platform.

The endpoint URL was not published anywhere. This was the security model. Obscurity as a control.

An attacker who guessed or discovered the URL could send arbitrary fulfillment updates to the store. They could mark orders as shipped that had not been shipped. They could inject fake tracking numbers. They could, depending on how the store handled certain edge cases, cause refunds to be processed. None of this was theoretical. The endpoint was live, it accepted anything, and the store trusted it completely.

The fix was three things. First, the fulfillment platform actually did support signed requests, using an HMAC signature in a header. That had been documented in their integration guide, on a page nobody had read when the original build had been done. Second, the endpoint was moved behind a hard-to-guess path segment, not as the primary control, but as an additional layer. Third, all requests to the endpoint were now logged, with source IP and payload, so that anomalies could be detected after the fact even if they got through the other controls.

The whole change took less than a day. The exposure it closed had been open for two years.

## The class of problem

The webhook example is one instance of a broader pattern. Internal systems and integration endpoints are treated as trusted because they are supposed to be talking to trusted partners, and the trust gets built into the system as a default rather than as an earned property that is verified at every request. The signed-webhook problem is one version. Other versions I have run into repeatedly include:

Over-permissioned API keys are the most common version. I inherited a Zapier integration once that only ever needed to read order totals from a payment processor's API, and the key behind it had full read-write access to refunds, payouts, and account settings, because that was the default scope in the interface where the key had been generated years earlier and nobody had gone back to narrow it.

Long-lived tokens that never rotate are close behind. On that same client's stack, a token generated at project kickoff was still authenticating a nightly sync three years later. It had been pasted into a Slack thread at least once during an unrelated debugging session, and it was sitting in plaintext in an `.env` file that had, at some point, been committed to a private repository and never scrubbed from the history.

The third version is quieter and harder to catch in a code review: integration layers that write to production databases without validating what comes in, because the sender is a trusted partner and trusted partners are assumed to send well-formed data. The fulfillment webhook from the earlier example did exactly this — before the fix, it would have accepted a malformed tracking number or an out-of-range order ID with no complaint, because nobody had ever asked what should happen if the trusted sender sent garbage.

None of these are exotic. All of them show up regularly. All of them are invisible to a security review that focuses on the public-facing bits, because none of them are public-facing. And all of them have deeper access to sensitive data than the login page does, because they exist to move that data around.

## What I actually run before shipping

What I actually run before an integration goes into production isn't a document, it's a habit of asking the same handful of things out loud until the answers stop being comfortable. The one I lead with is who or what can actually call this endpoint — if the honest answer is "anyone who knows the URL," that isn't an answer, it's the same obscurity-as-security model that left the fulfillment webhook open for two years.

From there I want to know what credentials the integration is holding and whether they're scoped to the smallest set of permissions it actually uses, because a credential with more access than its job requires is a defect sitting there waiting for the day something else goes wrong nearby. I check what gets logged, since an attack that succeeds against a system with no logging is invisible until its effects surface somewhere downstream, sometimes weeks later. And I ask about rotation — not whether the credentials could be rotated, but whether there's an actual scheduled date for the next rotation, because "yes, we could" and "yes, it's scheduled" are different answers with very different track records.

I don't run all of this with equal weight on every integration. A low-stakes internal tool reading non-sensitive data through a single trusted API doesn't need the same rotation cadence and logging depth as something touching customer records or payment data — treating every integration as maximum-stakes burns time that should go toward the ones that actually carry risk. The judgment call is sizing the response to what the integration can actually touch, not applying a uniform checklist regardless of stakes.

None of this is OWASP Top 10 recitation. OWASP is useful for orienting; it is not a substitute for asking, of this specific integration, what actually happens if it gets called by someone who should not be calling it. That question is boring and specific and has to be asked one system at a time. Nobody enjoys asking it. It is exactly where the work is.

## Why this matters more, not less, for internal tooling

The public-facing exposure is bounded by what a random visitor to the website can do. It is not small, but it is bounded, and there is usually a decent amount of monitoring on it. The internal attack area, especially for systems that talk to each other, is often bounded by nothing. An integration layer that has read access to the customer database, write access to the fulfillment system, and API access to the CRM is a system that can, if compromised, do more damage in an afternoon than a public-facing SQL injection could do in a week. And it will do that damage from a source that everyone in the organization has been told to trust.

The webhook sat open for two years not because anyone decided the risk was acceptable, but because nobody had been assigned to ask about it — it wasn't on the list of things that got security attention, because it wasn't customer-facing. That is the actual failure mode I watch for now: not a bad decision, but the absence of anyone whose job it was to make one.
