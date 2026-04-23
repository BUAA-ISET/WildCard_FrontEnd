import { createRouter, createWebHistory } from 'vue-router'


const routes = [
  { path: '/', component: () => import('../views/HomeView.vue') },
  { path: '/rule-market', component: { template: '<div>Rule Market</div>' } },
  { path: '/creation-center', component: { template: '<div>Creation Center</div>' } },
  { path: '/match-history', component: { template: '<div>Match History</div>' } },
  { path: '/user-info', component: { template: '<div>User Info</div>' } },
  { path: '/admin-panel', component: { template: '<div>Admin Panel</div>' } },
  { path: '/about', component: { template: '<div>About</div>' } },
  { path: '/learn', component: { template: '<div>Learn</div>' } },
  { path: '/contact', component: { template: '<div>Contact</div>' } },
  { path: '/community', component: { template: '<div>Community</div>' } },
  { path: '/create-room', component: { template: '<div>Create Room</div>' } },
  { path: '/join-room', component: { template: '<div>Join Room</div>' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router