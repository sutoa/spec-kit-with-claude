# Quickstart: Financial Account Dashboard

## Prerequisites

- **Node.js**: 20.x LTS or higher
- **pnpm**: 8.x or higher (`npm install -g pnpm`)
- **Git**: For version control
- **SnapTrade Account**: Developer account for brokerage API access (see SnapTrade Setup section)

## Project Setup

### 1. Initialize the project structure

```bash
# Create root directories
mkdir -p backend/src/{models,services,api,db}
mkdir -p backend/src/services/snaptrade
mkdir -p backend/tests/{unit,integration}
mkdir -p frontend/src/{components,pages,services,hooks,types,styles}
mkdir -p frontend/src/components/{layout,dashboard,connections}
mkdir -p frontend/tests/{unit,e2e}

# Initialize pnpm workspace
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'frontend'
  - 'backend'
EOF

# Create root package.json
cat > package.json << 'EOF'
{
  "name": "financial-account-dashboard",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
EOF
```

### 2. Initialize backend

```bash
cd backend

# Create package.json
cat > package.json << 'EOF'
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "zod": "^3.22.4",
    "snaptrade-typescript-sdk": "^11.0.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "tsx": "^4.6.2",
    "typescript": "^5.3.0",
    "vitest": "^1.0.4"
  }
}
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

cd ..
```

### 3. Initialize frontend

```bash
cd frontend

# Create with Vite (React + TypeScript)
pnpm create vite . --template react-ts

# Install additional dependencies
pnpm add react-router-dom @tanstack/react-query

# Install Tailwind CSS
pnpm add -D tailwindcss postcss autoprefixer @tailwindcss/forms
npx tailwindcss init -p

cd ..
```

### 4. Configure Tailwind CSS

Update `frontend/tailwind.config.js` with the design tokens from mockups:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#137fec",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
        "panel-light": "#ffffff",
        "panel-dark": "#111a22",
        "border-light": "#e5e7eb",
        "border-dark": "#233648",
        "text-primary-light": "#1f2937",
        "text-primary-dark": "#ffffff",
        "text-secondary-light": "#6b7280",
        "text-secondary-dark": "#92adc9",
        "input-bg-light": "#ffffff",
        "input-bg-dark": "#192633",
        "input-border-light": "#d1d5db",
        "input-border-dark": "#324d67",
        "search-bg-light": "#f3f4f6",
        "search-bg-dark": "#233648",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

### 5. Add fonts and icons to `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Financial Hub</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
  </head>
  <body class="font-display bg-background-dark">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 6. Install all dependencies

```bash
pnpm install
```

## Running the Application

### Development mode

```bash
# From root directory - runs both frontend and backend
pnpm dev

# Or run separately:
# Terminal 1 - Backend (port 3001)
cd backend && pnpm dev

# Terminal 2 - Frontend (port 5173)
cd frontend && pnpm dev
```

### Stopping the application

Press **Ctrl+C** in the terminal to stop the servers.

If running separately, stop each terminal with Ctrl+C.

### Production build

```bash
pnpm build
```

## Environment Variables

Create `backend/.env`:

```env
# Server
PORT=3001

# Database
DATABASE_PATH=./data/financial-hub.db

# Encryption (generate a random 32-character string)
ENCRYPTION_SECRET=change-this-to-random-32-char-string

# SnapTrade API Credentials
# Get these from https://dashboard.snaptrade.com
SNAPTRADE_CLIENT_ID=your-client-id
SNAPTRADE_CONSUMER_KEY=your-consumer-key
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

## Database Setup

The SQLite database is created automatically on first run. To reset:

```bash
rm backend/data/financial-hub.db
```

## SnapTrade Setup

SnapTrade provides unified API access to multiple brokerages (Alpaca, Vanguard, Schwab) through a single integration.

### 1. Create a SnapTrade Developer Account

1. Visit https://snaptrade.com/ and sign up for a developer account
2. Navigate to the dashboard at https://dashboard.snaptrade.com
3. Generate your API credentials (Client ID and Consumer Key)
4. Add the credentials to your `backend/.env` file

### 2. Supported Brokerages

SnapTrade supports the following institutions for this application:

| Institution | Capabilities | Auth Method |
|-------------|--------------|-------------|
| Alpaca | Full data + trading | OAuth |
| Vanguard | Read-only (balances, positions) | OAuth |
| Schwab (TD Trade) | Full data + trading | OAuth |

### 3. Testing with Paper Trading

For development, you can use Alpaca's paper trading:

1. Create an Alpaca account at https://alpaca.markets/
2. In SnapTrade connection flow, select "Alpaca Paper" for testing
3. This allows full integration testing without real money

### 4. SnapTrade SDK Usage

```typescript
import { Snaptrade } from 'snaptrade-typescript-sdk';

