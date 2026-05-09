export const API_CONFIG = {
    BASE_URL: 'http://localhost:3000',
    // 默认保留房间/规则 mock，仅优先打通用户系统
    USE_MOCK: true,
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
            leave: '/api/room/leave',
        }
    }
}

export const getApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.BASE_URL}${endpoint}`
}

export const shouldUseMockApi = (): boolean => API_CONFIG.USE_MOCK
export const shouldUseUserMockApi = (): boolean => API_CONFIG.userUseMock ?? API_CONFIG.USE_MOCK
