import axios from 'axios'

/**
 * 获取血压历史记录
 * @returns {Promise} 返回血压历史数据Promise
 */
export function getBloodPressureHistory() {
  return axios.get('/health')
}

/**
 * 添加新的血压记录
 * @param {Object} record 血压记录对象
 * @returns {Promise} 返回添加结果Promise
 */
export function addBloodPressureRecord(record) {
  return axios.post('/health', record)
} 