# Feature Specification: Financial Account Dashboard

**Feature Branch**: `001-financial-account-dashboard`
**Created**: 2026-01-11
**Status**: Draft
**Input**: User description: "Web-based reporting utility to collect and consolidate financial account information from multiple institutions (Alpaca, Vanguard, TD Trade) with dashboard and connection management views."

## Clarifications

### Session 2026-01-11

- Q: Should account balances show cash only, cash plus total portfolio value, or full position breakdown? → A: Cash balance plus total portfolio value (combined single number per account)
- Q: How should institution credentials be secured? → A: Local encrypted storage (MVP: no master password authentication - single user assumed)
- Q: Can users disconnect/remove an institution? → A: Yes, with confirmation prompt before removing

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Consolidated Account Dashboard (Priority: P1)

As a user, I want to see a consolidated view of all my financial accounts across connected institutions so that I can understand my total financial position at a glance.

**Why this priority**: This is the core value proposition of the application - providing a unified view of financial accounts that are otherwise scattered across multiple institutions.

**Independent Test**: Can be fully tested by loading the dashboard with at least one connected institution and verifying account data displays correctly with proper grouping and totals.

**Acceptance Scenarios**:

1. **Given** I have connected institutions with accounts, **When** I click "Dashboard" in the left navigation and click the refresh button, **Then** I see my accounts grouped by institution with account numbers, balance amounts, and as-of dates displayed.

2. **Given** I am viewing the dashboard with multiple accounts, **When** the data loads, **Then** I see subtotals for each institution and a grand total across all institutions.

3. **Given** I am on the dashboard, **When** I enter an as-of date and refresh, **Then** the system retrieves and displays balances closest to that specified date.

4. **Given** I am on the dashboard, **When** I do not specify an as-of date and click refresh, **Then** the system uses the latest available date for each account.

---

### User Story 2 - Manage Institution Connections (Priority: P1)

As a user, I want to connect and manage my financial institution accounts so that my dashboard can retrieve account information from these sources.

**Why this priority**: Without connected institutions, the dashboard has no data to display. This is equally critical as the dashboard itself for MVP functionality.

**Independent Test**: Can be fully tested by navigating to the Connections view, connecting to an institution with credentials, and verifying the connection status updates accordingly.

**Acceptance Scenarios**:

1. **Given** I am on the landing page, **When** I click "Connections" in the left navigation, **Then** I see a list of supported institutions (Alpaca, Vanguard, TD Trade) with their connection status and connect icons.

2. **Given** I see an unconnected institution, **When** I click the "Connect" icon, **Then** I am prompted to enter my credentials for that institution.

3. **Given** I have entered valid credentials for an institution, **When** the connection is established, **Then** the status icon updates to show "Connected" and my accounts from that institution become available on the dashboard.

4. **Given** an institution is connected, **When** I view the Connections list, **Then** I see a visual indicator showing the connection is active.

5. **Given** an institution is connected, **When** I click "Disconnect" and confirm the prompt, **Then** the institution returns to unconnected state and its accounts are removed from the dashboard.

---

### User Story 3 - Navigate Application Layout (Priority: P1)

As a user, I want a modern, sleek interface with clear navigation so that I can easily switch between dashboard and connection management.

**Why this priority**: The navigation structure is foundational to accessing all other features and provides the modern UX experience requested.

**Independent Test**: Can be fully tested by loading the application and verifying the left navigation panel contains Dashboard and Connections options that switch the right panel content when clicked.

**Acceptance Scenarios**:

1. **Given** I open the application, **When** the landing page loads, **Then** I see a left navigation panel with "Dashboard" and "Connections" menu items.

2. **Given** I am on any page, **When** I click "Dashboard" in the left panel, **Then** the right panel displays the dashboard view with the filter section and refresh capability.

3. **Given** I am on any page, **When** I click "Connections" in the left panel, **Then** the right panel displays the connections management view.

---

### User Story 4 - Filter Dashboard by Institution (Priority: P2 - Post-MVP)

As a user, I want to filter the dashboard to show only accounts from selected institutions so that I can focus on specific portions of my portfolio.

**Why this priority**: This is explicitly marked as post-MVP functionality. The core MVP delivers value without institution filtering.

**Independent Test**: Can be tested by displaying institution checkboxes in the filter section and verifying that only selected institutions appear in the report.

**Acceptance Scenarios**:

1. **Given** I am on the dashboard, **When** I view the filter section, **Then** I see checkboxes for each connected institution in addition to the as-of date field.

2. **Given** I have multiple institutions connected, **When** I select only specific institutions and refresh, **Then** only accounts from those selected institutions appear in the report.

---

### Edge Cases

- What happens when a user tries to refresh with no connected institutions? Display a friendly message prompting them to connect at least one institution first.
- What happens when credential validation fails during connection? Display a clear error message indicating the credentials could not be verified and allow retry.
- What happens when an institution's service is temporarily unavailable? Show the last cached data with a warning indicator and timestamp of last successful refresh.
- What happens when account data cannot be retrieved for a specific date? Display the closest available date with a note explaining the actual as-of date used.
- What happens when a previously connected institution becomes disconnected? Show a warning status indicator and prompt user to re-authenticate.

