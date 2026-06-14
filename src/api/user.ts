import { ref } from 'vue'
import { apiGet, apiPost, apiPut } from './request'
import { API_CONFIG, getApiUrl, shouldUseMockApi, shouldUseUserMockApi } from './config'
import { AUTH_TOKEN_STORAGE_KEY, scopedStorageKey, USER_STORAGE_KEY } from '../utils/storageNamespace'

export interface User {
  id: string
  username: string
  email: string
  avatar: string
  token?: string
  role?: string
}

export interface LoginParams {
  // accepts either an email (contains '@') or a username; field name kept for backend wire compatibility
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

export interface UpdateEmailParams {
  newEmail: string
  verificationCode: string
}

export interface SendVerificationCodeParams {
  email: string
}

export interface PasswordResetParams {
  email: string
  verificationCode: string
  newPassword: string
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

type BackendUser = {
  id: string
  username: string
  email: string
  avatar?: string
  token?: string
  role?: string
}

const VERIFICATION_CODE_TTL = 5 * 60 * 1000

const defaultMockAccounts: MockAccount[] = [
  {
    id: '1',
    username: 'testuser',
    email: 'test@mail.com',
    avatar: '',
    password: 'password123',
    role: 'admin',
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

const MOCK_ACCOUNTS_STORAGE_KEY = scopedStorageKey('mock-accounts')

function loadMockAccountsFromStorage(): MockAccount[] {
  try {
    const stored = localStorage.getItem(MOCK_ACCOUNTS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load mock accounts from storage:', e)
  }
  return defaultMockAccounts
}

function saveMockAccountsToStorage(): void {
  try {
    localStorage.setItem(MOCK_ACCOUNTS_STORAGE_KEY, JSON.stringify(Array.from(mockAccounts.values())))
  } catch (e) {
    console.error('Failed to save mock accounts to storage:', e)
  }
}

const mockAccounts = buildAccountsMap(loadMockAccountsFromStorage())
const verificationCodes = new Map<string, VerificationRecord>()

function loadUserFromStorage(): User | null {
  try {
    const stored = sessionStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem(USER_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load user from storage:', e)
  }
  return null
}

function saveUserToStorage(user: User | null): void {
  try {
    if (user) {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  } catch (e) {
    console.error('Failed to save user to storage:', e)
  }
}

function saveAuthToken(token: string | null | undefined): void {
  try {
    if (token) {
      sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    } else {
      sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    }
  } catch (e) {
    console.error('Failed to save auth token:', e)
  }
}

const currentUser = ref<User | null>(loadUserFromStorage())

function setCurrentUser(user: User | null) {
  currentUser.value = user
  saveUserToStorage(user)
  saveAuthToken(user?.token)
}

function normalizeBackendUser(user: BackendUser | null | undefined): User | null {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar || '',
    token: user.token,
    role: user.role,
  }
}

export const userApi = {
  async login(params: LoginParams): Promise<ApiResult<User>> {
    return apiPost(API_CONFIG.endpoints.user.login, params, {
      useMock: shouldUseUserMockApi(),
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
    }).then((result: ApiResult<BackendUser | User>) => {
      if (!result.success) {
        return result as ApiResult<User>
      }

      const user = normalizeBackendUser(result.data as BackendUser) || (result.data as User | undefined)
      if (user) {
        setCurrentUser(user)
      }

      return {
        ...result,
        data: user || undefined,
      }
    })
  },

  async sendVerificationCode(params: SendVerificationCodeParams): Promise<ApiResult> {
    return apiPost(API_CONFIG.endpoints.user.sendVerificationCode, params, {
      useMock: shouldUseUserMockApi(),
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
      useMock: shouldUseUserMockApi(),
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
        saveMockAccountsToStorage()

        const user = toUser(account)
        setCurrentUser(user)
        return { success: true, data: user }
      },
    }).then((result: ApiResult<BackendUser | User>) => {
      if (!result.success) {
        return result as ApiResult<User>
      }

      const user = normalizeBackendUser(result.data as BackendUser) || (result.data as User | undefined)
      if (user) {
        setCurrentUser(user)
      }

      return {
        ...result,
        data: user || undefined,
      }
    })
  },

  async logout(): Promise<ApiResult> {
    return apiPost(API_CONFIG.endpoints.user.logout, {}, {
      useMock: shouldUseUserMockApi(),
      mockDelay: 200,
      mockFn: () => {
        setCurrentUser(null)
        return { success: true }
      },
    }).then((result: ApiResult) => {
      if (result.success) {
        setCurrentUser(null)
        saveAuthToken(null)
      }
      return result
    })
  },

  async getCurrentUser(): Promise<ApiResult<User | null>> {
    return apiGet(API_CONFIG.endpoints.user.current, {
      useMock: shouldUseUserMockApi(),
      mockDelay: 200,
      mockFn: () => ({ success: true, data: currentUser.value }),
    }).then((result: ApiResult<BackendUser | User | null>) => {
      if (!result.success) {
        return result as ApiResult<User | null>
      }

      const user = normalizeBackendUser(result.data as BackendUser | null) ?? (result.data as User | null | undefined) ?? null
      setCurrentUser(user)
      return {
        ...result,
        data: user,
      }
    })
  },

  async updateUsername(newUsername: string): Promise<ApiResult<User>> {
    return apiPut(API_CONFIG.endpoints.user.updateUsername, { username: newUsername }, {
      useMock: shouldUseUserMockApi(),
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
        saveMockAccountsToStorage()

        const user = toUser(account)
        setCurrentUser(user)
        return { success: true, data: user }
      },
    }).then((result: ApiResult<BackendUser | User>) => {
      if (!result.success) {
        return result as ApiResult<User>
      }

      const user = normalizeBackendUser(result.data as BackendUser) || (result.data as User | undefined)
      if (user) {
        setCurrentUser(user)
      }

      return {
        ...result,
        data: user || undefined,
      }
    })
  },

  async updatePassword(params: UpdatePasswordParams): Promise<ApiResult> {
    return apiPut(API_CONFIG.endpoints.user.updatePassword, params, {
      useMock: shouldUseUserMockApi(),
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
        saveMockAccountsToStorage()
        return { success: true, message: '密码更新成功' }
      },
    })
  },

  async updateEmail(params: UpdateEmailParams): Promise<ApiResult<User>> {
    return apiPut(API_CONFIG.endpoints.user.updateEmail, params, {
      useMock: shouldUseUserMockApi(),
      mockDelay: 300,
      mockFn: () => {
        const newEmail = normalizeEmail(params.newEmail)
        if (!newEmail || !params.verificationCode.trim()) {
          return { success: false, message: '请填写新邮箱和验证码' }
        }
        if (!currentUser.value) {
          return { success: false, message: '未登录' }
        }
        if (currentUser.value.email === newEmail) {
          return { success: false, message: '新邮箱与当前邮箱相同' }
        }
        const verificationResult = validateVerificationCode(newEmail, params.verificationCode)
        if (!verificationResult.success) {
          return verificationResult
        }
        if (mockAccounts.has(newEmail)) {
          return { success: false, message: '该邮箱已被占用' }
        }
        const oldEmail = currentUser.value.email
        const account = mockAccounts.get(oldEmail)
        if (account) {
          mockAccounts.delete(oldEmail)
          account.email = newEmail
          mockAccounts.set(newEmail, account)
          saveMockAccountsToStorage()
        }
        currentUser.value = { ...currentUser.value, email: newEmail }
        saveUserToStorage(currentUser.value)
        return { success: true, data: currentUser.value }
      },
    })
  },

  async uploadAvatar(file: File): Promise<ApiResult<User>> {
    if (shouldUseUserMockApi()) {
      if (!currentUser.value) {
        return { success: false, message: '未登录' }
      }
      const reader = new FileReader()
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      currentUser.value = { ...currentUser.value, avatar: dataUrl }
      saveUserToStorage(currentUser.value)
      return { success: true, data: currentUser.value }
    }

    const form = new FormData()
    form.append('file', file)
    const url = getApiUrl(API_CONFIG.endpoints.user.updateAvatar)
    const token = (() => {
      if (typeof window === 'undefined') return ''
      try {
        return (
          window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
          window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
          ''
        )
      } catch {
        return ''
      }
    })()
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
          message:
            (result as { message?: string }).message ||
            `Request failed with status ${response.status}`,
        }
      }
      return result as ApiResult<User>
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : '网络请求失败',
      }
    }
  },

  async sendPasswordResetCode(params: SendVerificationCodeParams): Promise<ApiResult> {
    return apiPost(API_CONFIG.endpoints.user.passwordResetCode, params, {
      useMock: shouldUseUserMockApi(),
      mockDelay: 300,
      mockFn: () => {
        const email = normalizeEmail(params.email)
        if (!email) {
          return { success: false, message: '请输入邮箱' }
        }
        if (!mockAccounts.has(email)) {
          return { success: false, message: '该邮箱未注册' }
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const record: VerificationRecord = {
          code,
          expiresAt: Date.now() + VERIFICATION_CODE_TTL,
        }
        verificationCodes.set(email, record)
        return { success: true, message: '验证码已生成', debugCode: code }
      },
    })
  },

  async resetPassword(params: PasswordResetParams): Promise<ApiResult> {
    return apiPost(API_CONFIG.endpoints.user.passwordReset, params, {
      useMock: shouldUseUserMockApi(),
      mockDelay: 300,
      mockFn: () => {
        const email = normalizeEmail(params.email)
        if (!email || !params.verificationCode.trim() || !params.newPassword) {
          return { success: false, message: '请填写完整' }
        }
        const account = mockAccounts.get(email)
        if (!account) {
          return { success: false, message: '该邮箱未注册' }
        }
        const verificationResult = validateVerificationCode(email, params.verificationCode)
        if (!verificationResult.success) {
          return verificationResult
        }
        account.password = params.newPassword
        saveMockAccountsToStorage()
        return { success: true, message: '密码已重置' }
      },
    })
  },
}
