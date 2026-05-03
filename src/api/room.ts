import { apiPost, apiGet } from './request'
import { API_CONFIG } from './config'
import defaultAvatarUrl from '../assets/default-avatar.svg'
import { scopedStorageKey, USER_STORAGE_KEY } from '../utils/storageNamespace'

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
    joinedAt?: number
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

export const ROOM_STORAGE_KEY = scopedStorageKey('mock-rooms')
const PLAYER_STORAGE_KEY = scopedStorageKey('player-id')
const CURRENT_ROOM_STORAGE_KEY = scopedStorageKey('current-room-code')
const LEGACY_CURRENT_ROOM_STORAGE_KEY = 'currentRoomCode'
const GUEST_NAME_STORAGE_KEY = scopedStorageKey('guest-name')
export const DEFAULT_AVATAR = defaultAvatarUrl

const initialMockRooms: Record<string, Room> = {
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
            { id: 'host1', username: 'HostPlayer', avatar: '', isReady: true, joinedAt: 1 },
        ],
        status: 'waiting',
    },
}

function hasBrowserStorage() {
    return typeof window !== 'undefined' && !!window.localStorage && !!window.sessionStorage
}

function cloneRoom(room: Room): Room {
    return JSON.parse(JSON.stringify(room)) as Room
}

function readRooms(): Record<string, Room> {
    if (!hasBrowserStorage()) {
        return JSON.parse(JSON.stringify(initialMockRooms)) as Record<string, Room>
    }

    const saved = window.localStorage.getItem(ROOM_STORAGE_KEY)
    if (!saved) {
        window.localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(initialMockRooms))
        return JSON.parse(JSON.stringify(initialMockRooms)) as Record<string, Room>
    }

    try {
        return JSON.parse(saved) as Record<string, Room>
    } catch {
        window.localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(initialMockRooms))
        return JSON.parse(JSON.stringify(initialMockRooms)) as Record<string, Room>
    }
}

function writeRooms(rooms: Record<string, Room>) {
    if (!hasBrowserStorage()) {
        return
    }

    window.localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(rooms))
}

function getCurrentPlayerId(): string {
    if (!hasBrowserStorage()) {
        return 'currentUser'
    }

    const existingId = window.sessionStorage.getItem(PLAYER_STORAGE_KEY)
    if (existingId) {
        return existingId
    }

    const newId = `player-${Math.random().toString(36).slice(2, 10)}`
    window.sessionStorage.setItem(PLAYER_STORAGE_KEY, newId)
    return newId
}

function getCurrentRoomCode(): string | null {
    if (!hasBrowserStorage()) {
        return null
    }

    return window.sessionStorage.getItem(CURRENT_ROOM_STORAGE_KEY)
}

function setCurrentRoomCode(code: string) {
    if (!hasBrowserStorage()) {
        return
    }

    window.sessionStorage.setItem(CURRENT_ROOM_STORAGE_KEY, code)
    window.sessionStorage.setItem(LEGACY_CURRENT_ROOM_STORAGE_KEY, code)
}

function clearCurrentRoomCode() {
    if (!hasBrowserStorage()) {
        return
    }

    window.sessionStorage.removeItem(CURRENT_ROOM_STORAGE_KEY)
    window.sessionStorage.removeItem(LEGACY_CURRENT_ROOM_STORAGE_KEY)
}

function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function getRoomByPlayer(rooms: Record<string, Room>, playerId: string): Room | null {
    return Object.values(rooms).find((room) => room.players.some((player) => player.id === playerId)) || null
}

function findNextHostId(players: Player[]): string | null {
    if (players.length === 0) {
        return null
    }

    return [...players]
        .sort((left, right) => (left.joinedAt || 0) - (right.joinedAt || 0))[0]
        .id
}

function isRoomReadyToStart(room: Room): boolean {
    return room.players.length === room.playerCount && room.players.every((player) => player.isReady)
}

function getGuestUsername(): string {
    if (!hasBrowserStorage()) {
        return `guest${Math.floor(1000 + Math.random() * 9000)}`
    }

    const existingGuestName = window.sessionStorage.getItem(GUEST_NAME_STORAGE_KEY)
    if (existingGuestName) {
        return existingGuestName
    }

    const guestName = `guest${Math.floor(1000 + Math.random() * 9000)}`
    window.sessionStorage.setItem(GUEST_NAME_STORAGE_KEY, guestName)
    return guestName
}

