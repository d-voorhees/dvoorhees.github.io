---
layout: page
content_class: about-document
title: "About"
seo_title: "About Danielle Voorhees | Technical Project Manager & Software Engineer"
seo_description: "Danielle Voorhees, PMP and Certified ScrumMaster. Technical project delivery and software engineering across more than 100 software, web, and IT engagements since 2013."
author: "Danielle Voorhees"
permalink: /about/
---

# About

I am Danielle Voorhees, a Technical Project Manager and software engineer. Since 2013, I have worked across more than 100 software, web, and IT engagements, taking technical work from discovery and planning through implementation and delivery. I stay close to the engineering because scope, risk, and delivery decisions depend on understanding how a system actually behaves.

At Medium & Message, I work in software engineering and technical consulting. Through Veritech Diligence, I provide technical due diligence and buy-side technical advisory for business acquisitions. Across both, the work starts with an operating question: what does someone need this system to do, and what evidence will tell them it is working?

Most of my projects begin after a business has outgrown the idea that a website is just a website. Orders need to reach fulfillment, inventory needs reconciliation, and payment or customer data needs to reach the right people. I build full-stack applications, integrations, workflow automation, data pipelines, and reporting around those realities.

## How I work

Discovery, requirements, scope, scheduling, stakeholder communication, risk management, and change control are part of the technical work. I identify dependencies, explain tradeoffs, and assess how changed requirements affect timing and implementation. A delivery plan needs to account for testing, documentation, and handoff alongside the code.

I establish which system owns each piece of data and who can change it. An integration is not finished when an API call succeeds: retries need to be idempotent, conflicts need explicit rules, and operators need a way to see and recover from failure. Security follows what the system can actually reach; automation stays bounded enough to inspect when something goes wrong.

I prefer interfaces that fit how people already work, even when that requires more integration effort. Reporting should trace a number back to its source. Documentation should answer the next maintainer's real questions, including why a decision was made. These choices take time up front, but they belong in the scope before a business starts depending on the system.

## Selected systems

These projects show those decisions in practice, from acquisition screening to inventory reconciliation and production applications.

<div class="systems-grid">
  <article class="editorial-card">
    <p class="card-discipline">Technical due diligence</p>
    <h3>Veritech Scan</h3>
    <p>An evidence-first pre-screening platform for web-business acquisitions. Authorized public-web scans become traceable Technical Acquisition Briefs through bounded collection, deterministic rules, and a risk register. Controls around cost and failure handling keep the collection process bounded and its evidence reviewable.</p>
    <a class="card-link" href="https://sitechecker.veritechdiligence.com/" aria-label="Visit Veritech Scan public site">Visit public site <span aria-hidden="true">→</span></a>
  </article>
  <article class="editorial-card">
    <p class="card-discipline">Integration architecture</p>
    <h3>WooCommerce Multi-Location Inventory Sync</h3>
    <p>A reference architecture for inventory that a storefront and ERP can update concurrently. Authenticated webhooks, asynchronous jobs, idempotency, and explicit conflict rules protect the integration contract. Reconciliation and a dead-letter queue give operators a way to review failures without losing inventory state.</p>
    <a class="card-link" href="https://github.com/d-voorhees/woo-multilocation-inventory-reference" aria-label="View WooCommerce Multi-Location Inventory Sync repository">View repository <span aria-hidden="true">→</span></a>
  </article>
  <article class="editorial-card">
    <p class="card-discipline">Applied AI · Production infrastructure</p>
    <h3>Streaming AI Chat Tool in PHP</h3>
    <p>A production-deployed streaming AI workflow within shared PHP hosting and an existing CRM/signup flow. HMAC access tokens and server-side SSE support gated access and streaming, while CRM tagging connects the workflow to signup. Spend limits, rate controls, and a usage dashboard make operation visible and bounded.</p>
    <a class="card-link" href="https://github.com/d-voorhees/streaming-ai-chat-php" aria-label="View Streaming AI Chat Tool in PHP repository">View repository <span aria-hidden="true">→</span></a>
  </article>
  <article class="editorial-card">
    <p class="card-discipline">Data integration · TypeScript</p>
    <h3>HubSpot ↔ Airtable Sync</h3>
    <p>A two-way sync engine for HubSpot custom objects and Airtable. Stable IDs, adapter boundaries, timestamp-based conflict resolution, and rate-aware writes define how records move between systems. A per-record audit log preserves the evidence needed to investigate changes.</p>
    <a class="card-link" href="https://github.com/d-voorhees/hubspot-airtable-sync" aria-label="View HubSpot ↔ Airtable Sync repository">View repository <span aria-hidden="true">→</span></a>
  </article>
  <article class="editorial-card">
    <p class="card-discipline">Full-stack product delivery</p>
    <h3>Bird by Bird</h3>
    <p>A deployed application built with Next.js, Django, GraphQL, and PostgreSQL. Cookie-based authentication and explicit data and API design support the product workflow. Production reliability work addresses dropped database connections and concurrent updates.</p>
    <a class="card-link" href="https://github.com/d-voorhees/bird-by-bird" aria-label="View Bird by Bird repository">View repository <span aria-hidden="true">→</span></a>
  </article>
</div>

## Background and credentials

I hold the Project Management Professional (PMP) and Certified ScrumMaster (CSM) credentials, and I am pursuing an MS in Information Technology Management. My earlier experience includes Bank of America, running a digital newsroom website in the Fortune Top 25, and teaching college-level Statistics and Macroeconomics.

Editorial discipline still shapes how I explain technical decisions, and statistics makes me wary of false certainty. Client work keeps bringing me back to whether a system will remain usable after the original builder is gone. That is also the perspective behind the writing here, failures included.

My stack includes JavaScript, TypeScript, Python, PHP, SQL, PostgreSQL, MySQL, React, Next.js, Django, GraphQL, WordPress, WooCommerce, GA4, GTM, and cloud deployment tooling.

## Contact

[LinkedIn](https://www.linkedin.com/in/danielle-voorhees-pmp) · [d@dvoorhees.com](mailto:d@dvoorhees.com)
