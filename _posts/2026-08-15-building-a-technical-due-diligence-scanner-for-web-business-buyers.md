---
date: 2026-08-15
layout: post
title: "A Technical Due Diligence Scanner for Web-Business Buyers"
introduction: "A buyer evaluating a web business usually gets a five-minute look at the site and a gut feeling about the tech behind it. Here's how I built a scanner that turns that gut feeling into an evidence-linked report."
seo_title: "A Technical Due Diligence Scanner for Web-Business Buyers"
seo_description: "How I built an evidence-first, deterministic scanning tool for pre-screening a web business's technical posture before deeper acquisition diligence."
categories: ["engineering", "projects on github"]
github_url: "https://github.com/d-voorhees/veritech-scan"
---

# Building a Technical Due Diligence Scanner for Web-Business Buyers

Someone buying a web-based business, a content site, a small SaaS product, an ecommerce shop, usually gets a walkthrough of the website in terms of how traffic and revenue are trending, and whether churn is holding steady; but the technical foundation underneath the website gets a much shallower look.

Initial purchase concerns are, does this look like a real, functioning, transferable business? Does the website make its offer clear, work on a phone, provide a reliable path to purchase or inquire, demonstrate recent activity and customer trust, and tell a believable story about where its traffic and revenue come from?

But the technical quality of the site is a murkier affair, and issues like security, site reliability, performance, discoverability, indexability, dependency management, on-page SEO, analytics, platform exposure, domain registration, accessibility, and email deliverability are less clear, and all these issues can be problems and costs after closing if not uncovered early.

In the absence of alternatives in the market, I built a bounded, evidence-linked technical pre-screen tool a buyer can run before committing to a deeper (and more expensive) diligence engagement as a way to address this gap. 

The tool exists to answer one practical question for a prospective buyer:
Is this web property purchase worth deeper technical diligence, and what should I investigate next?

## Current options for screening

**General vulnerability scanners** like Qualys, Nessus, or Detectify are built to find exploitable weaknesses in infrastructure you're authorized to test aggressively. A buyer evaluating an acquisition target usually has no such authorization and no interest in one. The output of these tools doesn't translate into a dollar-impact estimate a buyer can weigh against the deal. They return CVE lists and exploit chains for a security engineer to address, but these lists don't help a buyer deciding whether to keep negotiating.

