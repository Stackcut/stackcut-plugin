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
  names, never code or secrets.

## Install

- **Grok Bot:** Plugins → search "Stackcut" → Add. Or ask the bot: *Add a custom MCP server called stackcut at
  https://stackcut.io/mcp*.
- **Cursor:** install from the Cursor Marketplace, or add `mcp.json` from this repo to your MCP settings.

No API key. The server is free, read-only, and stores no user data; `get_my_plan` reads only a plan you share with a
code that expires in 7 days and can be revoked.

## Network and credentials

The plugin calls one endpoint, `https://stackcut.io/mcp`, over HTTPS. It needs no credentials. The skill's local
scanner reads files in the repo you point it at and sends Stackcut only vendor ids, feature names and counts; it never
reads `.env` files or sends code, file contents or secret values.

## What's inside

| Path | What |
|---|---|
| `.grok-plugin/plugin.json` | Plugin manifest for Grok Bot and Grok Build (xAI plugin marketplace format) |
| `.cursor-plugin/plugin.json` | Plugin manifest for the Cursor Marketplace |
| `.mcp.json` | Remote MCP server, Grok format |
| `mcp.json` | Remote MCP server: `https://stackcut.io/mcp` (Streamable HTTP) |
| `skills/stackcut/` | The Stackcut skill, plus a local scanner (`scripts/detect.mjs`) and its rules (`detect.json`) |
| `assets/logo.svg` | Logo |

Tools: `get_my_plan`, `choose_stack`, `list_stack_jobs`, `audit_stack`, `get_detection_rules`, `find_alternatives`,
`search_recipes`, `get_recipe`, `get_build_packet`, `leaderboard`, `list_categories`, `report_outcome`.
Docs: https://stackcut.io/agents · Grok Bot guide: https://stackcut.io/grok

Savings are modeled from public prices, not guaranteed. Grok Bot is a product of xAI; Stackcut is not affiliated with
or endorsed by xAI.

MIT License.
