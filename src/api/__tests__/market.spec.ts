import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost } from '../request'
import { marketApi, resolveDeveloperAvatar } from '../market'

vi.mock('../request', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

describe('marketApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists published rules through the real backend endpoint with encoded filters', async () => {
    vi.mocked(apiGet).mockResolvedValue({ success: true, data: [] })

    await marketApi.listPublishedRules({ keyword: 'War & Duel', type: '对战' })

    expect(apiGet).toHaveBeenCalledWith(
      '/api/rules/published?keyword=War+%26+Duel&type=%E5%AF%B9%E6%88%98',
      expect.objectContaining({ useMock: false }),
    )
  })

  it('loads detail, developer rules, rooms, reviews, and fork endpoints with encoded ids', async () => {
    vi.mocked(apiGet).mockResolvedValue({ success: true, data: [] })
    vi.mocked(apiPost).mockResolvedValue({ success: true, data: {} })

    await marketApi.getPublishedRuleDetail('rule/with space')
    await marketApi.listDeveloperRules('dev/with space', { keyword: 'Tiny Demo' })
    await marketApi.listRuleRooms('rule/with space')
    await marketApi.postRuleReview('rule/with space', { rating: 5, content: 'Nice' })
    await marketApi.forkRule('rule/with space', 'My Fork')

    expect(apiGet).toHaveBeenNthCalledWith(
      1,
      '/api/rules/published/rule%2Fwith%20space',
      expect.objectContaining({ useMock: false }),
    )
    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      '/api/rules/developers/dev%2Fwith%20space/rules?keyword=Tiny+Demo',
      expect.objectContaining({ useMock: false }),
    )
    expect(apiGet).toHaveBeenNthCalledWith(
      3,
      '/api/rules/published/rule%2Fwith%20space/rooms',
      expect.objectContaining({ useMock: false }),
    )
    expect(apiPost).toHaveBeenNthCalledWith(
      1,
      '/api/rules/published/rule%2Fwith%20space/reviews',
      { rating: 5, content: 'Nice' },
      expect.objectContaining({ useMock: false }),
    )
    expect(apiPost).toHaveBeenNthCalledWith(
      2,
      '/api/rules/published/rule%2Fwith%20space/fork',
      { name: 'My Fork' },
      expect.objectContaining({ useMock: false }),
    )
  })
})

describe('resolveDeveloperAvatar', () => {
  it('keeps explicit developer avatars', () => {
    expect(resolveDeveloperAvatar({ id: 'dev-1', avatar: '/avatar.png' })).toBe('/avatar.png')
  })

  it('uses the WildCard logo for the system developer and the default avatar otherwise', () => {
    const systemAvatar = resolveDeveloperAvatar({ id: 'system', avatar: '' })
    const regularAvatar = resolveDeveloperAvatar({ id: 'dev-1', avatar: '' })

    expect(systemAvatar).toBeTruthy()
    expect(regularAvatar).toBeTruthy()
    expect(systemAvatar).not.toBe(regularAvatar)
  })
})
