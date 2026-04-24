import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import InfoLayout from '../layouts/InfoLayout.vue'
import HomeView from '../views/HomeView.vue'
import About from '../views/About.vue'
import CardStyleView from '../views/CardStyleView.vue'
import BattleView from '../views/BattleView.vue'


const routes = [
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
        component: { template: '<div>Creation Center</div>' }
      },
      {
        path: 'match-history',
        component: { template: '<div>Match History</div>' }
      },
      {
        path: 'user-info',
        component: { template: '<div>User Info</div>' }
      },
      {
        path: 'admin-panel',
        component: { template: '<div>Admin Panel</div>' }
      },
      {
        path: 'create-room',
        component: { template: '<div>Create Room</div>' }
      },
      {
        path: 'join-room',
        component: { template: '<div>Join Room</div>' }
      },
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
        component: { template: '<div>Contact</div>' }
      },
      {
        path: 'help',
        component: { template: '<div>Help</div>' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
