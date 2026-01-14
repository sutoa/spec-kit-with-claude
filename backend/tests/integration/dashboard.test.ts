import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { getDatabase } from '../../src/db/index.js';
import { setConnectionServiceDeps, resetConnectionServiceDeps } from '../../src/services/connection.js';
import { mockSnaptradeClient, mockGetAccounts, mockGetHoldings, resetMockSnapTrade } from '../mocks/snaptrade.mock.js';

describe('GET /api/dashboard', () => {
  let db: ReturnType<typeof getDatabase>;

  beforeAll(() => {
    // Set up mock SnapTrade for all tests
    setConnectionServiceDeps({
      registerSnaptradeUser: mockSnaptradeClient.registerSnapTradeUser,
      deleteSnaptradeUser: mockSnaptradeClient.deleteSnaptradeUser,
      getConnectionPortalUrl: mockSnaptradeClient.getConnectionPortalUrl,
      getAccounts: mockGetAccounts,
      getHoldings: mockGetHoldings,
    });
  });

  afterAll(() => {
    resetConnectionServiceDeps();
  });

  beforeEach(() => {
    db = getDatabase();
    // Clear all data
    db.prepare('DELETE FROM balance_records').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM connections').run();
    db.prepare('DELETE FROM credentials').run();
    resetMockSnapTrade();
  });

  afterEach(() => {
    // Cleanup
    db.prepare('DELETE FROM balance_records').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM connections').run();
    db.prepare('DELETE FROM credentials').run();
  });

  it('should return empty dashboard when no connections exist', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toMatchObject({
      grandTotal: 0,
      totalInstitutions: 0,
      institutions: [],
      asOfDate: null,
    });
  });

  it('should return dashboard with single institution', async () => {
    // Create a connection
    const connResponse = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: {
          type: 'api_key',
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        },
      });

    const connectionId = connResponse.body.id;

    // Create an account
    const accountResult = db.prepare(
      `INSERT INTO accounts (connection_id, external_id, account_number_masked, account_name, account_type, is_active)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id`
    ).get(connectionId, 'ext-123', '•••• 1234', 'Test Brokerage', 'brokerage', 1) as any;

    // Create a balance record
    db.prepare(
      `INSERT INTO balance_records (account_id, total_value, cash_balance, portfolio_value, as_of_date, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(accountResult.id, 50000.00, 5000.00, 45000.00, '2024-01-15', new Date().toISOString());

    const response = await request(app)
      .get('/api/dashboard')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toMatchObject({
      grandTotal: 50000.00,
      totalInstitutions: 1,
      asOfDate: null,
      institutions: [
        {
          institutionId: 'alpaca',
          institutionName: 'Alpaca',
          subTotal: 50000.00,
          accounts: [
            {
              accountId: accountResult.id,
              accountName: 'Test Brokerage',
              accountNumberMasked: '•••• 1234',
              totalValue: 50000.00,
              asOfDate: '2024-01-15',
            },
          ],
        },
      ],
    });
  });

  it('should return dashboard with multiple institutions and accounts', async () => {
    // Create Alpaca connection
    const alpacaConn = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: { type: 'api_key', apiKey: 'key1', apiSecret: 'secret1' },
      });

    // Create Vanguard connection
    const vanguardConn = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'vanguard',
        credentials: { type: 'credentials', username: 'user', password: 'pass' },
      });

    // Create Alpaca account 1
    const alpacaAccount1 = db.prepare(
      `INSERT INTO accounts (connection_id, external_id, account_number_masked, account_name, is_active)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`
    ).get(alpacaConn.body.id, 'ext-alpaca-1', '•••• 1111', 'Alpaca Trading', 1) as any;

    // Create Alpaca account 2
    const alpacaAccount2 = db.prepare(
      `INSERT INTO accounts (connection_id, external_id, account_number_masked, account_name, is_active)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`
    ).get(alpacaConn.body.id, 'ext-alpaca-2', '•••• 2222', 'Alpaca IRA', 1) as any;

    // Create Vanguard account
    const vanguardAccount = db.prepare(
      `INSERT INTO accounts (connection_id, external_id, account_number_masked, account_name, is_active)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`
    ).get(vanguardConn.body.id, 'ext-vanguard-1', '•••• 9999', 'Vanguard 401k', 1) as any;

    // Add balance records
    db.prepare(
      `INSERT INTO balance_records (account_id, total_value, as_of_date, fetched_at)
       VALUES (?, ?, ?, ?)`
    ).run(alpacaAccount1.id, 25000.00, '2024-01-15', new Date().toISOString());

    db.prepare(
      `INSERT INTO balance_records (account_id, total_value, as_of_date, fetched_at)
       VALUES (?, ?, ?, ?)`
    ).run(alpacaAccount2.id, 35000.00, '2024-01-15', new Date().toISOString());

    db.prepare(
      `INSERT INTO balance_records (account_id, total_value, as_of_date, fetched_at)
       VALUES (?, ?, ?, ?)`
    ).run(vanguardAccount.id, 100000.00, '2024-01-15', new Date().toISOString());

    const response = await request(app)
      .get('/api/dashboard')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.grandTotal).toBe(160000.00);
    expect(response.body.totalInstitutions).toBe(2);
    expect(response.body.institutions).toHaveLength(2);

    // Find Alpaca institution
    const alpacaInst = response.body.institutions.find((i: any) => i.institutionId === 'alpaca');
    expect(alpacaInst).toBeDefined();
    expect(alpacaInst.subTotal).toBe(60000.00);
    expect(alpacaInst.accounts).toHaveLength(2);

    // Find Vanguard institution
    const vanguardInst = response.body.institutions.find((i: any) => i.institutionId === 'vanguard');
    expect(vanguardInst).toBeDefined();
    expect(vanguardInst.subTotal).toBe(100000.00);
    expect(vanguardInst.accounts).toHaveLength(1);
  });

  it('should filter by asOfDate query parameter', async () => {
    // Create connection and account
    const connResponse = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: { type: 'api_key', apiKey: 'key', apiSecret: 'secret' },
      });

    const accountResult = db.prepare(
      `INSERT INTO accounts (connection_id, external_id, account_number_masked, account_name, is_active)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`
    ).get(connResponse.body.id, 'ext-1', '•••• 1234', 'Account', 1) as any;

    // Add balance on 2024-01-10
    db.prepare(
      `INSERT INTO balance_records (account_id, total_value, as_of_date, fetched_at)
       VALUES (?, ?, ?, ?)`
    ).run(accountResult.id, 40000.00, '2024-01-10', new Date().toISOString());

    // Add balance on 2024-01-15
    db.prepare(
      `INSERT INTO balance_records (account_id, total_value, as_of_date, fetched_at)
       VALUES (?, ?, ?, ?)`
    ).run(accountResult.id, 50000.00, '2024-01-15', new Date().toISOString());

    // Query for 2024-01-10
    const response = await request(app)
      .get('/api/dashboard?asOfDate=2024-01-10')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.asOfDate).toBe('2024-01-10');
    expect(response.body.grandTotal).toBe(40000.00);
    expect(response.body.institutions[0].accounts[0].totalValue).toBe(40000.00);
  });

  it('should only include accounts with balance records', async () => {
    // Create connection
    const connResponse = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: { type: 'api_key', apiKey: 'key', apiSecret: 'secret' },
      });

    // Create account with balance
    const accountWithBalance = db.prepare(
      `INSERT INTO accounts (connection_id, external_id, account_number_masked, account_name, is_active)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`
    ).get(connResponse.body.id, 'ext-1', '•••• 1111', 'Account 1', 1) as any;

    // Create account without balance
    db.prepare(
      `INSERT INTO accounts (connection_id, external_id, account_number_masked, account_name, is_active)
       VALUES (?, ?, ?, ?, ?)`
    ).run(connResponse.body.id, 'ext-2', '•••• 2222', 'Account 2', 1);

    // Add balance to first account only
    db.prepare(
      `INSERT INTO balance_records (account_id, total_value, as_of_date, fetched_at)
       VALUES (?, ?, ?, ?)`
    ).run(accountWithBalance.id, 25000.00, '2024-01-15', new Date().toISOString());

    const response = await request(app)
      .get('/api/dashboard')
      .expect(200);

    expect(response.body.grandTotal).toBe(25000.00);
    expect(response.body.totalInstitutions).toBe(1);
    expect(response.body.institutions[0].accounts).toHaveLength(1);
  });
});

describe('POST /api/dashboard/refresh', () => {
  let db: ReturnType<typeof getDatabase>;

  beforeAll(() => {
    setConnectionServiceDeps({
      registerSnaptradeUser: mockSnaptradeClient.registerSnapTradeUser,
      deleteSnaptradeUser: mockSnaptradeClient.deleteSnaptradeUser,
      getConnectionPortalUrl: mockSnaptradeClient.getConnectionPortalUrl,
      getAccounts: mockGetAccounts,
      getHoldings: mockGetHoldings,
    });
  });

  afterAll(() => {
    resetConnectionServiceDeps();
  });

  beforeEach(() => {
    db = getDatabase();
    db.prepare('DELETE FROM balance_records').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM connections').run();
    db.prepare('DELETE FROM credentials').run();
    resetMockSnapTrade();
  });

  afterEach(() => {
    db.prepare('DELETE FROM balance_records').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM connections').run();
    db.prepare('DELETE FROM credentials').run();
  });

  it('should refresh all connections and return updated dashboard', async () => {
    // Create connection
    const connResponse = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: { type: 'api_key', apiKey: 'key', apiSecret: 'secret' },
      });

    const response = await request(app)
      .post('/api/dashboard/refresh')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('dashboard');
    expect(response.body).toHaveProperty('syncResults');

    expect(response.body.dashboard).toMatchObject({
      grandTotal: expect.any(Number),
      totalInstitutions: expect.any(Number),
      institutions: expect.any(Array),
    });

    expect(response.body.syncResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          institutionId: 'alpaca',
          success: true,
          error: null,
        }),
      ])
    );
  });

  it('should return empty dashboard when no connections exist', async () => {
    const response = await request(app)
      .post('/api/dashboard/refresh')
      .expect(200);

    expect(response.body.dashboard).toMatchObject({
      grandTotal: 0,
      totalInstitutions: 0,
      institutions: [],
    });

    expect(response.body.syncResults).toEqual([]);
  });

  it('should handle sync failures gracefully', async () => {
    // Create connection
    await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: { type: 'api_key', apiKey: 'key', apiSecret: 'secret' },
      });

    // Override mock to simulate failure
    setConnectionServiceDeps({
      registerSnaptradeUser: mockSnaptradeClient.registerSnapTradeUser,
      deleteSnaptradeUser: mockSnaptradeClient.deleteSnaptradeUser,
      getConnectionPortalUrl: mockSnaptradeClient.getConnectionPortalUrl,
      getAccounts: async () => {
        throw new Error('API temporarily unavailable');
      },
      getHoldings: mockGetHoldings,
    });

    const response = await request(app)
      .post('/api/dashboard/refresh')
      .expect(200);

    expect(response.body.syncResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          institutionId: 'alpaca',
          success: false,
          error: expect.any(String),
        }),
      ])
    );

    // Dashboard should still be returned (may be empty if sync failed)
    expect(response.body.dashboard).toBeDefined();
  });
});
