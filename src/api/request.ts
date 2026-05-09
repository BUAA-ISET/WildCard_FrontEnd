import { getApiUrl, shouldUseMockApi } from './config'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
    method?: RequestMethod
    body?: any
    useMock?: boolean
    mockDelay?: number
    mockFn?: () => any
}

const DEFAULT_MOCK_DELAY = 300

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
        mockFn
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
    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    })

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
