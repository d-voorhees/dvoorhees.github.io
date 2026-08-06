---
date: 2026-08-05
layout: post
title: "The Daily OpenAI Usage Email Report"
introduction: "I wanted a simple way to see OpenAI API spend every day without paying for another monitoring tool, so I built a small scheduled reporter that emails me the numbers."
seo_title: "How I Built a Free Daily OpenAI Usage Email Report"
seo_description: "A small GitHub Actions project that checks OpenAI usage daily and emails a report for free."
categories: ["engineering", "projects on github"]
github_url: "https://github.com/d-voorhees/openai-usage-reporter"
---

OpenAI usage is easy to check in the dashboard when you remember to open it. It is harder to keep an eye on when you are moving between client work, prototypes, and experiments and only notice spend after it has already gone awry.

After making some projects public lately where I pay for usage on them, I wanted a daily openai usage report in my email, preferably one that cost nothing to run and that i could DIY. The result was a small Python script, a GitHub Actions schedule, and an email sent once a day with the numbers I care about.

If you want the code first, the repo is here: [github.com/d-voorhees/openai-usage-reporter](https://github.com/d-voorhees/openai-usage-reporter).

## The constraints

The project had three hard constraints. It had to stay free, it had to be small, and it had to run without a server.

That ruled out a hosted app, a database, and a more elaborate dashboard. It also pushed me toward GitHub Actions as the scheduler, because the repo already existed and the workflow runner was enough for a once-a-day job.

## The first pass

My first version reported yesterday's usage. That worked mechanically, but it did not match the way I wanted to read the report at 10 PM.

I want to review usage towards the end of the day.

## The implementation

The core script pulls usage data, formats a short report, and sends it through SMTP once a 24-hour period from 10 PM the previous day to 10 PM today. 

```python
from datetime import datetime, timedelta, time

def main():
    now = datetime.now()
    today_10pm = datetime.combine(now.date(), time(22, 0))
    yesterday_10pm = today_10pm - timedelta(days=1)

    if now < today_10pm:
        end = yesterday_10pm
        start = end - timedelta(days=1)
    else:
        end = today_10pm
        start = yesterday_10pm

    today_data = get_usage(start.date().isoformat(), end.date().isoformat())
    subscription = get_subscription()

    report = format_report(today_data, subscription)
    send_email(f"OpenAI Usage Report - {end.date()}", report)
```

The schedule lives in GitHub Actions.

```yaml
on:
  schedule:
    - cron: '0 4 * * *'
```

That setup keeps the runtime cheap and predictable. There is no container to keep alive, no database to back up, and no extra infrastructure that exists only to support one small report.

I also had to keep the email layer boring. SMTP is not glamorous, but it is easy to understand, and for a personal tool that matters more than elegance.

## Why GitHub Actions made sense

I considered a few free ways to schedule it. GitHub Actions won because it was already available, it supports cron, and it did not require me to add another service just to wake the script up once per day.

That choice also keeps the repo portable. Anyone who clones the project can see the whole thing in one place: the code, the schedule, and the environment variables.

## What this is good for

This is a good fit for a personal budget check, a small internal monitor, or a portfolio project that shows how a practical automation gets put together.It is not a full analytics system. 

I like this as a portfolio project because it is small but real. It shows API work, scheduled automation, secrets handling, and a clear product decision about what to include and what to leave out.

It also reads well as a project where code solves a specific problem, the tradeoffs are visible, and the implementation is small enough that someone can inspect it without needing a tour.

If you want to inspect the code, and implement it for yourself, you can find it here: [github.com/d-voorhees/openai-usage-reporter](https://github.com/d-voorhees/openai-usage-reporter).