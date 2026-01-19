# Implementation Plan: Add New Institution Connections

**Branch**: `001-financial-account-dashboard` | **Date**: 2026-01-18 | **Spec**: [spec.md](./spec.md)
**Input**: User request to add ability to connect new institutions beyond the 3 pre-configured ones

## Summary

Enable users to connect to any financial institution supported by SnapTrade (24+ brokerages), not just the 3 hardcoded ones (Alpaca, Vanguard, TD Trade). This involves adding a backend endpoint to list available brokerages and a frontend "Add Institution" modal with search/select functionality.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 20 LTS
**Primary Dependencies**: React 18, Express.js, SnapTrade SDK, TanStack Query
**Storage**: SQLite (existing) - no schema changes needed
**Testing**: Vitest for unit tests
**Target Platform**: Web browser (desktop)
**Project Type**: Web application (frontend + backend monorepo)
**Performance Goals**: Brokerage list loads in <2 seconds
**Constraints**: Must work within SnapTrade free tier limits
**Scale/Scope**: Single user, 24+ available brokerages

## Research Certification

### Market Landscape Scan

*Not applicable - this feature extends existing SnapTrade integration, no new service required*

**Keywords searched**: N/A - using existing SnapTrade API

**Candidates discovered**:
| Candidate | Pricing Tier | Covers Our Need? | Why Selected/Rejected |
|-----------|--------------|------------------|----------------------|
| SnapTrade `listAllBrokerages()` | Free tier | Yes | Already integrated, provides 24+ brokerages |

### Research Verification

- [x] Verified SnapTrade API supports `listAllBrokerages()` endpoint
- [x] Confirmed existing OAuth flow accepts `broker` parameter
- [x] Tested brokerage list returns 24 brokerages
- [x] No additional costs for listing brokerages

*See `research.md` addendum for detailed findings*

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity and Maintainability | ✅ PASS | Minimal changes - reuses existing OAuth flow, no DB changes |
| II. Test-Driven Development | ✅ PASS | Unit tests planned for new endpoint and component |
| III. User Experience Focus | ✅ PASS | Modal with search improves discoverability |
| IV. Performance Optimization | ✅ PASS | Single API call for brokerage list, can cache later |

**Gate Status**: PASS - No violations

## Project Structure

### Documentation (this feature)

```text
specs/001-financial-account-dashboard/
├── plan.md              # This file
├── research.md          # Updated with addendum
├── data-model.md        # No changes needed
├── quickstart.md        # Existing
├── contracts/           # Updated with new endpoint
└── tasks.md             # To be generated
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── brokerages.ts    # NEW: GET /api/brokerages endpoint
│   │   ├── connections.ts   # UPDATE: Accept broker slug
│   │   └── institutions.ts  # Existing
│   └── services/
│       └── snaptrade/
│           └── client.ts    # Existing listBrokerages() function
└── tests/
    └── unit/
        └── brokerages.test.ts  # NEW: Tests for brokerage endpoint

frontend/
├── src/
│   ├── components/
│   │   └── connections/
│   │       ├── AddInstitutionModal.tsx  # NEW: Brokerage picker modal
│   │       ├── ConnectModal.tsx         # UPDATE: Accept broker slug
│   │       └── InstitutionList.tsx      # UPDATE: Add button
│   ├── pages/
│   │   └── Connections.tsx              # UPDATE: Wire up modal
│   ├── services/
│   │   └── api.ts                       # UPDATE: Add getBrokerages()
│   └── hooks/
│       └── useBrokerages.ts             # NEW: React Query hook
└── tests/
    └── unit/
        └── AddInstitutionModal.test.tsx  # NEW: Component tests
```

**Structure Decision**: Web application structure (Option 2) - already established in codebase

## Implementation Overview

### Backend Tasks

1. **Create `GET /api/brokerages` endpoint** (`backend/src/api/brokerages.ts`)
   - Call `listBrokerages()` from SnapTrade client
   - Get connected brokerages from `listUserConnections()`
   - Mark each brokerage with `isConnected` status
   - Return sorted list (connected first, then alphabetical)

2. **Update connection portal URL endpoint**
   - Ensure `broker` slug is passed to SnapTrade OAuth URL
   - Already supported in `getConnectionPortalUrl()` function

### Frontend Tasks

1. **Create `AddInstitutionModal` component**
   - Search input with debounced filtering
   - List of available brokerages with icons
   - Click to select and initiate OAuth flow
   - Loading and error states

2. **Update `Connections` page**
   - Add "Add Institution" button in header
   - State management for modal open/close
   - Refresh list after successful connection

3. **Create `useBrokerages` hook**
   - React Query hook for fetching brokerages
   - Handle loading/error states

4. **Update `ConnectModal`**
   - Accept brokerage slug parameter
   - Pass slug when getting portal URL

## API Contract

### GET /api/brokerages

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "ALPACA-PAPER",
      "name": "Alpaca Paper",
      "slug": "ALPACA-PAPER",
      "isConnected": true
    },
    {
      "id": "ROBINHOOD",
      "name": "Robinhood",
      "slug": "ROBINHOOD",
      "isConnected": false
    }
  ]
}
```

## Complexity Tracking

> No violations - implementation is straightforward extension of existing patterns

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| No DB changes | Low | SnapTrade provides all brokerage data |
| Reuses OAuth flow | Low | Existing infrastructure handles connection |
| New endpoint | Low | Simple proxy to SnapTrade API |
| New modal component | Medium | UI work but follows existing patterns |
