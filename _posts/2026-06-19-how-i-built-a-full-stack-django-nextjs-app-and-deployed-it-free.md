---
date: 2026-06-19
layout: post
title: "How I Built and Deployed a Full-Stack Django + Next.js App for Free in 2026"
introduction: "The full production stack for Bird by Bird, a Django + Next.js + GraphQL app with managed Postgres, transactional email, and HTTPS, costs nothing per month to run. Here is how I built it and what went wrong along the way."
seo_title: "How I Built and Deployed a Full-Stack Django + Next.js App for Free in 2026"
seo_description: "How I built and deployed Bird by Bird, a full-stack Django + Next.js + GraphQL app, for $0/month using Fly.io, Neon, Vercel, and Resend."
categories: ["engineering", "deployment"]
---

I built Bird by Bird because I wanted to work with a specific stack: Django on the backend, GraphQL as the contract between layers, Next.js on the frontend, PostgreSQL underneath. The app itself is a focus tool. It shows one task at a time and keeps everything else out of view. The idea came from Anne Lamott's *Bird by Bird*, specifically the story of her brother panicking over a school report on birds the night before it was due, and their father sitting beside him and saying: bird by bird, buddy, just take it bird by bird.

The build was as much about spending time inside the tools as about the product that came out of them. What I did not expect was how the deployment story would turn out. I have been shipping web projects for over a decade, and infrastructure cost has always been a real constraint on what you can run as a side project. That constraint has changed. The full production stack for Bird by Bird costs nothing per month to run, and that is worth documenting separately from the product decisions.

## The stack

Frontend: Next.js 14 with the App Router, TypeScript in strict mode, Apollo Client, Tailwind CSS, `@dnd-kit` for drag-to-reorder. Deployed on Vercel Hobby.

Backend: Django 5 with Graphene-Django for GraphQL, JWT authentication in HTTP-only cookies, email verification via Resend. Deployed on Fly.io on a shared-cpu-1x machine with 1GB RAM.

Database: PostgreSQL on Neon's free tier. Managed, auto-scales to zero when idle, point-in-time restore included.

Email: Resend, SMTP relay, free tier covers 3,000 emails per month.

Total monthly cost: $0.

## The first decision that shaped everything else: keeping the frontend proxy pattern

The most consequential architectural decision was not about Django or GraphQL. It was about how the Next.js frontend talks to the Django backend.

The obvious approach is to put the backend on a subdomain (`api.yourdomain.com`) and have the frontend call it directly. This is what most tutorials show. The problem is that cross-origin HTTP-only cookies are fragile. `SameSite=Lax` cookies don't cross origins at all. `SameSite=None; Secure` cookies cross origins but require careful CORS configuration that breaks in subtle ways across browsers, and any mismatch between the frontend's origin and the cookie's domain makes the auth invisible to the browser.

My mental model for this: if the browser has to make a request to a different origin to authenticate, the cookie story gets complicated fast. Keep everything on one origin.

The solution was a Next.js rewrite proxy. The frontend calls `/graphql` on its own origin. `next.config.mjs` rewrites that to the Fly.io backend:

```javascript
async rewrites() {
  const backend = process.env.GRAPHQL_BACKEND_URL ?? "http://127.0.0.1:8000";
  return [
    {
      source: "/graphql",
      destination: `${backend}/graphql/`,
    },
  ];
}
```

In production, `GRAPHQL_BACKEND_URL` is the Fly.io URL. The browser never sees a cross-origin request. The JWT lives in an HTTP-only cookie set by Django, readable by no JavaScript, sent automatically with every same-origin request. The CORS configuration on Django only needs to trust the Vercel origin for the server-to-server leg of the proxy, which is a much simpler surface to secure.

This pattern also means the backend URL is never exposed in client-side code. The `NEXT_PUBLIC_GRAPHQL_URL` environment variable exists for server-side rendering, but the browser always calls `/graphql` on the Vercel domain.

## What went wrong: the Dockerfile

Fly.io auto-generated a Dockerfile when I ran `fly launch`. The generated file used Poetry as the package manager and the Django development server as the process:

```dockerfile
RUN pip install poetry
COPY pyproject.toml poetry.lock /code/
RUN poetry config virtualenvs.create false
RUN poetry install --only main --no-root --no-interaction
CMD ["python","manage.py","runserver","0.0.0.0:8000"]
```

Two problems. The project uses `uv`, not Poetry, so there is no `poetry.lock` file. And the development server is not suitable for production, which Fly had already warned about during the launch wizard. I missed the warning and deployed anyway.

The first deploy landed with a 502. The logs showed:

```
ModuleNotFoundError: No module named 'django'
```

Gunicorn was installed in the system Python. Django was installed in the uv virtualenv. The two environments did not share packages. When Gunicorn tried to boot the WSGI application, it could not find Django because it was looking in the wrong Python environment.

The fix was to install everything into the system Python and run Gunicorn directly:

```dockerfile
RUN pip install uv
COPY pyproject.toml uv.lock /code/
RUN uv pip install --system -r pyproject.toml
RUN pip install gunicorn
CMD ["gunicorn", "bird_api.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "60"]
```

