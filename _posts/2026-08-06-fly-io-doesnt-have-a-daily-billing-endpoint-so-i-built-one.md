---
date: 2026-08-06
layout: post
title: "Fly.io Doesn't Have a Daily Billing Endpoint, So I Built One"
introduction: "I wanted a daily view of Fly.io usage cost without adding another hosted service, so I built a scheduled reporter that estimates infrastructure spend and emails the result."
seo_title: "Fly.io Doesn't Have a Daily Billing Endpoint, So I Built One"
seo_description: "A free GitHub Actions project that estimates Fly.io compute usage from Machines and Prometheus metrics."
categories: ["engineering", "projects on github"]
github_url: "https://github.com/d-voorhees/flyio-usage-monitoring"
---

Fly.io gives me a monthly organization bill. I wanted a daily number that could show a usage change before the invoice arrived.

The result is a small Python script. It reads Fly Machine configuration, queries Prometheus for network activity, and estimates compute cost. Then it emails the report through SMTP. GitHub Actions runs the job once per day.

The code is here: [github.com/d-voorhees/flyio-usage-monitoring](https://github.com/d-voorhees/flyio-usage-monitoring).

## The problem

A monthly invoice answers one question: what did the organization owe? It doesn't give me anything to check in the meantime, while the current workload is still accumulating cost.

I wanted to review usage toward the end of each day. The report needed to cover the preceding 24 hours. It also had to stay free to run and small enough to inspect in one sitting.

## What Fly exposes

Fly gives you two useful programmatic inputs. The Machines API exposes app and Machine resources, and Fly's managed Prometheus service supports standard query endpoints, including range queries.

Those APIs hand the script configuration and usage signals. Fly's public billing documentation describes organization billing and invoices, but I didn't find a documented endpoint that returns exact daily spend by app for an arbitrary time range.

That gap shaped the project. I built an estimator instead of a billing lookup, and I wrote the report language to say so plainly.

## The cost model

The first model uses CPU, memory, and assumed active runtime:

```text
estimated_compute_cost =
    active_hours × cpu_count × cpu_rate_per_hour
  + active_hours × memory_gb × memory_rate_per_gb_hour
```

The script pulls CPU count, memory allocation, and state from the Machines API. The CPU and memory rates come from GitHub Actions secrets, so the code itself carries no pricing assumptions. Fly's pricing documentation lists Machine pricing by CPU and RAM configuration.

Prometheus supplies network counters for the same reporting window:

```promql
sum by (app) (increase(fly_instance_net_sent_bytes[24h]))
sum by (app) (increase(fly_instance_net_recv_bytes[24h]))
```

The report shows those counters beside the compute estimate. It doesn't turn them into an official bandwidth charge, because regional rates and invoice rules need more information than the script has access to.

## The implementation

The repository contains one Python entry point, a dependency file, and a GitHub Actions workflow. The workflow injects secrets and starts the script. The script performs the API requests and applies the estimate, then formats the message and sends the email.

```text
GitHub Actions
      |
      v
Python reporter
   |       |       |
   v       v       v
Machines Prometheus SMTP
API      API       server
```

The reporting window ends when the script runs and begins 24 hours earlier. That gives me a complete daily interval instead of a calendar-day query that could miss activity around midnight.

## Where the first model breaks

The first version assumes that a Machine observed as started ran through the full interval. That holds for a service that stays up continuously. A Machine that starts, stops, or changes size during the interval produces a less accurate number, and the report doesn't try to hide that.

The number in the email represents a model based on current configuration and observed metrics, not a bill. Fly's billing records remain the authority for exact charges.

A later version could record hourly Machine state and calculate active runtime per Machine. That would close the largest source of error without requiring a full billing system.

## Why I used GitHub Actions

GitHub Actions gives the project a scheduler and a place to store encrypted repository secrets. The job needs one short execution each day, so a hosted application would add upkeep without adding much.

It also keeps the project easy to inspect. A reviewer can see the schedule, the API calls, the pricing inputs, and the email step in one repository, with nothing running anywhere else.

## What the project reports

Each email includes the 24-hour reporting window, the Machines inspected, their current CPU and memory configuration, estimated compute cost, and aggregate network counters by app.

It leaves out invoice adjustments, taxes, credits, volume billing, dedicated IPv4 charges, and final bandwidth charges. Those exclusions are the honest boundary of what this version does, and they're the first items on the list for a later one.

## Why this is useful

A daily estimate doesn't replace an invoice. It gives me a short feedback loop, so I can catch a change in Machine size or application traffic before the monthly bill closes instead of after.

I'd use the same approach again for any Fly service with operational metrics but no per-day billing endpoint: pull the signals the provider already exposes, keep every assumption visible in the output, and check the estimate against the real invoice once a month to see how far off it runs.

The repository is available here: [github.com/d-voorhees/flyio-usage-monitoring](https://github.com/d-voorhees/flyio-usage-monitoring).
