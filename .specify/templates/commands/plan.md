# `/speckit.plan` Command Workflow

This document describes the execution workflow for the `/speckit.plan` command.

## Overview

The plan command transforms a feature specification into a comprehensive implementation plan with research, data models, and API contracts.

## Phases

### Phase 0: Market Landscape Scan & Research

**Purpose**: Ensure comprehensive discovery before making technology decisions.

#### Step 0.1: Market Landscape Scan (REQUIRED for integrations)

Before evaluating specific solutions for any external integration:

1. **Identify problem domain keywords**:
   - Primary: Exact problem (e.g., "brokerage account aggregation API")
   - Adjacent: Related terms (e.g., "investment API", "portfolio tracking API")
   - Niche: Specific variations (e.g., "retail brokerage API", "wealth management API")

2. **Execute discovery searches**:
   ```
   "{domain} API providers [current year]"
   "{domain} alternatives to [known solution]"
   "best {domain} for developers free tier"
   "{domain} SDK [target language]"
   Reddit/HackerNews: "{domain} recommendations"
   GitHub: awesome-{domain} lists
   Product Hunt / G2 / Capterra: {domain} category
   ```

3. **Build candidate list BEFORE evaluating**:
   - List ALL discovered options (minimum 3-5)
   - Note pricing tier (free/paid/enterprise)
   - Note target audience (developer/enterprise/consumer)
   - Do NOT dismiss any option until full list is compiled

4. **Then evaluate** each candidate against requirements

#### Step 0.2: Technical Context Resolution

For each "NEEDS CLARIFICATION" in Technical Context:
- Research best practices for the domain
- Identify technology choices
- Document decision rationale

#### Step 0.3: Research Consolidation

Output `research.md` with:
- Decision: What was chosen
- Rationale: Why chosen
- Alternatives considered: What else was evaluated and why rejected
- Market landscape scan results (for integrations)
- Research verification checklist completion

### Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete with all clarifications resolved

#### Step 1.1: Data Model

Extract entities from feature spec → `data-model.md`:
- Entity name, fields, relationships
- Validation rules from requirements
- State transitions if applicable
- Database schema (SQL or document structure)

#### Step 1.2: API Contracts

Generate API contracts from functional requirements:
- For each user action → endpoint
- Use standard REST/GraphQL patterns
- Output OpenAPI/GraphQL schema to `/contracts/`

#### Step 1.3: Quickstart Guide

Create `quickstart.md` with:
- Prerequisites
- Project setup steps
- Environment configuration
- Verification checklist

#### Step 1.4: Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude`:
- Update agent-specific context file
- Add new technology from current plan
- Preserve manual additions between markers

### Phase 2: Constitution Re-check

Re-evaluate all Constitution principles against final design:
- Mark items as verified [x] or pending [ ]
- Document any justified violations in Complexity Tracking
- Ensure no unresolved gates

## Output Artifacts

```
specs/[###-feature-name]/
├── plan.md              # Implementation plan (this file)
├── research.md          # Technology decisions with alternatives
├── data-model.md        # Entity definitions and schema
├── quickstart.md        # Setup instructions
└── contracts/
    └── api.yaml         # OpenAPI specification
```

## Research Quality Gates

The `/speckit.plan` command MUST verify:

### For External Integrations

- [ ] Market landscape scan performed with 5+ search queries
- [ ] 3+ candidate solutions identified
- [ ] Domain-specific solutions checked (not just general ones)
- [ ] Pricing verified from primary sources (not assumptions)
- [ ] Rejection rationale documented for each alternative

### For Technology Decisions

- [ ] Best practices researched for domain
- [ ] Alternatives considered and documented
- [ ] Decision rationale is clear and testable

## Common Pitfalls to Avoid

| Pitfall | Prevention |
|---------|------------|
| Missing niche players | Search domain-specific terms, not just generic |
| Assuming expensive | Always check for free/developer tiers explicitly |
| First result bias | Gather 5+ candidates before evaluating any |
| Outdated information | Include current year in searches |
| Missing SDK availability | Search GitHub for `{service} SDK {language}` |
| Binary thinking | Look for hybrid approaches |

## Checklist Reference

See `.specify/templates/research-checklist.md` for detailed research guidance including:
- Market landscape scan checklist
- Integration research checklist
- Alternatives exhaustion log template
- Domain-specific search prompts

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-01-12 | Added Market Landscape Scan phase; Research verification gates |
| 1.0.0 | Initial | Basic plan workflow |
