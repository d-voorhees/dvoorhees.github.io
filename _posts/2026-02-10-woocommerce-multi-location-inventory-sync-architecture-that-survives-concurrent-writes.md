---
date: 2026-02-10
layout: post
title: "WooCommerce Multi-Location Inventory Sync Architecture That Survives Concurrent Writes"
introduction: "WooCommerce tracks one stock number per SKU. Multi-location retailers need inventory that handles concurrent writes from an ERP, a POS, and online sales without losing data. This is the architecture I built, the conflict resolution strategies I shipped, and the reconciliation decision I almost got wrong."
seo_title: "WooCommerce Multi-Location Inventory Sync Architecture That Survives Concurrent Writes"
seo_description: "How to sync WooCommerce inventory across multiple retail locations with webhook ingestion, conflict resolution, and daily ERP reconciliation."
categories: ["architecture", "github projects"]
tags: []
---

WooCommerce tracks a single stock quantity per SKU. That works for a warehouse. It stops working the moment inventory lives in seven physical retail locations, a point-of-sale system writes adjustments from the register, and online orders decrement the same pool. Native WooCommerce and the marketplace plugins that add location pickers do not solve the hard problems: what happens when two systems write to the same SKU at the same time, what happens when the webhook retries, and what happens when your own sync logic has a bug.

