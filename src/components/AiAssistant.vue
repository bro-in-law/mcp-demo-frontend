<template>
  <div class="ai-assistant-container">
    <!-- 悬浮按钮，点击呼出侧边栏 -->
    <div class="ai-assistant-trigger" @click="toggleAssistant" v-if="!isOpen">
      <el-button type="primary" circle>
        <el-icon><ChatLineRound /></el-icon>
      </el-button>
    </div>
    
    <!-- 侧边栏内容 -->
    <el-drawer
      v-model="isOpen"
      title="智能健康助手"
      size="30%"
      :with-header="true"
      destroy-on-close
      direction="rtl"
    >
      <div class="assistant-content">
        <!-- 助手模式切换 -->
        <div class="mode-switcher">
          <el-radio-group v-model="assistantMode" size="small" @change="handleModeChange">
            <el-radio-button label="ask">指南模式</el-radio-button>
            <el-radio-button label="agent">执行模式</el-radio-button>
          </el-radio-group>
          <div class="mode-desc">
            <template v-if="assistantMode === 'ask'">获取操作指南，不执行实际操作</template>
            <template v-else>根据指令自动执行相应操作</template>
          </div>
        </div>
        
        <!-- 聊天消息区域 -->
        <div class="chat-messages" ref="chatContainer">
          <div v-for="(message, index) in messages" :key="index" 
               :class="['message', message.type === 'user' ? 'user-message' : 'assistant-message']">
            <div class="message-content">
              <div v-if="message.type === 'assistant' && message.thinking" class="thinking">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
              <div v-else>
                <!-- 普通文本消息 -->
                <div v-if="!message.guide" v-html="formatMessage(message.content)"></div>
                
                <!-- 指南类型消息 -->
                <div v-else class="guide-message">
                  <h3>{{ message.guide.title }}</h3>
                  <p>{{ message.guide.description }}</p>
                  
                  <template v-if="message.guide.steps">
                    <h4>操作步骤：</h4>
                    <ol>
                      <li v-for="(step, i) in message.guide.steps" :key="i">{{ step }}</li>
                    </ol>
                  </template>
                  
                  <template v-if="message.guide.parameters">
                    <h4>参数说明：</h4>
                    <div class="parameters">
                      <div v-for="(value, key) in flattenParams(message.guide.parameters)" :key="key" class="param-item">
                        <strong>{{ key }}:</strong> {{ value }}
                      </div>
                    </div>
                  </template>
                  
                  <template v-if="message.guide.features">
                    <h4>功能说明：</h4>
                    <div v-for="(feature, i) in message.guide.features" :key="i" class="feature-item">
                      <strong>{{ feature.name }}</strong>: {{ feature.description }}
                    </div>
                  </template>
                  
                  <template v-if="message.guide.common_queries">
                    <h4>常见问题：</h4>
                    <ul>
                      <li v-for="(query, i) in message.guide.common_queries" :key="i">{{ query }}</li>
                    </ul>
                  </template>
                  
                  <div v-if="message.guide.example" class="example">
                    <strong>示例：</strong> {{ message.guide.example }}
                  </div>
                  
                  <div class="guide-actions">
                    <el-button 
                      v-if="assistantMode === 'ask'" 
                      type="primary" 
                      size="small"
                      @click="switchToAgentMode"
                    >
                      切换到执行模式
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="chat-input">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题，例如：帮我更新血压记录..."
            :disabled="loading"
            @keyup.enter.ctrl="sendMessage"
          />
          <div class="button-group">
            <el-button @click="clearChat" :disabled="loading">清空对话</el-button>
            <el-button type="primary" @click="sendMessage" :loading="loading">发送</el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick, onMounted, getCurrentInstance } from 'vue';
import { ElMessage } from 'element-plus';
import { ChatLineRound } from '@element-plus/icons-vue';
import axios from 'axios';

// 获取全局实例
const { proxy } = getCurrentInstance();