## Requirements *(mandatory)*

### Functional Requirements

**Navigation & Layout**

- **FR-001**: System MUST display a left navigation panel with "Dashboard" and "Connections" menu options
- **FR-002**: System MUST switch the right panel content based on selected navigation item
- **FR-003**: System MUST maintain a modern, sleek visual design

**Dashboard View**

- **FR-004**: Dashboard MUST display a filter section with an optional as-of date field
- **FR-005**: Dashboard MUST include a refresh button/icon to retrieve account data
- **FR-006**: When no as-of date is specified, system MUST use the latest available date
- **FR-007**: Dashboard MUST display account number, total balance (cash plus portfolio market value combined), and actual as-of date for each account
- **FR-008**: Dashboard MUST group accounts by institution
- **FR-009**: Dashboard MUST calculate and display subtotals for each institution
- **FR-010**: Dashboard MUST calculate and display a grand total across all accounts
- **FR-011**: Balance amounts MUST be displayed in dollar format

**Connections View**

- **FR-012**: Connections view MUST display a list of supported institutions (Alpaca, Vanguard, TD Trade)
- **FR-013**: Each institution MUST show a connection status indicator
- **FR-014**: Each unconnected institution MUST show a clickable "Connect" icon
- **FR-015**: Clicking "Connect" MUST prompt user for institution credentials (user ID and password)
- **FR-016**: System MUST store credentials locally using encryption (MVP: no master password - single user assumed)
- **FR-017**: System MUST validate credentials by testing the connection before confirming
- **FR-017a**: Connected institutions MUST display a "Disconnect" action
- **FR-017b**: Clicking "Disconnect" MUST show a confirmation prompt before removing
- **FR-017c**: Upon confirmed disconnection, system MUST delete stored credentials and remove institution from dashboard

**Data Retrieval**

- **FR-018**: System MUST retrieve account information from connected institutions
- **FR-019**: System MUST prioritize free or low-cost methods for retrieving account data
- **FR-020**: System MUST handle retrieval failures gracefully with appropriate user feedback

**Post-MVP Requirements**

- **FR-021**: (Post-MVP) Filter section MUST include checkboxes to select specific institutions
- **FR-022**: (Post-MVP) Dashboard MUST filter displayed accounts based on selected institutions

### Key Entities

- **Institution**: Represents a financial company (Alpaca, Vanguard, TD Trade) with name, connection status, and credential storage reference
- **Connection**: Links an institution to stored credentials with status (connected/disconnected) and last successful sync timestamp
- **Account**: Belongs to an institution, has account number, and maintains balance history
- **Balance Record**: Represents an account's total value (cash plus portfolio market value combined) at a specific point in time with dollar amount and as-of date
- **Dashboard Report**: A computed view that aggregates accounts grouped by institution with subtotals and grand total

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can view consolidated account balances from all connected institutions within 10 seconds of clicking refresh
- **SC-002**: User can connect to a new institution and see it reflected in the dashboard within 2 minutes
- **SC-003**: 100% of displayed balances show the actual as-of date matching the data source
- **SC-004**: Institution subtotals and grand total are mathematically accurate (sum verification passes)
- **SC-005**: User can navigate between Dashboard and Connections views in under 1 second
- **SC-006**: User can filter by as-of date and receive historical balance data when available from the institution
- **SC-007**: Connection failures display user-friendly error messages that guide resolution

## Assumptions

- This is a single-user personal finance tool (no multi-user authentication required for the application itself)
- User will provide valid credentials for their accounts at supported institutions
- Institutions (Alpaca, Vanguard, TD Trade) provide some mechanism for programmatic account access
- Balances are retrieved in USD or can be converted to USD
- Historical balance data availability depends on what each institution provides
- "Sleek, modern" design implies clean typography, appropriate whitespace, and contemporary visual patterns
- The as-of date filter retrieves the closest available balance record at or before the specified date
- Credentials are stored locally with encryption; no cloud transmission of credentials occurs

## Scope Boundaries

**In Scope (MVP)**:
- Left navigation with Dashboard and Connections views
- Dashboard with optional as-of date filter and refresh functionality
- Account display with institution grouping, subtotals, and grand total
- Connection management for three institutions: Alpaca, Vanguard, TD Trade
- Credential entry and connection status tracking

**Out of Scope (MVP)**:
- Master password / application-level authentication (deferred to later version)
- Institution checkbox filtering (explicitly post-MVP)
- Account transaction history
- Portfolio analytics or performance tracking
- Multiple user support
- Mobile application
- Automated/scheduled refresh
- Export functionality

## UI Design Reference

Mockup screens are provided in `mockup-screens/` folder and MUST be followed for pixel-perfect implementation:
- `mockup-screens/dashboard_tab/` - Dashboard view with filters and account report
- `mockup-screens/connection_tab/` - Connection management view

**Design System (from mockups)**:
- Font: Inter (400, 500, 600, 700 weights)
- Icons: Material Symbols Outlined
- Primary color: #137fec
- Dark theme backgrounds: #101922 (background), #111a22 (panel)
- Border color: #233648
- Framework: Tailwind CSS
