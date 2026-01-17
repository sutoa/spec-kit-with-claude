import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { getDatabase } from '../../src/db/index.js';
import { setConnectionServiceDeps, resetConnectionServiceDeps } from '../../src/services/connection.js';
import { mockSnaptradeClient, mockGetAccounts, mockGetHoldings, resetMockSnapTrade } from '../mocks/snaptrade.mock.js';

describe('POST /api/connections', () => {
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
    // Reset to real SnapTrade after tests
    resetConnectionServiceDeps();
  });

  beforeEach(() => {
    db = getDatabase();
    // Clear all data in correct order (children first to avoid FK issues)
    db.prepare('DELETE FROM balance_records').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM credentials').run();
    db.prepare('DELETE FROM connections').run();
    // Reset mock state
    resetMockSnapTrade();
  });

  afterEach(() => {
    // Cleanup after tests (children first)
    db.prepare('DELETE FROM balance_records').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM credentials').run();
    db.prepare('DELETE FROM connections').run();
  });

  it('should create a new connection with valid API key credentials', async () => {
    const response = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: {
          type: 'api_key',
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret',
        },
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      institutionId: 'alpaca',
      status: 'pending', // Starts as pending until OAuth is completed
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    expect(response.body.id).toBeGreaterThan(0);
  });

  it('should create a new connection with username/password credentials', async () => {
    const response = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'vanguard',
        credentials: {
          type: 'credentials',
          username: 'test-user',
          password: 'test-password',
        },
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      institutionId: 'vanguard',
      status: 'pending', // Starts as pending until OAuth is completed
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('should return 400 for missing institutionId', async () => {
    const response = await request(app)
      .post('/api/connections')
      .send({
        credentials: {
          type: 'api_key',
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        },
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toMatchObject({
      error: expect.any(String),
      message: expect.any(String),
    });
  });

  it('should create connection without credentials (OAuth flow)', async () => {
    // OAuth institutions don't require credentials upfront
    const response = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      institutionId: 'alpaca',
      status: 'pending',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('should return 400 for invalid credential type', async () => {
    const response = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: {
          type: 'invalid_type',
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        },
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toMatchObject({
      error: expect.any(String),
      message: expect.any(String),
    });
  });

  it('should return 404 for non-existent institution', async () => {
    const response = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'non-existent',
        credentials: {
          type: 'api_key',
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        },
      })
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toMatchObject({
      error: expect.any(String),
      message: expect.any(String),
    });
  });

  it('should return 409 if connection already exists for institution', async () => {
    // Create first connection
    await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: {
          type: 'api_key',
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        },
      })
      .expect(201);

    // Try to create duplicate
    const response = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: {
          type: 'api_key',
          apiKey: 'different-key',
          apiSecret: 'different-secret',
        },
      })
      .expect('Content-Type', /json/)
      .expect(409);

    expect(response.body).toMatchObject({
      error: 'CONNECTION_EXISTS',
      message: expect.stringContaining('already exists'),
    });
  });

  it('should store credentials encrypted in the database', async () => {
    const response = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: {
          type: 'api_key',
          apiKey: 'secret-key-123',
          apiSecret: 'secret-value-456',
        },
      })
      .expect(201);

    const connectionId = response.body.id;

    // Query credentials directly from database
    const credential = db
      .prepare('SELECT * FROM credentials WHERE connection_id = ?')
      .get(connectionId) as any;

    expect(credential).toBeDefined();
    expect(credential.encrypted_data).toBeDefined();
    expect(credential.iv).toBeDefined();
    expect(credential.auth_tag).toBeDefined();

    // Ensure plaintext is NOT stored
    const encryptedString = credential.encrypted_data.toString();
    expect(encryptedString).not.toContain('secret-key-123');
    expect(encryptedString).not.toContain('secret-value-456');
  });
});

describe('DELETE /api/connections/:id', () => {
  let db: ReturnType<typeof getDatabase>;
  let connectionId: number;

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
    // Reset to real SnapTrade after tests
    resetConnectionServiceDeps();
  });

  beforeEach(async () => {
    db = getDatabase();
    // Clear all data in correct order (children first to avoid FK issues)
    db.prepare('DELETE FROM balance_records').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM credentials').run();
    db.prepare('DELETE FROM connections').run();
    // Reset mock state
    resetMockSnapTrade();

    // Create a connection before each test
    const response = await request(app)
      .post('/api/connections')
      .send({
        institutionId: 'alpaca',
        credentials: {
          type: 'api_key',
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        },
      });

    connectionId = response.body.id;
  });

  afterEach(() => {
    // Cleanup (children first)
    db.prepare('DELETE FROM balance_records').run();
    db.prepare('DELETE FROM accounts').run();
    db.prepare('DELETE FROM credentials').run();
    db.prepare('DELETE FROM connections').run();
  });

  it('should delete an existing connection', async () => {
    await request(app)
      .delete(`/api/connections/${connectionId}`)
      .expect(204);

    // Verify connection is deleted
    const connection = db
      .prepare('SELECT * FROM connections WHERE id = ?')
      .get(connectionId);

    expect(connection).toBeUndefined();
  });

  it('should cascade delete associated credentials', async () => {
    await request(app)
      .delete(`/api/connections/${connectionId}`)
      .expect(204);

    // Verify credentials are deleted
    const credential = db
      .prepare('SELECT * FROM credentials WHERE connection_id = ?')
      .get(connectionId);

    expect(credential).toBeUndefined();
  });

  it('should cascade delete associated accounts and balances', async () => {
    // Create an account for this connection
    db.prepare(
      `INSERT INTO accounts (connection_id, external_id, account_number_masked, account_name, is_active)
       VALUES (?, ?, ?, ?, ?)`
    ).run(connectionId, 'ext-123', '•••• 1234', 'Test Account', 1);

    const account = db
      .prepare('SELECT * FROM accounts WHERE connection_id = ?')
      .get(connectionId) as any;

    // Create a balance record for this account
    db.prepare(
      `INSERT INTO balance_records (account_id, total_value, as_of_date)
       VALUES (?, ?, ?)`
    ).run(account.id, 10000.0, '2024-01-01');

    // Delete connection
    await request(app)
      .delete(`/api/connections/${connectionId}`)
      .expect(204);

    // Verify account is deleted
    const deletedAccount = db
      .prepare('SELECT * FROM accounts WHERE connection_id = ?')
      .get(connectionId);

    expect(deletedAccount).toBeUndefined();

    // Verify balance records are deleted
    const deletedBalance = db
      .prepare('SELECT * FROM balance_records WHERE account_id = ?')
      .get(account.id);

    expect(deletedBalance).toBeUndefined();
  });

  it('should return 404 when deleting non-existent connection', async () => {
    const nonExistentId = 99999;

    const response = await request(app)
      .delete(`/api/connections/${nonExistentId}`)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'NOT_FOUND',
      message: expect.any(String),
    });
  });

  it('should return 400 for invalid connection ID format', async () => {
    const response = await request(app)
      .delete('/api/connections/invalid-id')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toMatchObject({
      error: expect.any(String),
      message: expect.any(String),
    });
  });
});
