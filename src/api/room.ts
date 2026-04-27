export interface Room {
    id: string
    code: string
    hostId: string
    playerCount: number
    roundTime: number
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
    playerCount: number
    roundTime: number
    password?: string
}

export interface JoinRoomParams {
    code: string
    password?: string
}

const mockRooms: Record<string, Room> = {
    '123456': {
        id: '1',
        code: '123456',
        hostId: 'host1',
        playerCount: 4,
        roundTime: 30,
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
    async createRoom(params: CreateRoomParams): Promise<{ success: boolean; data?: Room; message?: string }> {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const newRoom: Room = {
        id: Math.random().toString(36).substr(2, 9),
        code: generateRoomCode(),
        hostId: 'currentUser',
        playerCount: params.playerCount,
        roundTime: params.roundTime,
        password: params.password || null,
        players: [
            { id: 'currentUser', username: 'You', avatar: '', isReady: true },
        ],
        status: 'waiting',
        }
        
        mockRooms[newRoom.code] = newRoom
        currentRoom = newRoom
        
        return { success: true, data: newRoom }
    },

    async joinRoom(params: JoinRoomParams): Promise<{ success: boolean; data?: Room; message?: string }> {
        await new Promise(resolve => setTimeout(resolve, 500))
        
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
    },

    async checkRoomPassword(code: string): Promise<{ success: boolean; hasPassword: boolean }> {
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const room = mockRooms[code]
        if (room) {
            return { success: true, hasPassword: !!room.password }
        }
            return { success: false, hasPassword: false }
    },

    async getCurrentRoom(): Promise<{ success: boolean; data?: Room | null }> {
        await new Promise(resolve => setTimeout(resolve, 200))
        return { success: true, data: currentRoom }
    },

    async leaveRoom(): Promise<{ success: boolean }> {
        await new Promise(resolve => setTimeout(resolve, 200))
        currentRoom = null
        return { success: true }
    },
}