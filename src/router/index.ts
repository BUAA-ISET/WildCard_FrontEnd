import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import InfoLayout from '../layouts/InfoLayout.vue'
import HomeView from '../views/HomeView.vue'
import About from '../views/About.vue'
import Contact from '../views/Contact.vue'
import CardStyleView from '../views/CardStyleView.vue'
import BattleView from '../views/BattleView.vue'
import ReadyRoomView from '../views/ReadyRoomView.vue'
import UserView from '../views/UserView.vue'
import JoinRoomView from '../views/JoinRoomView.vue'
import CreateRoomView from '../views/CreateRoomView.vue'
import CreationCenterView from '../views/CreationCenterView.vue'
import RuleBuilderView from '../views/RuleBuilderView.vue'
import MatchHistoryView from '../views/MatchHistoryView.vue'
import ReplayView from '../views/ReplayView.vue'
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
        component: { template: '<div>规则市场</div>' }
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
        component: MatchHistoryView
      },
      {
        path: 'match-history/:replayId',
        component: ReplayView
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
        component: { template: '<div>帮助中心</div>' }
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

  if (!userStore.isLoggedIn && !publicPaths.has(to.path)) {
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
