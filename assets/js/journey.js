// =============================================================
// 经营航迹构建器（Journey Builder）
// -------------------------------------------------------------
// 职责：
//   把 Navigation Item 的 milestones（经营级里程碑历史）投影成
//   「UI 中立的数据结构」，供后续阶段（P06 经营航迹可视化）消费。
//
// 本阶段只做逻辑与数据投影，不开发任何可视化组件。
//
// 输出节点字段：
//   { id, label, type, at, state, routeId?, branchFrom?, meta? }
//   state ∈ { completed, current, pending, checkpoint, branch }
// -------------------------------------------------------------

import { MILESTONE_TYPES } from './data.js';

/**
 * 将单个 milestone 的状态映射为航迹节点状态
 * 说明（验收问题 1）：Route B 推荐不再被强制标记为 `branch` 态，而是按其
 * milestone.status 标记为 `current`（即「当前节点停在推荐路线 B 待人工确认」）。
 * 「从当前激活路线分歧而出」的信息改由节点的 `branchFrom` 字段表达，
 * 不再占用 state 这一单一值。
 * @param {object} m 里程碑
 * @returns {string} completed | current | pending | checkpoint
 */
function mapState(m) {
  if (m.type === 'CHECKPOINT_REACHED') return 'checkpoint';
  if (m.status === 'current') return 'current';
  if (m.status === 'done') return 'completed';
  return 'pending';
}

/**
 * 构建经营航迹
 * @param {object} item Navigation Item（含 milestones）
 * @returns {Array} 按时间排序的航迹节点数组
 */
export function buildJourney(item) {
  if (!item || !Array.isArray(item.milestones)) return [];

  const nodes = item.milestones.map(m => {
    const route = (item.routes || []).find(r => r.id === m.routeId);
    const routeName = route ? route.name : '';
    // 是否为「从当前激活路线分歧而出的新路线推荐」（改道分支）：
    // 仅作为描述性字段 branchFrom，不抢占 state。
    const isBranch = m.type === 'ROUTE_RECOMMENDED' && m.routeId && m.routeId !== item.activeRouteId;

    // ROUTE_RECOMMENDED 节点补充路线名称，使当前节点文案即「推荐路线 B（待人工确认）」
    let label = MILESTONE_TYPES[m.type] || m.type;
    if (m.type === 'ROUTE_RECOMMENDED' && routeName) label = `${label} · ${routeName}`;

    return {
      id: m.id,
      label,
      type: m.type,
      at: m.at,
      state: mapState(m),
      routeId: m.routeId || null,
      branchFrom: isBranch ? item.activeRouteId : null,  // 从当前激活路线分歧而出
      meta: {
        judgmentVersion: m.judgmentVersion,
        decisionId: m.decisionId,
        checkpointId: m.checkpointId,
        resultId: m.resultId,
        status: m.status
      }
    };
  });

  // 按时间升序排列（同时间的保持声明顺序）
  return nodes.slice().sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

/**
 * 取当前航迹中“正在进行”的节点（state = current 或 branch）
 * @param {object} item
 * @returns {Array}
 */
export function getCurrentJourneyNodes(item) {
  return buildJourney(item).filter(n => n.state === 'current' || n.state === 'branch');
}
