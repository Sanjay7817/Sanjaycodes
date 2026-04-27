# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is **Marketing Skills** — a collection of AI agent skills for marketing tasks (CRO, SEO, copywriting, analytics, growth engineering). Skills follow the [Agent Skills specification](https://agentskills.io/specification.md) and are cross-agent compatible (Claude Code, OpenAI Codex, Cursor, Windsurf).

## Validation Commands

Skills are content-only markdown files (no build step). Validate them with:

```bash
# Validate all skills against the Agent Skills spec
bash validate-skills.sh

# Syntax-check a CLI tool
node --check tools/clis/<name>.js

# Preview a CLI tool request without sending it
node tools/clis/<name>.js <cmd> --dry-run
```

CLI tools require Node 18+ and have zero dependencies.

## Architecture

### Skill Structure

Each skill lives in `skills/<skill-name>/` and must contain a `SKILL.md` with YAML frontmatter:

```yaml
---
name: skill-name          # must match directory name exactly
description: ...          # 1-1024 chars, include trigger phrases
---
```

Optional subdirectories per skill: `references/` (detailed docs loaded on demand), `scripts/` (executable helpers), `assets/` (templates, data).

Keep `SKILL.md` under 500 lines — move verbose reference material into `references/`.

### Skill Dependency Pattern

`product-marketing-context` is the foundation skill. Every other skill reads it first to understand the user's product, audience, and positioning before doing anything. Skills also cross-reference each other (e.g. `copywriting ↔ page-cro ↔ ab-test-setup`, `revops ↔ sales-enablement ↔ cold-email`). The product context file is stored at `.agents/product-marketing-context.md` (`.claude/product-marketing-context.md` is the legacy fallback).

### Tools Directory

```
tools/
├── REGISTRY.md          # Index of all tools with capabilities
├── clis/                # 51 zero-dependency Node.js CLI tools
├── integrations/        # Per-tool API guides (auth, endpoints, ops)
└── composio/            # MCP access for OAuth-heavy tools (HubSpot, Salesforce, Meta Ads, etc.)
```

Skills reference the relevant integration guides — e.g. `referral-program` → `tools/integrations/rewardful.md`.

### Plugin Manifest

`.claude-plugin/marketplace.json` makes this repo a Claude Code plugin marketplace, installable via `/plugin marketplace add coreyhaines31/marketingskills`.

## Naming Rules

- Skill directory and `name` frontmatter field must match exactly
- `name`: lowercase `a-z`, numbers, hyphens only; 1–64 chars; no leading/trailing/consecutive hyphens
- Valid: `page-cro`, `email-sequence`, `ab-test-setup`
- Invalid: `Page-CRO`, `-page`, `page--cro`

## Writing Style for Skills

- Second person, instructional ("You are a conversion rate optimization expert")
- Bold (`**text**`) for key terms; code blocks for examples; tables for reference data
- Clarity and specificity over cleverness; active voice; one idea per section

## `description` Field Best Practices

The description drives skill discovery. It must explain:
1. What the skill does
2. Trigger phrases (natural language a user might say)
3. Scope boundaries pointing to related skills (e.g. "For signup flows, see signup-flow-cro")

## Claude Code-Specific: Dynamic Content Injection

Use `` !`command` `` syntax in local skill overrides (`.claude/skills/`) to inject shell output at invocation time — **never in the canonical `SKILL.md` files**, because other agents will see the raw string instead of executing it.

Most useful pattern: auto-inject the product marketing context at the top of a skill body:

```markdown
Product context: !`cat .agents/product-marketing-context.md 2>/dev/null || echo "No product context file found — ask the user about their product before proceeding."`
```

## Git Conventions

Branch naming: `feature/<skill-name>`, `fix/<skill-name-description>`, `docs/<description>`

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add skill-name skill`
- `fix: improve clarity in page-cro`
- `docs: update README`

## Version Tracking

`VERSIONS.md` lists the current version of every skill. On first skill use per session, fetch the upstream `VERSIONS.md` and notify the user if 2+ skills have updates or any skill has a major version bump. Keep the notification non-blocking (append at end of response).
