---
date: 2026-08-10
layout: post
title: "Building a DST-Safe Nightly Brevo Email Report with GitHub Actions"
introduction: "Brevo's dashboard won't hand you a nightly summary of transactional email on its own. Here's how a rolling 10 PM to 10 PM window and a UTC-only cron schedule turned into a small, DST-safe reporting script."
seo_title: "Building a DST-Safe Nightly Brevo Email Report with GitHub Actions"
seo_description: "A DST-safe, rolling 10 PM to 10 PM Mountain Time reporting window for Brevo transactional email, built for GitHub Actions cron."
categories: ["engineering", "projects on github"]
github_url: "https://github.com/d-voorhees/brevo-api-daily-report"
---

Brevo's dashboard shows transactional email activity if you go look for it. It doesn't send a nightly summary. I wanted one email at 10 PM with the day's count and a category breakdown showing who got what.

A midnight cutoff splits the evening in two. I set the window from 10 PM to 10 PM in America/Denver. The script computes it against the Denver clock. It survives the March and November time changes.

GitHub Actions cron runs in UTC. It doesn't shift for daylight saving. No single UTC time hits 10 PM Mountain year-round. I set two schedules: one at 04:00 UTC for Mountain Daylight Time, one at 05:00 UTC for Mountain Standard. A guard in the script keeps both schedules from sending the same report twice.

Brevo's log endpoint filters by date. It has no timestamp precision. A two-day request can't express a 10 PM boundary. The script works around this with a buffered date range and a client-side timestamp filter.

### How it works

Converting Denver wall-clock time to a UTC instant takes a fixed-point iteration. The script uses `Intl.DateTimeFormat` with `timeZone: 'America/Denver'` to read what Denver offset applied at a given UTC millisecond, then treats the conversion as a small loop: guess a UTC value for the wall time, read the offset at that guess, subtract it, and check again. Two passes converge because DST transitions are always one-hour jumps. That handles the March and November boundaries without a library or a hardcoded offset table.

The Brevo fetch requests a day of buffer on each side of the 10 PM window and paginates in batches of 100 until a short page comes back. Each returned record carries its send timestamp on `item.date`. The script parses that and keeps only records where the timestamp falls inside the exact window. A scheduled-run guard prevents both UTC cron schedules from sending a report on the same night. Manual `workflow_dispatch` runs bypass the guard entirely, which is what makes replaying a past window through the `REPORT_END_DATE` input possible.

Grouping is a `Map` keyed by subject, with a `Template ID {n}` fallback when subject is empty and `Untitled email` as a last resort. Sort is by count descending, alphabetical within a tie. The report renders as both HTML and plain text from the same data and goes out through `nodemailer`. The SMTP port decides connection mode on its own: port 465 uses implicit TLS, everything else negotiates STARTTLS.

### Discovered fail modes

Two problems showed up once the code went live.

The first was in the scheduled-run guard. It checked whether the run started during the 22:00 hour in Denver, but GitHub Actions cron doesn't guarantee that. A delayed run drifts past that hour and hits a non-22 check. The script exits and the report never sends.

The second was in the timestamp filter. When Brevo returned a record with a missing or unreadable `date` field, `new Date(item.date)` came back `NaN`, the filter treated `NaN` as outside the window, and the record vanished. The total came out lower than reality with no signal that anything was wrong.

### The fixes

The guard now reads which cron expression fired (`github.event.schedule`) and compares Denver's actual current UTC offset against the offset that schedule is meant for: 04:00 UTC for MDT (offset -6), 05:00 UTC for MST (offset -7). If the offsets match, this run is the intended one for the current DST state and it proceeds, no matter how late GitHub started it. Testing that change surfaced a floating-point noise bug in the offset calculation that was making every scheduled run skip; adding rounding cleared it.

The timestamp filter now reports every record it drops. The script counts records with a missing or unreadable send time and writes that count into both the run logs and the report email as a warning line.

Both changes shipped in `1.1.0`. See the [changelog](https://github.com/d-voorhees/brevo-api-daily-report/blob/main/CHANGELOG.md).

Code's on GitHub: [brevo-api-daily-report](https://github.com/d-voorhees/brevo-api-daily-report).
