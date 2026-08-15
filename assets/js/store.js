// =============================================================
// 轻量状态库（Store）
// -------------------------------------------------------------
// 职责（刻意保持极简，不引入 Redux / Pinia 等框架）：
//   1. 持有 Navigation Item 集合与当前选中项（唯一真相源的持有者）；
//   2. 持有页面路由状态；
//   3. 持有 Dashboard 数据引用；
//   4. 提供取数 / 更新 / 选中切换等最小接口；
//   5. 通知重渲染（沿用现有架构：由 app.js 调用 renderApp 完成）。
//
// 设计原则：
//   - Store 不负责取数细节（那归 api.js），也不负责渲染（归 render.js）；
//   - Navigation Item 永远是 canonical，P01/P05/P06 只通过 selectors 投影它。
// =============================================================

import { NAVIGATION_ITEMS, DASHBOARD, WORK_STATES, ROUTE_STATUSES } from './data.js';

// -------------------------------------------------------------
// 内部状态
// -------------------------------------------------------------
const _state = {
  navigationItems: NAVIGATION_ITEMS,   // 经营导航事项集合（canonical）
  selectedNavigationItemId: 'NI-001',  // 当前选中事项
  page: 'P01',                         // 当前页面路由（对应 NAV.id）
  dashboard: DASHBOARD                 // Dashboard 数据（默认持 Mock；接入后端后由 app 经 api 填充覆盖）
};

// -------------------------------------------------------------
// Navigation Item 相关
// -------------------------------------------------------------
/** 取全部经营导航事项 */
export function getNavigationItems() {
  return _state.navigationItems;
}

/** 取指定（或当前选中）经营导航事项 */
export function getNavigationItem(id = _state.selectedNavigationItemId) {
  return _state.navigationItems.find(n => n.id === id) || null;
}

/** 取当前选中的 Navigation Item id */
export function getSelectedNavigationItemId() {
  return _state.selectedNavigationItemId;
}

/** 切换当前选中的 Navigation Item */
export function setSelectedNavigationItemId(id) {
  _state.selectedNavigationItemId = id;
}

// -------------------------------------------------------------
// 页面路由状态
// -------------------------------------------------------------
export function getPage() {
  return _state.page;
}

export function setPage(page) {
  _state.page = page;
}

// -------------------------------------------------------------
// Dashboard 数据
// -------------------------------------------------------------
/** 取 Dashboard 数据 */
export function getDashboard() {
  return _state.dashboard;
}

/** 覆盖 Dashboard 数据（启动后由 app 经 api 填充，或接入后端后写回） */
export function setDashboard(d) {
  _state.dashboard = d;
}

// -------------------------------------------------------------
// 更新（Demo 状态变更入口；接入后端后此处改为调用 api 写回）
// -------------------------------------------------------------
/**
 * 更新指定 Navigation Item（浅合并补丁）
 * @param {string} id
 * @param {object} patch 需要修改的字段
 */
export function updateNavigationItem(id, patch) {
  const item = getNavigationItem(id);
  if (!item) return;
  Object.assign(item, patch);
  // 注：当前为纯前端 Mock，无需通知远端。未来接后端时在此发起写回请求。
}

// -------------------------------------------------------------
// 显式状态迁移（用户动作驱动；严禁由业务对象自动推导 currentWorkState）
// -------------------------------------------------------------
// 设计铁律（验收补充）：
//   - currentWorkState 表达「用户此刻在页面主要处理什么（工作模式）」；
//   - 它只能由用户显式动作改变，绝不能因为系统生成了某个业务对象
//     （如 Route B 被推荐）就自动迁移；
//   - Route B 被推荐（RECOMMENDED）不改变 currentWorkState，也不改变 activeRouteId。

/**
 * 用户显式进入「经营路线确认态」（② 经营路线确认态）
 * 触发：用户在 P06 第⑤态点击「查看新路线并决策」。
 * 仅改变工作模式：
 *   currentWorkState: RESULT_REVIEW → ROUTE_CONFIRMATION
 * 不改变：
 *   - Route B.status（此时仍只是 RECOMMENDED，尚未 Human Confirm）
 *   - activeRouteId（当前正式路线仍指向 R-A，直到 Human Confirm 完成）
 * @param {string} itemId
 * @param {string} [routeId] 正在进入确认的新路线（仅记录供 P06 ②展示，非正式路线）
 */
export function enterRouteConfirmation(itemId, routeId) {
  const item = getNavigationItem(itemId);
  if (!item) return;
  item.currentWorkState = WORK_STATES.ROUTE_CONFIRMATION.code;
  if (routeId) item.pendingConfirmationRouteId = routeId; // 仅供 P06 ②展示，非正式路线
}

/**
 * 用户在「经营路线确认态」（②）完成 Human Confirm ①
 * 触发：用户在②中确认采纳新经营路线。
 * 同时完成三项迁移：
 *   - route.status:   RECOMMENDED → CONFIRMED
 *   - activeRouteId:  切换到被确认的路线（正式路线变更）
 *   - currentWorkState: → EXECUTION_PREPARATION（③ 执行准备态）
 * @param {string} itemId
 * @param {string} routeId 被确认（Human Confirm）的路线
 */
export function confirmRoute(itemId, routeId) {
  const item = getNavigationItem(itemId);
  if (!item) return;
  const route = (item.routes || []).find(r => r.id === routeId);
  if (!route) return;
  route.status = ROUTE_STATUSES.CONFIRMED.code;
  if (!route.confirmedDecisionId) {
    route.confirmedDecisionId = `HD-ROUTE-${routeId.replace(/^R-/, '')}`;
  }
  item.activeRouteId = routeId;
  item.currentWorkState = WORK_STATES.EXECUTION_PREPARATION.code;
  delete item.pendingConfirmationRouteId;
}
