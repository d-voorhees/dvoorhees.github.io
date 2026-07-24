---
date: 2026-05-12
layout: post
title: "Auditing GA4 Attribution in Code: Duplicate Conversions, Channel Discrepancies, and UTM Drift"
introduction: "GA4's interface can show you one attribution problem on one day. It cannot show you the same five problems across 30 days, three data sources, and a client-ready report. This is the toolkit I built to run those audits programmatically, and the decisions behind the duplicate detection logic, sample data design, and report structure."
seo_title: "Auditing GA4 Attribution in Code: Duplicate Conversions, Channel Discrepancies, and UTM Drift"
seo_description: "A Python toolkit for catching GA4 attribution errors at scale: duplicate conversions with CallRail, channel discrepancies with Google Ads, and UTM inconsistencies, with client-ready report output."
categories: ["architecture", "github projects"]
tags: []
---

Attribution errors in GA4 hide well. A phone call conversion that fires in both GA4 and CallRail does not announce itself as a duplicate. A Google Ads click that GA4 assigns to Direct shows the same session count and the same conversion number as every other session. A campaign source spelled three different ways across UTM parameters looks like three small campaigns with modest results, when the combined total would change the channel mix calculation.

You can find any one of these in the GA4 interface. Open Explorations, build the right dimensions and filters, compare against the Google Ads report, and check for casing inconsistencies in the source/medium report. That works for one check on one day. It does not work when you need the same five checks run across 30 days of data, cross-referenced against CallRail call logs and Google Ads campaign data, with output a marketing manager can read.

