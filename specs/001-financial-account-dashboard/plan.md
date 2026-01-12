# Implementation Plan: Financial Account Dashboard

**Branch**: `001-financial-account-dashboard` | **Date**: 2026-01-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-financial-account-dashboard/spec.md`

## Summary

Build a web-based financial account dashboard that consolidates account information from multiple institutions (Alpaca, Vanguard, TD Trade/Schwab). The application provides a modern dark-themed UI with left navigation, dashboard view showing aggregated balances with institution grouping, and a connections management view for linking financial accounts. MVP assumes single-user operation with no authentication required. Uses SnapTrade for unified brokerage integration covering all three target institutions.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 20 LTS
**Primary Dependencies**:
- Frontend: React 18, Tailwind CSS 3.x, Vite
- Backend: Express.js
- Integration: SnapTrade TypeScript SDK (snaptrade-typescript-sdk)
- Material Symbols (icons from mockups)
- Inter font family (from mockups)

**Storage**: SQLite with better-sqlite3 (local file-based, suitable for single-user desktop app)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web (Desktop browser, macOS primary)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Dashboard refresh < 10 seconds (per SC-001), navigation < 1 second (per SC-005)
**Constraints**: Local-only operation, encrypted credential storage, no cloud transmission
**Scale/Scope**: Single user, 3 institutions, ~10 accounts maximum

## Research Certification

*Added retroactively after identifying SnapTrade gap - serves as template for future plans*

### Market Landscape Scan

**Problem domain**: Brokerage account aggregation API

**Keywords searched**:
- Primary: "brokerage account aggregation API", "investment account API"
- Adjacent: "portfolio tracking API", "financial data aggregation"
- Niche: "retail brokerage API", "Vanguard API integration service"

**Candidates discovered**:
| Candidate | Pricing Tier | Covers Our Need? | Why Selected/Rejected |
|-----------|--------------|------------------|----------------------|
| SnapTrade | Free tier + paid | Yes - all 3 institutions | **Selected**: Covers Alpaca, Vanguard, Schwab with single integration |
| Plaid | Paid ($500+/mo) | Partial - no Alpaca | Rejected: Expensive, missing Alpaca coverage |
| Yodlee | Enterprise | Yes | Rejected: Enterprise pricing, overkill for single-user |
| MX | Enterprise | Yes | Rejected: Enterprise pricing |
| Direct Alpaca API | Free | Partial - Alpaca only | Fallback option if SnapTrade costs exceed budget |

**Search log**:
| Query | Date | Results |
|-------|------|---------|
| "brokerage API aggregation 2025" | 2026-01-12 | SnapTrade, Plaid |
| "Vanguard API integration service" | 2026-01-12 | SnapTrade |
| "alternative to Plaid for investments" | 2026-01-12 | SnapTrade, Yodlee |
| "retail brokerage API free tier" | 2026-01-12 | SnapTrade, Alpaca direct |
| GitHub: "brokerage API TypeScript" | 2026-01-12 | snaptrade-sdks, alpaca-ts |

### Research Verification

- [x] Performed 5+ distinct search queries
- [x] Identified 5 candidate solutions
- [x] Checked domain-specific solutions (SnapTrade = brokerage-specific)
- [x] Verified pricing from primary sources (SnapTrade docs, Plaid pricing page)
- [x] Documented rejection rationale for each alternative

*Note: Initial research missed SnapTrade due to narrow search scope. This certification format now prevents similar gaps.*

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluated against Account Viewer Constitution v1.0.0:

### I. Simplicity and Maintainability
- [x] Clear separation: frontend (React) + backend (Express) with single responsibility
- [x] Standard patterns: REST API, SQLite, no over-engineering
- [x] Simple project structure without unnecessary abstractions
- [x] SnapTrade reduces complexity vs multiple direct integrations

### II. Test-Driven Development (TDD)
- [x] Testing framework selected: Vitest (unit), Playwright (e2e)
- [x] Test directories defined in project structure
- [ ] Tests MUST be written before implementation (enforced during tasks phase)

### III. User Experience (UX) Focus
- [x] Mockup-driven implementation for pixel-perfect UI consistency
- [x] Error states defined in spec (edge cases section)
- [ ] Accessibility (WCAG 2.1 AA) - MUST be verified during implementation

### IV. Performance Optimization
- [x] Dashboard refresh < 10 seconds (SC-001) - matches constitution requirement
- [x] Navigation < 1 second (SC-005) - matches constitution requirement
- [x] SQLite for fast local queries; no network latency for data storage
- [x] SnapTrade caching to reduce API calls

### Development Workflow Compliance
- [x] Feature branch created: `001-financial-account-dashboard`
- [x] CI/CD: GitHub Actions with ESLint/Prettier (per quickstart.md)
- [ ] PR review required before merge (enforced at merge time)

### Quality & Maintainability
- [x] TypeScript for type safety
- [x] ESLint + Prettier configured (per research.md)
- [ ] JSDoc documentation - MUST be added during implementation

## Project Structure

### Documentation (this feature)

```text
specs/001-financial-account-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output - technology decisions
├── data-model.md        # Phase 1 output - entity definitions
├── quickstart.md        # Phase 1 output - setup instructions
├── contracts/           # Phase 1 output - API definitions
│   └── api.yaml         # OpenAPI spec
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/          # Database models (Institution, Account, Balance, Credential)
│   ├── services/        # Business logic (SnapTrade connector, encryption)
│   │   ├── snaptrade/   # SnapTrade integration wrapper
│   │   │   ├── client.ts
│   │   │   ├── accounts.ts
│   │   │   └── holdings.ts
│   │   ├── encryption.ts
│   │   └── balance.ts
│   ├── api/             # REST endpoint handlers
│   │   ├── institutions.ts
│   │   ├── accounts.ts
│   │   └── dashboard.ts
│   └── db/              # Database setup and migrations
├── package.json
└── tests/
    ├── unit/
    └── integration/

frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── layout/      # Navigation, Header, Sidebar
│   │   ├── dashboard/   # Account cards, totals, filters
│   │   └── connections/ # Institution cards, connection modals
│   ├── pages/           # Route-level components
│   │   ├── Dashboard.tsx
│   │   └── Connections.tsx
│   ├── services/        # API client functions
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   └── styles/          # Tailwind config, global styles
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tests/
    ├── unit/
    └── e2e/
```

**Structure Decision**: Web application with separate frontend and backend directories. Frontend uses React + Tailwind (matching mockup tech stack). Backend provides REST API for data persistence and SnapTrade integration.

## Complexity Tracking

No constitution violations to justify. The architecture follows standard patterns appropriate for the scope.

## UI Design Reference

Implementation MUST follow mockup screens pixel-perfectly:

### Dashboard Tab (`mockup-screens/dashboard_tab/`)
- Left sidebar with "Financial Hub" branding, Dashboard/Connections navigation
- Collapsible sidebar with chevron toggle button
- Header with "Consolidated Account Report" title, Export/Refresh buttons, user avatar
- Filter panel: As of Date picker, Institution search with checkboxes
- Main content: Grand Total card, Total Institutions count, institution-grouped account cards
- Each institution card shows: name header with sub-total, accounts with masked numbers, balances, as-of dates

### Connection Tab (`mockup-screens/connection_tab/`)
- Same sidebar navigation (Connection active state)
- Header with "Connection" title, notification/help icons, avatar
- Page header: "Manage Financial Institutions" title, "Add New Connection" button
- Search bar for institutions
- Institution cards: logo, name, connection status (green dot + "Connected"), last updated time
- More options menu (three dots) for disconnect action

### Design Tokens (from mockup HTML)
```
Colors:
- primary: #137fec
- background-dark: #101922
- panel-dark: #111a22
- border-dark: #233648
- text-primary-dark: #ffffff
- text-secondary-dark: #92adc9
- input-bg-dark: #192633
- input-border-dark: #324d67
- search-bg-dark: #233648

Typography:
- Font: Inter (400, 500, 600, 700 weights)
- Icons: Material Symbols Outlined

Spacing/Borders:
- Border radius: 0.25rem (default), 0.5rem (lg), 0.75rem (xl)
```

## Institution Integration Strategy

### Primary Approach: SnapTrade

SnapTrade provides unified API access to all three target institutions:

| Institution | SnapTrade Support | Auth Method | Capabilities |
|-------------|-------------------|-------------|--------------|
| Alpaca | Yes | OAuth | Full data + trading |
| Vanguard | Yes | OAuth | Read-only (balances, positions) |
| Schwab (TD Trade) | Yes | OAuth | Full data + trading |

**Key Benefits**:
- Single integration covers all institutions
- Vanguard support (no public API otherwise)
- SOC 2 Type 2 compliant
- TypeScript SDK available
- Normalized data format

**Connection Flow**:
1. User clicks "Connect" on institution card
2. Backend initiates SnapTrade redirect URL
3. User authenticates with institution via SnapTrade portal
4. SnapTrade returns authorization to backend
5. Backend stores connection reference (not raw credentials)
6. Subsequent data fetches use SnapTrade API

### Fallback Approach

If SnapTrade costs exceed budget:
1. Alpaca: Direct API integration (free)
2. Vanguard: Manual balance entry
3. TD Trade/Schwab: Manual balance entry

Architecture supports both approaches via connector abstraction layer.
