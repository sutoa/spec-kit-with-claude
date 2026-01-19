import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../../src/index.js'

// Mock the SnapTrade accounts module
vi.mock('../../src/services/snaptrade/accounts.js', async (importOriginal) => {
  const actual = await importOriginal() as object
  return {
    ...actual,
    listUserConnections: vi.fn(),
  }
})

import { listUserConnections } from '../../src/services/snaptrade/accounts.js'

const mockListUserConnections = listUserConnections as ReturnType<typeof vi.fn>

describe('GET /api/brokerages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock: no connected brokerages
    mockListUserConnections.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return a list of available brokerages', async () => {
    const response = await request(app)
      .get('/api/brokerages')
      .expect('Content-Type', /json/)
      .expect(200)

    expect(response.body).toHaveProperty('data')
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.length).toBeGreaterThan(0)

    // Check structure of first brokerage
    const firstBrokerage = response.body.data[0]
    expect(firstBrokerage).toHaveProperty('id')
    expect(firstBrokerage).toHaveProperty('name')
    expect(firstBrokerage).toHaveProperty('slug')
    expect(firstBrokerage).toHaveProperty('isConnected')
    expect(typeof firstBrokerage.id).toBe('string')
    expect(typeof firstBrokerage.name).toBe('string')
    expect(typeof firstBrokerage.slug).toBe('string')
    expect(typeof firstBrokerage.isConnected).toBe('boolean')
  })

  it('should include common brokerages in the list', async () => {
    const response = await request(app)
      .get('/api/brokerages')
      .expect(200)

    const brokerageNames = response.body.data.map((b: any) => b.name)

    // Check for some known SnapTrade brokerages
    expect(brokerageNames).toContain('Alpaca Paper')
    expect(brokerageNames).toContain('Robinhood')
    expect(brokerageNames).toContain('Fidelity')
    expect(brokerageNames).toContain('Schwab')
    expect(brokerageNames).toContain('Vanguard')
  })

  it('should mark connected brokerages as isConnected: true', async () => {
    // Mock that Alpaca Paper is connected
    mockListUserConnections.mockResolvedValue([
      {
        id: 'conn-1',
        brokerageName: 'Alpaca Paper',
        brokerageSlug: 'ALPACA-PAPER',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ])

    const response = await request(app)
      .get('/api/brokerages')
      .expect(200)

    const alpacaPaper = response.body.data.find((b: any) => b.slug === 'ALPACA-PAPER')
    expect(alpacaPaper).toBeDefined()
    expect(alpacaPaper.isConnected).toBe(true)

    // Other brokerages should not be connected
    const robinhood = response.body.data.find((b: any) => b.slug === 'ROBINHOOD')
    expect(robinhood).toBeDefined()
    expect(robinhood.isConnected).toBe(false)
  })

  it('should filter out connected brokerages when showConnected=false', async () => {
    // Mock that Alpaca Paper is connected
    mockListUserConnections.mockResolvedValue([
      {
        id: 'conn-1',
        brokerageName: 'Alpaca Paper',
        brokerageSlug: 'ALPACA-PAPER',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ])

    const response = await request(app)
      .get('/api/brokerages?showConnected=false')
      .expect(200)

    const alpacaPaper = response.body.data.find((b: any) => b.slug === 'ALPACA-PAPER')
    expect(alpacaPaper).toBeUndefined()

    // Other brokerages should still be present
    const robinhood = response.body.data.find((b: any) => b.slug === 'ROBINHOOD')
    expect(robinhood).toBeDefined()
  })

  it('should include connected brokerages by default', async () => {
    // Mock that Alpaca Paper is connected
    mockListUserConnections.mockResolvedValue([
      {
        id: 'conn-1',
        brokerageName: 'Alpaca Paper',
        brokerageSlug: 'ALPACA-PAPER',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ])

    const response = await request(app)
      .get('/api/brokerages')
      .expect(200)

    const alpacaPaper = response.body.data.find((b: any) => b.slug === 'ALPACA-PAPER')
    expect(alpacaPaper).toBeDefined()
    expect(alpacaPaper.isConnected).toBe(true)
  })

  it('should sort brokerages with connected ones first, then alphabetically', async () => {
    // Mock that Vanguard is connected (starts with V, normally later in alphabet)
    mockListUserConnections.mockResolvedValue([
      {
        id: 'conn-1',
        brokerageName: 'Vanguard',
        brokerageSlug: 'VANGUARD',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ])

    const response = await request(app)
      .get('/api/brokerages')
      .expect(200)

    // Vanguard should be first since it's connected
    expect(response.body.data[0].name).toBe('Vanguard')
    expect(response.body.data[0].isConnected).toBe(true)

    // The rest should be alphabetically sorted
    const unconnectedBrokerages = response.body.data.slice(1)
    const names = unconnectedBrokerages.map((b: any) => b.name)
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b))
    expect(names).toEqual(sortedNames)
  })

  it('should handle SnapTrade connection error gracefully', async () => {
    // Mock a failure from SnapTrade
    mockListUserConnections.mockRejectedValue(new Error('SnapTrade unavailable'))

    const response = await request(app)
      .get('/api/brokerages')
      .expect(200) // Should still return 200 with all brokerages marked as unconnected

    expect(response.body).toHaveProperty('data')
    expect(Array.isArray(response.body.data)).toBe(true)

    // All brokerages should be marked as not connected
    const connectedBrokerages = response.body.data.filter((b: any) => b.isConnected)
    expect(connectedBrokerages.length).toBe(0)
  })

  it('should handle multiple connected brokerages', async () => {
    mockListUserConnections.mockResolvedValue([
      {
        id: 'conn-1',
        brokerageName: 'Alpaca Paper',
        brokerageSlug: 'ALPACA-PAPER',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'conn-2',
        brokerageName: 'Robinhood',
        brokerageSlug: 'ROBINHOOD',
        createdAt: '2024-01-02T00:00:00Z',
      },
    ])

    const response = await request(app)
      .get('/api/brokerages')
      .expect(200)

    const connectedBrokerages = response.body.data.filter((b: any) => b.isConnected)
    expect(connectedBrokerages.length).toBe(2)

    const connectedSlugs = connectedBrokerages.map((b: any) => b.slug)
    expect(connectedSlugs).toContain('ALPACA-PAPER')
    expect(connectedSlugs).toContain('ROBINHOOD')
  })

  it('should return at least 20 brokerages', async () => {
    const response = await request(app)
      .get('/api/brokerages')
      .expect(200)

    // SnapTrade supports 24+ brokerages
    expect(response.body.data.length).toBeGreaterThanOrEqual(20)
  })
})
