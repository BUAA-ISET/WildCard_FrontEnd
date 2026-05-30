import { apiGet, apiPost } from './request'
import { shouldUseMarketMockApi } from './config'
import defaultAvatarUrl from '../assets/default-avatar.svg'
import wildcardLogoUrl from '../assets/logo.svg'

const SYSTEM_DEVELOPER_ID = 'system'

export function resolveDeveloperAvatar(developer: { id: string; avatar: string }): string {
  if (developer.avatar) {
    return developer.avatar
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
  authorName: string
  authorAvatar: string
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
    coverUrl: '',
    screenshots: [],
    introduction: 'Tiny Demo 是一套短局制规则，强调快速发牌、即时比较和明确结算。它适合作为新玩家熟悉 WildCard 自定义规则流程的入门模板。',
    reviews: [
      {
        id: 'review-1',
        authorName: '测试玩家',
        authorAvatar: defaultAvatarUrl,
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
    coverUrl: '',
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
            authorName: '我',
            authorAvatar: defaultAvatarUrl,
            rating: payload.rating,
            content: payload.content,
            imageUrl: payload.imageUrl,
            createdAt: Date.now(),
          },
        }),
      },
    )
  },
}
