# Research: Financial Account Dashboard

**Feature Branch**: `001-financial-account-dashboard`
**Date**: 2026-01-12

## Technology Decisions

### 1. Frontend Framework

**Decision**: React 18 with TypeScript

**Rationale**:
- Mockup HTML uses standard web technologies (HTML/CSS/JS) that translate directly to React components
- TypeScript provides type safety for complex financial data structures
- React's component model matches the mockup's clear UI decomposition (sidebar, header, filters, cards)
- Vite provides fast development experience with HMR

**Alternatives Considered**:
- Vue.js: Viable, but React has broader ecosystem for financial/dashboard components
- Vanilla JS: Would work for this scale but lacks type safety and component reusability
- Next.js: Overkill for single-user local app, SSR not needed

### 2. CSS Framework

**Decision**: Tailwind CSS 3.x

**Rationale**:
- Mockups are already built with Tailwind (see `code.html` files)
- Direct copy of mockup classes ensures pixel-perfect implementation
- Utility-first approach matches the rapid development needs
- Custom theme configuration already defined in mockup's `tailwind.config`

**Alternatives Considered**:
- CSS Modules: More isolation but would require rewriting all mockup styles
- Styled Components: Runtime overhead, doesn't match mockup approach
- Plain CSS: Would require significant effort to replicate Tailwind utilities

### 3. Backend Framework

**Decision**: Express.js with TypeScript

**Rationale**:
- Mature, well-documented framework suitable for REST API
- Minimal setup for simple CRUD + external API proxy operations
- Large ecosystem of middleware for encryption, validation, etc.
- Shared TypeScript types between frontend and backend

**Alternatives Considered**:
- Fastify: Faster but smaller ecosystem, less familiar
- Nest.js: Too heavyweight for MVP scope
- Hono: Modern but less mature ecosystem

### 4. Database

**Decision**: SQLite with better-sqlite3

**Rationale**:
- Single-user application doesn't need client-server database
- File-based storage is portable and simple to backup
- better-sqlite3 provides synchronous API (simpler than async for this use case)
- No external database server to install or manage
- Sufficient performance for <100 records

**Alternatives Considered**:
- PostgreSQL: Overkill for single-user, requires server installation
- LowDB/JSON file: Lacks query capabilities and schema enforcement
- IndexedDB (browser): Would require different approach for credential encryption

### 5. Credential Encryption

**Decision**: Node.js crypto module with AES-256-GCM

**Rationale**:
- Built into Node.js, no external dependencies
- AES-256-GCM provides authenticated encryption (prevents tampering)
- Machine-specific key derivation using OS user data as salt
- MVP: No master password (single user assumed per spec)

**Alternatives Considered**:
- libsodium: More modern but adds dependency
- Keytar (OS keychain): Would be ideal but adds complexity and OS-specific code
- Plain text: Unacceptable for financial credentials

**Implementation Notes**:
- Encryption key derived from: machine ID + username + application constant
- IV regenerated for each encryption operation
- Auth tag stored alongside ciphertext

### 6. Institution API Integration

**Decision**: SnapTrade for unified brokerage integration (recommended) OR direct API + manual entry fallback

#### Option A: SnapTrade (Recommended)

**Overview**: SnapTrade provides a unified API to connect with 25+ retail brokerages through a single integration.

**Supported Institutions for Our MVP**:
| Institution | SnapTrade Support | Capabilities |
|-------------|-------------------|--------------|
| Alpaca | Yes | Full trading + data via OAuth |
| Vanguard | Yes | Read-only access (balances, positions) |
| TD Trade/Schwab | Yes (Schwab) | Full trading via OAuth (TD migrated to Schwab) |

**Pricing**:
- Free tier available with limited concurrent connections
- Paid tier for unlimited connections
- Usage-based charges for manual refresh and certain endpoints
- Specific pricing requires contacting sales or checking dashboard

**Pros**:
- Single integration covers ALL three target institutions
- Vanguard support (no public API otherwise)
- SOC 2 Type 2 compliant security
- TypeScript SDK available
- >95% connection success rate
- Normalized data format across brokerages

**Cons**:
- Third-party dependency
- Vanguard is read-only (no trading, but we only need balances)
- Free tier has connection limits
- Usage-based costs may accumulate

