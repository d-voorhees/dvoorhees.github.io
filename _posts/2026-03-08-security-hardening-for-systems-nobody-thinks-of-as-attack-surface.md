---
date: 2026-03-08
layout: post
title: "Security Hardening for Systems Nobody Thinks of as Attack Surface"
introduction: "The systems that get breached are rarely the ones everyone was already worried about. They are the internal tools nobody thought to harden, because they were not customer-facing. That is where the real exposure lives."
seo_title: "Security Hardening for Internal Systems and Integration Layers"
seo_description: "Public-facing sites get security attention by default. Internal tools, webhook handlers, and integration endpoints often do not. This is where the real exposure lives, and why it matters more for internal tooling, not less."
categories: ["methods & strategy"]
---

# Security Hardening for Systems Nobody Thinks of as Attack Surface

Public-facing websites have a certain kind of security discipline built into how they get budgeted and how they get built. There is a login page, so somebody thinks about password policy. There is a checkout form, so somebody thinks about PCI compliance. There is a contact form, so somebody thinks about spam and bots. The visibility of the surface generates the attention. Whether the attention is enough is a separate question, but at least it is there.

Internal systems do not get that same treatment, and this is where the actual exposure often lives.

The webhook handler that receives inventory updates from the fulfillment platform. The admin panel that only three people use, protected by a password one of them wrote on a sticky note. The API endpoint that pulls customer data into the CRM every night, authenticated with a token that was generated three years ago and has never been rotated. None of these are customer-facing. All of them, in my experience, are the places where the security work is thinnest and the potential blast radius is widest.

## The webhook that had no authentication

A client had a WooCommerce store integrated with an external fulfillment platform. Orders placed on the store were sent to the fulfillment platform via a webhook, and the fulfillment platform sent status updates back the same way. The system had been running for two years when I was brought in to work on something unrelated, and in the course of tracing an unrelated bug I looked at the return webhook and noticed there was no authentication on it at all. Any request that arrived at the endpoint URL, from any source, would be processed as if it had come from the fulfillment platform.

The endpoint URL was not published anywhere. This was the security model. Obscurity as a control.

An attacker who guessed or discovered the URL could send arbitrary fulfillment updates to the store. They could mark orders as shipped that had not been shipped. They could inject fake tracking numbers. They could, depending on how the store handled certain edge cases, cause refunds to be processed. None of this was theoretical. The endpoint was live, it accepted anything, and the store trusted it completely.

The fix was three things. First, the fulfillment platform actually did support signed requests, using an HMAC signature in a header. That had been documented in their integration guide, on a page nobody had read when the original build had been done. Second, the endpoint was moved behind a hard-to-guess path segment, not as the primary control, but as an additional layer. Third, all requests to the endpoint were now logged, with source IP and payload, so that anomalies could be detected after the fact even if they got through the other controls.

The whole change took less than a day. The exposure it closed had been open for two years.

## The class of problem

The webhook example is one instance of a broader pattern. Internal systems and integration endpoints are treated as trusted because they are supposed to be talking to trusted partners, and the trust gets built into the system as a default rather than as an earned property that is verified at every request. The signed-webhook problem is one version. Other versions I have run into repeatedly include:

Over-permissioned API keys. A key that needs to read one specific resource is issued with full read-write access to the entire platform, because that was the default in the interface where the key was created, and nobody scoped it down.

Long-lived tokens that never rotate. A token generated at project kickoff is still in use three years later, has been shared over email at least twice, and is stored in plaintext in an environment file that has been checked into private repositories multiple times.

Integration layers that write to production databases without any input validation, because the incoming data is coming from a trusted source, and if the trusted source ever sends something malformed or malicious, the database will accept it and act on it.

None of these are exotic. All of them show up regularly. All of them are invisible to a security review that focuses on the public-facing surface, because none of them are on the public-facing surface. And all of them have deeper access to sensitive data than the login page does, because they exist to move that data around.

## What I actually run before shipping

The checklist I run before an integration goes into production has evolved over time and is not fancy. It is a series of questions I try to answer honestly, not a document I have to fill out.

Who or what can call this endpoint. If the answer is "anyone who knows the URL," that is not an answer.

What credentials does this integration hold, and what is the smallest set of permissions those credentials need. If the credentials have more access than the integration uses, that is a defect, not a convenience.

What gets logged when this runs. If nothing gets logged, an attack that succeeds will be invisible until its effects surface somewhere downstream.

What is the rotation plan for the credentials, and when is the next rotation scheduled. If there is no answer, the credentials will not be rotated.

What does the failure mode look like if a malformed or hostile request arrives. If the answer is "the system will process it," that is a bug.

None of this is OWASP Top 10 recitation. OWASP is useful for orienting; it is not a substitute for asking, of this specific integration, what actually happens if it gets called by someone who should not be calling it. That question is boring and specific and has to be asked one system at a time. Nobody enjoys asking it. It is exactly where the work is.

## Why this matters more, not less, for internal tooling

The public-facing attack surface is bounded by what a random visitor to the website can do. It is not small, but it is bounded, and there is usually a decent amount of monitoring on it. The internal attack surface, especially for systems that talk to each other, is often bounded by nothing. An integration layer that has read access to the customer database, write access to the fulfillment system, and API access to the CRM is a system that can, if compromised, do more damage in an afternoon than a public-facing SQL injection could do in a week. And it will do that damage from a source that everyone in the organization has been told to trust.

The systems nobody thinks of as attack surface are the ones with the deepest access. The engineer building them has, in my view, more responsibility for their security posture, not less, precisely because nobody else is watching.
