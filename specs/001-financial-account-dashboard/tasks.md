# Tasks: Financial Account Dashboard

**Input**: Design documents from `/specs/001-financial-account-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.yaml, quickstart.md

**Tests**: Constitution requires TDD - tests included for critical components.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per quickstart.md

- [X] T001 Create root project structure with pnpm-workspace.yaml and root package.json
- [X] T002 [P] Initialize backend with package.json, tsconfig.json per backend/package.json
- [X] T003 [P] Initialize frontend with Vite React-TS template per frontend/package.json
- [X] T004 [P] Configure Tailwind CSS with design tokens in frontend/tailwind.config.js
- [X] T005 [P] Add Inter font and Material Symbols to frontend/index.html
- [X] T006 [P] Create backend environment config in backend/.env
- [X] T007 [P] Create frontend environment config in frontend/.env
- [X] T008 [P] Configure ESLint and Prettier in root .eslintrc.js and .prettierrc
- [X] T009 Install all dependencies with pnpm install

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Database & Schema

- [X] T010 Create SQLite database initialization in backend/src/db/index.ts
- [X] T011 Implement database schema per data-model.md in backend/src/db/schema.ts
- [X] T012 Create institution seed data in backend/src/db/seed.ts (Alpaca, Vanguard, TD Trade)

### Shared TypeScript Types

- [X] T013 [P] Create shared types for entities in backend/src/types/index.ts
- [X] T014 [P] Create frontend API types mirroring backend in frontend/src/types/index.ts

### Backend Core Infrastructure

- [X] T015 Create Express server entry point in backend/src/index.ts
- [X] T016 [P] Implement CORS and Helmet middleware in backend/src/middleware/security.ts
- [X] T017 [P] Implement error handling middleware in backend/src/middleware/error.ts
- [X] T018 [P] Create health check endpoint in backend/src/api/health.ts
- [X] T019 Setup API router aggregation in backend/src/api/index.ts

### Encryption Service

- [X] T020 Implement AES-256-GCM encryption service in backend/src/services/encryption.ts

### SnapTrade Integration

- [X] T021 Create SnapTrade client wrapper in backend/src/services/snaptrade/client.ts
- [X] T022 [P] Implement SnapTrade accounts service in backend/src/services/snaptrade/accounts.ts
- [X] T023 [P] Implement SnapTrade holdings service in backend/src/services/snaptrade/holdings.ts

### Frontend Core Infrastructure

- [X] T024 Create React Router setup in frontend/src/App.tsx
- [X] T025 [P] Create API client service in frontend/src/services/api.ts
- [X] T026 [P] Create React Query provider setup in frontend/src/main.tsx
- [X] T027 [P] Create custom useApi hook in frontend/src/hooks/useApi.ts

### Base Models (Backend)

- [X] T028 [P] Create Institution model in backend/src/models/institution.ts
- [X] T029 [P] Create Connection model in backend/src/models/connection.ts
- [X] T030 [P] Create Credential model in backend/src/models/credential.ts
- [X] T031 [P] Create Account model in backend/src/models/account.ts
- [X] T032 [P] Create BalanceRecord model in backend/src/models/balance.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 3 - Navigate Application Layout (Priority: P1)

**Goal**: Modern, sleek interface with left navigation panel allowing switching between Dashboard and Connections views

**Independent Test**: Load the application, verify left navigation with Dashboard/Connections options, clicking each switches the right panel content

### Tests for User Story 3

- [X] T033 [P] [US3] Unit test for Sidebar component in frontend/tests/unit/Sidebar.test.tsx
- [X] T034 [P] [US3] Unit test for Header component in frontend/tests/unit/Header.test.tsx

### Implementation for User Story 3

- [X] T035 [P] [US3] Create Sidebar component (collapsible, Financial Hub branding) in frontend/src/components/layout/Sidebar.tsx
- [X] T036 [P] [US3] Create Header component (title, icons, avatar) in frontend/src/components/layout/Header.tsx
- [X] T037 [US3] Create main Layout wrapper component in frontend/src/components/layout/Layout.tsx
- [X] T038 [US3] Create Dashboard page placeholder in frontend/src/pages/Dashboard.tsx
- [X] T039 [US3] Create Connections page placeholder in frontend/src/pages/Connections.tsx
- [X] T040 [US3] Wire up routes in frontend/src/App.tsx with Layout and pages
- [X] T041 [US3] Style components pixel-perfect per mockup-screens/dashboard_tab/code.html

**Checkpoint**: Navigation layout complete - can switch between Dashboard and Connections views

---

## Phase 4: User Story 2 - Manage Institution Connections (Priority: P1)

**Goal**: Connect and manage financial institution accounts via SnapTrade OAuth flow

**Independent Test**: Navigate to Connections view, connect to an institution, verify connection status updates, disconnect and verify removal

### Tests for User Story 2

- [X] T042 [P] [US2] Contract test for POST /connections in backend/tests/integration/connections.test.ts
- [X] T043 [P] [US2] Contract test for DELETE /connections/:id in backend/tests/integration/connections.test.ts
- [X] T044 [P] [US2] Unit test for InstitutionList component in frontend/tests/unit/InstitutionList.test.tsx

### Backend Implementation for User Story 2

- [X] T045 [US2] Implement GET /institutions endpoint in backend/src/api/institutions.ts
- [X] T046 [US2] Implement GET /connections endpoint in backend/src/api/connections.ts
- [X] T047 [US2] Implement POST /connections endpoint (create connection via SnapTrade) in backend/src/api/connections.ts
- [X] T048 [US2] Implement DELETE /connections/:id endpoint in backend/src/api/connections.ts
- [X] T049 [US2] Implement POST /connections/:id/sync endpoint in backend/src/api/connections.ts
- [X] T050 [US2] Create ConnectionService with SnapTrade integration in backend/src/services/connection.ts

### Frontend Implementation for User Story 2

- [X] T051 [P] [US2] Create InstitutionCard component in frontend/src/components/connections/InstitutionCard.tsx
- [X] T052 [P] [US2] Create InstitutionList component in frontend/src/components/connections/InstitutionList.tsx
- [X] T053 [US2] Create ConnectModal component (credential input form) in frontend/src/components/connections/ConnectModal.tsx
- [X] T054 [US2] Create DisconnectConfirmModal component in frontend/src/components/connections/DisconnectConfirmModal.tsx
- [X] T055 [US2] Create useInstitutions hook in frontend/src/hooks/useInstitutions.ts
- [X] T056 [US2] Create useConnections hook in frontend/src/hooks/useConnections.ts
- [X] T057 [US2] Implement full Connections page in frontend/src/pages/Connections.tsx
- [X] T058 [US2] Style Connections view pixel-perfect per mockup-screens/connection_tab/code.html

**Checkpoint**: Connection management complete - can connect/disconnect institutions

---

## Phase 5: User Story 1 - View Consolidated Account Dashboard (Priority: P1)

**Goal**: Consolidated view of all financial accounts across connected institutions with grouping, subtotals, and grand total

**Independent Test**: With at least one connected institution, load dashboard, click refresh, verify accounts grouped by institution with balances, subtotals, and grand total

### Tests for User Story 1

- [X] T059 [P] [US1] Contract test for GET /dashboard in backend/tests/integration/dashboard.test.ts
- [X] T060 [P] [US1] Contract test for POST /dashboard/refresh in backend/tests/integration/dashboard.test.ts
- [X] T061 [P] [US1] Unit test for GrandTotal component in frontend/tests/unit/GrandTotal.test.tsx
- [X] T062 [P] [US1] Unit test for InstitutionCard (dashboard) in frontend/tests/unit/DashboardInstitutionCard.test.tsx

### Backend Implementation for User Story 1

- [X] T063 [US1] Implement GET /dashboard endpoint in backend/src/api/dashboard.ts
- [X] T064 [US1] Implement POST /dashboard/refresh endpoint in backend/src/api/dashboard.ts
- [X] T065 [US1] Implement GET /dashboard/export (CSV) endpoint in backend/src/api/dashboard.ts
- [X] T066 [US1] Create DashboardService with aggregation logic in backend/src/services/dashboard.ts
- [X] T067 [US1] Create BalanceService for balance queries in backend/src/services/balance.ts
- [X] T068 [US1] Implement as-of date filtering logic in backend/src/services/dashboard.ts

### Frontend Implementation for User Story 1

- [X] T069 [P] [US1] Create GrandTotal component in frontend/src/components/dashboard/GrandTotal.tsx
- [X] T070 [P] [US1] Create TotalInstitutions component in frontend/src/components/dashboard/TotalInstitutions.tsx
- [X] T071 [P] [US1] Create FilterPanel component (as-of date picker) in frontend/src/components/dashboard/FilterPanel.tsx
- [X] T072 [US1] Create DashboardInstitutionCard component in frontend/src/components/dashboard/InstitutionCard.tsx
- [X] T073 [US1] Create AccountRow component in frontend/src/components/dashboard/AccountRow.tsx
- [X] T074 [US1] Create useDashboard hook in frontend/src/hooks/useDashboard.ts
- [X] T075 [US1] Implement full Dashboard page in frontend/src/pages/Dashboard.tsx
- [X] T076 [US1] Implement refresh functionality with loading states
- [X] T077 [US1] Implement export report button functionality
- [X] T078 [US1] Style Dashboard view pixel-perfect per mockup-screens/dashboard_tab/code.html

**Checkpoint**: Dashboard complete - consolidated view with refresh, grouping, and totals

---

## Phase 6: User Story 4 - Filter Dashboard by Institution (Priority: P2 - Post-MVP)

**Goal**: Filter dashboard to show only accounts from selected institutions

**Independent Test**: With multiple institutions connected, display checkboxes, select subset, verify only selected institutions appear

### Tests for User Story 4

- [ ] T079 [P] [US4] Unit test for InstitutionFilter component in frontend/tests/unit/InstitutionFilter.test.tsx

### Implementation for User Story 4

- [ ] T080 [US4] Add institutionIds query param support to GET /dashboard in backend/src/api/dashboard.ts
- [ ] T081 [US4] Create InstitutionFilter component (checkboxes) in frontend/src/components/dashboard/InstitutionFilter.tsx
- [ ] T082 [US4] Update FilterPanel to include institution checkboxes in frontend/src/components/dashboard/FilterPanel.tsx
- [ ] T083 [US4] Update useDashboard hook to support institution filtering in frontend/src/hooks/useDashboard.ts
- [ ] T084 [US4] Update Dashboard page to wire up institution filter in frontend/src/pages/Dashboard.tsx

**Checkpoint**: Institution filtering complete (Post-MVP feature)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, performance, accessibility

### Error Handling & Edge Cases

- [ ] T085 [P] Implement "no connected institutions" state in Dashboard with prompt message
- [ ] T086 [P] Implement credential validation failure UI in ConnectModal
- [ ] T087 [P] Implement institution service unavailable state (cached data + warning)
- [ ] T088 [P] Implement "data not available for date" notification
- [ ] T089 [P] Implement disconnected institution warning indicator

### Performance & UX

- [ ] T090 Add loading spinners and skeleton states to all data fetches
- [ ] T091 Implement response caching for dashboard data
- [ ] T092 Add optimistic updates for connection status changes

### Accessibility (WCAG 2.1 AA)

- [ ] T093 [P] Add ARIA labels to all interactive components
- [ ] T094 [P] Ensure keyboard navigation works for all UI elements
- [ ] T095 [P] Verify color contrast meets WCAG AA standards

### Documentation & Cleanup

- [ ] T096 [P] Add JSDoc comments to all public backend services
- [ ] T097 [P] Add JSDoc comments to all React components
- [ ] T098 Run quickstart.md verification checklist
- [ ] T099 Final code cleanup and unused import removal

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3 (US3 Navigation)**: Depends on Phase 2 - Provides layout for other stories
- **Phase 4 (US2 Connections)**: Depends on Phase 2 + Phase 3
- **Phase 5 (US1 Dashboard)**: Depends on Phase 2 + Phase 3 + Phase 4 (needs connected institutions)
- **Phase 6 (US4 Filtering)**: Depends on Phase 5 - Post-MVP
- **Phase 7 (Polish)**: Depends on Phase 5

### User Story Dependencies

```
Phase 2 (Foundation)
        │
        ▼
