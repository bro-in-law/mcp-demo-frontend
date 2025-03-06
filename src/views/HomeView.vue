<template>
  <div class="home-container">
    <h2>健康信息概览</h2>
    
    <el-card v-if="user" class="user-card">
      <template #header>
        <div class="user-header">
          <h3>{{ user.name }}的健康档案</h3>
          <el-button type="primary" size="small" @click="navigateToEdit">
            <el-icon><Edit /></el-icon>
            编辑信息
          </el-button>
        </div>
      </template>
      
      <div class="user-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ user.name }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ user.age }}岁</el-descriptions-item>
          <el-descriptions-item label="性别">{{ user.gender }}</el-descriptions-item>
          <el-descriptions-item label="身高">{{ user.height }}cm</el-descriptions-item>
          <el-descriptions-item label="体重">{{ user.weight }}kg</el-descriptions-item>
          <el-descriptions-item label="最近检查日期">{{ user.lastCheckup }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="bp-section">
          <h4>当前血压</h4>
          <div class="bp-display">
            <div class="bp-item">
              <div class="bp-value">{{ user.bloodPressure?.systolic || '-' }}</div>
              <div class="bp-label">收缩压(mmHg)</div>
            </div>
            <div class="bp-divider">/</div>
            <div class="bp-item">
              <div class="bp-value">{{ user.bloodPressure?.diastolic || '-' }}</div>
              <div class="bp-label">舒张压(mmHg)</div>
            </div>
          </div>
          
          <el-button type="primary" @click="navigateToChart">
            <el-icon><TrendCharts /></el-icon>
            查看趋势图
          </el-button>
        </div>
      </div>
    </el-card>
    
    <el-skeleton v-else :rows="6" animated />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getUserInfo } from '../api/user'
import { Edit, TrendCharts } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import eventBus from '../mcp/eventBus'

const router = useRouter()
const route = useRoute()
const user = ref(null)

// 加载用户数据的函数
const loadUserData = async () => {
  try {
    console.log('开始加载用户数据')
    const response = await getUserInfo()
    user.value = response.data
    console.log('加载用户数据成功:', user.value)
  } catch (error) {
    console.error('获取用户信息失败', error)
    ElMessage.error('获取用户信息失败：' + (error.message || '未知错误'))
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadUserData()
  
  // 注册MCP事件监听
  eventBus.on('refresh-home-data', handleDataRefresh)
})

// 组件卸载前移除事件监听
onBeforeUnmount(() => {
  eventBus.off('refresh-home-data', handleDataRefresh)
})

// 处理MCP触发的数据刷新
const handleDataRefresh = async () => {
  console.log('MCP触发主页数据刷新')
  await loadUserData()
}

// 监听路由变化，当路由到这个组件时重新加载数据
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/home') {
      loadUserData()
    }
  }
)

const navigateToEdit = () => {
  router.push('/edit')
}

const navigateToChart = () => {
  router.push('/chart')
}
</script>

<style scoped>
.home-container {
  max-width: 800px;
  margin: 0 auto;
}

.user-card {
  margin-top: 20px;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-header h3 {
  margin: 0;
}

.bp-section {
  margin-top: 30px;
  text-align: center;
}

.bp-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
}

.bp-item {
  text-align: center;
}

.bp-value {
  font-size: 2rem;
  font-weight: bold;
  color: #409eff;
}

.bp-label {
  font-size: 0.8rem;
  color: #909399;
}

.bp-divider {
  font-size: 2rem;
  margin: 0 15px;
  color: #909399;
}
</style> 