I built a [reference implementation](https://github.com/d-voorhees/woo-multilocation-inventory-reference) of the architecture that handles those cases. It is not a turnkey plugin. It is the patterns extracted from real integrations across seven retail locations, rebuilt as reviewable public code with documentation explaining why each piece exists.

## The constraints that shape the architecture

A seven-location brick-and-mortar retailer with a few thousand active SKUs is not a high-throughput engineering problem. The volume is modest. The difficulty is in the write conflicts and the failure modes.

The ERP is the system of record for inventory. Register adjustments happen at the POS. Online orders happen on WooCommerce. All three can write to the same SKU within seconds of each other. A register clerk does a cycle count and corrects stock at location three while a customer buys the last unit online. The webhook carrying the cycle count arrives after WooCommerce has already decremented.

Any architecture that processes webhooks synchronously (validate and update stock inline, return 200) breaks under this scenario. The webhook sender times out on a slow WooCommerce response. A retry arrives after the first request already wrote. Two workers process the same SKU and one overwrites the other.

## Webhook ingestion: validate, persist, queue, 202

The inbound webhook endpoint does four things and returns immediately. First, HMAC signature validation confirms the sender. The raw event with its `event_id` goes into a custom table. A processing job gets enqueued via Action Scheduler. Then the endpoint returns a 202.

No stock writes happen during the request. No business logic runs. The webhook sender gets a fast response regardless of how long processing takes, and the `event_id` in the event table means a duplicate POST from a network retry never schedules a second job.

This is the pattern I have seen break most often in WooCommerce integrations. Developers process the webhook inline because it feels simpler, and it is simpler until the ERP retries a timed-out request and two stock writes race each other.

## Why Action Scheduler

WooCommerce already ships Action Scheduler. Using it for the processing queue means retries, admin-visible job status, and job grouping work without operating Redis, RabbitMQ, or any second queue infrastructure. The tradeoff is throughput. Very high-volume catalogs (tens of thousands of SKU updates per hour) need a dedicated Action Scheduler runner process and possibly the high-volume plugin. For seven retail locations and SKU counts in the low tens of thousands, the built-in runner is sufficient.

I evaluated a custom database queue as well. It would have given more control over job priorities and batch processing, but it would also have meant reimplementing retry logic, failure tracking, and admin visibility that Action Scheduler already provides. The build cost of a custom queue only makes sense when Action Scheduler's limitations are the actual bottleneck, and they were not for this use case.

## The conflict resolution problem

Two strategies ship with the reference implementation: last-writer-wins and delta merge. Choosing between them is the decision that most determines whether a multi-location sync loses data or preserves it, and the correct choice depends entirely on who writes.

**Last-writer-wins** compares source timestamps and keeps the most recent absolute value. If the ERP says location three has 14 units and WooCommerce says it has 12, the newer timestamp wins. This is simple, auditable, and correct when the ERP is authoritative and WooCommerce is read-mostly. The ERP pushes absolute stock levels, and WooCommerce accepts them.

**Delta merge** applies relative changes from each source. If the ERP says "add 10 to location three" and WooCommerce says "subtract 1 from location three," both changes apply regardless of order. This is required when online sales and register adjustments both write. Absolute overwrites from the ERP would erase the online sale's decrement if the ERP's snapshot was taken before the sale.

## The part I built wrong first

My first implementation defaulted to delta merge everywhere, reasoning that it was the safer strategy because it preserves all writes. That reasoning was wrong in a specific and instructive way.

Delta merge requires every source to send increments, not absolute values. If the ERP sends absolute stock levels (which most ERPs do by default), treating those absolutes as deltas causes stock to drift. An ERP message saying "location three has 14 units" gets interpreted as "add 14 units to location three," and the stock inflates on every sync cycle.

The fix was recognizing that the choice between strategies is not about safety in the abstract. It maps directly to the message format: if the source sends absolute values, use last-writer-wins. If the source sends deltas, use delta merge. And if different sources send different formats (the ERP sends absolutes, WooCommerce sends order decrements), the resolver needs to know which format each source uses.

The shipped version implements both strategies behind a `ResolverInterface` and lets the configuration specify which resolver to use. The documentation in `docs/conflict-resolution-strategies.md` explains the write-direction dependency, because getting the strategy wrong silently corrupts stock rather than failing loudly.

## Per-product locking

When two Action Scheduler jobs fire for the same SKU concurrently, the resolver needs to see consistent state. WordPress transients provide a cheap, single-node lock: before writing, the processor attempts to set a transient keyed to the SKU. If the transient already exists, the job backs off and retries. If it does not, the job acquires the lock, processes, and deletes the transient.

The tradeoff is multi-node WordPress. Transients stored in the database work across nodes, but transients stored in an object cache (Memcached, Redis) are node-local unless the cache is shared. Production deployments need Redis-backed transients with a shared cache. The reference implementation documents this constraint and works correctly in both configurations, but the default Docker environment is single-node, so the object-cache edge case requires manual setup to test.

## Reconciliation: compare only, never auto-heal

The daily reconciliation job pulls current stock from the mock ERP for every active SKU, compares it against WooCommerce's per-location meta, and records discrepancies. It does not auto-correct.

Auto-healing is tempting and dangerous. If the discrepancy is caused by a legitimate timing gap (a webhook in the queue that has not processed yet), auto-healing overwrites good data with stale data. If the discrepancy is caused by a bug in the sync logic itself, auto-healing applies the sync logic again and makes the problem worse. In both cases, the correction happens silently, with no record of what the state was before the fix.

Compare-only reconciliation generates a Markdown report that operations can review. A human decides whether the discrepancy is a timing gap, a sync bug, or a real inventory error. The dead-letter queue provides the other half of the picture: payloads that failed processing are visible in WordPress admin with enough context to diagnose what went wrong.

I was initially planning to include an auto-heal mode behind a configuration flag. The further I got into the failure scenarios, the clearer it became that the compare-only approach was the correct default, and that auto-heal was the kind of feature that sounds responsible until it runs unsupervised at 2 AM and overwrites stock for 40 SKUs.

## The dead-letter queue

Any inbound event that fails after retry lands in a dead-letter store, visible on a dedicated WordPress admin page. Each entry shows the original payload, the error, the timestamp, and a replay button.

The replay button re-enqueues the event as a new Action Scheduler job. This covers the most common failure mode: the ERP was temporarily unreachable when the outbound sync tried to confirm receipt. Replay after the ERP recovers processes the event without manual API calls or database surgery.

The dead-letter page is also the canary for sync logic bugs. If the same payload type keeps landing in the dead letter queue, the problem is in the resolver or the payload validator, and the entries provide the exact input needed to write a regression test.

## The mock ERP

The reference implementation includes a small Express server that simulates an external inventory system. It accepts inbound stock queries, returns current state, and introduces intentional latency (up to 3 seconds per request) and random failures (5% of requests return a 500). The latency and failure rate are configurable.

The mock ERP exists because testing sync architecture against a polite, fast, always-available service proves nothing useful. The architecture needs to survive slow responses, dropped connections, and intermittent errors. The mock makes those conditions reproducible.

## What this demonstrates

The architecture here covers the scenarios that break simple WooCommerce inventory integrations: concurrent writes from multiple sources, network retries producing duplicate events, ERP slowness blocking webhook senders, and reconciliation gaps between systems. The code is PHP running on WordPress with Action Scheduler, which is the stack a WooCommerce retailer already operates. The documentation explains why each pattern exists, because the patterns are the transferable part. The ERP changes, the location count changes, the SKU volume changes. The need for idempotent intake, conflict-aware resolution, and human-reviewed reconciliation does not.

The code is at [github.com/d-voorhees/woo-multilocation-inventory-reference](https://github.com/d-voorhees/woo-multilocation-inventory-reference).
