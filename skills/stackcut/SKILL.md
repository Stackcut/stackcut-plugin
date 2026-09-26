---
name: stackcut
description: Find cheaper ways to run the paid services a codebase or team uses, and pick the cheapest stack for a new project. Use when the user asks to cut software or SaaS spend, audit their stack, replace a subscription, work through their Stackcut plan (they have an sca_ code), choose a database/host/email service, find the most cost-effective way to build something, or check alternatives before adding a new paid tool.
---

# Stackcut: audit a stack and find cheaper paths

Stackcut maps paid services to cheaper ways to get the same job done: switch vendor, a cheaper plan, open source,
pay per use, or Replace with AI (a spec a coding agent builds from). Data comes from the Stackcut MCP server
(`https://stackcut.io/mcp`, no key). Savings are modeled from public prices, not guaranteed.

## When to use

- The user gives you a Stackcut agent code (`sca_…`) or asks you to work through their Stackcut savings plan:
  see "The user's own plan" below.
- The user is choosing what to build with ("best database for this", "cheapest way to build this", "what should we
  host on"): see "Choosing a stack" below.
- The user asks to reduce software spend, audit the services in this repo, or replace a specific tool.
- The user is about to add a paid SDK or SaaS: check `find_alternatives` or `search_recipes` first.
- Do not run this on your own initiative on every project.

## Privacy rules (always)

- Scan locally. Send Stackcut only the summary: vendor ids, evidence labels, feature names, counts, and the prices
  the user tells you.
- Never send source code, file contents, customer data, or environment variable values. The scanner never reads
  `.env` or `.env.local`; keep it that way.
- Tell the user what you will send before calling `audit_stack`. Stackcut stores the arguments of tool calls (redacted,
  never IP addresses) to improve its recommendations, so never put personal data or secrets in them.

## The user's own plan (`get_my_plan`)

1. Call `get_my_plan` with the code. It is read-only and expires; if it's rejected, ask the user to make a new one
   on stackcut.io (their plan → Send to my agent). Never ask for their scan link.
2. Go from the biggest proven saving down (`savings_per_year_usd`; `null` = not proven, don't present a number).
   For each line show the proof in `why` (receipts, prices with links), then the `how` steps and `detail.checks`.
3. Ask before any cancel, downgrade, purchase or sign-up. For `needs_info` lines ask for what `missing` names; for
   `investigate` lines help find out who uses the tool.
4. Help with the steps: compare plans on the linked pricing pages, draft cancellation or dispute messages, set up the
   replacement, and use `get_recipe` / `get_build_packet` for migrations.

## Choosing a stack (`choose_stack`)

1. If the user has a product brief or spec, call `plan_stack_from_spec` with it: it derives the jobs and volumes per
   scale (with assumptions you should show and let them edit) and returns the stack plus a build packet for a new product.
2. Otherwise list the jobs (`list_stack_jobs`: database, auth, hosting, email_transactional, llm_inference,
   image_generation_api, object_storage, video_delivery, payments_billing, sandbox_compute, browser_automation,
   job_queue, …) and ask for volumes in each job's units (MAU, emails, events, tokens in/out, images, GB stored,
   video minutes, transactions and average amount). `volumes` takes several per job; `scales` gives cost curves and
   break-evens (e.g. where SES beats Resend); `unit_economics` gives margins.
3. Present each job's `pick` with its `basis` and pricing link. Read `blocked_by` aloud: daily caps, commercial-use
   limits, session caps, missing features on a tier. `unsupported_jobs` lists what Stackcut couldn't price; say so
   and don't invent a price. Self-host options exclude server cost; don't invent it. Mention `risks` (for example
   holding funds for others) and suggest a professional answer.

## Workflow: audit a codebase

1. **Scan the codebase** (local, read-only):
   `node <this skill>/scripts/detect.mjs <repo path> --latest --pretty`
   (`--latest` pulls current rules from stackcut.io/data/detect.json; without network it uses the bundled `detect.json`.)
2. **Show the user the services found**, with the features each one appears to use. Low-confidence hits (one file, an
   embed, a config file) may not be paid: ask. Ask them to correct anything and to add paid tools that don't live in
   code (Notion, Figma, Calendly, Loom, seats). Ask what they pay per month for each (plan and seats are enough).
3. **Ask for usage.** Call `get_usage_questions` with the vendors: it says which numbers decide each answer (emails per
   month and per day, domains, database GB, file storage GB, MAU, seats, …) and where the user finds each one (dashboard
   path, API, export). If you can read usage yourself through their own tools (a Supabase, Vercel, Stripe or PostHog
   connector), use read-only aggregate queries only.
4. **Call `audit_stack`** with `services` (plus any the user added): per service `monthly_spend_usd`, `plan`, `seats`,
   `features_used` and `usage` (`{"emails_per_month": 40000, "domains": 4, "db_gb": 3}`), or `evidence` strings such as
   "40,000 emails/mo". For a portfolio, give each line a `project`: one vendor across projects is audited as one account.
   Lines with the same `account` share one bill. Auditing one product on a shared account (one Supabase org, one Vercel
   team)? Pass `shared_with` (how many products use it) so the bill isn't counted as this product's. Mark lines the user
   says they pay for with `confirmed: true`; scanner-only lines stay unconfirmed and get a question, not a price. Add
   `last_active`, `active_users` and `revenue_usd_per_month` when you know them: they drive the cleanup and sanity checks.
   If the MCP server isn't connected, POST JSON-RPC to `https://stackcut.io/mcp`
   (`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"audit_stack","arguments":{...}}}`).
5. **Present results per vendor**: status (`eligible`, `needs_info`, `keep`, `no_priced_path`, `no_recipe`), the best path,
   `your_features_covered` / `_missing` / `_to_check`, `does_not_fit` (paths ruled out, with the cap they break), setup hours
   and upkeep. `eligible` means every check passed (price, features, usage vs caps, seats, a real free tier, commercial use).
   For `needs_info`, ask the returned `questions` instead of recommending the switch. Right-size paths (the cheapest plan
   of the same vendor that fits) are often the safest saving. Keeping a tool is a valid answer. Don't add up two paths that
   replace the same bill, and don't count a shared account (one Supabase org, one Vercel team) once per product.
   - `you_lose` lists what the cheaper plan doesn't have (backups, legal shield, session length, retention): read it out.
   - `levers` are savings that aren't a switch: `right_size`, `cleanup` (pause, transfer or delete an idle project, with a
     safety checklist), `model_swap`, `batch`, `prompt_cache`, `byok`, `gateway_fee`. Each has `checks` to run first.
   - `sanity` flags numbers worth a look before any saving: runaway jobs per user, cost per user, fees against revenue,
     no revenue, unused.
   - Totals come as `confirmed_*` (prices the user gave or confirmed) and `modeled_*` (list prices for plans nobody
     confirmed). Report them separately; never add them together.
6. **If they pick a path:**
   - Switch / cheaper plan / open source: give the migration steps from `get_recipe`: `how_to_leave` (export first, cancel
     steps, refunds, notice, what you lose), the path's `playbook` (before, setup, migrate, verify, rollback, gotchas) and
     `tested_by_stackcut` when Stackcut has run that path end to end. Cite the sources each step carries.
   - Replace with AI: call `get_build_packet`, write the files into a new folder, and build from `SPEC.md`
     (acceptance tests first, nothing listed as out of scope).
   - Never cancel a subscription, migrate production data, or change billing without the user's explicit go-ahead.
7. **After the user confirms** they switched (or reverted), call `report_outcome` so the public "most used"
   counts improve.
8. **No recipe fits?** Say so plainly, name the nearest option and the exact gap. Don't invent support.

## Tools on the MCP server

`get_my_plan`, `choose_stack`, `plan_stack_from_spec`, `list_stack_jobs`, `audit_stack`, `get_usage_questions`,
`get_detection_rules`, `find_alternatives`, `search_recipes`, `get_recipe`, `get_build_packet`, `leaderboard`,
`list_categories`, `report_outcome`.
Docs: https://stackcut.io/agents
