---
date: 2026-04-24
layout: post
title: "Documentation as Infrastructure, Not an Afterthought"
introduction: "Documentation that only exists to satisfy an audit is dead weight. Documentation that is built to be the thing the next person actually opens first is infrastructure. This post is about the difference."
seo_title: "Documentation as Infrastructure, Not an Afterthought"
seo_description: "Why the best system documentation gets written because the system was built to be explainable, not because a compliance deadline demanded it."
categories: ["methods & strategy"]
---

# Documentation as Infrastructure, Not an Afterthought

There is a moment, roughly six months after a system ships, when the person who built it is no longer available to answer questions about it. Sometimes that person has moved on to another contract. Sometimes they are still around but have loaded new context into working memory and cannot remember why a specific field was named the way it was. In either case, whoever is trying to make a change to the system now is standing in front of the codebase or the admin panel with a question that has no legible answer.

What happens next depends almost entirely on what documentation exists.

I have inherited systems built by other developers and had to reverse-engineer them from the code because there was nothing else to work from. I have handed off systems where the client wrote back three months later thanking me for a specific note buried in a maintenance log, because it explained a decision that would otherwise have looked like a bug. The gap between those two experiences is not a matter of documentation volume. Both directions can generate a lot of documentation. It is a matter of what the documentation is for.

The failure mode is documentation written to satisfy a process. A checklist requires that you produce a document, so you produce a document. It gets filed. Nobody reads it, because it was not written to be read. It was written to be filed. The person coming to the system fresh, six months later, opens it, finds nothing that helps them, and closes it. From that point forward, they treat the system as undocumented, because for their purposes it is.

The alternative is not more documentation. It is documentation shaped around the questions the next person is actually going to ask.

## What the shape looks like

On a WooCommerce build with a seven-location inventory sync, the documentation I care most about is not the API reference for the endpoints, because that lives in the code and can be regenerated. It is the log of what has changed and why. Every time a mapping between the fulfillment system and the store gets adjusted, there is a note that says which field was moved, on what date, and what problem it was solving. The note is two sentences. It is not comprehensive. It does not need to be. What it needs to do is give the next developer enough context to understand whether the current behavior is the correct one or the residue of an old fix that never got cleaned up.

Naming conventions do the same work at a smaller scale. A custom field called `client_priority_flag` tells you almost nothing. A custom field called `hubspot_sync_priority` tells you it is part of the HubSpot sync layer and its purpose is to control priority within that sync. The second name is not more documentation. It is documentation embedded in the artifact itself, which means the documentation cannot drift out of sync with the system, because it is the system.

The habit I have landed on, after many years of doing this both ways, is that anything that would take more than a sentence to explain in code comments belongs in a maintenance log entry. Anything that can be explained in a name should be explained in a name. Anything that is genuinely self-evident from the code does not need documentation at all, and documenting it anyway is worse than useless because it teaches the reader that your documentation cannot be trusted to contain only signal.

## A specific example

A client came to me with a system another developer had built, a WordPress installation with more than a hundred Gravity Forms, each one connected to a different downstream automation. The previous developer had documented every form in a spreadsheet. The spreadsheet listed the form ID, the form name, the date it was created, and a description of what the form did.

The description of what the form did was, in every single row, the name of the form.

That documentation existed. It had been produced. It had been delivered. It was worthless. What the client actually needed to know, when a form stopped working, was which downstream system that form was writing to, which automation platform was picking up the submission, and which field mappings had been customized. None of that was recorded anywhere. It had to be reconstructed by opening each form's settings, each Zapier zap, and each destination platform, and reading them side by side.

The rebuild took two weeks. The documentation I wrote to replace what was there is shorter. It is one row per form, three columns: which downstream system receives the submission, which fields are non-standard, and which automation platform routes it. The name of the form is not in that document, because the name of the form is in the form. Duplicating it there taught the reader nothing except that the previous author was checking a box.

## The design constraint

The best documentation gets written because the system was built to be explainable. If a system has fifty custom fields with cryptic names, no documentation is going to save it, because the documentation will have to be as long and as complex as the system itself, and nobody will read it. If a system has fifty custom fields with descriptive names, most of the documentation writes itself, and the rest is a short log of decisions and their reasons.

This is not a matter of writing better documents. It is a matter of building systems that do not require heroic documentation to be understandable. The engineer who thinks about explainability from the first field they create ends up producing less documentation than the engineer who thinks about it at handoff, and the documentation they do produce is the kind the next person actually opens.

Documentation is infrastructure in the same sense that logging is infrastructure. It is not a deliverable at the end of a project. It is a property of the system, present in the design or absent from it, and no amount of retroactive effort will fully make up for building the wrong way in the first place.