Phase 3 (US3: Navigation) ─────┐
        │                      │
        ▼                      │
Phase 4 (US2: Connections) ────┤
        │                      │
        ▼                      │
Phase 5 (US1: Dashboard) ──────┘
        │
        ▼
Phase 6 (US4: Filtering) [Post-MVP]
        │
        ▼
Phase 7 (Polish)
```

### Within Each User Story

1. Tests written and FAIL before implementation
2. Backend models/services before endpoints
3. Frontend components before pages
4. Core implementation before styling
5. Pixel-perfect styling as final step

### Parallel Opportunities

**Phase 1**:
```bash
# After T001, run in parallel:
T002, T003, T004, T005, T006, T007, T008
```

**Phase 2**:
```bash
# After T012, run in parallel:
T013, T014
# After T015, run in parallel:
T016, T017, T018
# After schema setup, run in parallel:
T028, T029, T030, T031, T032
```

**Phase 3 (US3)**:
```bash
# Tests in parallel:
T033, T034
# Components in parallel:
T035, T036
```

**Phase 4 (US2)**:
```bash
# Tests in parallel:
T042, T043, T044
# Components in parallel:
T051, T052
```

**Phase 5 (US1)**:
```bash
# Tests in parallel:
T059, T060, T061, T062
# Components in parallel:
T069, T070, T071
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: Navigation (US3)
4. Complete Phase 4: Connections (US2)
5. Complete Phase 5: Dashboard (US1)
6. **STOP and VALIDATE**: Test full MVP flow
7. Deploy/demo MVP

