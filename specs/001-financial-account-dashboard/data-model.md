# Data Model: Financial Account Dashboard

**Feature Branch**: `001-financial-account-dashboard`
**Date**: 2026-01-12

## Entity Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Institution   │────<│    Connection   │────<│    Account      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
   (reference data)      (has Credential)        ┌─────────────────┐
                                                 │  BalanceRecord  │
                                                 └─────────────────┘
```

## Entities

### Institution

Reference data for supported financial institutions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK | Unique identifier (e.g., "alpaca", "vanguard", "tdtrade") |
| name | string | NOT NULL | Display name (e.g., "Alpaca", "Vanguard", "TD Trade") |
| logo_url | string | NULL | URL or path to institution logo |
| api_type | enum | NOT NULL | Integration type: "api", "manual" |
| api_base_url | string | NULL | Base URL for API integrations |
| auth_type | enum | NOT NULL | Authentication: "api_key", "oauth", "credentials", "none" |

**Seed Data**:
```json
[
  { "id": "alpaca", "name": "Alpaca", "api_type": "api", "auth_type": "api_key" },
  { "id": "vanguard", "name": "Vanguard", "api_type": "manual", "auth_type": "credentials" },
  { "id": "tdtrade", "name": "TD Trade", "api_type": "manual", "auth_type": "credentials" }
]
```

### Connection

Links an institution to the user with connection status.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | PK, AUTO | Unique identifier |
| institution_id | string | FK → Institution.id, NOT NULL | Referenced institution |
| status | enum | NOT NULL | "connected", "disconnected", "error" |
| last_sync_at | datetime | NULL | Timestamp of last successful data fetch |
| error_message | string | NULL | Last error message if status is "error" |
| created_at | datetime | NOT NULL, DEFAULT NOW | When connection was created |
| updated_at | datetime | NOT NULL, DEFAULT NOW | When connection was last modified |

**Validation Rules**:
- Only one connection per institution (unique constraint on institution_id)
- status defaults to "disconnected"

**State Transitions**:
```
disconnected ──[connect]──> connected
connected ──[sync success]──> connected (update last_sync_at)
connected ──[sync failure]──> error
error ──[retry success]──> connected
connected ──[disconnect]──> (deleted)
error ──[disconnect]──> (deleted)
```

### Credential

Encrypted storage for institution authentication data.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | PK, AUTO | Unique identifier |
| connection_id | integer | FK → Connection.id, UNIQUE, NOT NULL | Associated connection |
| encrypted_data | blob | NOT NULL | AES-256-GCM encrypted JSON |
| iv | blob | NOT NULL | Initialization vector for decryption |
| auth_tag | blob | NOT NULL | Authentication tag for integrity |
| created_at | datetime | NOT NULL, DEFAULT NOW | When credential was stored |
| updated_at | datetime | NOT NULL, DEFAULT NOW | When credential was last updated |

**Encrypted Data Structure** (before encryption):
```typescript
// For api_key auth (Alpaca)
interface ApiKeyCredential {
  type: "api_key";
  api_key: string;
  api_secret: string;
}

// For credentials auth (Vanguard, TD Trade)
interface UsernamePasswordCredential {
  type: "credentials";
  username: string;
  password: string;
}