function getCachedCurrentUser(): { id: string; username: string; email: string; avatar: string } | null {
    if (!hasBrowserStorage()) {
        return null
    }

    const stored = window.localStorage.getItem(USER_STORAGE_KEY)
    if (!stored) {
        return null
    }

    try {
        return JSON.parse(stored)
    } catch {
        return null
    }
}

function getCurrentPlayerProfile() {
    const currentUser = getCachedCurrentUser()

    return {
        username: currentUser?.username || getGuestUsername(),
        avatar: currentUser?.avatar || DEFAULT_AVATAR,
    }
}

export const roomApi = {
    getCurrentPlayerId,

    async getRuleOptions(): Promise<{ success: boolean; data?: GameRuleOption[]; message?: string }> {
        return apiGet(API_CONFIG.endpoints.room.rules, {
            mockDelay: 200,
            mockFn: () => ({ success: true, data: mockRuleOptions }),
        })
    },

    async createRoom(params: CreateRoomParams): Promise<{ success: boolean; data?: Room; message?: string }> {
        return apiPost(API_CONFIG.endpoints.room.create, params, {
            mockDelay: 500,
            mockFn: () => {
                const selectedRule = mockRuleOptions.find((rule) => rule.id === params.ruleId)
                if (!selectedRule) {
                    return { success: false, message: 'Invalid room rule.' }
                }

                const rooms = readRooms()
                const playerId = getCurrentPlayerId()
                const playerProfile = getCurrentPlayerProfile()
                const now = Date.now()
                const newRoom: Room = {
                    id: Math.random().toString(36).substring(2, 9),
                    code: generateRoomCode(),
                    hostId: playerId,
                    playerCount: selectedRule.playerCount,
                    roundTime: params.roundTime,
                    ruleId: selectedRule.id,
                    ruleName: selectedRule.name,
                    password: params.password || null,
                    players: [
                        {
                            id: playerId,
                            username: playerProfile.username,
                            avatar: playerProfile.avatar,
                            isReady: true,
                            joinedAt: now,
                        },
                    ],
                    status: 'waiting',
                }

                rooms[newRoom.code] = newRoom
                writeRooms(rooms)
                setCurrentRoomCode(newRoom.code)
                return { success: true, data: cloneRoom(newRoom) }
            },
        })
    },

    async joinRoom(params: JoinRoomParams): Promise<{ success: boolean; data?: Room; message?: string }> {
        return apiPost(API_CONFIG.endpoints.room.join, params, {
            mockDelay: 500,
            mockFn: () => {
                const rooms = readRooms()
                const room = rooms[params.code]

                if (!room) {
                    return { success: false, message: 'Room does not exist.' }
                }
                if (room.password && room.password !== params.password) {
                    return { success: false, message: 'Incorrect password.' }
                }
                if (room.status !== 'waiting') {
                    return { success: false, message: 'This room has already started.' }
                }

                const playerId = getCurrentPlayerId()
                const playerProfile = getCurrentPlayerProfile()
                const existingPlayer = room.players.find((player) => player.id === playerId)
                if (!existingPlayer && room.players.length >= room.playerCount) {
                    return { success: false, message: 'Room is full.' }
                }

                if (!existingPlayer) {
                    room.players.push({
                        id: playerId,
                        username: playerProfile.username,
                        avatar: playerProfile.avatar,
                        isReady: false,
                        joinedAt: Date.now(),
                    })
                } else {
                    existingPlayer.username = playerProfile.username
                    existingPlayer.avatar = playerProfile.avatar
                }

                writeRooms(rooms)
                setCurrentRoomCode(room.code)
                return { success: true, data: cloneRoom(room) }
            },
        })
    },

    async checkRoomPassword(code: string): Promise<{ success: boolean; hasPassword: boolean }> {
        return apiGet(API_CONFIG.endpoints.room.checkPassword + `?code=${code}`, {
            mockDelay: 200,
            mockFn: () => {
                const rooms = readRooms()
                const room = rooms[code]
                if (room) {
                    return { success: true, hasPassword: !!room.password }
                }
                return { success: false, hasPassword: false }
            },
        })
    },

    async getCurrentRoom(): Promise<{ success: boolean; data?: Room | null }> {
        return apiGet(API_CONFIG.endpoints.room.getCurrent, {
            mockDelay: 200,
            mockFn: () => {
                const rooms = readRooms()
                const playerId = getCurrentPlayerId()
                const currentCode = getCurrentRoomCode()
                const room = currentCode ? rooms[currentCode] : getRoomByPlayer(rooms, playerId)

                if (!room) {
                    clearCurrentRoomCode()
                    return { success: true, data: null }
                }

                setCurrentRoomCode(room.code)
                return { success: true, data: cloneRoom(room) }
            },
        })
    },

    async getRoomByCode(code: string): Promise<{ success: boolean; data?: Room | null; message?: string }> {
        return apiGet(`${API_CONFIG.endpoints.room.getCurrent}?code=${code}`, {
            mockDelay: 200,
            mockFn: () => {
                const rooms = readRooms()
                const room = rooms[code]
                if (!room) {
                    return { success: false, data: null, message: 'Room does not exist.' }
                }

                return { success: true, data: cloneRoom(room) }
            },
        })
    },

    async setReady(isReady: boolean): Promise<{ success: boolean; data?: Room | null; message?: string }> {
        return apiPost(`${API_CONFIG.endpoints.room.getCurrent}/ready`, { isReady }, {
            mockDelay: 200,
            mockFn: () => {
                const rooms = readRooms()
                const playerId = getCurrentPlayerId()
                const room = getRoomByPlayer(rooms, playerId)

                if (!room) {
                    clearCurrentRoomCode()
                    return { success: false, data: null, message: 'Room does not exist.' }
                }
                if (room.status !== 'waiting') {
                    return { success: false, data: cloneRoom(room), message: 'Game has already started.' }
                }

                const player = room.players.find((item) => item.id === playerId)
                if (!player) {
                    return { success: false, data: null, message: 'Player is not in the room.' }
                }

                player.isReady = isReady
                writeRooms(rooms)
                return { success: true, data: cloneRoom(room) }
            },
        })
    },

    async startGame(): Promise<{ success: boolean; data?: Room | null; message?: string }> {
        return apiPost(`${API_CONFIG.endpoints.room.getCurrent}/start`, {}, {
            mockDelay: 300,
            mockFn: () => {
                const rooms = readRooms()
                const playerId = getCurrentPlayerId()
                const room = getRoomByPlayer(rooms, playerId)

                if (!room) {
                    clearCurrentRoomCode()
                    return { success: false, data: null, message: 'Room does not exist.' }
                }
                if (room.hostId !== playerId) {
                    return { success: false, data: cloneRoom(room), message: 'Only the host can start the game.' }
                }
                if (!isRoomReadyToStart(room)) {
                    return {
                        success: false,
                        data: cloneRoom(room),
                        message: 'The room must be full and every player must be ready.',
                    }
                }

                room.status = 'playing'
                writeRooms(rooms)
                return { success: true, data: cloneRoom(room) }
            },
        })
    },

    async leaveRoom(): Promise<{ success: boolean }> {
        return apiPost(API_CONFIG.endpoints.room.leave, {}, {
            mockDelay: 200,
            mockFn: () => {
                const rooms = readRooms()
                const playerId = getCurrentPlayerId()
                const room = getRoomByPlayer(rooms, playerId)

                if (!room) {
                    clearCurrentRoomCode()
                    return { success: true }
                }

                room.players = room.players.filter((player) => player.id !== playerId)

                if (room.players.length === 0) {
                    delete rooms[room.code]
                } else if (room.hostId === playerId) {
                    room.hostId = findNextHostId(room.players) || room.hostId
                    const nextHost = room.players.find((player) => player.id === room.hostId)
                    if (nextHost) {
                        nextHost.isReady = true
                    }
                }

                writeRooms(rooms)
                clearCurrentRoomCode()
                return { success: true }
            },
        })
    },
}
