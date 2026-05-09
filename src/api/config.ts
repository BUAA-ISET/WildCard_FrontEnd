export const API_CONFIG = {
    BASE_URL: 'http://localhost:3000',
    // 默认保留规则 mock，优先联通用户/房间/对局真实后端
    USE_MOCK: true,
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