// 状态变量
const isOpen = ref(false);
const userInput = ref('');
const loading = ref(false);
const chatContainer = ref(null);
const assistantMode = ref('ask'); // 默认为指南模式

const messages = reactive([
  { 
    type: 'assistant', 
    content: '您好，我是您的健康管理助手。我可以帮您查看健康记录、更新个人信息等。有什么可以帮您的吗？' 
  }
]);

// 打开/关闭助手
const toggleAssistant = () => {
  isOpen.value = !isOpen.value;
};

// 处理模式切换
const handleModeChange = (mode) => {
  ElMessage.info(`已切换到${mode === 'ask' ? '指南' : '执行'}模式`);
};

// 从指南模式切换到执行模式
const switchToAgentMode = () => {
  assistantMode.value = 'agent';
  ElMessage.success('已切换到执行模式，您可以直接发送指令执行操作');
};

// 格式化消息内容（支持简单的Markdown格式）
const formatMessage = (content) => {
  if (!content) return '';
  
  // 替换**文本**为加粗
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 替换换行符
  content = content.replace(/\n/g, '<br/>');
  
  return content;
};

// 将嵌套参数扁平化，方便显示
const flattenParams = (params, prefix = '') => {
  let result = {};
  
  for (const key in params) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof params[key] === 'object' && params[key] !== null && !Array.isArray(params[key])) {
      Object.assign(result, flattenParams(params[key], newKey));
    } else {
      result[newKey] = params[key];
    }
  }
  
  return result;
};

