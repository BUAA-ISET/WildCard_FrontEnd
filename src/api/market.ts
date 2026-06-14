import { apiGet, apiPost } from './request'
import { getApiUrl, shouldUseMarketMockApi } from './config'
import { AUTH_TOKEN_STORAGE_KEY } from '../utils/storageNamespace'
import defaultAvatarUrl from '../assets/default-avatar.svg'
import wildcardLogoUrl from '../assets/logo.svg'
import { resolveAvatarUrl } from '../utils/avatar'

const SYSTEM_DEVELOPER_ID = 'system'

export function resolveDeveloperAvatar(developer: { id: string; avatar: string }): string {
  if (developer.avatar) {
    return resolveAvatarUrl(developer.avatar)
  }
  if (developer.id === SYSTEM_DEVELOPER_ID) {
    return wildcardLogoUrl
  }
  return defaultAvatarUrl
}

export interface MarketDeveloper {
  id: string
  name: string
  avatar: string
  bio?: string
}

export interface PublishedRuleSummary {
  id: string
  name: string
  description: string
  type: string
  developer: MarketDeveloper
  rating: number
  reviewCount: number
  publishedAt: number
  coverUrl?: string
}

export interface RuleReview {
  id: string
  author?: {
    id: string
    name: string
    avatar: string
  }
  /** @deprecated Backend must return author.avatar. */
  authorName?: string
  /** @deprecated Backend must return author.avatar. */
  authorAvatar?: string
  rating: number
  content: string
  imageUrl?: string
  createdAt: number
}

export interface PublishedRuleDetail extends PublishedRuleSummary {
  introduction: string
  screenshots: string[]
  reviews: RuleReview[]
}

export interface RuleRoom {
  id: string
  code: string
  hostName: string
  currentPlayers: number
  maxPlayers: number
  hasPassword: boolean
  status: 'waiting' | 'playing'
}

interface ApiResult<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

export interface ForkRuleResponse {
  id: string
  status: 'draft' | 'published'
  updatedAt: number
}

interface RuleQueryParams {
  keyword?: string
  type?: string
}

interface ReviewPayload {
  rating: number
  content: string
  imageUrl?: string
}

const useMarketMock = shouldUseMarketMockApi()

const mockDeveloper: MarketDeveloper = {
  id: 'dev-demo',
  name: 'WildCard Studio',
  avatar: defaultAvatarUrl,
  bio: '专注于轻量桌游规则和快速联机体验。',
}

const mockRules: PublishedRuleDetail[] = [
  {
    id: 'builtin-test2-rule',
    name: 'Tiny Demo',
    description: '双人快速对局规则，适合测试出牌、结算和房间流程。',
    type: '对战',
    developer: mockDeveloper,
    rating: 4.6,
    reviewCount: 18,
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    coverUrl: wildcardLogoUrl,
    screenshots: [wildcardLogoUrl, defaultAvatarUrl],
    introduction: 'Tiny Demo 是一套短局制规则，强调快速发牌、即时比较和明确结算。它适合作为新玩家熟悉 WildCard 自定义规则流程的入门模板。',
    reviews: [
      {
        id: 'review-1',
        author: {
          id: 'mock-reviewer',
          name: '测试玩家',
          avatar: '',
        },
        rating: 5,
        content: '节奏很快，适合用来验证房间和对局流程。',
        createdAt: Date.now() - 1000 * 60 * 60 * 12,
      },
    ],
  },
  {
    id: 'builtin-test-rule',
    name: 'Duel Demo',
    description: '面向双人博弈的经典示例规则，包含更完整的胜负判断。',
    type: '策略',
    developer: {
      id: 'dev-rule-lab',
      name: 'Rule Lab',
      avatar: defaultAvatarUrl,
      bio: '探索可视化规则构建的更多可能。',
    },
    rating: 4.3,
    reviewCount: 11,
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    coverUrl: wildcardLogoUrl,
    screenshots: [],
    introduction: 'Duel Demo 保留了双人对抗的核心结构，并用更完整的流程演示规则构建器导出的运行逻辑。',
    reviews: [],
  },
]

function filterRules(rules: PublishedRuleSummary[], params: RuleQueryParams = {}) {
  const keyword = params.keyword?.trim().toLowerCase()
  return rules.filter((rule) => {
    const matchesKeyword = !keyword
      || rule.name.toLowerCase().includes(keyword)
      || rule.developer.name.toLowerCase().includes(keyword)
    const matchesType = !params.type || rule.type === params.type
    return matchesKeyword && matchesType
  })
}

