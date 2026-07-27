---
date: 2026-06-20
layout: post
title: "Building a Two-Way HubSpot to Airtable Sync for Custom Objects"
introduction: "Most no-code connectors cannot reach HubSpot custom objects, and none of them make a defensible call when a record changes on both sides between syncs. This is the TypeScript sync engine I built to handle both problems, and what I learned getting there."
seo_title: "Building a Two-Way HubSpot to Airtable Sync for Custom Objects"
seo_description: "Zapier and Make cannot reach HubSpot custom objects for two-way sync, and neither resolves conflicts. Here is the open-source TypeScript sync engine I built to handle both."
categories: ["integrations", "github", "systems design", "architecture"]
tags: []
---

# Building a Two-Way HubSpot to Airtable Sync for Custom Objects

HubSpot custom objects and Airtable bases both hold operational records that operations teams edit every day. A custom object is HubSpot's schema-extensible record type, sitting alongside contacts, companies, and deals, built for whatever an organization tracks that does not fit those defaults. When you try to keep a custom object in sync with Airtable in both directions, and a record gets edited on both sides between syncs, most tools have no answer for what to do next. Someone's change gets dropped, silently, and nobody finds out until a decision goes wrong weeks later. This post is about the sync engine I wrote to handle that case.

The pattern usually looks like this. A HubSpot instance tracks something like partners, projects, or event installations through a custom object. An operations team lives in Airtable and works against those same records every day. A low-code automation sits between the two platforms and keeps them in sync, or so everyone assumes.

Then someone updates a partner record in Airtable at the same time someone updates the matching record in HubSpot, changing the same status field from two different directions. One of those edits vanishes. Nobody can say which automation run did it, because Zapier and Make.com fire their actions in the order triggers arrive and neither one checks the other side's timestamp before writing. There is no log built for this case. The sync has been working most of the time and failing silently the rest, and a team can end up running a quarterly report off partner status data that has been wrong in a dozen small places for months, with nothing pointing at which ones.

## The problem underneath the problem

Two separate limitations are usually stacked on top of each other under a broken sync.

Zapier and Make.com have thin, plan-gated support for HubSpot custom objects, and neither handles two-way sync against them well. HubSpot custom objects are a first-class part of the CRM, but the popular no-code connectors were built around contacts, companies, and deals. Reaching a custom object usually means a specialized integration or custom API calls, and most existing automations I have seen end up as a one-way push with a person manually reconciling the gaps in a spreadsheet once a week.

Even where the automation can reach a field, it has no answer for conflicts. Zapier fires its actions in the order triggers arrive and never queries the other platform before writing. Make.com's scenarios run per-trigger with the same blind spot. Whichever side runs last wins, silently, with no comparison of which record was more current. That works until two people touch the same record inside the same sync window, which happens constantly on an active operations team.

The tool most teams end up with was never built to do the two things they need most: reach a custom object with full fidelity, and make a defensible decision when both sides have changed since the last run. The broken automation is one symptom of that gap.

## What I considered before writing code

My first move is never to open an editor. A configuration fix beats a new service in every case I have run into where a config option existed.

HubSpot's own native data sync handles two-way sync well for standard objects and lets you set a default system of record for conflicts. It does not extend that same conflict handling to custom objects in the way this scenario requires, and layering a second paid integration on top of a failing one usually treats a symptom. Heavier iPaaS platforms built for cross-platform reconciliation solve the technical problem, and they typically come with a five-figure annual license and an implementation timeline measured in weeks, which rarely matches a team whose data volume is a few thousand records syncing a handful of times a day.

A small, purpose-built sync engine is what remains. I stay skeptical of custom code for integration work, since most of the time a config change or an off-the-shelf connector gets you there faster, and custom code carries its own ongoing cost. Someone has to keep it working when HubSpot or Airtable changes their API, and it usually has exactly one person who understands it well enough to fix it at 2 a.m. The requirements here are narrow enough and specific enough that a general-purpose tool would spend its energy fighting its own defaults, and that maintenance cost was worth accepting once the alternatives had been ruled out. Once a no-code platform cannot reach the object type you need and cannot make the conflict call you need, the choice becomes custom code or continuing to lose data.

## The build

The sync runs as a small TypeScript CLI. It is a scheduled job. Full-time infrastructure would be overkill since the target case does not need real-time sync.

```typescript
export interface SyncRecord {
  externalId: string;
  hubspotId?: string;
  airtableId?: string;
  name: string;
  email?: string;
  company?: string;
  status?: string;
  notes?: string;
  hubspotModifiedAt?: Date;
  airtableModifiedAt?: Date;
}
```

`HubSpotAdapter` and `AirtableAdapter` translate their platform's field names and API shapes into that one shared type. The sync engine never sees a HubSpot property or an Airtable field name directly. It only ever compares `SyncRecord` objects. The adapter is the one place that has to know the custom object schema, and everything downstream is generic reconciliation logic that does not care which platform a record came from.

