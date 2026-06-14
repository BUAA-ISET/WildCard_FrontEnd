# 用户头像后端接口契约

## 统一用户结构

所有需要展示用户头像的接口，用户对象必须直接提供 `avatar` 字段：

```ts
interface UserSummary {
  id: string
  name: string
  avatar: string
}
```

登录用户接口使用：

```ts
interface User {
  id: string
  username: string
  email: string
  avatar: string
}
```

`avatar` 必须是以下两种格式之一：

- 可直接访问的完整 URL，例如 `https://example.com/static/avatar.png`
- 以后端 `/` 开头的相对路径，例如 `/static/avatars/user-id.png`

用户没有上传头像时返回空字符串 `""`。后端不得返回前端默认头像资源地址，也不得使用
`avatarUrl`、`avatar_url`、`userAvatar`、`user_avatar` 等其他字段名。

## 用户接口

以下接口返回的用户对象必须包含 `avatar`：

- `POST /api/user/login`
- `POST /api/user/register`
- `GET /api/user/current`
- `PUT /api/user/username`
- `PUT /api/user/email`
- `POST /api/user/avatar`

头像上传成功后，`POST /api/user/avatar` 应返回更新后的完整用户对象。

## 房间接口

以下接口返回的 `data.players` 中，每个玩家必须包含真实头像：

```ts
interface RoomPlayer {
  id: string
  username: string
  avatar: string
  isReady: boolean
}
```

涉及接口：

- `POST /api/room/create`
- `POST /api/room/join`
- `GET /api/room/current`
- `GET /api/room/current?code={roomCode}`
- `POST /api/room/current/ready`
- `POST /api/room/current/start`

后端应根据玩家 `id` 查询用户表中的最新头像，不应依赖客户端请求头保存头像。

## 对局接口

`GET /api/games/current` 以及出牌、跳过操作返回的 `data.players` 必须包含：

```ts
interface GamePlayer {
  id: string
  username: string
  avatar: string
  cardCount: number
  online: boolean
}
```

每次响应均应返回用户表中的最新真实头像。

## 回放接口

以下接口返回的每个 `record.players` 玩家必须包含 `id`、`username`、`avatar`：

- `GET /api/replays/history`
- `GET /api/replays/{replayId}`
- `POST /api/replays/from-snapshot`

## 规则市场接口

规则开发者必须使用：

```ts
developer: {
  id: string
  name: string
  avatar: string
}
```

规则评论作者必须使用：

```ts
author: {
  id: string
  name: string
  avatar: string
}
```

涉及接口：

- `GET /api/rules/published`
- `GET /api/rules/published/{ruleId}`
- `GET /api/rules/developers/{developerId}/rules`
- `POST /api/rules/published/{ruleId}/reviews`

## 举报接口

举报人和被举报用户必须使用统一用户对象：

```ts
reporter: {
  id: string
  name: string
  avatar: string
}

targetUser?: {
  id: string
  name?: string
  avatar?: string
}
```

涉及接口：

- `POST /api/reports`
- `GET /api/reports`
- `GET /api/reports/{reportId}`
- `POST /api/reports/{reportId}/action`

前端只读取用户对象中的 `avatar`，不会再兼容其他头像字段名或嵌套结构。
