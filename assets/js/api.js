// =============================================================
// 数据访问层（接口适配层 / API Adapter）
// -------------------------------------------------------------
// 职责：
//   为渲染层 / 图表层提供「数据获取接口」，屏蔽数据来源差异。
//   当前实现：直接返回 data.js 中的 Mock 数据（演示用）。
//   未来接入后端：只需把函数体内的 return 改为 fetch(...)，
//                 渲染层与图表层无需任何改动（字段结构保持一致即可）。
// =============================================================

import { DASHBOARD, NAVIGATION_ITEMS } from './data.js';

/** 后端接口前缀（部署时配置；开发演示阶段为空，走本地 Mock） */
const API_BASE = '/api';

/**
 * 获取全部经营导航事项（Navigation Item 集合）
 * @returns {Array} 与 data.js/NAVIGATION_ITEMS 相同结构
 */
export async function getNavigationItems() {
  return NAVIGATION_ITEMS;
}

/**
 * 获取指定（或默认首个）经营导航事项
 * @param {string} [id]
 * @returns {object|null}
 */
export async function getNavigationItem(id) {
  if (!id) return NAVIGATION_ITEMS[0] || null;
  return NAVIGATION_ITEMS.find(n => n.id === id) || null;
}

/**
 * 获取 P01 首页全部数据
 * @returns {Promise<object>} 与 data.js/DASHBOARD 相同结构的对象
 */
export async function getDashboard() {
  // —— 未来真实接口改造示例（取消注释即可启用）——
  // const res = await fetch(`${API_BASE}/dashboard/overview`);
  // if (!res.ok) throw new Error(`数据加载失败：${res.status}`);
  // return await res.json();

  // 当前：返回本地 Mock，模拟网络延迟（可选）
  return DASHBOARD;
}

/**
 * 获取省份支付 GMV 排名
 * @param {number} [limit] 限制返回条数；不传则返回全量
 * @returns {Promise<{list:Array, focus:object}>} 排名列表 + 重点关注省份
 */
export async function getProvinceRank(limit) {
  const list = limit
    ? DASHBOARD.provinceRank.slice(0, limit)
    : DASHBOARD.provinceRank;

  return {
    list,
    focus: DASHBOARD.focusProvince
  };
}