// 发送消息到后端
const sendMessage = async () => {
  if (!userInput.value.trim() || loading.value) return;
  
  // 添加用户消息
  messages.push({ type: 'user', content: userInput.value });
  
  // 添加助手思考中状态
  const thinkingIndex = messages.length;
  messages.push({ type: 'assistant', content: '', thinking: true });
  
  // 滚动到底部
  await scrollToBottom();
  
  const userQuery = userInput.value;
  userInput.value = '';
  loading.value = true;
  
  try {
    // 根据当前模式调用不同的API
    const endpoint = assistantMode.value === 'ask' ? '/assistant/ask' : '/assistant/agent';
    
    const response = await axios.post(endpoint, { 
      query: userQuery
    });
    
    // 移除思考中状态
    messages.splice(thinkingIndex, 1);
    
    const data = response.data;
    
    if (data.error) {
      // 显示错误消息
      messages.push({ type: 'assistant', content: `抱歉，我遇到了问题: ${data.error}` });
    } else if (assistantMode.value === 'ask') {
      // Ask模式：显示操作指南
      messages.push({ 
        type: 'assistant',
        guide: data
      });
    } else if (data.tool && data.params) {
      // Agent模式：执行工具操作
      const toolDescription = getToolDescription(data.tool);
      messages.push({ 
        type: 'assistant', 
        content: getToolResponseMessage(data.tool, data.params)
      });
      
      // 执行工具调用
      await handleToolCall(data.tool, data.params);
    } else {
      // 默认回复（如果没有工具调用）
      messages.push({ 
        type: 'assistant', 
        content: '我理解了您的请求，但目前无法执行相应操作。' 
      });
    }
  } catch (error) {
    console.error('AI助手请求失败:', error);
    messages.splice(thinkingIndex, 1);
    messages.push({ 
      type: 'assistant', 
      content: `抱歉，发生了错误: ${error.message || '未知错误'}。请稍后再试。` 
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

// 根据工具类型生成回复消息
const getToolResponseMessage = (tool, params) => {
  switch (tool) {
    case 'edit_profile':
      return `我将为您更新个人信息:\n**姓名**: ${params.name}\n**年龄**: ${params.age}岁\n**性别**: ${params.gender === 'male' ? '男' : '女'}\n**身高**: ${params.height}cm\n**体重**: ${params.weight}kg`;
    case 'view_blood_pressure':
      return `我将为您显示从 **${params.start_date}** 到 **${params.end_date}** 的血压趋势图。`;
    default:
      return `我将执行操作: ${getToolDescription(tool)}`;
  }
};

// 处理单个工具调用
const handleToolCall = async (tool, params) => {
  try {
    // 获取MCP服务器实例
    const server = proxy.$mcpServer;
    if (!server) {
      throw new Error('MCP服务器未初始化');
    }
    
    // 在聊天中添加工具调用说明
    messages.push({ 
      type: 'assistant', 
      content: `正在执行操作: **${getToolDescription(tool)}**` 
    });
    
    // 延迟一下，让用户看到执行提示
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 调用MCP工具
    const toolObj = server.capabilities.tools[tool];
    if (!toolObj) {
      throw new Error(`未找到工具: ${tool}`);
    }
    
    // 处理性别格式，将后端返回的male/female转换为男/女
    if (tool === 'edit_profile' && params.gender) {
      params.gender = params.gender === 'male' ? '男' : 
                       params.gender === 'female' ? '女' : params.gender;
    }
    
    const result = await toolObj.execute(params);
    
    // 添加执行结果
    if (result.success) {
      messages.push({ 
        type: 'assistant', 
        content: `✅ 操作已完成: **${result.message || '成功'}**` 
      });
    } else {
      messages.push({ 
        type: 'assistant', 
        content: `❌ 操作失败: **${result.message || '未知错误'}**` 
      });
    }
  } catch (error) {
    console.error('工具调用失败:', error);
    messages.push({ 
      type: 'assistant', 
      content: `❌ 操作执行出错: **${error.message || '未知错误'}**` 
    });
  }
  
  await scrollToBottom();
};

// 获取工具描述
const getToolDescription = (tool) => {
  const descriptions = {
    'edit_profile': '更新个人信息',
    'view_blood_pressure': '查看血压趋势图'
  };
  
  return descriptions[tool] || tool;
};

// 清空聊天记录
const clearChat = () => {
  messages.splice(0, messages.length);
  messages.push({ type: 'assistant', content: '聊天已清空。有什么可以帮您的吗？' });
};

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

// 监听侧边栏打开状态
watch(isOpen, async (newVal) => {
  if (newVal) {
    await nextTick();
    scrollToBottom();
  }
});
</script>

<style scoped>
.ai-assistant-container {
  position: relative;
}

.ai-assistant-trigger {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 999;
}

.assistant-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}

.mode-switcher {
  margin-bottom: 15px;
  text-align: center;
}

.mode-desc {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.message {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.user-message {
  align-items: flex-end;
}

.assistant-message {
  align-items: flex-start;
}

.message-content {
  max-width: 85%;
  padding: 10px 15px;
  border-radius: 10px;
  word-break: break-word;
}

.user-message .message-content {
  background-color: #409eff;
  color: white;
  border-top-right-radius: 0;
}

.assistant-message .message-content {
  background-color: #fff;
  color: #333;
  border: 1px solid #eaeaea;
  border-top-left-radius: 0;
}

.guide-message {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-message h3 {
  margin: 0 0 5px 0;
  color: #303133;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 8px;
}

.guide-message h4 {
  margin: 10px 0 5px 0;
  color: #606266;
}

.guide-message ol, .guide-message ul {
  margin: 5px 0;
  padding-left: 25px;
}

.guide-message li {
  margin-bottom: 5px;
}

.parameters {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.param-item, .feature-item {
  margin-bottom: 5px;
}

.example {
  margin-top: 10px;
  font-style: italic;
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.95em;
}

.guide-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.chat-input {
  margin-top: auto;
  padding: 10px 0;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 10px;
}

.thinking {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
}

.dot {
  height: 8px;
  width: 8px;
  background-color: #888;
  border-radius: 50%;
  margin: 0 3px;
  animation: pulse 1.5s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.3s;
}

.dot:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}
</style> 