const PRODUCTION_API_BASE_URL = 'http://69.197.183.145:3000'

const isProductionHost = (host: string): boolean => {
    return host === 'isetwildcard.me' || host.endsWith('.github.io')
}

const resolveBaseUrl = (): string => {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
    if (configuredBaseUrl) {
        return configuredBaseUrl
    }

    if (typeof window !== 'undefined') {
        const host = window.location.hostname
        // 生产部署（GH Pages 自定义域名 / *.github.io）没有同主机 BE，
        // 固定指向中央开发服。本地与 dev 公网 IP 沿用原行为。
        if (isProductionHost(host)) {
            return PRODUCTION_API_BASE_URL
        }
        return `${window.location.protocol}//${host}:3000`
    }

    return 'http://localhost:3000'
}

export const API_CONFIG = {
    BASE_URL: resolveBaseUrl(),
    // 规则保存、房间创建和开局需要后端规则引擎解析，因此默认走真实后端。
    USE_MOCK: false,

    userUseMock: false,
    roomUseMock: false,
    gameUseMock: false,

    endpoints: {
        user: {
            login: '/api/user/login',
            register: '/api/user/register',
            sendVerificationCode: '/api/user/send-code',
            passwordResetCode: '/api/user/password-reset-code',
            passwordReset: '/api/user/password-reset',
            logout: '/api/user/logout',
            current: '/api/user/current',
            updateUsername: '/api/user/username',
            updatePassword: '/api/user/password',
            updateEmail: '/api/user/email',
            updateAvatar: '/api/user/avatar',
        },
        room: {
            create: '/api/room/create',
            rules: '/api/room/rules',
            join: '/api/room/join',
            checkPassword: '/api/room/check-password',
            getCurrent: '/api/room/current',
            getRule: '/api/room/rule/get',
            leave: '/api/room/leave',
        },
        game: {
            getCurrent: '/api/games/current',
        }
    }
}

export const getApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.BASE_URL}${endpoint}`
}

export const shouldUseMockApi = (): boolean => API_CONFIG.USE_MOCK
export const shouldUseUserMockApi = (): boolean => API_CONFIG.userUseMock ?? API_CONFIG.USE_MOCK
export const shouldUseRoomMockApi = (): boolean => API_CONFIG.roomUseMock ?? API_CONFIG.USE_MOCK
export const shouldUseGameMockApi = (): boolean => API_CONFIG.gameUseMock ?? API_CONFIG.USE_MOCK

