---
date: 2026-05-19
layout: post
title: "What 100 Client Engagements Taught Me About Systems That Actually Get Adopted"
introduction: "A technically correct system that nobody uses is a failed system. The gap between 'works' and 'gets adopted' is where most internal tooling actually dies. After more than a hundred client engagements, this is what I have learned about what happens in that gap."
seo_title: "What Makes Internal Systems Actually Get Adopted"
seo_description: "The gap between a technically correct system and one people actually use is where most internal tooling dies. A field report from more than a hundred client engagements."
categories: ["methods & strategy", "product development"]
---

# What 100 Client Engagements Taught Me About Systems That Actually Get Adopted

I have delivered somewhere north of a hundred client engagements over the last thirteen years. Some of the systems I built are still in daily use, half a decade after handoff, with the client staff running them so fluently that the original build feels like it was always there. Some of them are dead, quietly replaced or worked around, sometimes within months of go-live. And here is the part that took me an embarrassingly long time to admit: whether a system landed in the first category or the second was not, in most cases, a function of how technically good the build was.

Some of the systems that died were extremely well engineered. Some of the systems that lived were held together with duct tape. Technical quality clearly matters some — I have never seen a genuinely broken system get adopted — but I stopped trusting it as the main variable once I had enough dead, well-built systems and surviving, ugly ones on the same list. Something else was doing more of the work.

The second variable is whether the system matched the mental model the users already had of what they were doing, or whether it required them to adopt a new mental model to use it.

## The pattern

I have watched this play out enough times that I now expect it. A client comes to me with an operational problem. They describe how the work currently gets done, usually a combination of spreadsheets, email threads, and one heroic person who holds the entire process in their head. I build a system that solves the problem correctly, on paper. The system replaces the spreadsheets, the email threads, and the heroic person. It is objectively better. It ships. Training happens. Everyone nods.

Six months later, one of two things has happened. Either the client staff are using the system the way it was designed to be used, and things are going well, or the client staff have quietly reconstructed their old workflow inside the new system, using it as a fancy container for the spreadsheet and email approach that the system was supposed to replace. In the second case the system is technically running, and technically being used, and technically a success, and it is also completely failing to deliver the value it was built to deliver.

The difference between the two outcomes, in almost every case I have looked at closely, comes down to whether the new system asked the users to think about their work in the same way they already thought about it, or asked them to think about it differently.

## The system that almost died

A client in professional services came to me to build a project intake and status tracking system. Their existing process ran on a shared spreadsheet with about forty columns, updated by whoever remembered to update it, with color coding that had accreted over years and that nobody could fully explain. My initial build was a well-designed database-backed system with clean forms, structured records, and reports that could answer any question the leadership had ever asked and several they had not yet thought to ask.

The system was elegant. I was proud of it. It was, within about eight weeks of launch, dead.

The staff had gone back to the spreadsheet. They were using the spreadsheet to actually manage projects, and then, once a week, someone was copying summary data from the spreadsheet into the new system, so that the reports the leadership wanted would populate. The system had become an expensive display layer for data that was still being managed elsewhere.

I was frustrated at first, in the way you get frustrated when a client fails to appreciate a good thing. That was the wrong reaction. When I actually sat with the staff and watched them work, what I saw was that the spreadsheet was doing something the new system was not: it was allowing them to see everything about a project at once, in one horizontal row, with all the context they needed for a status conversation right there. My system had normalized the data across several related tables. To see everything about a project, they had to click through three screens. This was, from a data modeling perspective, correct. From a "person needing to answer a question during a client call" perspective, it was a disaster.

The fix, once I understood the problem, was not to rebuild the database. It was to add a single denormalized view that showed a project the way the spreadsheet had shown it, one project per row, all the fields visible, sortable and filterable. The underlying structure did not change. The interface changed. Adoption followed within two weeks. The spreadsheet went away, not because I forced it to, but because the new system finally answered the question people were actually asking of it.

The view came with a real cost, and it was worth naming rather than pretending the fix was free. A denormalized view is a second place the same data lives, and if anything writes to it directly instead of going through the normalized tables, the two copies drift. I locked the view to read-only and rebuilt it on a schedule rather than in real time, which meant the staff view was occasionally a few minutes stale. That was a fine trade for a status dashboard. It would not have been fine for the actual write path.

## What this means for building

The engineer who thinks about adoption from day one builds differently than the engineer who thinks about it at handoff. The first engineer asks, before designing the schema, what the current workflow actually looks like, in enough detail to understand what the users are getting from the current workflow that they will lose if the new system does not preserve it. The second engineer asks what the new system should do and builds it, and then hopes the training session bridges the gap.

There is a version of engineering culture that treats adoption problems as user problems. Users are resistant to change. Users do not want to learn new tools. Users have bad habits. This framing is comforting because it locates the problem outside the system, in the population of humans who have failed to appreciate what has been built for them. In every dead system I have gone back to diagnose, the staff had a specific, describable reason for reverting — the horizontal-row view they lost, the extra clicks they picked up, the report a manager wanted that didn't help them do the actual job. None of the reasons were "change is hard." All of them were "this new version costs me more than the old one did, for work I still have to do the old way underneath it."

The engineer who understands this designs for the person doing the work, not the person receiving the reports, and then designs the reports on top of that foundation. It is possible to do both. It requires spending more time understanding the work before the build starts, and less time being clever about the schema.

## For an internal tooling role

An organization building internal tools for its own staff has, in principle, an advantage over an external consultant: the users are colleagues, someone can walk over and watch them work, and there is no invoice creating pressure to call a build finished before it actually fits. That advantage only pays off if it gets used, though, and the way to use it is the same thing I did with the professional-services client: sit with the person doing the work before the schema gets written, and ask what they would lose, specifically, if this system replaced their current one. Not whether they're open to change. What they would lose.

I still get the schema wrong sometimes. What changed, after a hundred engagements, is how early I go looking for the moment it will get rejected — before launch, sitting next to someone doing the actual work, instead of eight weeks after go-live, reading usage logs and wondering why nobody's touching it.
