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

HubSpot custom objects and Airtable bases both hold operational records that operations teams edit every day. When you try to keep them in sync in both directions, and a record gets edited on both sides between syncs, most tools have no answer for what to do next. Someone's change gets dropped, silently, and nobody finds out until a decision goes wrong weeks later. This post is about the sync engine I wrote to handle that case.

The pattern usually looks like this. A HubSpot instance tracks something like partners, projects, or event installations through a custom object. An operations team lives in Airtable and works against those same records every day. A low-code automation sits between the two platforms and keeps them in sync, or so everyone assumes.

Then someone on the ops side updates a record in Airtable at the same time someone in sales updates the matching record in HubSpot. One of those edits vanishes. Nobody can say which automation run did it or why, and there is no log to check. The sync has been working most of the time and failing silently the rest of the time, and by then a team has been making decisions off a dataset with gaps nobody can see for months.

## The problem underneath the problem

The first instinct in this situation is to fix the automation. Two separate limitations are usually stacked on top of each other.

Zapier and Make.com do not support HubSpot custom objects for two-way work. HubSpot custom objects are a first-class part of the CRM, but the popular no-code connectors were built around contacts, companies, and deals. Reaching a custom object means either a specialized integration or custom API calls, and most existing automations end up doing something closer to a workaround than a real sync.

Even where the automation can reach a field, it has no answer for conflicts. Most no-code sync tools handle one-way flows well and treat two-way sync as an afterthought. Whichever side runs last in the execution order wins, silently, with no comparison of which record was more current. That works until two people touch the same record inside the same sync window, which happens constantly on an active operations team.

The tool most teams end up with was never built to do the two things they need most: reach a custom object with full fidelity, and make a defensible decision when both sides have changed since the last run. The broken automation is one symptom of that gap.

## What I considered before writing code

My first move is never to open an editor. A configuration fix beats a new service every time.

HubSpot's own native data sync handles two-way sync well for standard objects and lets you set a default system of record for conflicts. It does not extend that same conflict handling to custom objects in the way this scenario requires, and layering a second paid integration on top of a failing one usually treats a symptom. Heavier iPaaS platforms built for cross-platform reconciliation solve the technical problem, and they come with a pricing tier and an implementation timeline that rarely match a team whose data volume is a few thousand records syncing a handful of times a day.

A small, purpose-built sync engine is what remains. I stay skeptical of custom code for integration work, since most of the time a config change or an off-the-shelf connector gets you there faster. The requirements here are narrow enough and specific enough that a general-purpose tool would spend its energy fighting its own defaults. Once a no-code platform cannot reach the object type you need and cannot make the conflict call you need, the choice becomes custom code or continuing to lose data.

## The build

The sync runs as a small TypeScript CLI. It is a scheduled job. Full-time infrastructure would be overkill since the target case does not need real-time sync. The core design decision was keeping HubSpot and Airtable specifics out of the code that makes decisions.

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

`HubSpotAdapter` and `AirtableAdapter` translate their platform's field names and API shapes into that one shared type. The sync engine never sees a HubSpot property or an Airtable field name directly. It only ever compares `SyncRecord` objects. That boundary is what lets the engine handle a custom object cleanly. The adapter is the one place that has to know the custom object schema, and everything downstream is generic reconciliation logic that does not care which platform a record came from.

Conflict resolution follows a rule I can state in one sentence. Whichever record was modified more recently wins. If neither side has a timestamp, HubSpot wins as the fallback system of record.

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

Visibility is the other piece that carries as much weight as the sync logic itself. Every run produces a full report, grouped by what happened to each record. Created, updated, skipped, conflict resolved, or errored, with the reason attached to each one. After months of a sync that failed without warning, most teams are not asking for smarter logic. They want the tool to show its work on every single run.

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

Both surprises point at the same lesson. The parts of a spec that feel too obvious to write down are usually the parts that break first, because nobody stress-tested the assumption hiding inside them.

## What changed

The sync reaches every field on the custom object, including the ones a low-code automation cannot touch at all. Conflicts resolve on a rule an operations team can explain to itself in a sentence, replacing a process that used to depend on whichever automation happened to run last. Every run leaves behind a report the team can read. A sync failure shows up as an error message with a record ID attached, so it stops being a gap in the data that nobody notices until a decision goes wrong.

The reporting piece turns out to be the harder win with clients. A tool that drops a record silently costs you more than a tool that fails loudly, because a loud failure at least tells you when to stop trusting the data. Fixing the two-way conflict problem was the engineering work. A team's trust in its data returns when the tool starts reporting clearly on what it did every time it ran.

## The transferable part

Almost every no-code connector can reach both HubSpot and Airtable. Whether the connector works for you depends on a different question. Ask what it does the moment both sides have changed since the last sync, and whether it will tell you when it guessed wrong. Most tools built for one-way flows have no answer to either question. They have a default that nobody chose on purpose.

If you end up writing the sync yourself, protect the boundary between platform-specific translation and business rule. Every tangled integration I have seen got that way because a conflict rule or a field mapping snuck into the same function that talks to the API. Keep those separate from the start and the code stays readable even after the schema grows past six fields, which it will.

The code for this project is on GitHub at [d-voorhees/hubspot-airtable-sync](https://github.com/d-voorhees/hubspot-airtable-sync). Issues are welcome there.