type CredentialData = ApiKeyCredential | UsernamePasswordCredential;
```

**Security Notes**:
- Credentials are NEVER stored in plaintext
- Encryption key derived from machine-specific data
- Deleting a Connection cascades to delete Credential

### Account

Financial account belonging to a connected institution.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | PK, AUTO | Unique identifier |
| connection_id | integer | FK → Connection.id, NOT NULL | Parent connection |
| external_id | string | NOT NULL | Institution's account identifier |
| account_number_masked | string | NOT NULL | Masked display (e.g., "•••• 5678") |
| account_name | string | NOT NULL | Account display name (e.g., "Brokerage Account") |
| account_type | string | NULL | Type if known (e.g., "brokerage", "ira", "roth_ira") |
| is_active | boolean | NOT NULL, DEFAULT TRUE | Whether account is active |
| created_at | datetime | NOT NULL, DEFAULT NOW | When account was discovered |
| updated_at | datetime | NOT NULL, DEFAULT NOW | When account was last updated |

**Validation Rules**:
- external_id + connection_id must be unique
- account_number_masked must show last 4 digits only

### BalanceRecord

Point-in-time balance snapshot for an account.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | PK, AUTO | Unique identifier |
| account_id | integer | FK → Account.id, NOT NULL | Parent account |
| total_value | decimal(15,2) | NOT NULL | Combined cash + portfolio value in USD |
| cash_balance | decimal(15,2) | NULL | Cash portion if known |
| portfolio_value | decimal(15,2) | NULL | Investment value if known |
| as_of_date | date | NOT NULL | Date this balance represents |
| fetched_at | datetime | NOT NULL, DEFAULT NOW | When this record was fetched/entered |

**Validation Rules**:
- total_value must be >= 0
- as_of_date cannot be in the future
- One record per account per as_of_date (upsert on conflict)

**Query Patterns**:
- Latest balance: `SELECT * FROM balance_records WHERE account_id = ? ORDER BY as_of_date DESC LIMIT 1`
- Balance as of date: `SELECT * FROM balance_records WHERE account_id = ? AND as_of_date <= ? ORDER BY as_of_date DESC LIMIT 1`

## Computed Views

### DashboardReport

Not stored; computed at query time.

```typescript
interface DashboardReport {
  asOfDate: Date | null;  // Filter date or null for latest
  grandTotal: number;
  totalInstitutions: number;
  institutions: InstitutionSummary[];
}

interface InstitutionSummary {
  institutionId: string;
  institutionName: string;
  subTotal: number;
  accounts: AccountBalance[];
}

interface AccountBalance {
  accountId: number;
  accountName: string;
  accountNumberMasked: string;
  totalValue: number;
  asOfDate: Date;
}
```

## Database Schema (SQLite)

```sql
-- Reference data
CREATE TABLE institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  api_type TEXT NOT NULL CHECK (api_type IN ('api', 'manual')),
  api_base_url TEXT,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('api_key', 'oauth', 'credentials', 'none'))
);

-- User connections
CREATE TABLE connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_id TEXT NOT NULL UNIQUE REFERENCES institutions(id),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_sync_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Encrypted credentials
CREATE TABLE credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL UNIQUE REFERENCES connections(id) ON DELETE CASCADE,
  encrypted_data BLOB NOT NULL,
  iv BLOB NOT NULL,
  auth_tag BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Accounts
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  account_number_masked TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (connection_id, external_id)
);

-- Balance history
CREATE TABLE balance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  total_value REAL NOT NULL CHECK (total_value >= 0),
  cash_balance REAL,
  portfolio_value REAL,
  as_of_date TEXT NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (account_id, as_of_date)
);

-- Indexes for common queries
CREATE INDEX idx_balance_records_account_date ON balance_records(account_id, as_of_date DESC);
CREATE INDEX idx_accounts_connection ON accounts(connection_id);
```

## TypeScript Types

```typescript
// Enums
type InstitutionApiType = "api" | "manual";
type InstitutionAuthType = "api_key" | "oauth" | "credentials" | "none";
type ConnectionStatus = "connected" | "disconnected" | "error";

// Entities
interface Institution {
  id: string;
  name: string;
  logoUrl: string | null;
  apiType: InstitutionApiType;
  apiBaseUrl: string | null;
  authType: InstitutionAuthType;
}

interface Connection {
  id: number;
  institutionId: string;
  status: ConnectionStatus;
  lastSyncAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Account {
  id: number;
  connectionId: number;
  externalId: string;
  accountNumberMasked: string;
  accountName: string;
  accountType: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BalanceRecord {
  id: number;
  accountId: number;
  totalValue: number;
  cashBalance: number | null;
  portfolioValue: number | null;
  asOfDate: Date;
  fetchedAt: Date;
}

// API Response Types
interface InstitutionWithConnection extends Institution {
  connection: Connection | null;
  lastUpdatedRelative: string | null;  // "2m ago", "15m ago", etc.
}

interface AccountWithBalance extends Account {
  latestBalance: BalanceRecord | null;
  institution: Pick<Institution, "id" | "name">;
}
```
