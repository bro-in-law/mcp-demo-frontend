import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { initMcpServer } from './mcp/server'

// 配置axios
axios.defaults.baseURL = '/api'
axios.interceptors.response.use(
  response => {
    console.log('API响应成功:', response.config.url, response.data)
    return response
  },
  error => {
    console.error('API错误:', error.config?.url, error.message, error)
    return Promise.reject(error)
  }
)

const app = createApp(App)

// 注册ElementPlus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
app.config.globalProperties.$axios = axios

// 初始化MCP服务器
try {
  const mcpServer = initMcpServer();
  app.config.globalProperties.$mcpServer = mcpServer;
  console.log('MCP服务器初始化成功');
} catch (error) {
  console.error('MCP服务器初始化失败:', error);
}

app.mount('#app') 