`uv pip install --system` installs into the system Python rather than a virtualenv. Gunicorn is also installed system-wide. Both share the same Python environment. Second deploy worked.

The lesson: `fly launch` generates a reasonable starting point but it does not know your package manager or your production server requirements. Read the generated Dockerfile before deploying, not after the 502.

## The cold start problem and how to fix it for free

The default Fly configuration shuts the machine down after a few minutes of inactivity:

```toml
auto_stop_machines = 'stop'
min_machines_running = 0
```

This is sensible for cost, and irrelevant if you are on a paid plan with predictable traffic. For a side project, the first request after idle takes 6-10 seconds while the machine boots. That is a bad first impression for anyone who clicks the link in your GitHub README.

The fix is one line in `fly.toml`:

```toml
min_machines_running = 1
```

With one machine always running, the cold start disappears. On the free allowance for a shared-cpu-1x machine, keeping one instance warm is within the free tier limits. You are not charged extra for warmth, only for the machine size and uptime, and one small machine running continuously costs nothing on the free plan.

## The GraphQL mutation proliferation problem

The original data model had three mutations for task state: `completeTask`, `skipTask`, and `abandonTask`. The flock view had a three-dot menu per row with Done, Skip, Promote, and Abandon options.

I built all of it. Then I deleted most of it.

Every button on a flock row is a decision the user has to make before doing the actual work. Four options per row, multiplied by a backlog of twenty tasks, produces eighty micro-decisions before you have finished anything. The mutations existed, but the interface did not need to expose them.

What shipped instead: one checkbox (`completeTask`), one drag handle (`reorderTasks`), one trash icon (`deleteTask`). Two additional mutations came in during the build: `uncompleteTask` for sending a completed task back to the queue, and `clearHistory` for wiping the archive. Neither was in the original spec. Both were five-line additions to the GraphQL schema because the schema-first model makes incremental mutation additions cheap.

This is the part of the build I would have gotten wrong if I had not actually used the product for a few weeks before shipping. The spec looked reasonable on paper. In practice, the menu was the problem I was trying to solve, rebuilt inside the product I was trying to ship.

## Deploying the split stack: Vercel + Fly + Neon + Resend

The deployment sequence matters more than the individual services. Getting it wrong costs hours.

The right order is: database first, email second, backend third, frontend last. The reason is dependency direction. The backend needs a working database connection before it can run migrations, and it needs working email credentials before verification flows work. The frontend needs a deployed backend URL before its environment variables mean anything. Each service is a dependency of the next.

**Neon** took fifteen minutes. Create a project, copy the connection string, run `python manage.py migrate` against it locally to confirm the schema applies, done. The connection string goes directly into Fly secrets later; it never touches a config file that could be committed.

**Resend** took fifteen minutes. Create an API key, add it as Django's SMTP credentials (server: `smtp.resend.com`, port 587, TLS), test a send from the Django shell. Resend's free tier limits sends to your own verified email address until you verify a sending domain. Verify your domain in Resend before you share the app with anyone, otherwise your users' verification emails will never arrive.

**Fly** took the most time, partly because of the Dockerfile problem above and partly because the Django settings needed two production-specific additions: `dj-database-url` to parse the `DATABASE_URL` connection string Neon provides, and the security middleware block that Django needs when running behind Fly's HTTPS-terminating proxy:

```python
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
```

Without `SECURE_PROXY_SSL_HEADER`, Django sees plain HTTP from Fly's internal network and treats every request as insecure, which breaks the cookie auth in ways that are annoying to debug.

**Vercel** took thirty minutes including the one wrong turn: Vercel detected both the `frontend/` and `backend/` directories and asked for a `vercel.json` to manage multiple services. The Deploy button grayed out. The fix was setting the root directory to `frontend/` only, which tells Vercel to ignore the Django backend entirely and deploy just the Next.js app.

## What the free tier story actually looks like in 2026

A fully deployed, always-on, production-shaped web application, with managed Postgres, transactional email, HTTPS everywhere, and auto-deploy on push, costs nothing per month to run in 2026.

That was not true three years ago. Heroku killed its free tier in 2022. Railway has a $5/month minimum. Render's free tier spins down after fifteen minutes of inactivity, which produces the same cold start problem without the fix available on Fly. The combination of Vercel Hobby, Fly.io's free allowance, Neon's free tier, and Resend's free tier is the stack that closed the gap.

The practical implication: the barrier to keeping a side project live is no longer infrastructure cost. It is maintenance attention and the willingness to set `min_machines_running = 1` in a config file. Ship the thing, then iterate. The free tier will hold it while you figure out whether anyone cares.

Bird by Bird is live at [bird-by-bird.vercel.app](https://bird-by-bird.vercel.app) and the full source, including the Dockerfile, `fly.toml`, and Terraform-shaped `infra/` directory for anyone who wants the AWS production architecture instead, is at [github.com/d-voorhees/bird-by-bird](https://github.com/d-voorhees/bird-by-bird).