I built [ga4-attribution-audit](https://github.com/d-voorhees/ga4-attribution-audit) to run those checks programmatically. It runs five audits across three data sources and produces markdown or HTML output. The toolkit runs against included sample data with zero credentials, so the output is evaluable without connecting a live GA4 property.

## The audits and why each exists

Five checks cover the attribution problems I have seen cause the most damage to budget decisions.

Duplicate conversion detection cross-references GA4 conversion event timestamps against CallRail call start times. Phone call tracking is the most common source of double-counted conversions. A user clicks a dynamic number on the site, CallRail records the call, and GA4 records a conversion event from the GTM tag. Both are measuring the same customer action, and the marketing team's cost-per-acquisition calculation is off by the number of duplicates.

Channel discrepancy reporting compares GA4's default channel grouping against Google Ads campaign attribution for the same sessions. Google Ads knows a click happened from a specific campaign. GA4 may assign that session to Direct or Organic if auto-tagging failed, if the landing page stripped the GCLID, or if the session timed out and restarted before the conversion. The audit matches conversions across both systems and flags mismatches.

Attribution gap detection surfaces three patterns: conversions tagged as Direct/none (which often mask untagged email, social, or referral traffic), high-traffic landing pages with no UTM parameters (making channel ROI impossible to calculate for traffic arriving on those pages), and conversions that fall outside the configured attribution window.

Conversion event hygiene inventories every event in the property with counts and share of total. Events firing hundreds of times per day relative to actual conversions are usually misconfigured GTM triggers. Configured conversion events with zero activity over the audit period are likely deprecated in practice but still marked as conversions in GA4 admin.

UTM consistency surfaces casing variants and non-standard medium values. GA4 treats `Facebook`, `facebook`, and `FaceBook` as three sources. Medium values like `print` or `flyer` may be intentional (offline campaign tracking) or accidental (someone typed a UTM by hand). The audit groups variants so the reviewer can decide which are real and which are errors.

## The duplicate detection matching problem

The core question in duplicate conversion detection is the time window. A GA4 conversion event and a CallRail call record refer to the same customer action if they happen close enough together. The question is how close.

My first implementation used a strict 60-second window. If the GA4 event and the CallRail call were more than a minute apart, they were treated as separate actions. That caught obvious duplicates but missed a common pattern: a user loads the page, sees the phone number, browses for a few minutes, and then calls. The CallRail call might start three or four minutes after the GA4 page conversion event. A 60-second window misses that entirely.

Widening the window to 10 minutes caught those cases but introduced false positives. A user who converts online and then calls the store with a question about their order five minutes later is two separate actions, and the audit was flagging them as duplicates.

The shipped default is five minutes, exposed as a configuration parameter (`duplicate_window_minutes`). Five minutes is a judgment call, and I am direct about that in the documentation. The right value depends on the client's site, their conversion flow, and how long their phone calls typically take to initiate after page load. The configurable parameter means the analytics engineer running the audit can adjust based on what they know about the business, rather than accepting a hard-coded assumption.

## Sample data as a design decision

The toolkit includes sample CSV files for GA4, CallRail, and Google Ads, along with a sample configuration and a committed sample report for a fictional e-commerce client called Harbor Goods. Running `ga4-audit sample` generates the full audit report from this data with no credentials, no API setup, and no real account required.

The sample data is not random. The fictional audit tells a specific story: Harbor Goods ran spring sale campaigns across Google Ads and Facebook. Phone call conversions double-counted because both GA4 and CallRail tracked the same calls. Two CallRail calls had no matching GA4 session at all, indicating broken dynamic number insertion or missing GTM on those pages. Several Google Ads purchases showed up as Direct in GA4. UTM casing inconsistencies split Facebook reporting into three source entries.

Every issue in the sample data represents a real pattern I have seen on client properties. The sample report reads like a real client deliverable because the underlying data mimics real attribution errors, including the ones that are subtle enough to miss in the GA4 interface.

The decision to invest time in realistic sample data came from a practical problem: reviewers evaluating the tool (whether hiring managers, potential collaborators, or agency engineers) need to see what the output looks like before committing to connecting their own GA4 property. A `ga4-audit sample` command that produces a professional-looking report in under two minutes removes that barrier entirely.

## CSV-first, API-optional

The toolkit accepts data via CSV export or live API pull. CSV is the default mode.

Most agency analytics engineers already export GA4 and Google Ads data to CSV for client work. Making CSV the primary input means the toolkit runs without service account credentials, OAuth configuration, or API quota management. The setup cost is zero: export the files, point the configuration at them, run the audit.

API mode exists for teams that want automated or scheduled runs. The GA4 Data API client in Python is mature and the Google Ads API integration is well-documented. But requiring API setup as a prerequisite to first use would have eliminated the "run this in two minutes and see if it is useful" path. The CSV-first approach keeps that path open.

## Report structure

Reports render in markdown or HTML. Both formats are structured around the same template: an executive summary with issue counts by severity, then one section per audit with methodology, findings, and specific records.

The methodology note in each section is intentional. A marketing manager receiving this report needs to know what the audit checked and what its limitations are. A channel discrepancy finding is more useful when the report says "we matched GA4 sessions to Google Ads clicks by timestamp and landing page, and these sessions had different channel assignments" than when it says "15 channel discrepancies found" with no explanation of how the match was made.

The template iterates all audit results automatically. Adding a new audit module (a Python file with a `run(data: AuditData) -> AuditResult` function, registered in `AUDIT_MODULES`) adds a new section to the report with no template changes.

## What I would build differently

The current audit modules operate independently. Each one pulls from the loaded data, runs its checks, and returns results. There is no cross-audit analysis: the duplicate detection audit and the channel discrepancy audit do not share information about which sessions they each flagged. In practice, a session with a channel discrepancy is also more likely to have a duplicate conversion (because the tracking issues that cause one often cause the other), and a combined view would surface correlated problems that the individual audits miss.

I chose independent modules because they are simpler to test, simpler to reason about, and simpler to extend. A new audit does not need to understand the output format of any existing audit. The tradeoff is that correlated findings require the human reviewer to notice the pattern across sections, which is exactly the kind of cross-referencing the toolkit was supposed to automate. A future version could add a correlation layer that runs after all audits complete, taking their results as input rather than modifying their internal logic.

## The part that requires human judgment

Attribution auditing surfaces problems. It does not decide what to do about them. A channel discrepancy between GA4 and Google Ads requires investigating auto-tagging configuration, UTM parameters, and cross-domain tracking on the specific site. A duplicate conversion requires deciding which system (GA4 or CallRail) is the source of truth for that conversion type. A UTM casing inconsistency requires deciding whether `facebook` and `Facebook` should be merged or whether they represent intentional segmentation.

The toolkit is designed around this constraint. The report presents findings with context and methodology. The remediation is the analytics engineer's job, because the correct fix depends on the specific implementation, the specific client, and the specific business rules. Automating the detection saves hours of manual cross-referencing. Automating the remediation would require assumptions about the client's tracking architecture that the toolkit does not and should not make.

The code is at [github.com/d-voorhees/ga4-attribution-audit](https://github.com/d-voorhees/ga4-attribution-audit).