Conflict resolution follows a rule I can state in one sentence. Whichever record was modified more recently wins. If neither side has a timestamp, HubSpot wins as the fallback system of record. This carries the standard limitation of any last-write-wins rule: clock skew between the two platforms can make the wrong side look newer, and the HubSpot default is wrong for any team whose actual source of truth is Airtable, in which case that one line in `determineWinner` needs to flip.

```typescript
private determineWinner(hubspotRecord: SyncRecord, airtableRecord: SyncRecord): 'hubspot' | 'airtable' {
  const hubspotTime = hubspotRecord.hubspotModifiedAt?.getTime();
  const airtableTime = airtableRecord.airtableModifiedAt?.getTime();

  if (hubspotTime === undefined && airtableTime === undefined) return 'hubspot';
  if (hubspotTime === undefined) return 'airtable';
  if (airtableTime === undefined) return 'hubspot';

  return hubspotTime >= airtableTime ? 'hubspot' : 'airtable';
}
```

Visibility carries as much weight as the sync logic itself. Every run produces a full report, grouped by what happened to each record. Created, updated, skipped, conflict resolved, or errored, with the reason attached to each one. After months of a sync that failed without warning, most teams are not asking for smarter logic. They want the tool to show its work on every single run.

## Where it did not go as planned

Two things surprised me during the build. Both came from assuming a rule I had written down was simpler in practice than it turned out to be.

The first was Airtable's rate limit. Airtable caps requests at five per second per base, and my first pass at the write logic did not account for what happens during a bulk reconciliation run touching a few hundred records back to back. The official Airtable client retries on a 429 with backoff, so early on I assumed that retry logic was enough of a safety net on its own. It technically was, in the sense that the sync eventually finished, but a run that should take a few seconds was burning through retry budget and taking minutes. Logs were full of 429s that looked like something was broken when nothing was. The fix was pacing the writes deliberately, and specifically only in the bulk loop. Baking a delay into every `create` or `update` call would have been the wrong place for it.

```typescript
static async pace(): Promise<void> {
  const delayMs = process.env.AIRTABLE_PACE_MS ? Number(process.env.AIRTABLE_PACE_MS) : 210;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}
```

Putting the delay inside the adapter's `update` method would have made every call anywhere in the codebase pay for a rate limit that only bites during bulk operations. Keeping the pacing in the sync engine's loop, called only after a write happened, means a single manual sync of one record stays fast while a full reconciliation run stays under the limit.

The second surprise was in the conflict rule itself. Most recently modified wins reads as a complete rule until you hit a record created directly in Airtable that has never touched HubSpot, so it has no HubSpot-side timestamp to compare against. The mirror case happens too, a HubSpot record with no Airtable-side timestamp for the same reason. My first draft of `determineWinner` did not have an explicit answer for either case. It assumed both timestamps would exist because in my test data they always did. In practice, plenty of real records had one side or the other missing a modified date, especially anything created before the sync existed. I went back and decided, out loud, what should happen when the comparison itself is impossible. That is where HubSpot ended up as the named fallback system of record.

Both surprises came from the same blind spot: assuming a third-party platform's metadata would always be there because it was there in test data. Rate limits and missing timestamps are the two most common gaps of that kind in any integration against HubSpot or Airtable, and both are worth checking for explicitly before writing the reconciliation logic that depends on them.

## What changed

The sync reaches every field on the custom object, including the ones a low-code automation cannot touch at all. Conflicts resolve on the single rule described above, replacing a process that used to depend on whichever automation happened to run last. Every run leaves behind a report the team can read. A sync failure shows up as an error message with a record ID attached, so it stops being a gap in the data that nobody notices until a decision goes wrong.

The reporting piece turns out to change the relationship with a client faster than the sync logic does, because a report is the first thing a skeptical ops lead reads after months of not trusting the old process. A tool that drops a record silently costs more than a tool that fails loudly. In this case the specific cost was weeks of stale partner status data sitting undetected before anyone noticed, versus an error message pointing at the exact record the moment something breaks. Fixing the two-way conflict problem was the engineering work. A team's trust in its data returns when the tool reports clearly on what it did every time it ran.

## The transferable part

Almost every no-code connector can reach both HubSpot and Airtable. Whether the connector works for you depends on a different question. Ask what it does the moment both sides have changed since the last sync, and whether it will tell you when it guessed wrong. Most tools built for one-way flows have no answer to either question. They have a default that nobody chose on purpose.

If you end up writing the sync yourself, protect the boundary between platform-specific translation and business rule. Most of the tangled integrations I have seen at this scope got that way because a conflict rule or a field mapping snuck into the same function that talks to the API. That separation is not free. For a small one-off sync between two systems that will never add a third, the extra adapter layer can be more structure than the problem needs. It earns its cost once the schema grows past a handful of fields or a second platform joins, which is the case this project was built for.

The full code is on GitHub at [d-voorhees/hubspot-airtable-sync](https://github.com/d-voorhees/hubspot-airtable-sync), along with a test suite covering these conflict rules directly. The tests run against fake adapters. The live APIs are never called during a test run. This proves the decision logic is correct. It does not prove anything about how HubSpot or Airtable behave in practice. Running the sync against a real sandbox account is what closes that gap.
