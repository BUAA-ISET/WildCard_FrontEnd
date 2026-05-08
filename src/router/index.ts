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
import RuleBuilderView from '../views/RuleBuilderView.vue'


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
        component: { template: '<div>Rule Market</div>' }
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
        component: RuleBuilderView
      },
      {
        path: 'match-history',
        component: { template: '<div>Match History</div>' }
      },
      {
        path: 'user-info',
        component: UserView
      },
      {
        path: 'admin-panel',
        component: { template: '<div>Admin Panel</div>' }
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
        component: { template: '<div>Help</div>' }
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

export default router
