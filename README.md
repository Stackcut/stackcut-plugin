# Stackcut plugin for Grok Bot and Cursor

Cut SaaS spend from chat. The plugin connects your agent to the [Stackcut](https://stackcut.io) MCP server and adds a
skill that knows how to use it.

- **Your savings plan, with proof.** Make a read-only code on stackcut.io (your plan → Send to my agent) and ask:
  `@stackcut walk me through my plan, code sca_…`. Every line comes with the receipts and sourced prices behind it,
  plus the steps.
- **Cheaper ways out.** `@stackcut what's the cheapest way to replace Typeform if I only use forms and webhooks?`
  Recipes cover switching vendor, a cheaper plan, open source, pay per use, an agent skill, or building it, with
  how-to-leave steps (export, cancel, refunds, notice) and step-by-step playbooks. Some paths are tested end to end by
  Stackcut.
- **The cheapest stack at your volume.** `@stackcut pick a database and an email provider for 20k users and 40k emails
  a month`. A tier only counts when its published limit covers your volume.
- **Audit a codebase.** The skill scans a repo locally for paid services and sends Stackcut only vendor and feature
  names, never code or secrets. The audit checks your usage against each plan's limits, finds right-sized plans and
  idle projects to pause, and says what a cheaper plan leaves out.

## Install

- **Grok Bot:** Plugins → search "Stackcut" → Add. Or ask the bot: *Add a custom MCP server called stackcut at
  https://stackcut.io/mcp*.
- **Cursor:** install from the Cursor Marketplace, or add `mcp.json` from this repo to your MCP settings.

No API key, and the server is free. It stores the arguments agents send to its tools (redacted, never IP addresses) to
improve recommendations, so don't put personal data or secrets in them. `get_my_plan` reads only a plan you share with
a code that expires in 7 days and can be revoked. Details: https://stackcut.io/privacy

## Network and credentials

The plugin's MCP server is `https://stackcut.io/mcp` (HTTPS, no credentials). The skill's local scanner reads files in
the repo you point it at and prints a summary (vendor ids, feature names, counts) that the agent can send to Stackcut;
it never reads `.env` files, and code, file contents and secret values stay on your machine. With `--latest` the
scanner also downloads the public detection rules from `https://stackcut.io/data/detect.json`; without it, it uses
the bundled copy.

## What's inside

| Path | What |
|---|---|
| `.grok-plugin/plugin.json` | Plugin manifest for Grok Bot and Grok Build (xAI plugin marketplace format) |
| `.cursor-plugin/plugin.json` | Plugin manifest for the Cursor Marketplace |
| `.mcp.json` | Remote MCP server, Grok format |
| `mcp.json` | Remote MCP server: `https://stackcut.io/mcp` (Streamable HTTP) |
| `skills/stackcut/` | The Stackcut skill, plus a local scanner (`scripts/detect.mjs`) and its rules (`detect.json`) |
| `assets/logo.svg` | Logo |

Tools: `get_my_plan`, `choose_stack`, `plan_stack_from_spec`, `list_stack_jobs`, `audit_stack`, `get_usage_questions`,
`get_detection_rules`, `find_alternatives`, `search_recipes`, `get_recipe`, `get_build_packet`, `leaderboard`,
`list_categories`, `report_outcome`.
Docs: https://stackcut.io/agents · Grok Bot guide: https://stackcut.io/grok

Savings are modeled from public prices, not guaranteed. Grok Bot is a product of xAI; Stackcut is not affiliated with
or endorsed by xAI.

MIT License.
