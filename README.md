# 健康管理系统

基于Vue3构建的轻量级健康管理系统，主要功能包括用户信息展示、个人信息编辑和健康数据趋势可视化。

## 技术栈

- Vue 3 (Composition API)
- Vue Router 4
- Element Plus
- Axios
- ECharts

## 项目结构

```
src/
├─ api/
│  ├─ user.js      # 用户相关API封装
│  └─ health.js    # 健康数据接口
├─ router/
│  └─ index.js     # 路由配置(含导航守卫)
├─ views/
│  ├─ HomeView.vue  # 信息展示主页
│  ├─ EditView.vue  # 信息编辑页
│  └─ ChartView.vue # 趋势图表页
└─ App.vue          # 全局布局容器
```

## 核心功能模块

1. **主页展示**：显示用户基本信息卡片，包括个人信息和当前血压值
2. **个人信息编辑**：提供表单界面编辑个人健康信息
3. **血压趋势图**：使用ECharts可视化血压数据变化趋势

## 安装与使用

1. 安装依赖
   ```
   npm install
   ```

2. 本地开发
   ```
   npm run dev
   ```

3. 生产环境构建
   ```
   npm run build
   ```

## 接口说明

系统使用模拟API进行演示，主要接口包括：

- `GET /api/user`：获取用户信息
- `PUT /api/user`：更新用户信息
- `GET /api/health`：获取血压历史记录
- `POST /api/health`：添加新的血压记录 