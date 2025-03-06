import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EditView from '../views/EditView.vue'
import ChartView from '../views/ChartView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { title: '首页' }
    },
    {
      path: '/edit',
      name: 'edit',
      component: EditView,
      meta: { title: '个人信息编辑' }
    },
    {
      path: '/chart',
      name: 'chart',
      component: ChartView,
      meta: { title: '健康趋势图' }
    }
  ]
})

// 导航守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 健康管理系统` : '健康管理系统'
  
  // 可以在这里处理未初始化数据场景
  // 例如，检查用户数据是否已加载
  next()
})

export default router 