**Implementation**:
```typescript
// SnapTrade TypeScript SDK
import { Snaptrade } from 'snaptrade-typescript-sdk';

const snaptrade = new Snaptrade({
  clientId: process.env.SNAPTRADE_CLIENT_ID,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY,
});
```

**Documentation**: https://docs.snaptrade.com/

#### Option B: Direct Integration + Manual Entry (Fallback)

If SnapTrade costs are prohibitive or connectivity issues arise:

##### Alpaca (Direct)
- **Approach**: Official Alpaca REST API
- **Auth**: API key + secret (stored encrypted)
- **Data**: Account balances, positions, buying power
- **Documentation**: https://docs.alpaca.markets/

##### Vanguard (Manual)
- **Approach**: Manual balance entry (no public API available)
- **Rationale**: Vanguard has no official API for retail customers
- **MVP Implementation**: User manually enters/updates balance values

##### TD Trade / Schwab (Manual or Schwab API)
- **Note**: Charles Schwab acquired TD Ameritrade; legacy API deprecated
- **Schwab API**: Requires developer application approval
- **MVP Implementation**: Manual entry mode initially

#### Recommendation

**For MVP**: Start with SnapTrade free tier
- Covers all three institutions with one integration
- Vanguard support is a major win (otherwise manual-only)
- Evaluate usage costs during development
- Fall back to Option B if costs become prohibitive

**Aggregator Comparison**:
| Service | Alpaca | Vanguard | Schwab | Free Tier | Est. Cost |
|---------|--------|----------|--------|-----------|-----------|
| SnapTrade | Yes | Yes (read) | Yes | Limited | Contact sales |
| Plaid | No | Yes | Yes | No | $500+/month |
| Yodlee | No | Yes | Yes | No | Enterprise |
| Direct APIs | Yes | No | Limited | Yes | Free |

**Sources**:
- [SnapTrade Official Site](https://snaptrade.com/)
- [SnapTrade Documentation](https://docs.snaptrade.com/)
- [SnapTrade Brokerage Integrations](https://snaptrade.com/brokerage-integrations)
- [SnapTrade Schwab Integration](https://snaptrade.com/brokerage-integrations/schwab-api)

### 7. Testing Strategy

**Decision**: Vitest for unit tests, Playwright for E2E

**Rationale**:
- Vitest: Fast, Vite-native, Jest-compatible API
- Playwright: Cross-browser E2E testing with good React support
- Both have TypeScript support out of box

**Test Coverage Plan**:
- Unit: Encryption service, balance calculations, API transformers
- Integration: Database operations, API endpoints
- E2E: Critical user flows (view dashboard, connect institution, refresh data)

### 8. Development Environment

**Decision**: pnpm workspaces for monorepo structure

**Rationale**:
- Efficient disk space usage
- Shared dependencies between frontend/backend
- Single lockfile
- Simple script orchestration

**Alternatives Considered**:
- npm workspaces: Works but slower, more disk usage
- Yarn: Good but pnpm is faster
- Separate repos: Adds complexity for small team

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| How to handle institutions without APIs? | Manual entry mode for MVP |
| Master password for encryption? | Deferred per spec - single user assumed |
| Where to store encrypted credentials? | SQLite database with AES-256-GCM encryption |
| Historical balance data? | Store locally on each fetch; query by date range |
| Export report format? | CSV export (matches "Export Report" button in mockup) |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SnapTrade free tier limits exceeded | Medium | Medium | Monitor usage; budget for paid tier or fall back to Option B |
| SnapTrade service outage | Low | High | Implement caching; consider hybrid approach with direct Alpaca API |
| TD Ameritrade API unavailable | N/A | N/A | Resolved: Use SnapTrade's Schwab integration |
| Vanguard blocks automation | Low | Medium | SnapTrade handles OAuth; they maintain compliance |
| Encryption key loss | Medium | High | Document key derivation; future: backup option |
| API rate limiting | Low | Low | SnapTrade handles rate limits; cache responses locally |
| SnapTrade pricing increases | Medium | Medium | Architecture allows fallback to direct APIs + manual entry |

## Next Steps

1. Create data model based on spec entities
2. Define API contracts (OpenAPI spec)
3. Set up project scaffolding with chosen technologies
