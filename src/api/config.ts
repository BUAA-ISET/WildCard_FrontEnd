const resolveBaseUrl = (): string => {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
    if (configuredBaseUrl) {
        return configuredBaseUrl
    }

    if (typeof window !== 'undefined') {
        return `${window.location.protocol}//${window.location.hostname}:3000`
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

