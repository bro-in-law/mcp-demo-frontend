import axios from 'axios'

/**
 * 获取用户信息
 * @returns {Promise} 返回用户信息Promise
 */
export function getUserInfo() {
  return axios.get('/user')
}

/**
 * 更新用户信息
 * @param {Object} userData 用户数据
 * @returns {Promise} 返回更新结果Promise
 */
export function updateUserInfo(userData) {
  return axios.put('/user', userData)
}

/**
 * 系统初始化
 * @returns {Promise} 返回初始化数据Promise
 */
export function initSystem() {
  return axios.get('/init')
} 