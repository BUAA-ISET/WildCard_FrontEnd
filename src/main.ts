import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import './styles/global.css'
import App from './App.vue'

const app = createApp(App)

app.use(ElementPlus)
app.use(createPinia())
app.use(router)  // 注册路由

app.mount('#app')