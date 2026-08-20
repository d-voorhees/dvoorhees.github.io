---
layout: page
title: "About"
seo_title: "About"
seo_description: "Full-stack engineer and technical diligence consultant building reliable integrations, automations, data pipelines, and evidence-based technical systems."
permalink: /about/
---

# About

I design and ship reliable integration and operational systems for businesses whose critical workflows cross multiple platforms. I work from technical discovery and data-model decisions through implementation, production failure handling, and documentation.

I build full-stack products, API-driven tools, workflow automation, data pipelines, and production web infrastructure. The goal is not merely to connect systems: it is to turn ambiguous business problems and technical risk into reliable, usable workflows with clear ownership and evidence.

I have led technical work on hundreds of engagements crossing ecommerce platforms, payment processors, fulfillment systems, analytics tools, internal databases, custom applications, CRMs, and ERPs.

## What I actually build

Most of my work starts after a business has outgrown the idea that a website is just a website.

A storefront becomes the point where orders move to fulfillment, inventory is reconciled across locations, payment status reaches finance, and customer data flows into a CRM. A WordPress installation, HubSpot portal, Airtable base, or custom application becomes part of the operational system.

I design and build the integration layer around those realities:

- API integrations, webhooks, background jobs, and scheduled reconciliation
- Data models that make ownership and write permissions clear
- Operational tools and reports that expose drift, exceptions, and failure
- Full-stack applications for customer-facing and internal workflows
- Analytics and attribution systems that trace every number back to one source, so decision data does not need a second check before someone acts on it
- Practical AI tools, built only where a conversational interface actually beats a form or a dashboard for the task at hand

I do not treat an integration as “connected” when an API call succeeds. I establish the system of record, model ownership, make retries idempotent, surface conflicts, preserve evidence, and give operators a way to see and recover from failure.

## How I approach systems

I start with the actual operating question. The platform and feature list come later.

Who needs to make a decision, and what workflow are they trying to complete? Which system owns each piece of data? Eventually a dependency fails, and whoever inherits the system next needs evidence for why it behaves the way it does.

That leads to a few defaults in my work:

- One clear owner for each important data domain. Shared ownership sounds collaborative, but it usually means no one is accountable when something breaks.
- Automation stays bounded, with failure states you can actually see. Unbounded automation is faster to build and much harder to debug at 2 a.m.
- Retries and conflicts get handled by explicit design decisions, made before the platform's defaults decide for you. Reconciliation follows the same rule, and it takes real time up front that is tempting to skip when the deadline is tight.
- Security scales to what the system can actually reach. Overprovisioned access is the easiest corner to cut under a deadline, and the most expensive one to fix later.
- Interfaces match how people already work, even when that means more integration effort than building to the cleanest data model.
- Documentation answers the next maintainer's real questions. Writing it well takes time nobody budgets for, so it is usually the first thing cut.

## Selected systems

These are public, documented examples of the kind of work I do: turn an ambiguous operating problem into a bounded technical system with clear data ownership, failure behavior, and a usable decision or recovery path.

### [Veritech Scan](https://github.com/d-voorhees/veritech-scan)

An evidence-first technical pre-screening platform for web-business acquisitions. It turns an authorized public-web scan into a traceable Technical Acquisition Brief, combining bounded collection, deterministic rules, a risk register, and operational controls around safety, cost, and failure handling.

### [WooCommerce Multi-Location Inventory Sync](https://github.com/d-voorhees/woo-multilocation-inventory-reference)

A reference architecture for inventory workflows where a storefront and an ERP can update stock concurrently. It uses authenticated webhooks, asynchronous processing, idempotency, conflict-resolution strategies, reconciliation, and a dead-letter queue so operators can review failures rather than lose inventory state.

### [Streaming AI Chat Tool in PHP](https://github.com/d-voorhees/streaming-ai-chat-php)

A production-deployed pattern for fitting a gated, streaming AI workflow into shared PHP hosting and an existing CRM/signup flow. It combines HMAC access tokens, server-side SSE streaming, CRM tagging, spend limits, rate controls, and an operator-facing usage dashboard.

### [HubSpot ↔ Airtable Sync](https://github.com/d-voorhees/hubspot-airtable-sync)

A two-way TypeScript sync engine for HubSpot custom objects and Airtable. It makes the integration contract explicit through stable IDs, adapter boundaries, timestamp-based conflict resolution, rate-aware writes, and a per-record audit log.

### [Bird by Bird](https://github.com/d-voorhees/bird-by-bird)

A deployed full-stack application built with Next.js, Django, GraphQL, and PostgreSQL. It demonstrates end-to-end product delivery, cookie-based authentication, data and API design, and production reliability work around dropped database connections and concurrent updates.

## What I write about here

This is a working engineering blog built from projects as they actually went, failures included. I write about full-stack applications, integrations, operational reporting, data reliability, WordPress and WooCommerce systems, applied AI, deployment, security, and documentation—especially the system decisions that become expensive after a business starts depending on them.

If you are new here, start with the projects above or browse the posts on integration, reliability, data modeling, and internal tools.

## Background

Before Medium & Message, I ran a digital newsroom website in the Fortune Top 25. I also taught Statistics and Macroeconomics at the college level.

Those experiences still influence how I work. Editorial discipline makes me care whether an explanation is actually clear, and statistics left me wary of false certainty. Years of client work taught me to ask whether a system still works after the original builder is gone.

## Stack

I work primarily in JavaScript, TypeScript, Python, PHP, SQL, PostgreSQL, MySQL, React, Next.js, Django, GraphQL, WordPress, WooCommerce, GA4, GTM, and cloud deployment tooling. I am a regular user of Claude Code and Cursor.

## Contact

[d@dvoorhees.com](mailto:d@dvoorhees.com)
