# Research Checklist Template

Use this checklist during Phase 0 (Research) of `/speckit.plan` to ensure comprehensive discovery before finalizing technology decisions.

## Market Landscape Scan

Before evaluating specific solutions, perform systematic market discovery:

### 1. Keyword Identification

Identify search terms for the problem domain:

- [ ] **Primary keywords**: [exact problem, e.g., "brokerage account aggregation API"]
- [ ] **Adjacent keywords**: [related terms, e.g., "investment API", "portfolio tracking API"]
- [ ] **Niche keywords**: [specific variations, e.g., "retail brokerage API", "wealth management API"]
- [ ] **Negative keywords**: [what to exclude, e.g., "enterprise-only", "bank accounts only"]

### 2. Discovery Searches

Execute these search patterns (replace `{domain}` with your keywords):

- [ ] `"{domain} API providers [current year]"`
- [ ] `"{domain} alternatives to [known solution]"`
- [ ] `"best {domain} for developers free tier"`
- [ ] `"{domain} SDK [your language]"` (e.g., "brokerage API SDK TypeScript")
- [ ] Reddit/HackerNews: `"{domain} recommendations"`
- [ ] GitHub: `awesome-{domain}` lists
- [ ] Product Hunt / G2 / Capterra: `{domain}` category

### 3. Candidate List

Build a comprehensive list BEFORE evaluating:

| Candidate | Pricing Tier | Target Audience | Covers Our Need? |
|-----------|--------------|-----------------|------------------|
| [Service 1] | Free/Paid/Enterprise | Developer/Enterprise/Consumer | Yes/Partial/No |
| [Service 2] | ... | ... | ... |
| [Service 3] | ... | ... | ... |

**Rule**: List at least 5 candidates before dismissing any. "I only found 2 options" usually means insufficient search.

---

## Integration Research Checklist

Before finalizing any external integration approach:

### Discovery Verification

- [ ] Searched for **domain-specific** aggregators (not just general ones)
- [ ] Checked for **free/developer tier** options explicitly
- [ ] Searched GitHub for **SDKs in target language**
- [ ] Checked **Product Hunt / G2 / Capterra** for alternatives
- [ ] Asked: "Is there a service that **specializes in exactly this**?"
- [ ] Searched for `"[specific entity] API integration service"` (e.g., "Vanguard API integration")

### Pricing Verification

- [ ] Verified pricing by checking **actual documentation** (not assumptions)
- [ ] Checked for **usage-based pricing** vs flat rate
- [ ] Looked for **startup/developer programs** with credits
- [ ] Confirmed free tier **limitations** (not just existence)

### Technical Verification

- [ ] Confirmed **coverage** of all required entities/services
- [ ] Verified **authentication method** compatibility
- [ ] Checked **rate limits** and quotas
- [ ] Reviewed **SDK quality** (last update, GitHub stars, issues)
- [ ] Looked for **community feedback** (Reddit, HN, Stack Overflow)

---

## Alternatives Exhaustion Log

Document your search process to certify thoroughness:

| Search Query | Date | Results Found | Notes |
|--------------|------|---------------|-------|
| "[domain] API aggregation" | YYYY-MM-DD | Service A, B, C | ... |
| "[specific entity] integration service" | YYYY-MM-DD | Service D | ... |
| "alternative to [known solution]" | YYYY-MM-DD | ... | ... |
| GitHub: "[domain] API" + language | YYYY-MM-DD | ... | ... |

### Certification

Before concluding research, verify:

- [ ] I have performed at least **5 distinct search queries**
- [ ] I have identified at least **3 candidate solutions** (even if some are unsuitable)
- [ ] I have checked **domain-specific** solutions, not just general ones
- [ ] I have verified pricing from **primary sources** (not assumptions)
- [ ] I have documented **why alternatives were rejected** (not just that they were)

---

## Domain-Specific Search Prompts

### Financial / Brokerage Integrations

```
- "[institution name] API integration service"
- "brokerage account aggregation API"
- "retail investment API providers"
- "portfolio tracking API free tier"
- "alternative to Plaid for investments"
- "connect to [institution] programmatically"
- GitHub: "brokerage API" + language filter
```

### Payment Integrations

```
- "payment gateway API comparison [year]"
- "alternative to Stripe for [use case]"
- "[country] payment processor API"
- "payment API free tier developer"
```

### Authentication / Identity

```
- "authentication as a service comparison"
- "alternative to Auth0 free tier"
- "OAuth provider API [year]"
- "identity verification API developer"
```

### Data / Analytics

```
- "[data type] API providers"
- "alternative to [known provider] API"
- "[domain] data aggregation service"
- "real-time [data type] API free"
```

---

## Common Research Pitfalls

| Pitfall | How to Avoid |
|---------|--------------|
| **Assuming expensive** | Always check for free/developer tiers explicitly |
| **Missing niche players** | Search for domain-specific terms, not generic ones |
| **First result bias** | Gather 5+ candidates before evaluating any |
| **Outdated info** | Include current year in searches; check "last updated" |
| **Ignoring SDK availability** | Search GitHub for `{service} SDK {language}` |
| **Binary thinking** | Look for hybrid approaches, not just A vs B |

---

## Template Usage

Copy relevant sections to your `research.md` and fill in during Phase 0:

```markdown
## Market Landscape Scan

### Keywords Used
- Primary: [your keywords]
- Adjacent: [your keywords]
- Niche: [your keywords]

### Candidates Discovered
| Candidate | Pricing | Target | Covers Need? |
|-----------|---------|--------|--------------|
| ... | ... | ... | ... |

### Search Log
| Query | Results |
|-------|---------|
| ... | ... |

### Certification
- [x] 5+ distinct searches performed
- [x] 3+ candidates identified
- [x] Domain-specific solutions checked
- [x] Pricing verified from primary sources
```
