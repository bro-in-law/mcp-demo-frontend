/**
 * 模拟的MCP SDK实现
 * 这个模块用于模拟@modelcontextprotocol/sdk功能
 * 用于演示目的，不需要安装真正的SDK包
 */

// 模拟的服务器类
export class Server {
  constructor(info, config) {
    this.info = info;
    this.capabilities = config.capabilities || {};
    this.running = false;
  }

  // 启动服务器
  async start() {
    console.log('模拟MCP服务器启动:', this.info.name, this.info.version);
    this.running = true;
    return true;
  }

  // 停止服务器
  async stop() {
    console.log('模拟MCP服务器停止');
    this.running = false;
    return true;
  }

  // 获取服务器状态
  getStatus() {
    return {
      running: this.running,
      info: this.info
    };
  }
}

export default { Server }; 