function buildQuery(params: RuleQueryParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.keyword) {
    searchParams.set('keyword', params.keyword)
  }
  if (params.type) {
    searchParams.set('type', params.type)
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export function getReviewAuthor(review: RuleReview) {
  return review.author || {
    id: '',
    name: review.authorName || '',
    avatar: review.authorAvatar || '',
  }
}

export const marketApi = {
  async listPublishedRules(params: RuleQueryParams = {}): Promise<ApiResult<PublishedRuleSummary[]>> {
    return apiGet<ApiResult<PublishedRuleSummary[]>>(`/api/rules/published${buildQuery(params)}`, {
      useMock: useMarketMock,
      mockFn: () => ({ success: true, data: filterRules(mockRules, params) }),
    })
  },

  async getPublishedRuleDetail(ruleId: string): Promise<ApiResult<PublishedRuleDetail>> {
    return apiGet<ApiResult<PublishedRuleDetail>>(`/api/rules/published/${encodeURIComponent(ruleId)}`, {
      useMock: useMarketMock,
      mockFn: () => ({
        success: true,
        data: mockRules.find((rule) => rule.id === ruleId) || mockRules[0],
      }),
    })
  },

  async listDeveloperRules(developerId: string, params: Pick<RuleQueryParams, 'keyword'> = {}): Promise<ApiResult<PublishedRuleSummary[]>> {
    return apiGet<ApiResult<PublishedRuleSummary[]>>(
      `/api/rules/developers/${encodeURIComponent(developerId)}/rules${buildQuery(params)}`,
      {
        useMock: useMarketMock,
        mockFn: () => ({
          success: true,
          data: filterRules(
            mockRules.filter((rule) => rule.developer.id === developerId),
            params,
          ),
        }),
      },
    )
  },

  async listRuleRooms(ruleId: string): Promise<ApiResult<RuleRoom[]>> {
    return apiGet<ApiResult<RuleRoom[]>>(`/api/rules/published/${encodeURIComponent(ruleId)}/rooms`, {
      useMock: useMarketMock,
      mockFn: () => ({
        success: true,
        data: [
          {
            id: 'room-demo-1',
            code: 'A1B2C3',
            hostName: '房主A',
            currentPlayers: 1,
            maxPlayers: 2,
            hasPassword: false,
            status: 'waiting',
          },
          {
            id: 'room-demo-2',
            code: 'D4E5F6',
            hostName: '房主B',
            currentPlayers: 2,
            maxPlayers: 2,
            hasPassword: true,
            status: 'playing',
          },
        ],
      }),
    })
  },

  async postRuleReview(ruleId: string, payload: ReviewPayload): Promise<ApiResult<RuleReview>> {
    return apiPost<ApiResult<RuleReview>>(
      `/api/rules/published/${encodeURIComponent(ruleId)}/reviews`,
      payload,
      {
        useMock: useMarketMock,
        mockFn: () => ({
          success: true,
          data: {
            id: `review-${Date.now()}`,
            author: {
              id: 'current-user',
              name: '我',
              avatar: '',
            },
            rating: payload.rating,
            content: payload.content,
            imageUrl: payload.imageUrl,
            createdAt: Date.now(),
          },
        }),
      },
    )
  },

  async forkRule(ruleId: string, name: string): Promise<ApiResult<ForkRuleResponse>> {
    return apiPost<ApiResult<ForkRuleResponse>>(
      `/api/rules/published/${encodeURIComponent(ruleId)}/fork`,
      { name },
      {
        useMock: useMarketMock,
        mockFn: () => ({
          // Mock 模式下不返伪造的 draftId——跳到 /creation-center/{id} 会拉不到草稿。
          // 主动返失败，避免给用户造成"成功但页面 404"的误解。
          success: false,
          message: 'Fork 在 mock 模式下不可用，请关闭 marketUseMock 后重试',
        }),
      },
    )
  },

  /**
   * 把图片 multipart 上传到 BE，拿到一个短 URL（/static/review-images/<uuid>.<ext>）
   * 再用这个 URL 作为 createReview 的 imageUrl 字段。
   * 之前的实现是把图片 base64 dataURL 直接塞进 imageUrl，会撞 DB 的 VARCHAR(512) 限制。
   */
  async uploadReviewImage(file: File): Promise<ApiResult<{ imageUrl: string }>> {
    if (useMarketMock) {
      // mock 模式回退为 dataURL，仅供本地预览。
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      return { success: true, data: { imageUrl: dataUrl } }
    }

    const form = new FormData()
    form.append('file', file)
    const url = getApiUrl('/api/rules/reviews/images')
    const token =
      (typeof window !== 'undefined' &&
        (window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
          window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY))) ||
      ''
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'omit',
        headers,
        body: form,
      })
      const text = await response.text()
      const result = text ? JSON.parse(text) : {}
      if (!response.ok) {
        return {
          success: false,
          message: result?.message || `上传失败 (HTTP ${response.status})`,
        }
      }
      return result
    } catch (err) {
      console.warn('[marketApi.uploadReviewImage] request failed', err)
      return { success: false, message: '图片上传失败，请稍后重试' }
    }
  },
}
