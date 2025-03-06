import { reactive } from 'vue';

// 创建一个简单的事件总线
class EventBus {
  constructor() {
    this.events = {};
  }

  // 注册事件监听器
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  // 移除事件监听器
  off(event, callback) {
    if (!this.events[event]) return;
    
    if (callback) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    } else {
      delete this.events[event];
    }
  }

  // 触发事件
  emit(event, data) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      callback(data);
    });
  }
}

// 创建事件总线实例
const eventBus = new EventBus();
export default eventBus; 