const snaptrade = new Snaptrade({
  clientId: process.env.SNAPTRADE_CLIENT_ID,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY,
});

// Register a user
const { userId, userSecret } = await snaptrade.authentication.registerSnapTradeUser({
  userId: 'unique-user-id',
});

// Get connection portal URL
const redirectUri = await snaptrade.authentication.loginSnapTradeUser({
  userId,
  userSecret,
});
```

## Project Structure Reference

```
financial-account-dashboard/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # pnpm workspace definition
├── .gitignore                # Git ignore patterns
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                  # Environment variables (not committed)
│   ├── src/
│   │   ├── index.ts          # Express server entry
│   │   ├── db/
│   │   │   ├── index.ts      # Database connection
│   │   │   ├── schema.ts     # SQLite schema setup
│   │   │   └── seed.ts       # Institution seed data
│   │   ├── models/
│   │   │   ├── institution.ts
│   │   │   ├── connection.ts
│   │   │   ├── credential.ts
│   │   │   ├── account.ts
│   │   │   └── balance.ts
│   │   ├── services/
│   │   │   ├── encryption.ts
│   │   │   ├── balance.ts
│   │   │   ├── connection.ts
│   │   │   ├── dashboard.ts
│   │   │   └── snaptrade/    # SnapTrade integration
│   │   │       ├── client.ts
│   │   │       ├── accounts.ts
│   │   │       └── holdings.ts
│   │   ├── api/
│   │   │   ├── index.ts      # Router aggregation
│   │   │   ├── health.ts
│   │   │   ├── institutions.ts
│   │   │   ├── connections.ts
│   │   │   ├── accounts.ts
│   │   │   └── dashboard.ts
│   │   ├── middleware/
│   │   │   ├── security.ts   # CORS, Helmet
│   │   │   └── error.ts      # Error handling
│   │   └── types/
│   │       └── index.ts
│   └── tests/
│       ├── unit/
│       └── integration/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    ├── .env                  # Environment variables (not committed)
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Sidebar.tsx
    │   │   │   ├── Header.tsx
    │   │   │   └── Layout.tsx
    │   │   ├── dashboard/
    │   │   │   ├── GrandTotal.tsx
    │   │   │   ├── TotalInstitutions.tsx
    │   │   │   ├── InstitutionCard.tsx
    │   │   │   ├── AccountRow.tsx
    │   │   │   ├── FilterPanel.tsx
    │   │   │   └── InstitutionFilter.tsx
    │   │   └── connections/
    │   │       ├── InstitutionList.tsx
    │   │       ├── InstitutionCard.tsx
    │   │       ├── ConnectModal.tsx
    │   │       └── DisconnectConfirmModal.tsx
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   └── Connections.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── hooks/
    │   │   ├── useApi.ts
    │   │   ├── useDashboard.ts
    │   │   ├── useInstitutions.ts
    │   │   └── useConnections.ts
    │   └── types/
    │       └── index.ts
    └── tests/
        ├── unit/
        └── e2e/
```

## Verification Checklist

- [ ] `pnpm install` completes without errors
- [ ] `pnpm dev` starts both servers
- [ ] Frontend loads at http://localhost:5173
- [ ] Backend health check at http://localhost:3001/api/health returns `{"status":"ok"}`
- [ ] Dark theme displays correctly with mockup colors
- [ ] Material Symbols icons render properly
- [ ] SnapTrade credentials configured in backend/.env
- [ ] Database file created at backend/data/financial-hub.db on first run
