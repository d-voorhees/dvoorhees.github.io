---
date: 2026-01-22
layout: post
title: "Custom Fields, Taxonomies, and the Cost of Getting the Data Model Wrong Early"
introduction: "A data model decision made in week one either compounds in your favor or compounds against you. There is rarely a neutral outcome. This is what that looks like from the inside of a real client build."
seo_title: "The Real Cost of a Bad Early Data Model Decision"
seo_description: "Custom fields, taxonomies, and object relationships decided on day one shape what the system can do on day five hundred. A look at how the compounding works and how to avoid the worst of it."
categories: ["methods & strategy"]
---

# Custom Fields, Taxonomies, and the Cost of Getting the Data Model Wrong Early

Every system that stores structured data has, buried inside it, a set of decisions made very early about what the shape of that data was going to be. In WordPress this shows up as custom fields and custom post types. In HubSpot it shows up as custom objects and property definitions. In Airtable it shows up as base design. The terminology changes across platforms. The underlying decision is the same one: what are the entities in this system, what attributes do they have, and how do they relate to each other.

The decision gets made in week one, often by whoever happens to be sitting in front of the tool, sometimes without much conversation with the people who will actually be querying the data six months later. And then the system runs for a year, or five years, and the shape of the data either fits the shape of the questions the business wants to ask, or it does not.

There is no neutral outcome. It compounds one direction or the other.

## The seven-location retailer

A client came to me with a WordPress-based ecommerce system that had been built by a previous developer to manage inventory across seven physical retail locations. The original build treated inventory as a single attribute on the product: one number, updated by whichever location had last taken action. This is a reasonable decision if you have one location. It is a wrong decision if you have seven, and the wrongness only becomes visible when the business asks a question the data cannot answer.

The question, in this case, was: which products are selling well at some locations but sitting on the shelf at others. The single-inventory-number model made that question unanswerable. You could see that total inventory had dropped, but you could not see where the sale had happened or where the stock still was. Everything else the business wanted to do, from restocking decisions to promotions to identifying products that should be discontinued, was gated on being able to answer that question.

The fix required rebuilding the data model. Inventory had to become a relationship, not an attribute: each product now related to seven inventory records, one per location, each with its own count and its own last-updated timestamp. The rebuild took several weeks. It required migrating live data. It required rewriting every report and every automation that touched inventory. And once it was done, a query that had been literally impossible on the old model produced, on the first pass, a six-figure product line that was overstocked at four locations and out of stock at three. That product line had been sitting in the data the whole time, unretrievable because the data model did not have the vocabulary to describe it.

## What a wrong early call actually costs

The cost of getting a data model wrong early is not the abstract cost of technical debt. It is specific, and it shows up in specific places.

It shows up as reports the business cannot run, which the business then either gives up on or produces manually by exporting everything to a spreadsheet and doing the analysis by hand. That is not a data problem the business perceives as a data problem. It is perceived as an ordinary cost of doing business, because the alternative, fixing the model, seems expensive and abstract.

It shows up as automations that break when the underlying data does something the model did not anticipate. A one-to-one relationship modeled where the reality is many-to-many will silently produce wrong results at the edges. The automation runs. The output looks plausible. The wrongness is only visible when someone happens to check.

It shows up as migrations that have to happen live, on production, because the business cannot pause operations to do them. Migrating a live data model is the single most expensive kind of technical work I do, and it is almost always the result of an earlier decision that was made without enough information about what the system was going to be asked to do.

## How I approach it now

Before I create the first field in a new system, the question I start with is whether the entities in the business are actually the same thing as the entities in the tool. A HubSpot contact is not always the same thing as a customer. A WordPress post is not always the same thing as a piece of content. The vocabulary of the tool is a starting point, not a description, and getting this one wrong is what put the inventory-as-attribute decision on the wrong track before anyone had typed a line of code.

From there I want to know what the business is actually going to ask of this data, and whether the shape I'm about to build can answer it. If the answer is no, or if I can't tell yet, that's a signal to slow down and get the questions written down before building anything.

The relationship structure gets the most scrutiny, because it's the part that's hardest to migrate later: which connections are one-to-one, which are one-to-many, and which are secretly many-to-many even though the current data makes them look simpler than that. Getting this one wrong is what turned three weeks of expected work into a live production migration on the retailer's inventory system.

Last, and lowest-stakes by comparison: what's likely to change. Business rules change, product categories reorganize, locations open and close, and the model needs room for the kinds of change that are foreseeable — without getting so abstracted in anticipation of hypothetical change that nobody can reason about it anymore.

None of these questions are platform-specific. They apply to a HubSpot custom object build with the same force they apply to a WordPress custom post type build or an Airtable base design. The tool changes. The discipline does not.

This is also not a process I run on everything. A one-off internal script that answers a single question and gets deleted next quarter doesn't need four questions' worth of upfront modeling — the cost of a wrong guess there is an afternoon, not a live migration. The four questions earn their time on anything that's going to outlive the person who built it and get asked questions nobody has thought of yet, which is most of what actually gets called a "system" rather than a script.

I still think about the seven-location retailer's product line sitting in data the original model had no vocabulary to describe, and I use it as my own test now: before I ship a model, can I name a real question the business would ask that this shape genuinely cannot answer? If I can name one, I'm not done yet.