### MVP Scope

- Navigation layout with Dashboard/Connections views
- Connect/disconnect institutions via SnapTrade
- View consolidated dashboard with grouping and totals
- As-of date filtering
- Export report (CSV)

### Post-MVP

- Phase 6: Institution checkbox filtering (US4)
- Phase 7: Polish, error handling, accessibility

---

## Summary

| Phase | User Story | Task Count | Priority |
|-------|------------|------------|----------|
| 1 | Setup | 9 | - |
| 2 | Foundational | 23 | - |
| 3 | US3 Navigation | 9 | P1 (MVP) |
| 4 | US2 Connections | 17 | P1 (MVP) |
| 5 | US1 Dashboard | 20 | P1 (MVP) |
| 6 | US4 Filtering | 6 | P2 (Post-MVP) |
| 7 | Polish | 15 | - |
| **Total** | | **99** | |

### Tasks by User Story

- **US1 (Dashboard)**: 20 tasks
- **US2 (Connections)**: 17 tasks
- **US3 (Navigation)**: 9 tasks
- **US4 (Filtering)**: 6 tasks (Post-MVP)
- **Infrastructure**: 32 tasks (Setup + Foundational)
- **Polish**: 15 tasks

### Parallel Opportunities

- **Setup**: 7 parallel tasks after T001
- **Foundational**: Multiple parallel groups (types, models, services)
- **Per Story**: Tests parallelizable, components often parallelizable
- **Cross-Story**: US3 → US2 → US1 must be sequential (dependencies)
