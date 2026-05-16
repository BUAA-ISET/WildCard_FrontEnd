import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExportedRuleDesign } from '../../types/ruleBuilder'
import { ruleApi } from '../rule'

const originalFetch = globalThis.fetch

const design: ExportedRuleDesign = {
  classes: {
    card: {
      default_properties: {
        point: { type: 'enum', default: 14, config: [{ display: 'A', value: 14 }] },
      },
      user_properties: {},
      methods: {},
    },
  },
  cardsets: {},
  cardset_comparisons: {},
  match_flow: {},
  end_flow: {},
}

describe('ruleApi', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('sends create draft requests with rule metadata and exported design', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: 'draft-001', updatedAt: 123 } })),
    )
    globalThis.fetch = fetchMock

    const result = await ruleApi.createDraft({
      name: 'Tiny Demo',
      playerCount: 2,
      description: 'demo',
      design,
    })

    expect(result.success).toBe(true)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      name: 'Tiny Demo',
      playerCount: 2,
      description: 'demo',
      design,
    })
    expect(window.localStorage.getItem('wildcard-rule-design-draft')).toBe(JSON.stringify(design))
  })

  it('encodes draft ids for update, publish, get and delete requests', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { id: 'draft 001', updatedAt: 124 } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { ruleId: 'rule-001', version: 1 } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { id: 'draft 001', name: 'Tiny Demo', playerCount: 2, description: '', status: 'draft', updatedAt: 1, createdAt: 1, design } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { id: 'draft 001', name: 'Tiny Demo', playerCount: 2, description: '', status: 'draft', updatedAt: 1 } })))
    globalThis.fetch = fetchMock

    await ruleApi.updateDraft('draft 001', { name: 'Tiny Demo', playerCount: 2, description: '', design })
    await ruleApi.publishDraft('draft 001')
    await ruleApi.getDraft('draft 001')
    await ruleApi.deleteDraft('draft 001')

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      expect.stringContaining('/api/rules/drafts/draft%20001'),
      expect.stringContaining('/api/rules/drafts/draft%20001/publish'),
      expect.stringContaining('/api/rules/drafts/draft%20001'),
      expect.stringContaining('/api/rules/drafts/draft%20001'),
    ])
    expect(fetchMock.mock.calls.map((call) => call[1].method)).toEqual(['PUT', 'POST', 'GET', 'DELETE'])
  })

  it('publishes a saved draft and returns both draft and rule ids', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { id: 'draft-001', updatedAt: 1 } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { ruleId: 'rule-001', version: 1 } })))

    await expect(ruleApi.saveRuleDesign({
      name: 'Tiny Demo',
      playerCount: 2,
      description: '',
      design,
    })).resolves.toEqual({
      success: true,
      data: {
        draftId: 'draft-001',
        ruleId: 'rule-001',
      },
    })
  })

  it('returns a failure when draft creation succeeds but publishing fails', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { id: 'draft-001', updatedAt: 1 } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false, message: 'invalid rule' })))

    await expect(ruleApi.saveRuleDesign({
      name: 'Tiny Demo',
      playerCount: 2,
      description: '',
      design,
    })).resolves.toEqual({
      success: false,
      message: 'invalid rule',
    })
  })
})
