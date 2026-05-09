import { apiGet, apiPost } from './request'
import { API_CONFIG, shouldUseRoomMockApi } from './config'
import defaultAvatarUrl from '../assets/default-avatar.svg'
import { scopedStorageKey, USER_STORAGE_KEY } from '../utils/storageNamespace'
import type { RoomRuleResponse } from '../utils/cardPlayRules'

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

type RoomResult<T> = {
    success: boolean
    data?: T
    message?: string
}

type BackendPlayer = Partial<Player> & {
    is_ready?: boolean
    joined_at?: number
}

type BackendRoom = Partial<Room> & {
    host_id?: string
    player_count?: number
    round_time?: number
    rule_id?: string
    rule_name?: string
    players?: BackendPlayer[]
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

const mockRoomRules: Record<string, RoomRuleResponse['rule']> = {
    classic: {
        name: 'standard-game',
        player_count: 4,
        classes: {},
        cardsets: {
            '1': {
                name: '任意出牌',
                properties: {},
                build_flow: {
                    '1': {
                        type: 28,
                        content: {
                            result: 1,
                            properties: {},
                        },
                    },
                },
                compare_flow: {},
                successors: [],
            },
        },
        match_flow: {},
        end_flow: {},
    },
    party: {
        name: 'party-game',
        player_count: 6,
        classes: {},
        cardsets: {
            '1': {
                name: '任意出牌',
                properties: {},
                build_flow: {
                    '1': {
                        type: 28,
                        content: {
                            result: 1,
                            properties: {},
                        },
                    },
                },
                compare_flow: {},
                successors: [],
            },
        },
        match_flow: {},
        end_flow: {},
    },
}

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

function getGuestPlayerId(): string {
    if (!hasBrowserStorage()) {
        return 'guest-player'
    }

    const existingId = window.sessionStorage.getItem(PLAYER_STORAGE_KEY)
    if (existingId) {
        return existingId
    }

    const newId = `player-${Math.random().toString(36).slice(2, 10)}`
    window.sessionStorage.setItem(PLAYER_STORAGE_KEY, newId)
    return newId
}

function getCurrentPlayerId(): string {
    const currentUser = getCachedCurrentUser()
    return currentUser?.id || getGuestPlayerId()
}

function getCurrentRoomCode(): string | null {
    if (!hasBrowserStorage()) {
        return null
    }

    return (
        window.sessionStorage.getItem(CURRENT_ROOM_STORAGE_KEY)
        || window.sessionStorage.getItem(LEGACY_CURRENT_ROOM_STORAGE_KEY)
    )
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

function normalizeRoomCode(code: string): string {
    return code.trim().toUpperCase()
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

type CachedCurrentUser = {
    id: string
    username: string
    email: string
    avatar: string
}

function getCachedCurrentUser(): CachedCurrentUser | null {
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
    if (currentUser) {
        return {
            id: currentUser.id,
            username: currentUser.username,
            avatar: currentUser.avatar || DEFAULT_AVATAR,
        }
    }

    return {
        id: getGuestPlayerId(),
        username: getGuestUsername(),
        avatar: DEFAULT_AVATAR,
    }
}

export function buildRoomHeaders() {
    const profile = getCurrentPlayerProfile()
    return {
        'x-player-id': profile.id,
        'x-player-name': encodeURIComponent(profile.username),
        'x-player-avatar': encodeURIComponent(profile.avatar),
    }
}

function normalizePlayer(player: BackendPlayer): Player {
    return {
        id: String(player.id || ''),
        username: player.username || '',
        avatar: player.avatar || DEFAULT_AVATAR,
        isReady: Boolean(player.isReady ?? player.is_ready),
        joinedAt: typeof player.joinedAt === 'number'
            ? player.joinedAt
            : typeof player.joined_at === 'number'
                ? player.joined_at
                : undefined,
    }
}

function normalizeRoom(room: BackendRoom): Room {
    return {
        id: String(room.id || ''),
        code: String(room.code || ''),
        hostId: String(room.hostId ?? room.host_id ?? ''),
        playerCount: Number(room.playerCount ?? room.player_count ?? 0),
        roundTime: Number(room.roundTime ?? room.round_time ?? 0),
        ruleId: String(room.ruleId ?? room.rule_id ?? ''),
        ruleName: String(room.ruleName ?? room.rule_name ?? ''),
        password: room.password ?? null,
        players: Array.isArray(room.players) ? room.players.map(normalizePlayer) : [],
        status: (room.status as Room['status']) || 'waiting',
    }
}

function normalizeRuleOption(rule: Partial<GameRuleOption> & { player_count?: number }): GameRuleOption {
    return {
        id: String(rule.id || ''),
        name: String(rule.name || ''),
        playerCount: Number(rule.playerCount ?? rule.player_count ?? 0),
        description: rule.description,
    }
}

function persistRoom<T extends Room | null>(result: RoomResult<T>) {
    if (!result.success) {
        return result
    }

    if (result.data && 'code' in result.data && result.data.code) {
        setCurrentRoomCode(result.data.code)
    } else if (result.data === null) {
        clearCurrentRoomCode()
    }

    return result
}

export const roomApi = {
    getCurrentPlayerId,

    async getRuleOptions(): Promise<RoomResult<GameRuleOption[]>> {
        const result = await apiGet<{ success: boolean; data?: Array<GameRuleOption & { player_count?: number }>; message?: string }>(
            API_CONFIG.endpoints.room.rules,
            {
                useMock: shouldUseRoomMockApi(),
                mockDelay: 200,
                mockFn: () => ({ success: true, data: mockRuleOptions }),
            },
        )

        return {
            success: result.success,
            data: result.data?.map(normalizeRuleOption),
            message: result.message,
        }
    },

    async createRoom(params: CreateRoomParams): Promise<RoomResult<Room>> {
        const result = await apiPost<RoomResult<BackendRoom>>(API_CONFIG.endpoints.room.create, params, {
            useMock: shouldUseRoomMockApi(),
            mockDelay: 500,
            mockFn: () => {
                const selectedRule = mockRuleOptions.find((rule) => rule.id === params.ruleId)
                if (!selectedRule) {
                    return { success: false, message: 'Invalid room rule.' }
                }

                const rooms = readRooms()
                const playerProfile = getCurrentPlayerProfile()
                const now = Date.now()
                const newRoom: Room = {
                    id: Math.random().toString(36).substring(2, 9),
                    code: generateRoomCode(),
                    hostId: playerProfile.id,
                    playerCount: selectedRule.playerCount,
                    roundTime: params.roundTime,
                    ruleId: selectedRule.id,
                    ruleName: selectedRule.name,
                    password: params.password || null,
                    players: [
                        {
                            id: playerProfile.id,
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
            headers: buildRoomHeaders(),
        })

        const normalized = persistRoom({
            success: result.success,
            data: result.data ? normalizeRoom(result.data) : undefined,
            message: result.message,
        })

        return {
            success: normalized.success,
            data: normalized.data || undefined,
            message: normalized.message,
        }
    },

    async joinRoom(params: JoinRoomParams): Promise<RoomResult<Room>> {
        const normalizedCode = normalizeRoomCode(params.code)
        const result = await apiPost<RoomResult<BackendRoom>>(
            API_CONFIG.endpoints.room.join,
            { ...params, code: normalizedCode },
            {
                useMock: shouldUseRoomMockApi(),
                mockDelay: 500,
                mockFn: () => {
                    const rooms = readRooms()
                    const room = rooms[normalizedCode]

                    if (!room) {
                        return { success: false, message: 'Room does not exist.' }
                    }
                    if (room.password && room.password !== params.password) {
                        return { success: false, message: 'Incorrect password.' }
                    }
                    if (room.status !== 'waiting') {
                        return { success: false, message: 'This room has already started.' }
                    }

                    const playerProfile = getCurrentPlayerProfile()
                    const existingPlayer = room.players.find((player) => player.id === playerProfile.id)
                    if (!existingPlayer && room.players.length >= room.playerCount) {
                        return { success: false, message: 'Room is full.' }
                    }

                    if (!existingPlayer) {
                        room.players.push({
                            id: playerProfile.id,
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
                headers: buildRoomHeaders(),
            },
        )

        const normalized = persistRoom({
            success: result.success,
            data: result.data ? normalizeRoom(result.data) : undefined,
            message: result.message,
        })

        return {
            success: normalized.success,
            data: normalized.data || undefined,
            message: normalized.message,
        }
    },

    async checkRoomPassword(code: string): Promise<{ success: boolean; hasPassword: boolean; message?: string }> {
        const normalizedCode = normalizeRoomCode(code)
        return apiGet(`${API_CONFIG.endpoints.room.checkPassword}?code=${encodeURIComponent(normalizedCode)}`, {
            useMock: shouldUseRoomMockApi(),
            mockDelay: 200,
            mockFn: () => {
                const rooms = readRooms()
                const room = rooms[normalizedCode]
                if (room) {
                    return { success: true, hasPassword: !!room.password }
                }
                return { success: false, hasPassword: false, message: 'Room does not exist.' }
            },
            headers: buildRoomHeaders(),
        })
    },

    async getCurrentRoom(): Promise<RoomResult<Room | null>> {
        const result = await apiGet<RoomResult<BackendRoom | null>>(API_CONFIG.endpoints.room.getCurrent, {
            useMock: shouldUseRoomMockApi(),
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
            headers: buildRoomHeaders(),
        })

        return persistRoom({
            success: result.success,
            data: result.data ? normalizeRoom(result.data) : result.data === null ? null : undefined,
            message: result.message,
        })
    },

    async getRoomByCode(code: string): Promise<RoomResult<Room | null>> {
        const normalizedCode = normalizeRoomCode(code)
        const result = await apiGet<RoomResult<BackendRoom | null>>(
            `${API_CONFIG.endpoints.room.getCurrent}?code=${encodeURIComponent(normalizedCode)}`,
            {
                useMock: shouldUseRoomMockApi(),
                mockDelay: 200,
                mockFn: () => {
                    const rooms = readRooms()
                    const room = rooms[normalizedCode]
                    if (!room) {
                        return { success: false, data: null, message: 'Room does not exist.' }
                    }

                    setCurrentRoomCode(room.code)
                    return { success: true, data: cloneRoom(room) }
                },
                headers: buildRoomHeaders(),
            },
        )

        return persistRoom({
            success: result.success,
            data: result.data ? normalizeRoom(result.data) : result.data === null ? null : undefined,
            message: result.message,
        })
    },

    async getRoomRule(roomId?: string): Promise<{ success: boolean; data?: RoomRuleResponse; message?: string }> {
        const query = roomId ? `?room_id=${encodeURIComponent(roomId)}` : ''
        const result = await apiGet<RoomRuleResponse | { success: boolean; data?: RoomRuleResponse; message?: string }>(
            API_CONFIG.endpoints.room.getRule + query,
            {
                useMock: true,
                mockDelay: 200,
                mockFn: () => {
                    const rooms = readRooms()
                    const playerId = getCurrentPlayerId()
                    const currentCode = getCurrentRoomCode()
                    const room = roomId
                        ? Object.values(rooms).find((item) => item.id === roomId || item.code === roomId)
                        : currentCode
                            ? rooms[currentCode] || getRoomByPlayer(rooms, playerId)
                            : getRoomByPlayer(rooms, playerId)
                    const rule = room ? mockRoomRules[room.ruleId] || mockRoomRules.classic : mockRoomRules.classic

                    return {
                        success: true,
                        data: {
                            room_id: room?.id || roomId || 'mock-room',
                            rule,
                        },
                    }
                },
            },
        )

        if ('room_id' in result && 'rule' in result) {
            return { success: true, data: result }
        }

        return result
    },

    async setReady(isReady: boolean): Promise<RoomResult<Room | null>> {
        const result = await apiPost<RoomResult<BackendRoom | null>>(
            `${API_CONFIG.endpoints.room.getCurrent}/ready`,
            { isReady },
            {
                useMock: shouldUseRoomMockApi(),
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
                headers: buildRoomHeaders(),
            },
        )

        return persistRoom({
            success: result.success,
            data: result.data ? normalizeRoom(result.data) : result.data === null ? null : undefined,
            message: result.message,
        })
    },

    async startGame(): Promise<RoomResult<Room | null>> {
        const result = await apiPost<RoomResult<BackendRoom | null>>(
            `${API_CONFIG.endpoints.room.getCurrent}/start`,
            {},
            {
                useMock: shouldUseRoomMockApi(),
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
                headers: buildRoomHeaders(),
            },
        )

        return persistRoom({
            success: result.success,
            data: result.data ? normalizeRoom(result.data) : result.data === null ? null : undefined,
            message: result.message,
        })
    },

    async leaveRoom(): Promise<{ success: boolean }> {
        const result = await apiPost<{ success: boolean }>(API_CONFIG.endpoints.room.leave, {}, {
            useMock: shouldUseRoomMockApi(),
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
            headers: buildRoomHeaders(),
        })

        if (result.success) {
            clearCurrentRoomCode()
        }

        return { success: result.success }
    },
}
