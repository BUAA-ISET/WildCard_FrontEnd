import { ref } from 'vue'
import { apiGet, apiPost, apiPut } from './request'
import { API_CONFIG, shouldUseMockApi } from './config'

export interface User {
  id: string
  username: string
  email: string
  avatar: string
}

export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  email: string
  password: string
  username: string
  verificationCode: string
}

export interface UpdatePasswordParams {
  currentPassword: string
  newPassword: string
}

export interface SendVerificationCodeParams {
  email: string
}

type MockAccount = User & {
  password: string
}

type VerificationRecord = {
  code: string
  expiresAt: number
}

type ApiResult<T = undefined> = {
  success: boolean
  data?: T
  message?: string
  debugCode?: string
}

const VERIFICATION_CODE_TTL = 5 * 60 * 1000

const defaultMockAccounts: MockAccount[] = [
  {
    id: '1',
    username: 'testuser',
    email: 'test@mail.com',
    avatar: '',
    password: 'password123',
  },
]

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

function toUser({ password: _password, ...user }: MockAccount): User {
  return { ...user }
}

function buildAccountsMap(accounts: MockAccount[]) {
  return new Map(accounts.map((account) => [normalizeEmail(account.email), account]))
}

function setCurrentUser(user: User | null) {
  currentUser.value = user
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function isUsernameTaken(username: string, excludeEmail?: string) {
  const normalizedUsername = normalizeUsername(username)

  for (const account of mockAccounts.values()) {
    if (excludeEmail && normalizeEmail(account.email) === normalizeEmail(excludeEmail)) {
      continue
    }

    if (normalizeUsername(account.username) === normalizedUsername) {
      return true
    }
  }

  return false
}

function validateVerificationCode(email: string, code: string) {
  const record = verificationCodes.get(email)

  if (!record) {
    return { success: false, message: '请先发送验证码' }
  }

  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(email)
    return { success: false, message: '验证码已过期，请重新发送' }
  }

  if (record.code !== code.trim()) {
    return { success: false, message: '验证码错误' }
  }

  verificationCodes.delete(email)
  return { success: true }
}

const mockAccounts = buildAccountsMap(defaultMockAccounts)
const verificationCodes = new Map<string, VerificationRecord>()
const currentUser = ref<User | null>(null)

export const userApi = {
  async login(params: LoginParams): Promise<ApiResult<User>> {
    return apiPost(API_CONFIG.endpoints.user.login, params, {
      mockDelay: 500,
      mockFn: () => {
        const email = normalizeEmail(params.email)
        const account = mockAccounts.get(email)

        if (!account || account.password !== params.password) {
          return { success: false, message: '邮箱或密码错误' }
        }

        const user = toUser(account)
        setCurrentUser(user)
        return { success: true, data: user }
      },
    })
  },

  async sendVerificationCode(params: SendVerificationCodeParams): Promise<ApiResult> {
    return apiPost(API_CONFIG.endpoints.user.sendVerificationCode, params, {
      mockDelay: 500,
      mockFn: () => {
        const email = normalizeEmail(params.email)

        if (!email) {
          return { success: false, message: '请输入邮箱' }
        }

        if (mockAccounts.has(email)) {
          return { success: false, message: '该邮箱已注册' }
        }

        const code = generateVerificationCode()
        verificationCodes.set(email, {
          code,
          expiresAt: Date.now() + VERIFICATION_CODE_TTL,
        })

        return {
          success: true,
          message: '验证码已发送，请检查邮箱',
          debugCode: shouldUseMockApi() ? code : undefined,
        }
      },
    })
  },

  async register(params: RegisterParams): Promise<ApiResult<User>> {
    return apiPost(API_CONFIG.endpoints.user.register, params, {
      mockDelay: 500,
      mockFn: () => {
        const email = normalizeEmail(params.email)
        const username = params.username.trim()

        if (!email || !params.password || !username || !params.verificationCode.trim()) {
          return { success: false, message: '缺少必填字段' }
        }

        if (mockAccounts.has(email)) {
          return { success: false, message: '该邮箱已注册' }
        }

        if (isUsernameTaken(username)) {
          return { success: false, message: '用户名已存在' }
        }

        const verificationResult = validateVerificationCode(email, params.verificationCode)
        if (!verificationResult.success) {
          return verificationResult
        }

        const account: MockAccount = {
          id: Math.random().toString(36).substring(2, 9),
          username,
          email,
          avatar: '',
          password: params.password,
        }

        mockAccounts.set(email, account)

        const user = toUser(account)
        setCurrentUser(user)
        return { success: true, data: user }
      },
    })
  },

  async logout(): Promise<ApiResult> {
    return apiPost(API_CONFIG.endpoints.user.logout, {}, {
      mockDelay: 200,
      mockFn: () => {
        setCurrentUser(null)
        return { success: true }
      },
    })
  },

  async getCurrentUser(): Promise<ApiResult<User | null>> {
    return apiGet(API_CONFIG.endpoints.user.current, {
      mockDelay: 200,
      mockFn: () => ({ success: true, data: currentUser.value }),
    })
  },

  async updateUsername(newUsername: string): Promise<ApiResult<User>> {
    return apiPut(API_CONFIG.endpoints.user.updateUsername, { username: newUsername }, {
      mockDelay: 300,
      mockFn: () => {
        const username = newUsername.trim()

        if (!username) {
          return { success: false, message: '用户名不能为空' }
        }

        if (!currentUser.value) {
          return { success: false, message: '未登录' }
        }

        if (isUsernameTaken(username, currentUser.value.email)) {
          return { success: false, message: '用户名已存在' }
        }

        const account = mockAccounts.get(normalizeEmail(currentUser.value.email))
        if (!account) {
          return { success: false, message: '用户不存在' }
        }

        account.username = username

        const user = toUser(account)
        setCurrentUser(user)
        return { success: true, data: user }
      },
    })
  },

  async updatePassword(params: UpdatePasswordParams): Promise<ApiResult> {
    return apiPut(API_CONFIG.endpoints.user.updatePassword, params, {
      mockDelay: 300,
      mockFn: () => {
        if (!params.currentPassword || !params.newPassword) {
          return { success: false, message: '请填写所有密码字段' }
        }

        if (!currentUser.value) {
          return { success: false, message: '未登录' }
        }

        const account = mockAccounts.get(normalizeEmail(currentUser.value.email))
        if (!account) {
          return { success: false, message: '用户不存在' }
        }

        if (account.password !== params.currentPassword) {
          return { success: false, message: '当前密码错误' }
        }

        account.password = params.newPassword
        return { success: true, message: '密码更新成功' }
      },
    })
  },
}
