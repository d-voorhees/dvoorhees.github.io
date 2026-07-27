---
date: 2026-07-12
layout: post
title: "How I Built a Streaming AI Chat Tool in PHP Without Node or a Database"
introduction: "A streaming LLM chat tool with HMAC token auth and CRM tagging, running on ordinary PHP shared hosting for the cost of an OpenAI API key. Here is how it works and what I learned switching providers mid-build."
seo_title: "Streaming AI Chat in PHP Without Node or a Database"
seo_description: "How to build a streaming AI chat tool in PHP with server-sent events, HMAC token auth, and CRM tagging, no Node, no database, no framework."
categories: ["architecture", "tutorials", "systems design", "github projects", "integrations"]
---

I built a diagnostic framework describing five patterns in how businesses use (or misunderstand) their own analytics data, each with a recommended metric to track. It worked as a concept, but in reality, it was a big lift. Readers had to identify their own decision making patterns, choose the right metric, and map it to a real decision they had made, and that is a lot to ask of someone reading a guide. Almost nobody finished it.

This winter I rebuilt it as a live AI conversation. Instead of asking readers to apply the framework to themselves, the tool applies it for them: it asks about their business and an actual decision they made, then does the pattern matching live. The framework did not change. Who does the thinking did.

The result is a chat tool that asks visitors seven questions about a real decision they made using their website analytics, then walks them through which of five decision patterns they fall into and what to track instead. Most tutorials for adding AI chat to a site land in one of two places: a third-party widget you don't control, where the conversation lives on someone else's platform, or a Node or Python backend, which means a new server to provision, pay for, and maintain. Neither fit what I wanted. This tool runs entirely on the PHP hosting I was already paying for, with no Node server and no database, so there was no new infrastructure to stand up at all.

