export const API_CONFIG = {
    BASE_URL: 'http://81.70.231.146:3000',
    // 规则保存、房间创建和开局需要后端规则引擎解析，因此默认走真实后端。
    USE_MOCK: false,
    userUseMock: false,

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
        }
    }
}

export const getApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.BASE_URL}${endpoint}`
}

export const shouldUseMockApi = (): boolean => API_CONFIG.USE_MOCK
export const shouldUseUserMockApi = (): boolean => API_CONFIG.userUseMock ?? API_CONFIG.USE_MOCK
