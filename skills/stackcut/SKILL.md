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
- Tell the user what you will send before calling `audit_stack`.

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

1. List the jobs the project needs (`list_stack_jobs`: database, auth, hosting, email_transactional, analytics, …)
   and ask for expected volumes: users (MAU), emails per month, events per month, seats.
2. Call `choose_stack` with `needs` (job, must-have features, volume) and `prefer` (cheapest, managed, open_source).
3. Present each job's `pick` with its `basis` (the published limit that covers their volume) and the pricing link.
   `starts_at`, `needs_check` and `needs_info` options are not proven at their volume: say so and ask, or check the
   linked pricing page. Self-host options exclude server cost; don't invent it.

## Workflow: audit a codebase

1. **Scan the codebase** (local, read-only):
   `node <this skill>/scripts/detect.mjs <repo path> --latest --pretty`
   (`--latest` pulls current rules from stackcut.io/data/detect.json; without network it uses the bundled `detect.json`.)
2. **Show the user the services found**, with the features each one appears to use. Ask them to correct anything and
   to add paid tools that don't live in code (Notion, Figma, Calendly, Loom, seats). Ask what they pay per month for
   each (plan and seats are enough). "Don't know" is fine: the audit uses modeled plan prices and says so.
3. **Call `audit_stack`** with `services` from the scan (plus any the user added) and `monthly_spend_usd` per vendor.
   If the MCP server isn't connected, POST JSON-RPC to `https://stackcut.io/mcp`
   (`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"audit_stack","arguments":{...}}}`).
4. **Present results per vendor**: status (`eligible`, `needs_info`, `keep`, `no_recipe`), the best path, which of
   their features it covers and which it misses, setup hours and upkeep. Keeping a tool is a valid answer.
   Don't add up two paths that replace the same bill.
5. **If they pick a path:**
   - Switch / cheaper plan / open source: give the migration steps from `get_recipe`: `how_to_leave` (export first, cancel
     steps, refunds, notice, what you lose), the path's `playbook` (before, setup, migrate, verify, rollback, gotchas) and
     `tested_by_stackcut` when Stackcut has run that path end to end. Cite the sources each step carries.
   - Replace with AI: call `get_build_packet`, write the files into a new folder, and build from `SPEC.md`
     (acceptance tests first, nothing listed as out of scope).
   - Never cancel a subscription, migrate production data, or change billing without the user's explicit go-ahead.
6. **After the user confirms** they switched (or reverted), call `report_outcome` so the public "most used"
   counts improve. It stores no user data.
7. **No recipe fits?** Say so plainly, name the nearest option and the exact gap. Don't invent support.

## Tools on the MCP server

`get_my_plan`, `choose_stack`, `list_stack_jobs`, `audit_stack`, `get_detection_rules`, `find_alternatives`,
`search_recipes`, `get_recipe`, `get_build_packet`, `leaderboard`, `list_categories`, `report_outcome`.
Docs: https://stackcut.io/agents
