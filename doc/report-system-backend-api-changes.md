# 举报系统后端接口变更报告

## 1. 兼容性原则

前端保留现有接口路径：

- `GET /api/reports`
- `GET /api/reports/{reportId}`
- `GET /api/reports/counts`
- `POST /api/reports/{reportId}/action`

所有响应继续使用 `{ success, data, message }`。处罚、关联举报关闭和撤销必须由后端在同一事务内完成。

## 2. 举报对象字段

`Report` 需要新增以下可选字段：

```ts
targetUser?: {
  id: string
  name?: string
  avatar?: string
}

targetRule?: {
  id: string
  name?: string
  authorId?: string
  authorName?: string
}
```

用户和对局行为举报应返回 `targetUser`，其中 `avatar` 为可直接访问的完整 URL 或以 `/` 开头的后端相对路径。规则和评价举报应返回 `targetRule`；规则作者可被处罚时，`authorId` 必须存在。

已执行处罚的举报还需返回：

```ts
punishment?: {
  id: string
  action: 'ban_user' | 'ban_rule' | 'ban_both'
  scope: 'user' | 'rule' | 'both'
  active: boolean
  banDays?: 1 | 3 | 5 | 7 | 30
  bannedUntil?: number
  ruleRemoved: boolean
  affectedReportIds: string[]
  createdAt: number
  revokedAt?: number
}

mergedByPunishmentId?: string
```

时间字段使用 Unix 毫秒时间戳。`actionLog` 的动作类型增加 `ban_both` 和 `revoke`，并允许返回本次动作的 `params`。

## 3. 列表查询

`GET /api/reports` 新增查询参数：

| 参数 | 含义 |
| --- | --- |
| `targetUser` | 按被举报用户 ID 精确匹配，或按用户名称模糊匹配 |
| `targetRule` | 按规则 ID 精确匹配，或按规则名称模糊匹配 |

两个参数可以和现有 `status`、`targetType`、`keyword`、`page` 组合使用。

唯一举报 ID 查询继续使用 `GET /api/reports/{reportId}`。不存在时返回 `success: false` 和可展示的错误信息。

## 4. 处罚请求

请求路径：

```http
POST /api/reports/{reportId}/action
```

封禁用户或规则作者：

```json
{
  "action": "ban_user",
  "note": "处理备注",
  "params": {
    "targetType": "user",
    "targetId": "原始举报目标 ID",
    "targetUserId": "被封禁用户 ID",
    "targetRuleId": "可选规则 ID",
    "ruleAuthorId": "处罚规则作者时提供",
    "banDays": 7
  }
}
```

下架规则：

```json
{
  "action": "ban_rule",
  "note": "处理备注",
  "params": {
    "targetType": "rule",
    "targetId": "原始举报目标 ID",
    "targetRuleId": "规则 ID",
    "ruleAuthorId": "规则作者 ID"
  }
}
```

下架规则并封禁作者：

```json
{
  "action": "ban_both",
  "note": "处理备注",
  "params": {
    "targetType": "rule",
    "targetId": "原始举报目标 ID",
    "targetUserId": "规则作者 ID",
    "targetRuleId": "规则 ID",
    "ruleAuthorId": "规则作者 ID",
    "banDays": 30
  }
}
```

`banDays` 只允许 `1、3、5、7、30`。`ban_rule` 必须将规则从市场下架；`ban_user` 必须禁止目标用户登录到截止时间。

## 5. 关联关闭与撤销

- 用户受罚后，将该用户其他 `pending` 举报标记为 `resolved`，并写入同一个 `mergedByPunishmentId`。
- 规则下架后，将该规则其他 `pending` 举报按相同方式关闭。
- `ban_both` 同时合并关闭规则和作者相关的待处理举报，重复项只处理一次。
- 主举报返回有效的 `punishment`，其中 `affectedReportIds` 包含被自动关闭的举报 ID。

撤销请求：

```json
{
  "action": "revoke",
  "note": "撤销原因",
  "params": {
    "targetType": "rule",
    "targetId": "原始举报目标 ID",
    "targetUserId": "相关用户 ID",
    "targetRuleId": "相关规则 ID",
    "ruleAuthorId": "规则作者 ID"
  }
}
```

撤销必须原子完成以下操作：

1. 解除本次用户封禁。
2. 仅在规则由本次处罚下架时恢复上架。
3. 将主举报恢复为 `pending`。
4. 将 `mergedByPunishmentId` 等于本次处罚 ID、且未被独立处理的举报恢复为 `pending`。
5. 保留处罚历史，将 `punishment.active` 设为 `false` 并填写 `revokedAt`。

重复撤销或不存在有效处罚时，应返回 `success: false`。

## 6. 成功响应

动作成功后，`data` 至少返回更新后的主举报完整对象。前端会重新请求列表和待处理计数，因此后端需保证动作响应返回时事务已提交。
