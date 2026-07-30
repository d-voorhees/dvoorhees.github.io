---
date: 2026-07-29
layout: post
title: "Building an MCP Server for PostHog's Documentation"
introduction: "A working RAG pipeline that serves PostHog's docs to any MCP-compatible AI agent, built with FastMCP, OpenAI embeddings, and ChromaDB, deployed on Fly.io. Three real bugs shaped the final build."
seo_title: "Building an MCP Server for PostHog Documentation"
seo_description: "How to build and deploy an MCP server with FastMCP, OpenAI embeddings, and ChromaDB. Covers chunking strategy, retrieval tradeoffs, and Fly.io deployment bugs."
categories: ["architecture", "tutorials", "systems design", "projects on github"]
github_url: "https://github.com/d-voorhees/posthog-writer-agent"
---

PostHog's job posting for a Context Engineer role names a specific internal project called a Writer agent: a RAG (retrieval-augmented generation) system that maintains the company's documentation. I read that line and decided to build a working version of it myself, against PostHog's real public docs, before ever applying.

The result is `posthog-writer-agent`, an MCP server that answers questions about PostHog's Feature Flags, Product Analytics, and Session Replay documentation. Any MCP-compatible AI tool can connect to it and get sourced, current answers instead of guessing from stale training data. The code and a live deployment are both public. The build surfaced three real bugs worth documenting, none of which were obvious going in.

## What the server actually does

A person never talks to this server directly. Their AI assistant does. Claude Code, Claude Desktop, Cursor, any MCP client, sends a query to the server through one of three tools. It searches an indexed collection of PostHog docs, returns the relevant chunks, and the assistant uses that text to write an answer. No conversation logic lives here. The server answers one kind of request: find the relevant PostHog doc content for a given question.

Three tools cover different retrieval shapes. `search_posthog_docs` runs general semantic search across all three doc sections. `get_configuration_guide` biases toward step-by-step setup content and pulls more chunks per call, since configuration questions usually need more surrounding context. `explain_event_schema` narrows further. It scopes retrieval to the Product Analytics schema management docs specifically, so a question about typed property groups doesn't compete against feature flag content in the results.

## Chunking on structure instead of size

The docs get chunked before embedding, and the chunking strategy was the first real decision worth getting right. A flat, fixed-size chunker (500 characters, say) treats every document as an undifferentiated stream of text. That approach broke on the first real test.

PostHog's feature flags best-practices doc explains flag evaluation as a hash of two inputs, the flag key and the distinct ID, with a specific formula and a sentence explaining what the formula means. A 500-character boundary landed squarely between the formula and its explanation. The retrieval system scored that chunk as relevant to a query about rollout percentages. The chunk itself explained nothing, because half of what a reader needed sat on the other side of an arbitrary cut.

The fix splits on Markdown `##` header boundaries first. PostHog's docs are well-authored, with clear semantic sections: a checklist, a worked example, a specific concept. Splitting on those boundaries respects the author's own structure. A character cap only kicks in as a fallback, for the rare section that runs long on its own, and even then the fallback splits on paragraph boundaries with a small overlap rather than cutting mid-sentence. The lesson generalizes beyond this project: chunk boundaries are primarily a comprehension decision, with size as a secondary constraint, at least when the source material is structured enough to reward that assumption.

## Retrieval, kept small on purpose

Embeddings run through OpenAI's `text-embedding-3-small`, the smaller of the two embedding models OpenAI offers. The doc set totals a few dozen chunks across three sections, the content is technical prose, and the smaller model's retrieval quality held up fine at that scale. A corpus two or three orders of magnitude larger, or content carrying subtler semantic distinctions, would push that choice toward the larger model instead.

The vector store runs ChromaDB in local persistent mode. Standing up Pinecone or an equivalent adds a dependency and a credential someone would need to manage just to run a demo. ChromaDB's local client reproduces the same retrieval behavior with no infrastructure beyond the container itself. Scaling to PostHog's full documentation site, or supporting concurrent access across multiple instances, would be the signal to move to a hosted store.

## A version bump that broke the SDK import

Dependency drift caused the second real bug. The official `mcp` Python package shipped a `2.0.0` major release that restructured its module layout and removed the `mcp.server.fastmcp` import path this project depends on. `pip install mcp[cli]` without a version pin resolved straight to that broken release. `requirements.txt` now pins to `mcp[cli]==1.29.0` specifically. Any future upgrade of that dependency should start with a changelog check, since a routine `pip install -U` would reintroduce the same break.

## The session bug that only showed up in production

Deploying to Fly.io surfaced a third bug, and this one only appeared after the code was already working locally. Fly runs more than one machine behind a single app by default, with no guaranteed session affinity between requests. FastMCP's HTTP transport tracks session state in memory per process. A client's `initialize` handshake landed on one machine, its follow-up `tools/list` call landed on the other, and that second machine had no record of the session. The connection closed with a generic MCP error, `-32000`, that gave no hint about the actual cause.

The fix is a single flag: `stateless_http=True` on the `FastMCP()` constructor. It removes the dependency on any session state surviving between requests, a requirement for any deployment running more than one instance behind a load balancer, Fly or otherwise. The tradeoff is real: features that depend on a persistent session, resumable streaming connections across a reconnect, for instance, aren't available in this mode. For a documentation-lookup server where every tool call is independent, that cost is close to nothing. A server that needed to maintain multi-turn state within a single client session would need a different fix, most likely session affinity configured at the load balancer rather than statelessness in the app itself. Local testing never surfaced any of this, since a single local process has nowhere else to route a request to.

## A landing page, because a bare MCP endpoint looks broken

The last piece was a gap: the deployed server had no landing page. Visiting the root URL in a browser returned a 404, since FastMCP serves the MCP protocol at `/mcp`. A person clicking the link from a README with no other context would reasonably conclude the project was down.

The fix adds a small landing page at `/`, registered through FastMCP's `custom_route` decorator, which explains what the server does, how to connect an MCP client, and links to the source. A `/health` endpoint sits alongside it for anyone who wants a direct status check without reading through prose. Neither route touches the MCP protocol itself; they exist purely for the human who clicks a link expecting to see something.

## Where it stands

The server runs live on Fly.io now, connectable by any MCP client at a public URL, with the full source on GitHub. Three doc sections are indexed: Feature Flags, Product Analytics, and Session Replay. The README documents the honest scope of the project directly: it exists to demonstrate a specific engineering pattern PostHog itself is building internally. That's a narrower claim than solving a problem for a general audience, and the README says so. A real secondary use case exists anyway: any AI coding agent working against PostHog's fast-moving API runs into the same problem this server solves, an assistant reasoning from documentation that's already gone out of date.

The repo is at [github.com/d-voorhees/posthog-writer-agent](https://github.com/d-voorhees/posthog-writer-agent), and the live server is at [posthog-writer-agent.fly.dev](https://posthog-writer-agent.fly.dev).
