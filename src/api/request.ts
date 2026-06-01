import { getApiUrl, shouldUseMockApi } from './config'
import { AUTH_TOKEN_STORAGE_KEY } from '../utils/storageNamespace'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
    method?: RequestMethod
    body?: any
    useMock?: boolean
    mockDelay?: number
    mockFn?: () => any
    headers?: Record<string, string>
}

const DEFAULT_MOCK_DELAY = 300

function getAuthToken() {
    if (typeof window === 'undefined') {
        return ''
    }

    try {
        return window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
            || window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
            || ''
    } catch {
        return ''
    }
}

/**
 * Simplified API request function
 * @param endpoint - API endpoint path
 * @param options - Request options
 */
export async function apiRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const {
        method = 'GET',
        body,
        useMock = shouldUseMockApi(),
        mockDelay = DEFAULT_MOCK_DELAY,
        mockFn,
        headers = {}
    } = options

    if (useMock) {
        if (mockFn) {
            await new Promise(resolve => setTimeout(resolve, mockDelay))
            return mockFn() as T
        }

        await new Promise(resolve => setTimeout(resolve, mockDelay))
        return { success: true } as T
    }

    const url = getApiUrl(endpoint)
    const token = getAuthToken()
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    }

    if (token && endpoint !== '/api/user/register' && !requestHeaders.Authorization) {
        requestHeaders.Authorization = `Bearer ${token}`
    }

    let response: Response
    try {
        response = await fetch(url, {
            method,
            credentials: 'omit',
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        })
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : '网络请求失败'
        } as T
    }


    const text = await response.text()
    const result = text ? JSON.parse(text) : {}

    if (!response.ok && typeof result === 'object' && result !== null) {
        return {
            success: false,
            message: (result as { message?: string }).message || `Request failed with status ${response.status}`
        } as T
    }

    return result
}

export async function apiGet<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method'> = {}
): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'GET' })
}

export async function apiPost<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'POST', body })
}

export async function apiPut<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'PUT', body })
}

export async function apiDelete<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method'> = {}
): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
}
