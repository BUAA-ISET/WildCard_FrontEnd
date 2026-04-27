import { ref } from 'vue'

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
}

export interface UpdatePasswordParams {
  currentPassword: string
  newPassword: string
}

const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@mail.com',
  avatar: '',
}

let currentUser = ref<User | null>(null)

export const userApi = {
  async login(params: LoginParams): Promise<{ success: boolean; data?: User; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (params.email && params.password) {
      currentUser.value = { ...mockUser, email: params.email }
      return { success: true, data: currentUser.value }
    }
    return { success: false, message: '邮箱或密码错误' }
  },

  async register(params: RegisterParams): Promise<{ success: boolean; data?: User; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (params.email && params.password && params.username) {
      currentUser.value = {
        id: Math.random().toString(36).substring(2, 9),
        username: params.username,
        email: params.email,
        avatar: '',
      }
      return { success: true, data: currentUser.value }
    }
    return { success: false, message: '缺少必填字段' }
  },

  async logout(): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 200))
    currentUser.value = null
    return { success: true }
  },

  async getCurrentUser(): Promise<{ success: boolean; data?: User | null }> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { success: true, data: currentUser.value }
  },

  async updateUsername(newUsername: string): Promise<{ success: boolean; data?: User; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (!newUsername) {
      return { success: false, message: '用户名不能为空' }
    }
    
    if (currentUser.value) {
      currentUser.value.username = newUsername
      return { success: true, data: currentUser.value }
    }
    return { success: false, message: '未登录' }
  },

  async updatePassword(params: UpdatePasswordParams): Promise<{ success: boolean; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (!params.currentPassword || !params.newPassword) {
      return { success: false, message: '请填写所有密码字段' }
    }
    
    return { success: true, message: '密码更新成功' }
  },

  async updateAvatar(avatarUrl: string): Promise<{ success: boolean; data?: User; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (currentUser.value) {
      currentUser.value.avatar = avatarUrl
      return { success: true, data: currentUser.value }
    }
    return { success: false, message: '未登录' }
  },
}