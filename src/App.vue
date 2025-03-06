<template>
  <div class="app-container">
    <el-container>
      <el-header class="app-header">
        <div class="logo">
          <h1>健康管理系统</h1>
        </div>
        <el-menu 
          mode="horizontal" 
          :router="true"
          :default-active="activeIndex"
          class="nav-menu"
        >
          <el-menu-item index="/home">首页</el-menu-item>
          <el-menu-item index="/edit">个人信息</el-menu-item>
          <el-menu-item index="/chart">健康趋势</el-menu-item>
        </el-menu>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
      <el-footer class="app-footer">
        健康管理系统 &copy; 2023
      </el-footer>
    </el-container>
    
    <!-- 添加AI助手组件 -->
    <AiAssistant />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import AiAssistant from './components/AiAssistant.vue'

const route = useRoute()
const activeIndex = computed(() => route.path)

// 全局状态初始化
onMounted(async () => {
  try {
    await axios.get('/api/init') 
  } catch (error) {
    console.error('初始化失败', error)
  }
})
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.app-container {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #409eff;
  color: white;
}

.nav-menu {
  border-bottom: none;
}

.app-footer {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.el-main {
  padding: 30px;
  min-height: calc(100vh - 150px);
}

.logo h1 {
  margin: 0;
  font-size: 1.5em;
}
</style> 