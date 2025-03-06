<template>
  <div class="edit-container">
    <h2>个人信息编辑</h2>
    
    <el-card v-if="formData" class="edit-card">
      <el-form 
        :model="formData" 
        :rules="rules" 
        ref="formRef" 
        label-width="100px"
        status-icon
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名"></el-input>
        </el-form-item>
        
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="formData.age" :min="1" :max="120"></el-input-number>
        </el-form-item>
        
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="身高(cm)" prop="height">
          <el-input-number v-model="formData.height" :min="50" :max="250" :precision="1"></el-input-number>
        </el-form-item>
        
        <el-form-item label="体重(kg)" prop="weight">
          <el-input-number v-model="formData.weight" :min="20" :max="200" :precision="1"></el-input-number>
        </el-form-item>
        
        <el-form-item label="最近检查" prop="lastCheckup">
          <el-date-picker 
            v-model="formData.lastCheckup" 
            type="date" 
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">保存信息</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-skeleton v-else :rows="10" animated />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getUserInfo, updateUserInfo } from '../api/user'
import { ElMessage } from 'element-plus'
import eventBus from '../mcp/eventBus'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const formData = ref(null)
const loading = ref(false)
const isMcpSubmit = ref(false)  // 标记是否由MCP触发的提交

// 加载用户数据
const loadUserData = async () => {
  try {
    console.log('开始加载用户数据')
    const response = await getUserInfo()
    formData.value = response.data
    console.log('加载用户数据成功:', formData.value)
  } catch (error) {
    console.error('获取用户信息失败', error)
    ElMessage.error('获取用户信息失败：' + (error.message || '未知错误'))
  }
}

// 表单验证规则
const rules = reactive({
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 1, max: 120, message: '年龄必须在1-120之间', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  height: [
    { required: true, message: '请输入身高', trigger: 'blur' },
    { type: 'number', min: 50, max: 250, message: '身高必须在50-250cm之间', trigger: 'blur' }
  ],
  weight: [
    { required: true, message: '请输入体重', trigger: 'blur' },
    { type: 'number', min: 20, max: 200, message: '体重必须在20-200kg之间', trigger: 'blur' }
  ],
  'bloodPressure.systolic': [
    { required: true, message: '请输入收缩压', trigger: 'blur' },
    { type: 'number', min: 60, max: 200, message: '收缩压必须在60-200mmHg之间', trigger: 'blur' }
  ],
  'bloodPressure.diastolic': [
    { required: true, message: '请输入舒张压', trigger: 'blur' },
    { type: 'number', min: 40, max: 120, message: '舒张压必须在40-120mmHg之间', trigger: 'blur' }
  ]
})

onMounted(async () => {
  await loadUserData()
  
  // 注册MCP事件监听
  eventBus.on('update-profile-form', handleMcpFormUpdate)
})

// 组件卸载前移除事件监听
onBeforeUnmount(() => {
  eventBus.off('update-profile-form', handleMcpFormUpdate)
})

// 处理MCP触发的表单更新
const handleMcpFormUpdate = async (data) => {
  console.log('MCP触发表单更新:', data)
  
  // 确保表单数据已加载
  if (!formData.value) {
    await loadUserData()
  }
  
  // 更新表单数据
  if (data) {
    // 合并现有数据和更新数据
    formData.value = { ...formData.value, ...data }
    
    // 自动提交表单
    isMcpSubmit.value = true
    setTimeout(() => {
      submitForm()
    }, 300)
  }
}

// 监听路由变化，当路由到这个组件时重新加载数据
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/edit') {
      loadUserData()
    }
  }
)

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        console.log('提交表单数据:', formData.value)
        await updateUserInfo(formData.value)
        
        ElMessage.success('信息保存成功')
        
        // 如果是MCP触发的提交，发送结果事件
        if (isMcpSubmit.value) {
          eventBus.emit('profile-update-result', { success: true })
          isMcpSubmit.value = false
        } else {
          // 手动点击提交，导航回主页
          router.push('/home')
        }
      } catch (error) {
        console.error('保存信息失败', error)
        ElMessage.error('保存信息失败：' + (error.message || '未知错误'))
        
        // 如果是MCP触发的提交，发送结果事件
        if (isMcpSubmit.value) {
          eventBus.emit('profile-update-result', { 
            success: false, 
            message: error.message || '保存失败' 
          })
          isMcpSubmit.value = false
        }
      } finally {
        loading.value = false
      }
    } else {
      // 表单验证失败
      if (isMcpSubmit.value) {
        eventBus.emit('profile-update-result', { 
          success: false, 
          message: '表单验证失败' 
        })
        isMcpSubmit.value = false
      }
      return false
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.edit-container {
  max-width: 800px;
  margin: 0 auto;
}

.edit-card {
  margin-top: 20px;
}

.unit {
  margin-left: 8px;
  color: #909399;
}
</style> 