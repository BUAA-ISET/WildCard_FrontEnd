import { apiPost, apiGet } from './request'
import { API_CONFIG } from './config'

export interface Room {
    id: string
    code: string
    hostId: string
    playerCount: number
    roundTime: number
    ruleId: string
    ruleName: string
    password: string | null
    players: Player[]
    status: 'waiting' | 'playing' | 'finished'
}

export interface Player {
    id: string
    username: string
    avatar: string
    isReady: boolean
}

export interface CreateRoomParams {
    ruleId: string
    roundTime: number
    password?: string
}

export interface JoinRoomParams {
    code: string
    password?: string
}

export interface GameRuleOption {
    id: string
    name: string
    playerCount: number
    description?: string
}

const mockRuleOptions: GameRuleOption[] = [
    {
        id: 'classic',
        name: 'Classic Rules',
        playerCount: 4,
        description: '4 players, standard wildcard flow.',
    },
    {
        id: 'party',
        name: 'Party Rules',
        playerCount: 6,
        description: '6 players, faster and more chaotic.',
    },
]

const mockRooms: Record<string, Room> = {
    '123456': {
        id: '1',
        code: '123456',
        hostId: 'host1',
        playerCount: 4,
        roundTime: 30,
        ruleId: 'classic',
        ruleName: 'Classic Rules',
        password: 'abc123',
        players: [
            { id: 'host1', username: 'HostPlayer', avatar: '', isReady: true },
        ],
        status: 'waiting',
    },
}

let currentRoom: Room | null = null

function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const roomApi = {
    async getRuleOptions(): Promise<{ success: boolean; data?: GameRuleOption[]; message?: string }> {
        return apiGet(API_CONFIG.endpoints.room.rules, {
            mockDelay: 200,
            mockFn: () => {
                return { success: true, data: mockRuleOptions }
            }
        })
    },

    async createRoom(params: CreateRoomParams): Promise<{ success: boolean; data?: Room; message?: string }> {
        return apiPost(API_CONFIG.endpoints.room.create, params, {
            mockDelay: 500,
            mockFn: () => {
                const selectedRule = mockRuleOptions.find(rule => rule.id === params.ruleId)
                if (!selectedRule) {
                    return { success: false, message: 'Invalid room rule.' }
                }

                const newRoom: Room = {
                    id: Math.random().toString(36).substring(2, 9),
                    code: generateRoomCode(),
                    hostId: 'currentUser',
                    playerCount: selectedRule.playerCount,
                    roundTime: params.roundTime,
                    ruleId: selectedRule.id,
                    ruleName: selectedRule.name,
                    password: params.password || null,
                    players: [
                        { id: 'currentUser', username: 'You', avatar: '', isReady: true },
                    ],
                    status: 'waiting',
                }
                mockRooms[newRoom.code] = newRoom
                currentRoom = newRoom
                return { success: true, data: newRoom }
            }
        })
    },

    async joinRoom(params: JoinRoomParams): Promise<{ success: boolean; data?: Room; message?: string }> {
        return apiPost(API_CONFIG.endpoints.room.join, params, {
            mockDelay: 500,
            mockFn: () => {
                const room = mockRooms[params.code]
                if (!room) {
                    return { success: false, message: '房间不存在' }
                }
                if (room.password && room.password !== params.password) {
                    return { success: false, message: '密码错误' }
                }
                if (room.players.length >= room.playerCount) {
                    return { success: false, message: '房间已满' }
                }
                room.players.push({
                    id: 'currentUser',
                    username: 'You',
                    avatar: '',
                    isReady: false,
                })
                currentRoom = room
                return { success: true, data: room }
            }
        })
    },

    async checkRoomPassword(code: string): Promise<{ success: boolean; hasPassword: boolean }> {
        return apiGet(API_CONFIG.endpoints.room.checkPassword + `?code=${code}`, {
            mockDelay: 200,
            mockFn: () => {
                const room = mockRooms[code]
                if (room) {
                    return { success: true, hasPassword: !!room.password }
                }
                return { success: false, hasPassword: false }
            }
        })
    },

    async getCurrentRoom(): Promise<{ success: boolean; data?: Room | null }> {
        return apiGet(API_CONFIG.endpoints.room.getCurrent, {
            mockDelay: 200,
            mockFn: () => {
                return { success: true, data: currentRoom }
            }
        })
    },

    async leaveRoom(): Promise<{ success: boolean }> {
        return apiPost(API_CONFIG.endpoints.room.leave, {}, {
            mockDelay: 200,
            mockFn: () => {
                currentRoom = null
                return { success: true }
            }
        })
    },
}
