import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import InfoLayout from '../layouts/InfoLayout.vue'
import HomeView from '../views/HomeView.vue'
import About from '../views/About.vue'
import Contact from '../views/Contact.vue'
import HelpView from '../views/HelpView.vue'
import CardStyleView from '../views/CardStyleView.vue'
import BattleView from '../views/BattleView.vue'
import ReadyRoomView from '../views/ReadyRoomView.vue'
import UserView from '../views/UserView.vue'
import JoinRoomView from '../views/JoinRoomView.vue'
import CreateRoomView from '../views/CreateRoomView.vue'
import CreationCenterView from '../views/CreationCenterView.vue'
import RuleBuilderView from '../views/RuleBuilderView.vue'
import RuleMarketHomeView from '../views/RuleMarketHomeView.vue'
import RuleMarketDetailView from '../views/RuleMarketDetailView.vue'
import RuleDeveloperDetailView from '../views/RuleDeveloperDetailView.vue'
import RuleRoomSearchView from '../views/RuleRoomSearchView.vue'
import { roomApi, getRoomEntryPath } from '../api/room'
import { useUserStore } from '../stores/userStore'


const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: MainLayout,
    children: [
      {
        path: '',
        component: HomeView
      },
      {
        path: 'rule-market',
        component: RuleMarketHomeView
      },
      {
        path: 'rule-market/developer/:developerId',
        component: RuleDeveloperDetailView
      },
      {
        path: 'rule-market/:ruleId/rooms',
        component: RuleRoomSearchView
      },
      {
        path: 'rule-market/:ruleId',
        component: RuleMarketDetailView
      },
      {
        path: 'card-style',
        component: CardStyleView
      },
      {
        path: 'battle',
        component: BattleView
      },
      {
        path: 'creation-center',
        component: CreationCenterView
      },
      {
        path: 'creation-center/new',
        component: RuleBuilderView
      },
      {
        path: 'creation-center/:draftId',
        component: RuleBuilderView
      },
      {
        path: 'match-history',
        component: { template: '<div>对局历史</div>' }
      },
      {
        path: 'user-info',
        component: UserView
      },
      {
        path: 'admin-panel',
        component: { template: '<div>管理面板</div>' }
      },
      {
        path: 'create-room',
        component: CreateRoomView
      },
      {
        path: 'join-room',
        component: JoinRoomView
      },
      {
        path: '/game/:roomCode',
        component: ReadyRoomView
      },
      {
        path: '/game/:roomCode/battle',
        component: BattleView
      }
    ]
  },
  {
    path: "/teaminfo",
    component: InfoLayout,
    children: [
      {
        path: 'about',
        component: About
      },
      {
        path: 'contact',
        component: Contact
      },
      {
        path: 'help',
        component: HelpView
      }
    ]
  }
]

if (import.meta.env.VITE_ENABLE_TEST_SANDBOX === 'true') {
  routes.push({
    path: '/__test__/room-sandbox',
    component: () => import('../testing/TestingSandboxView.vue'),
  })
}

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  const publicPaths = new Set(['/user-info'])
  // 团队介绍 / 联系我们 / 帮助中心 三页是公开静态页，谁都可看。
  // 这里特别需要：当用户在已登录 tab 里 window.open('/teaminfo/...') 打开新窗时，
  // 新 tab 的 sessionStorage 为空、读不到 token，beforeEach 会把它误识为未登录
  // 然后强制重定向到 /user-info，导致用户感受是「点了顶部链接，没跳转」。
  const isPublicPath = publicPaths.has(to.path) || to.path.startsWith('/teaminfo/')

  if (!userStore.isLoggedIn && !isPublicPath) {
    return { path: '/user-info' }
  }

  if (userStore.isLoggedIn && to.path === '/user-info') {
    return true
  }

  if (to.path !== '/battle') {
    return true
  }

  const currentRoom = await roomApi.getCurrentRoom()
  if (!currentRoom.success || !currentRoom.data) {
    return { path: '/' }
  }

  return getRoomEntryPath(currentRoom.data)
})

export default router
