# Baseline a team's stack (start_audit)

Use this when the decision needs more than the bills: cutting spend across several tools, consolidating apps into fewer
tools or one build, or replacing one tool safely. Bills and code show what a team pays for. They don't show who uses
what, which features matter, which workflows cross apps, or when each contract renews. That lives in admin consoles,
exports, invoices and people's heads, all on the user's side. You collect it locally and send Stackcut a summary.

## The loop

1. **Scope (2 minutes).** Ask what the decision is (cut spend, consolidate, replace one tool, choose a stack), what you
   may read (repos, connectors, exports, email) and what's off limits.
2. **First pass.** Write a rough manifest from what you already know: the user's own words, their Stackcut plan
   (`get_my_plan` with an `sca_` code), a code scan. Don't go digging yet. Even "Notion, Asana and Loom, about 8
   people" is a valid first pass.
3. **Call `start_audit` with the manifest** (or just `vendors` and `team_size` on the first pass). It validates it and
   answers with `questions`: the missing facts that would change the recommendation, highest stakes first. Each says
   why it matters and where people usually find it. With no arguments it returns this playbook, the schema and an example.
4. **Fetch only those facts**, then call again. If you look for something and can't find it, add it to `unknowns` with
   a reason; Stackcut won't ask for it again and states its assumption instead.
5. **Stop at `status: "enough"`** (usually two or three rounds). Then call `next.tool` (`audit_stack`) with
   `next.arguments`. For a consolidation, `search_workflow_recipes` and `get_build_packet` give the runbook and the build
   spec, and the manifest's `workflows` become the acceptance tests.
6. **Leave the baseline with the user**: `stack-baseline.md` (readable) and `stack-baseline.json` (the manifest) in their
   workspace, so they can correct it and reuse it at the next renewal.

## Where facts usually live

| Fact | Where to look |
|---|---|
| Plan and monthly bill | Invoice or receipt emails; the vendor's Billing page; a card or accounting export |
| Seats paid, seats used | The admin console's member list (sort by last active); Google Workspace or SSO app reports |
| Features actually used | Ask the people who use it; admin analytics where the vendor has them |
| Renewal date and notice | The invoice, order form or contract; the Billing page |
| Usage (emails, contacts, GB, records) | The vendor's usage or billing page; `get_usage_questions` names the exact screen |
| Data to move | The export dialog: record counts, file sizes, formats. Counts only |
| Integrations | Zapier or Make dashboards, webhook settings, SSO configuration |
| Builder | Ask: coding agent and plan, hosting and database already paid for, hourly value, upkeep budget |

## Privacy rule (the server enforces it)

Send counts, feature names, job labels, prices and dates. Never raw exports, invoices, file contents, customer data,
secrets, or people's names and emails: write roles ("ops lead"). Stackcut rejects a manifest that contains an email
address or something shaped like an API key. Tell the user what you'll send before the first call.
