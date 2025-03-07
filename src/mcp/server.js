import { Server } from './mockSdk';
// import { Server } from '@modelcontextprotocol/sdk';
import axios from 'axios';
import router from '../router';
import { ElMessage } from 'element-plus';
import eventBus from './eventBus';

// 创建MCP服务器实例
const server = new Server({
  name: "health-mcp",
  version: "0.1.0"
}, {
  capabilities: {
    tools: {
      // 个人信息编辑工具
      edit_profile: {
        parameters: {
          name: { type: "string" },
          age: { type: "number" },
          height: { type: "number" },
          weight: { type: "number" },
          gender: { type: "string" },
          bloodPressure: { 
            type: "object",
            properties: {
              systolic: { type: "number" },
              diastolic: { type: "number" }
            }
          }
        },
        execute: async (params) => {
          try {
            // 先检查是否需要导航到编辑页面
            if (router.currentRoute.value.path !== '/edit') {
              await router.push('/edit');
              // 等待页面加载
              await new Promise(resolve => setTimeout(resolve, 300));
            }

            // 触发表单更新事件
            eventBus.emit('update-profile-form', params);
            
            // 等待表单操作完成
            await new Promise(resolve => {
              const handler = (result) => {
                eventBus.off('profile-update-result', handler);
                resolve(result);
              };
              eventBus.on('profile-update-result', handler);
              
              // 5秒超时
              setTimeout(() => {
                eventBus.off('profile-update-result', handler);
                resolve({ success: false, message: "操作超时" });
              }, 5000);
            });
            
            // 导航回主页
            await router.push('/home');
            
            // 触发主页数据刷新
            eventBus.emit('refresh-home-data');
            
            return { success: true, message: "用户信息已更新" };
          } catch (error) {
            console.error('MCP工具执行失败:', error);
            ElMessage.error('更新用户信息失败');
            return { 
              success: false, 
              message: error.message || "更新失败",
              error: error.toString()
            };
          }
        }
      }
    }
  }
});

// 初始化MCP服务器
export function initMcpServer() {
  server.start().then(() => {
    console.log('MCP服务器已启动');
  }).catch(err => {
    console.error('MCP服务器启动失败:', err);
  });
  
  return server;
}

export default server; 