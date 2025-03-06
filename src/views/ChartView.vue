<template>
  <div class="chart-container">
    <h2>血压趋势图表</h2>
    
    <el-card class="chart-card">
      <template #header>
        <div class="chart-header">
          <h3>血压历史记录</h3>
          <div class="chart-controls">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :clearable="true"
              @change="handleDateRangeChange"
              style="margin-right: 10px;"
            />
            <el-button size="small" type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>
      
      <div v-else>
        <div ref="chartDom" class="chart-wrapper"></div>
        
        <el-divider content-position="center">历史记录</el-divider>
        
        <el-table
          :data="filteredRecords"
          stripe
          style="width: 100%"
          v-if="filteredRecords && filteredRecords.length > 0"
        >
          <el-table-column prop="date" label="日期" width="180" />
          <el-table-column prop="values.systolic" label="收缩压 (mmHg)" width="180" />
          <el-table-column prop="values.diastolic" label="舒张压 (mmHg)" />
        </el-table>
        
        <el-empty v-else description="暂无历史记录" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { getBloodPressureHistory } from '../api/health'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import eventBus from '../mcp/eventBus'

const chartDom = ref(null)
let myChart = null
const loading = ref(true)
const healthData = reactive({
  records: []
})
const route = useRoute()
const dateRange = ref(null)

// 根据日期筛选记录
const filteredRecords = computed(() => {
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) {
    return healthData.records;
  }

  const startDate = new Date(dateRange.value[0]);
  const endDate = new Date(dateRange.value[1]);
  
  return healthData.records.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= startDate && recordDate <= endDate;
  });
});

onMounted(async () => {
  await loadData();
  
  // 注册MCP事件监听
  eventBus.on('set-chart-date-range', handleMcpDateRange);
});

// 组件卸载前移除事件监听
onBeforeUnmount(() => {
  eventBus.off('set-chart-date-range', handleMcpDateRange);
});

// 处理MCP触发的日期范围设置
const handleMcpDateRange = (range) => {
  console.log('MCP触发日期范围设置:', range);
  if (Array.isArray(range) && range.length === 2) {
    dateRange.value = range;
    setTimeout(() => renderChart(), 100);
  }
};

// 监听路由变化，当路由到这个组件时重新加载数据
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/chart') {
      loadData();
    }
  }
);

const loadData = async () => {
  loading.value = true;
  try {
    console.log('开始加载血压历史数据');
    const response = await getBloodPressureHistory();
    healthData.records = response.data;
    console.log('加载血压历史数据成功:', healthData.records);
    setTimeout(() => renderChart(), 100); // 稍微延迟渲染图表，确保DOM已更新
  } catch (error) {
    console.error('获取血压历史记录失败', error);
    ElMessage.error('获取血压历史记录失败：' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

const refreshData = async () => {
  await loadData();
};

const handleDateRangeChange = () => {
  renderChart();
};

const renderChart = () => {
  if (!chartDom.value) {
    console.warn('图表DOM元素不存在');
    return;
  }
  
  // 确保图表容器存在
  if (!myChart) {
    console.log('初始化echarts实例');
    myChart = echarts.init(chartDom.value);
  }
  
  if (!filteredRecords.value || filteredRecords.value.length === 0) {
    console.warn('没有可显示的血压记录数据');
    // 清空图表
    myChart.clear();
    return;
  }
  
  const dates = filteredRecords.value.map(record => record.date);
  const systolicData = filteredRecords.value.map(record => record.values.systolic);
  const diastolicData = filteredRecords.value.map(record => record.values.diastolic);
  
  console.log('准备渲染图表，数据点数量:', dates.length);
  
  // 设置图表配置项
  const option = {
    title: {
      text: '血压变化趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br />{a0}: {c0} mmHg<br />{a1}: {c1} mmHg'
    },
    legend: {
      data: ['收缩压', '舒张压'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value',
      name: '压力 (mmHg)',
      min: 40,
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '收缩压',
        type: 'line',
        data: systolicData,
        markLine: {
          data: [
            { 
              name: '高压警戒线', 
              yAxis: 140, 
              lineStyle: { color: '#f56c6c' } 
            }
          ]
        },
        itemStyle: { color: '#409eff' }
      },
      {
        name: '舒张压',
        type: 'line',
        data: diastolicData,
        markLine: {
          data: [
            { 
              name: '低压警戒线', 
              yAxis: 90, 
              lineStyle: { color: '#f56c6c' } 
            }
          ]
        },
        itemStyle: { color: '#67c23a' }
      }
    ]
  };
  
  // 渲染图表
  try {
    myChart.setOption(option);
    console.log('图表渲染完成');
  } catch (error) {
    console.error('图表渲染失败', error);
  }
  
  // 响应式调整图表大小
  window.addEventListener('resize', () => {
    myChart?.resize();
  });
};
</script>

<style scoped>
.chart-container {
  max-width: 1000px;
  margin: 0 auto;
}

.chart-card {
  margin-top: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
}

.chart-controls {
  display: flex;
  align-items: center;
}

.chart-wrapper {
  width: 100%;
  height: 400px;
}

.loading-container {
  padding: 40px 0;
}
</style> 