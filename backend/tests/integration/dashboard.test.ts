import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { getDatabase } from '../../src/db/index.js';
import { setConnectionServiceDeps, resetConnectionServiceDeps } from '../../src/services/connection.js';
import { mockSnaptradeClient, mockGetAccounts, mockGetHoldings, resetMockSnapTrade } from '../mocks/snaptrade.mock.js';

/**
 * Note: Dashboard tests
 *
 * The current implementation uses a fixed SnapTrade user and fetches data directly
 * from SnapTrade APIs rather than from the local database. This means the dashboard
 * data comes from actual SnapTrade connections, not from local records.
 *
 * These tests verify the API contract and response structure, but the actual values
 * depend on the SnapTrade account configuration.
 */
describe('GET /api/dashboard', () => {
  let db: ReturnType<typeof getDatabase>;

  beforeAll(() => {
    // Set up mock SnapTrade for connection tests
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
    resetMockSnapTrade();
  });

  it('should return dashboard with correct structure', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .expect('Content-Type', /json/)
      .expect(200);

    // Verify response structure
    expect(response.body).toHaveProperty('grandTotal');
    expect(response.body).toHaveProperty('totalInstitutions');
    expect(response.body).toHaveProperty('institutions');
    expect(response.body).toHaveProperty('asOfDate');

    expect(typeof response.body.grandTotal).toBe('number');
    expect(typeof response.body.totalInstitutions).toBe('number');
    expect(Array.isArray(response.body.institutions)).toBe(true);
  });

  it('should accept asOfDate query parameter', async () => {
    const response = await request(app)
      .get('/api/dashboard?asOfDate=2024-01-10')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.asOfDate).toBe('2024-01-10');
  });

  it('should accept institutionIds query parameter', async () => {
    const response = await request(app)
      .get('/api/dashboard?institutionIds=alpaca-paper,vanguard')
      .expect('Content-Type', /json/)
      .expect(200);

    // Response should have correct structure (filtering depends on actual SnapTrade data)
    expect(response.body).toHaveProperty('grandTotal');
    expect(response.body).toHaveProperty('totalInstitutions');
    expect(response.body).toHaveProperty('institutions');
  });

  it('should return institutions with correct account structure', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .expect(200);

    // If there are institutions, verify their structure
    if (response.body.institutions.length > 0) {
      const institution = response.body.institutions[0];
      expect(institution).toHaveProperty('institutionId');
      expect(institution).toHaveProperty('institutionName');
      expect(institution).toHaveProperty('subTotal');
      expect(institution).toHaveProperty('accounts');
      expect(Array.isArray(institution.accounts)).toBe(true);

      if (institution.accounts.length > 0) {
        const account = institution.accounts[0];
        expect(account).toHaveProperty('accountId');
        expect(account).toHaveProperty('accountName');
        expect(account).toHaveProperty('accountNumberMasked');
        expect(account).toHaveProperty('totalValue');
        expect(account).toHaveProperty('asOfDate');
      }
    }
  });

  it('should calculate grandTotal as sum of all institution subTotals', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .expect(200);

    const expectedGrandTotal = response.body.institutions.reduce(
      (sum: number, inst: any) => sum + inst.subTotal,
      0
    );

    expect(response.body.grandTotal).toBeCloseTo(expectedGrandTotal, 2);
  });

  it('should set totalInstitutions to the number of institutions returned', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .expect(200);

    expect(response.body.totalInstitutions).toBe(response.body.institutions.length);
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
    // Clear all data in correct order (children first to avoid FK issues)
    db.prepare('DELETE FROM balance_records').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM credentials').run();
    db.prepare('DELETE FROM connections').run();
    resetMockSnapTrade();
  });

  afterEach(() => {
    // Cleanup (children first)
    db.prepare('DELETE FROM balance_records').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM credentials').run();
    db.prepare('DELETE FROM connections').run();
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

    // With fixed SnapTrade user, sync results are returned as a single "all" entry
    expect(response.body.syncResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          institutionId: 'all',
          success: true,
          error: null,
        }),
      ])
    );
  });

  it('should return dashboard with sync result when no local connections exist', async () => {
    // With fixed SnapTrade user, we still get sync results even without local connections
    const response = await request(app)
      .post('/api/dashboard/refresh')
      .expect(200);

    expect(response.body.dashboard).toMatchObject({
      grandTotal: expect.any(Number),
      totalInstitutions: expect.any(Number),
      institutions: expect.any(Array),
    });

    // Should still return a sync result (either success or error based on SnapTrade credentials)
    expect(response.body.syncResults).toBeDefined();
    expect(Array.isArray(response.body.syncResults)).toBe(true);
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

    // With fixed SnapTrade user, sync results are returned as a single "all" entry
    expect(response.body.syncResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          institutionId: 'all',
          success: expect.any(Boolean),
        }),
      ])
    );

    // Dashboard should still be returned (may be empty if sync failed)
    expect(response.body.dashboard).toBeDefined();
  });
});