**Stitching together point tools** is what most buyers do today, whether or not they'd describe it that way. A buyer checking a target by hand might run BuiltWith or Wappalyzer for the tech stack, SSL Labs for a TLS grade, MXToolbox for SPF/DMARC lookups, PageSpeed Insights for performance, and WAVE for accessibility. Every one of those tools does its own job well. None of them share a data model, so running all five ends up as five browser tabs and the job of mentally combining a mediocre PageSpeed score with an expiring domain registration into one judgment about deal risk. No individual point tool attempts that synthesis. That's the gap [my technical pre-screen tool](https://sitechecker.veritechdiligence.com) is built to close.

**Hiring a technical due diligence consultant** gets a buyer expert judgment, but it also gets them a multi-day or multi-week turnaround and a fee priced for a full engagement when what's needed is a first impression. The purpose of this site checker is to help buyers identify "is this worth going deeper," so a buyer doesn't pay consultant rates to find out whether the consultant-rate engagement is warranted.

Closing the information gap for a buyer means collecting evidence across thirteen performance areas and running it through a single evaluation engine to produce a report ordered around the question a buyer is asking.

## What Veritech Site Scanner does

[Veritech Site Scanner](https://sitechecker.veritechdiligence.com) runs 26 versioned rules across scan coverage, DNS/email posture, HTTP and security headers, crawl/indexability/on-page SEO, technology/CMS/dependency exposure, TLS and domain registration, performance, analytics, and accessibility. Every finding in the risk register carries a severity, a confidence level, and a remediation timing set by the rule, with a dollar-impact band where the finding represents a priced risk rather than a neutral observation.

A table shows all 26 rules and each one's outcome, whether thats clean or needs attention. The report then is ordered around critical purchase considerations: business continuity first (will the domain and certificate still be valid in sixty days), then what the buyer would be inheriting technically, then the rest. 

## The technical

Veritech Scan is a monorepo (Next.js frontend + FastAPI backend, one Postgres database, deployed as two Fly.io Machine roles from a single Docker image) whose core mechanics live entirely in this repo: app/services/scan_orchestrator.py and app/runner/ implement an on-demand-compute pattern where each scan spins up a dedicated Fly Machine via the Fly Machines API, runs a fixed sequence of collectors, and self-destructs — no persistent worker, queue, or Redis, with all state (scan status, events, evidence, findings) living in Postgres so any Machine can crash or restart without losing data; the app/collectors/ package (HTTP checks, DNS/email posture, same-origin crawling with rate-limiting, headless-Chromium rendering via Playwright, technology fingerprinting, PageSpeed-based performance) and app/core/ (SSRF-safe URL validation, crawl policy, rate limiting) are the concrete, reusable "how do you safely and politely gather evidence from an arbitrary public website" implementation; and app/models/evidence.py plus app/services/report_builder.py/report.html.jinja show the evidence/observation data model and how a report gets rebuilt live from Postgres rather than cached. 

What's proprietary and deliberately excluded is the actual risk-detection logic — the veritech-scan-rules package (a separate private pip dependency pinned by tag) that holds every rule's detection condition, threshold, and dollar-impact/remediation-timing assignment; this repo only contains the harness around it (app/rules/context.py builds the plain-dataclass RuleContext from persisted observations, app/rules/engine.py runs whatever rules are registered and persists Finding/FindingEvidence rows), so you can see the full shape of how rules consume evidence and get versioned/persisted without seeing what any rule actually checks for. 

## Evidence first, rules second

Collector functions in Veritech Site Checker never decide that something is a finding. Five feed the pipeline: the HTTP/redirect checker, the DNS/email posture check, the crawler, the Playwright renderer, the performance adapter. Each one only ever writes normalized `EvidenceItem` rows:

```python
class EvidenceItem(Base, UUIDMixin, TimestampMixin):
    """The normalized evidence layer. This — not raw responses — is the
    product's core data model. Every finding cites one or more of these.
    """
    category: Mapped[str]                  # e.g. "email_posture", "tls", "performance"
    source_type: Mapped[str]                # e.g. "http_response", "dns_txt", "playwright_render"
    source_url_or_identifier: Mapped[str]
    captured_at: Mapped[datetime]
    confidence: Mapped[str]                 # low | medium | high
    normalized_payload_json: Mapped[dict]
    human_readable_summary: Mapped[str]
```

A separate rules engine reads only from this evidence layer, never from a collector directly. That separation lets a finding cite the exact evidence behind it, with a visible chain back to what was actually observed.

To be reliable and credible source of advice, the tool needs to produce the same finding from the same evidence every time, with a version number attached so a change in behavior shows up as a traceable code change, visible in the diff and the rule's version bump. Each rule is a pure function returning a typed result:

```python
@dataclass
class RuleResult:
    rule_key: str
    version: int
    severity: str
    confidence: str
    title: str
    impact: str
    recommended_next_step: str
    dollar_impact: str          # rough band: $, $$, $$$ (no default)
    remediation_timing: str     # 30-day, 60-day, 90-day, longer-term (no default)
    evidence_ids: list[uuid.UUID]
```

`dollar_impact` and `remediation_timing` have no default value in that dataclass. A rule that forgets to set either one fails immediately in testing, before it can ship a finding with a blank column a buyer would have to guess the meaning of.

## What this doesn't do

Veritech Site Checker is live today for scans. By design, it only reads what's already public, so it won't catch anything sitting behind a login, the class of finding the full nine-layer Veritech Diligence review is built to reach. What it returns instead is a first, evidence-linked read a buyer can trust before deciding whether that deeper review is worth the time.

## Code
The code that runs the scanner is available on [github](https://github.com/d-voorhees/veritech-scan).

The repo is public, as some may find it useful for the Fly Machines-as-ephemeral-worker orchestration pattern, the collector/evidence-item architecture for building an auditable scanning pipeline, and the rules-engine versioning scheme that lets a paid, private rule catalog plug into an otherwise open pipeline. The actual detection methodology is kept out of this codebase as the proprietary private rule catalog.