It is live at [thedecisionloop.com/growth-leak-diagnostic](https://thedecisionloop.com/growth-leak-diagnostic). The full reference implementation is on GitHub at [github.com/d-voorhees/streaming-ai-chat-php](https://github.com/d-voorhees/streaming-ai-chat-php).

This post is the build story. The README covers the complete setup. Read this first to understand why things are built the way they are, then use the README to get it running.

---

## What I was trying to build

A visitor submits their email, gets redirected to a chat interface, answers seven questions about their business and a real decision they made, and receives a personalized breakdown of which analytics decision pattern they fall into. At the end, the tool classifies them into one of five archetypes and tags them in MailerLite so they get the right follow-up sequence automatically.

Four requirements shaped the architecture, and one drove more of the design than the other three combined. The API key could never reach the browser. Everything had to run on standard shared PHP hosting. The AI's response had to feel immediate rather than making visitors wait for a full round-trip. The hardest one: the chat page had to be access-controlled without a login system or a database, since that constraint is what eventually produced the whole HMAC token design below.

---

## The first version used Claude. I switched.

I started with Claude Sonnet via the Anthropic API. It correctly followed the six-stage structure, applied the business-model lookup table to edge cases I hadn't explicitly covered in the prompt, and never dropped the hidden classification tag. The system prompt I wrote is long: it covers seven question types, six diagnosis stages, a lookup table mapping roughly 25 business model types to specific metrics, and instructions for appending a hidden classification tag at the end of the output without the visitor seeing it.

At that prompt length, cost per conversation ran about $0.60 at the time of development. Claude's pricing has changed since then, so your numbers will differ, but the core problem was real. At any meaningful volume, $0.60 per conversation does not work for a tool at this price point.

Switching to `gpt-4o-mini` brought cost to $0.02-0.04 per conversation. I ran both models on the same prompts for a week and read the transcripts side by side: same stage sequence, same tag placement, same handling of business models outside the common ones in the lookup table. For this specific task, a structured multi-stage conversation following explicit sequential instructions, gpt-4o-mini held up. That is not a universal result. A prompt that needed more open-ended reasoning between stages, rather than following a fixed sequence, is exactly where I would expect the gap to reopen.

The switch itself took about two hours: new endpoint, updated auth header, new request payload shape, updated SSE response parser in the JavaScript. The chat interface did not change at all. I will come back to why.

---

## Keeping the API key server-side

`diagnostic-api.php` is a thin proxy between the browser and OpenAI. The browser sends conversation text. The PHP file appends the system prompt, authenticates with OpenAI using a key stored in `config.php`, and streams the response back. The browser never sees the key or the prompt.

If you make the API call directly from the browser, your key is visible to anyone who opens the network tab. That is not theoretical. It will happen.

Keeping the provider behind this proxy is also what made the provider switch cheap. Changing from Anthropic to OpenAI meant changing one file. The chat interface is insulated from every provider-specific detail: endpoint format, auth header shape, streaming response structure. When the provider changes, `diagnostic-api.php` changes. Nothing else does.

---

## Access control without a database

The chat page needed to work only for email-verified visitors, stay out of search engine indexes, and stop working after a reasonable window. A login system backed by a database would have handled all of that, but I did not want to build or maintain either.

HMAC-SHA256 tokens (a way to sign a piece of data so any tampering is detectable without storing anything server-side) handle this instead. When a visitor signs up, `diagnostic-token.php` takes their email and the current timestamp, signs the concatenated string with a secret key using `hash_hmac`, and base64-encodes the result into a URL-safe string. The visitor gets redirected to `diagnostic-chat.html?token=xxx`.

When the chat page loads, it calls `diagnostic-validate.php`, which re-derives the expected signature from the token's own payload and compares it to the signature embedded in the token. Matching signatures and a timestamp within one hour renders the chat. A tampered or expired token shows a soft error page with a link to sign up again.

Validation is pure cryptographic math. Either you know the secret key or you cannot produce a valid signature. No session table, no lookup query, no infrastructure beyond the files already on your server.

The tradeoff is worth naming: tokens cannot be revoked during their validity window. A visitor who shares their link within the hour gives someone else access. For a one-hour TTL on a low-stakes tool, that is acceptable. If revocation matters for your use case, you need a database and this pattern does not cover it.

One practical note before you build: the secret key was hardcoded in my original version of `diagnostic-token.php`. Before publishing to GitHub I moved it to `config.php` so it is never committed. Start with the config approach.

---

## Why the responses stream

The first version made a single blocking API call and rendered the complete response when it came back. At the prompt length the diagnostic requires, visitors waited 15-25 seconds before any text appeared. The spinner ran. People left.

Server-Sent Events stream the response token-by-token as the model produces it. The first token appears in under a second. Total generation time is identical. What changes is that the visitor sees progress immediately instead of waiting for everything at once.

SSE works here because the communication is one-directional: the server sends, the browser receives. WebSockets handle bidirectional communication, which this tool does not need, and they require a handshake protocol to manage. SSE runs over standard HTTP with two PHP settings: `ob_implicit_flush(true)` and `ob_end_clean()` to disable output buffering. The JavaScript side uses the `EventSource` API to listen for chunks and appends them to the chat interface as they arrive. The `streamResponse` function in `diagnostic-chat.html` has the full implementation.

One limit worth knowing before you deploy this: disabling PHP's own output buffering does not guarantee streaming end to end. Some shared hosts, reverse proxies, and CDNs buffer responses at a layer PHP does not control, which can quietly turn your token-by-token stream back into a single delayed block with no error to tell you why. Test on your actual hosting, not just locally, before you assume this works.

---

## The hidden tag that drives CRM automation

At the end of the diagnosis, the AI appends a string the visitor never sees: `[[LEAK:archetype_name]]`, where `archetype_name` is one of five values corresponding to the five archetypes.

The JavaScript watches the streamed output for that pattern using a regular expression. When it finds the tag, it strips it from the visible text and simultaneously fires a background POST to `diagnostic-tag.php` with the email address and the leak type. `diagnostic-tag.php` calls the MailerLite API and adds the subscriber to the right group. Each group triggers a different nurture sequence.

Why the hidden tag rather than parsing the conversation server-side after completion? Timing. The classification needs to fire after the visitor has read the diagnosis. Embedding the tag in the AI's output and letting the JavaScript trigger on it handles that. Parsing the full response server-side would mean either waiting for completion before tagging or building a second streaming parser on the PHP side.

The tradeoff is that the background POST is fire-and-forget: if that request fails, whether MailerLite is briefly down or the visitor closes the tab mid-request, nothing retries it and nothing surfaces the failure. A visitor completes the diagnosis and never gets tagged, with no log entry pointing at why. For a low-stakes lead-nurture sequence that is a tolerable failure mode. For something where the tag drives a purchase or a support handoff, you would want a retry or at least a server-side log of failed tag attempts.

---

## The system prompt is not in the repo

The full production prompt is the core product logic of a live tool and is not published. What is in the repo is a placeholder that documents the structure: the seven question types, the six diagnosis stages, the business model lookup table, and the hidden tag format. That is enough to write your own prompt for a different application.

One structural decision is worth explaining separately. Earlier versions of the prompt gave the full diagnosis in one block at the end. Engagement dropped sharply. Visitors read the first paragraph and left. The current prompt breaks the diagnosis into six sequential stages, each ending with a question the visitor must answer before the next stage appears. Total output is longer. Completion rate is substantially higher. Forcing sequential interaction keeps attention through the content that matters most.

---

## What to build on this

The same four PHP files work for anything that gates a personalized AI conversation behind an email signup: a product onboarding flow, a lead qualification tool. A support triage bot is a different shape. It usually needs to work for an existing customer, not a first-time visitor giving up an email address, which means the HMAC-token pattern here would need to authenticate against an account or ticket ID instead of an email and timestamp, not just swap in a new system prompt.

To adapt this repo for the onboarding or lead-qualification case: replace the system prompt in `diagnostic-api.php` with your own conversation logic, update the tag mapping in `diagnostic-tag.php` to match your outcomes and your CRM groups, and wire your email signup handler to call `generateDiagnosticToken($email)` and redirect to the chat page.

The README at [github.com/d-voorhees/streaming-ai-chat-php](https://github.com/d-voorhees/streaming-ai-chat-php) covers the complete setup, the config file shape, and how to generate test tokens without touching your live CRM.

## Support and done-for-you builds

The repo is published as-is. Between client work and my own projects, I do not have bandwidth to personally support individual implementations, debug specific hosting environments, or troubleshoot why a particular API call is failing on someone else's server. The README and this post together cover what you need to get it running, and any competent PHP developer can take it from there.

If you want a version of this built for your own site and connected to your own CRM, I take on a limited number of these builds as client work. I can adapt the system prompt to your diagnostic or qualification flow, wire it into whichever email platform you use, and hand off a working install on your hosting. Reach out through the contact page if that is what you need.

If this saves you time, a star on the repo helps others find it.
