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

I wanted a simple way to see OpenAI API spend every day without paying for another monitoring tool, so I built a small scheduled reporter that emails me the numbers. Before this, I checked usage by opening the dashboard, which only happened when something reminded me to. Between client work, prototypes, and a few public projects I now pay to run, spend went unnoticed more than once.

If you want the code first, the repo is here: [github.com/d-voorhees/openai-usage-reporter](https://github.com/d-voorhees/openai-usage-reporter).

## The constraints

No server, no database, no new service to maintain. I wanted the whole thing to live inside a repo I already had, running on a schedule I'd never have to think about again. That ruled out a hosted app or anything with its own dashboard. It pointed me toward GitHub Actions, since the repo already existed and the workflow runner was enough for a job that fires once a day.

## The first pass, and what was wrong with it

My first version reported usage from the previous calendar day. Mechanically it worked. But I check this kind of thing in the evening, close to 10 PM, and a report about yesterday's spend didn't line up with how I actually wanted to read it. I moved the window. Each report now covers the 24 hours ending at 10 PM the day it sends, not midnight to midnight.

## The implementation

The script pulls usage numbers from the API. It builds a short report and mails it through SMTP once a day, on the shifted window above.

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

The schedule lives in GitHub Actions:

```yaml
on:
  schedule:
    - cron: '0 4 * * *'
```

Nothing here needs to be kept alive between runs. There's no container idling, no database to back up, and one run a day stays nowhere near GitHub's free minute allotment, even on a private repo. I kept the email layer boring on purpose. SMTP isn't elegant, but for a tool only I look at, I'd rather debug something I understand at 11 PM than something clever.

## Why GitHub Actions, specifically

GitHub Actions won for a plain reason: the repo already existed, and cron support came built in. I didn't want to stand up a second service just to wake a script once a day. Anyone who clones the repo sees the setup in one place, code and schedule included, minus the actual secrets, which live in GitHub's encrypted repo variables instead of the file itself.

## Where this breaks

It's a single email with no alerting behind it. If the workflow fails, GitHub marks the run as failed in the Actions tab, but nothing pings me directly. If my SMTP app password expires or Gmail starts throttling it, I won't know until I notice a night with no email, which could be days later. It also doesn't scale past one account. Multiple API keys or a team that wants the same visibility would need a different report per key, not a bigger version of this one.

## What this is and isn't

This is a fit for a personal budget check or a small internal monitor. It's not a full analytics system, and I didn't build it to become one.

## The transferable principle

The tool sends one email every night. If I ever want per-project breakdowns or Slack instead of email, I know exactly which two functions to touch first. Until then it does the one job I built it for, and it cost nothing to run this month, which is the number I like.
