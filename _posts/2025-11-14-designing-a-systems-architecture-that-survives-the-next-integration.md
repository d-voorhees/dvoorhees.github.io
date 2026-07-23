---
date: 2025-11-14
layout: post
title: "Designing a Systems Architecture That Survives the Next Integration"
introduction: "A retail client's stack held up fine through the first two integrations. The third one exposed exactly where the original design had assumed too much."
seo_title: "Designing a Systems Architecture That Survives the Next Integration"
seo_description: "What breaks when a third integration hits a system built for one. Lessons from a retail client's order data architecture and the default I now build around."
seo_image: "/assets/images/blog-post-image.jpg"
categories: ["architecture", "systems design", "integrations"]
---

# Designing a Systems Architecture That Survives the Next Integration

A retail client I worked with ran orders through WooCommerce, with Stripe handling payment. Payment succeeded, WooCommerce marked the order paid, done. The first integration I built on top of that stack was a fulfillment platform. When an order hit a paid status, a webhook fired, the fulfillment system picked it up, packed it, and pushed tracking numbers back into WooCommerce as order meta. It worked well for about a year.

Then the client added a NetSuite ERP integration for accounting reconciliation. NetSuite needed order totals, tax line items, and refund events. It also needed to write some of that back into WooCommerce, because the finance team wanted refund status visible on the same order screen the support team was already using. That is when things started breaking. Orders would show conflicting refund states depending on which system had written to the order meta most recently. Support agents would tell customers a refund had processed when NetSuite had not confirmed it yet, because the WooCommerce field they were reading had been set by the fulfillment integration for an unrelated status change, and support had reasonably assumed the field meant what it looked like it meant.

Nothing was corrupted. No data was lost. Three systems were now writing to the same order record without any of them knowing the others existed, and the record itself had never been designed to represent three different write sources. It had been designed to represent one.

## What actually made the difference

The fulfillment integration held up for a year because it only ever moved in one direction. WooCommerce was the trigger, the fulfillment platform was the consumer, and the only thing that came back was a tracking number written to a field nothing else touched. A narrow, one-way pipe.

The ERP integration broke that pattern in two ways.

First, it needed to write to fields that another system was already writing to, because the original order meta schema had never separated fulfillment status from financial status. They were adjacent custom fields added at different times by different people solving different problems, and nothing in the schema said these represent different domains and should never be read as interchangeable. Second, authentication and write access for the ERP connector had been set up independently of the fulfillment connector, on a separate API key with separate permissions. There was no single place to see which systems could write to an order and which fields they were allowed to touch. Auditing who could change what meant checking three different integration configs instead of one.

The integrations that held up were the ones where a single system owned a given piece of data and everything else only read it. The integration that caused problems was the one where two systems both believed they were the source of truth for related but distinct information, because the underlying data model had never drawn a line between them.

## The default I build now

I now separate the data model by domain of ownership before I write any integration code, and I give each domain exactly one system permitted to write to it. For that retail client, this meant reworking the order schema so fulfillment status and financial status lived in genuinely separate fields with separate write permissions. Neither the fulfillment platform nor NetSuite could touch the other's field even by accident. Every downstream integration became a reader of one domain and a writer of exactly one domain, never both.

This is not the same as generic advice to keep systems loosely coupled. It is a specific rule applied at the schema level: before an integration gets write access to anything, I ask which single system owns this piece of data, and I make every other integration point read-only against it. If two systems both seem to need to write to the same field, that is a signal the field is doing two jobs and needs to be split before either integration ships, not after the second one causes a support ticket.

Centralizing authentication followed the same logic. Instead of each integration getting its own API key with its own scope defined ad hoc, I now maintain one access map that lists every external system with write access to the platform and exactly which fields each one can touch. When a new integration is proposed, the first question is whether it needs write access at all. If it does, the next question is which existing writer's territory it might collide with.

## The question to ask before the first integration

When I evaluate a new system before building anything into it, the question I care about is not whether the API is well documented or whether the data model looks clean today. It is whether the data model tells you, on its own, who owns each field. If the answer is not obvious by looking at the schema, a person joining in eighteen months and adding integration number five will not be able to tell either. That is exactly the situation that produced the refund status confusion at the retail client.

The practical version of this question: if I connect an entirely different system to this platform a year from now, and that system needs to write something, will it be obvious which fields are already spoken for? If the current schema cannot answer that, the fix is not a note in the documentation. It is restructuring the schema so ownership is visible in the data itself, before the second integration ships, not after the third one exposes it.

That is the difference between an architecture that happens to work for the integrations you already built and one that is actually built to take the next one. The first two integrations rarely tell you which kind you have. The third one always does.
