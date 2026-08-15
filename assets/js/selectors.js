// =============================================================
// 投影层（Selectors / Projections）
// -------------------------------------------------------------
// 本文件是本阶段最重要的代码之一。
//
// 原则：
//   - Navigation Item 是事实源（canonical state）；
//   - P01 首页只通过这里的 Selector 取得它需要的「投影（Projection）」；
//   - 严禁 P01 自己再拼一份 NI-001 的业务状态；
//   - Selector 输出结构刻意与重构前 DASHBOARD.hero / effectChain / navQueue
//     字段完全一致，从而 render.js / charts.js 无需任何改动，P01 第一视觉不变。
//   - 业务状态「当前状态 / 经营结果 / 下一步」一律由 Selector 从
//     currentWorkState / executions / results / routes / decisions 推导，
//     绝不允许 queueStatus 等字段成为第二套业务状态源（见 selectHomeQueue）。
// =============================================================

import { OUTCOMES } from './data.js';

// -------------------------------------------------------------
// P01 · 首屏 Hero（今日经营导航）
// -------------------------------------------------------------
// 投影来源：NI-001.goal / signal / nextStep / currentWorkState
export function selectHomeHero(ni) {
  const g = ni.goal;
  return {
    badges: [
      { text: '智脑主动发现', type: 'brand' },
      { text: '最优优先级',   type: 'risk'  }
    ],
    title: ni.title,                                    // 门店短视频经营能力提升
    lead: g.summary,
    stats: [
      { label: '当前覆盖率', value: `${g.current}%`,            delta: '较上期 ↑ 3 个百分点', trend: 'up'      },
      { label: '目标覆盖率', value: `${g.target}%`,            delta: '阶段目标',            trend: 'neutral' },
      { label: '偏离',       value: `${g.deviation} 个百分点`,  delta: '差距仍然较大',        trend: 'down'    },
      { label: '影响范围',   value: `${g.impactRegions} 个区域`, delta: `${g.impactStores.toLocaleString()} 家门店`, trend: 'neutral' }
    ],
    signal: ni.signal,
    nextStep: ni.nextStep
  };
}

// -------------------------------------------------------------
// P01 · 行动效果（5 步链路）
// -------------------------------------------------------------
// 投影来源：NI-001.activeRoute(R-A) + checkpoints(CP-1) + results(RES-A) + nextStep
// 注意：数值全部来自 NI 的 route/checkpoint/result，不再写死在 DASHBOARD.effectChain。
export function selectHomeEffect(ni) {
  const route = ni.routes.find(r => r.id === ni.activeRouteId) || ni.routes[0];
  const cp = ni.checkpoints.find(c => c.routeId === ni.activeRouteId) || ni.checkpoints[0];
  const result = ni.results.find(r => r.routeId === ni.activeRouteId) || ni.results[0];

  const steps = [
    {
      icon: '👤',
      label: '已执行动作',
      value: route.effectActionLabel || route.name
    },
    {
      icon: '🎯',
      label: '预期效果',
      value: `门店 GMV<br>${route.expected.storeGmv}`   // 来自 route.expected.storeGmv = '+15%'
    },
    {
      icon: '📊',
      label: '实际结果',
      value: `门店 GMV ${cp.storeGmvActual}`,            // 来自 checkpoint.storeGmvActual = '+11%'
      sub: cp.storeGmvSub                                // '+68 家 · +2.6pp'
    },
    {
      icon: '🧠',
      label: '智能判断',
      value: result ? selectResultVerdict(result.outcome) : '—'   // 由 outcome 枚举投影，如 '部分有效'
    },
    {
      icon: '🚩',
      label: '下一步建议',
      value: ni.effectNextStep                          // '建议继续观察<br>7 天'
    }
  ];

  return {
    steps,
    note: ni.effectNote
  };
}

// -------------------------------------------------------------
// P01 · 经营导航队列（队首为 NI-001，其余来自 Dashboard.queueOthers）
// -------------------------------------------------------------
// 投影来源：NI-001 的 goal/signal + 「当前阶段 / 落地率 / 下一步」由 canonical 推导；
//          其余经营事项来自 Dashboard.queueOthers（不属于 NI-001，继续留在 Dashboard 层）。
//
// 关键约束（验收问题 3）：queueStatus 只允许保留展示 / 更新时间类字段（updated），
// 绝不允许 stage / rate / next 这类业务状态出现「第二套业务状态源」。
// 因此队列卡的三项业务信息全部由 Selector 推导：
//   - stage ：currentWorkState 映射（与五态一致，不会与 currentWorkState 矛盾）
//   - rate  ：executions 执行进度推导
//   - next  ：当前待确认路线 / 当前态推导（统一口径，不来自 queueStatus）
export function selectHomeQueue(ni, dashboard) {
  const g = ni.goal;

  // 当前阶段：由 currentWorkState 推导（与五态定义严格一致）
  const stage = QUEUE_STAGE_BY_WORK_STATE[ni.currentWorkState] || '—';

  // 落地率：由活动路线的 executions 推导（R-A 已执行 3/3 → 100%）
  const ex = (ni.executions || []).find(e => e.routeId === ni.activeRouteId);
  const rate = ex && ex.totalActions ? `${Math.round(ex.executedActions / ex.totalActions * 100)}%` : '—';

  // 下一步：当前若有待确认路线 → 确认新经营路线；否则持续推进当前路线
  const recRoute = (ni.routes || []).find(r => r.status === 'RECOMMENDED');
  const next = recRoute
    ? `确认新经营路线：${recRoute.name}`
    : '持续推进当前经营路线';

  const niCard = {
    pri: ni.priority,                                                       // 'hi'
    name: ni.title,                                                         // 门店短视频经营能力提升
    signal: ni.signal,
    range: `${g.impactRegions} 个区域 / ${g.impactStores.toLocaleString()} 家门店`,
    stage,                                                                  // 来源：currentWorkState 投影
    rate,                                                                   // 来源：executions 投影
    next,                                                                   // 来源：recommended route / currentWorkState 投影
    updated: (ni.queueStatus && ni.queueStatus.updated) || '—'              // 仅保留展示 / 更新时间字段
  };

  return [niCard, ...(dashboard.queueOthers || [])];
}

// currentWorkState → 队列「当前阶段」展示文案（单一映射，杜绝与五态矛盾）
const QUEUE_STAGE_BY_WORK_STATE = {
  ANALYSIS:              '分析中',
  ROUTE_CONFIRMATION:    '路线确认中',
  EXECUTION_PREPARATION: '准备中',
  ORGANIZATION_EXECUTION:'执行中',
  RESULT_REVIEW:         '结果观察'
};

// -------------------------------------------------------------
// P01 · 等待决策（从 NI canonical + Dashboard 企业级决策 投影）
// -------------------------------------------------------------
// 验收问题 2：首页「等待你的决策」不能再只是透传 DASHBOARD.decisions。
// 所有与 Navigation Item 相关的人工决策，必须从 NI canonical state 投影：
//   - RECOMMENDED 路线 → 自动出现「确认新经营路线」（未来：Route B 推荐即出现）
//   - CONFIRMED 但尚未派发的路线 → 自动出现「确认正式派发」
//   - 路线确认 / 派发后，对应待决策项自动消失（因 status 不再匹配）
// Dashboard 只保留「真正与 Navigation Item 无关」的企业级独立决策。
//
// 重要（验收补充）：该投影仅由 route.status 驱动，与 currentWorkState 无关。
// 即使 currentWorkState 仍停留在 RESULT_REVIEW（结果观察态），只要存在
// status = RECOMMENDED 的路线（如 Route B），P01 仍应自动出现「确认新经营路线」入口。
// 绝不能因为 Route B 被推荐就自动把 currentWorkState 改成 ROUTE_CONFIRMATION
// （那必须等待用户在 P06 第⑤态显式点击「查看新路线并决策」，见 store.enterRouteConfirmation）。
export function selectHomeDecisions(ni, dashboard) {
  const niDecisions = projectNavigationDecisions(ni);        // NI 相关，从 canonical 投影
  const enterpriseDecisions = (dashboard && dashboard.decisions) || [];  // 企业级独立决策
  // NI 相关决策优先（最贴近当前经营导航事项），其后为企业级独立决策
  return [...niDecisions, ...enterpriseDecisions];
}

/**
 * 从 Navigation Item 投影「与 NI 相关的人工决策」
 * @param {object} ni
 * @returns {Array<{t,d,act,routeId,kind}>}
 */
function projectNavigationDecisions(ni) {
  const out = [];
  (ni.routes || []).forEach(r => {
    if (r.status === 'RECOMMENDED') {
      // Route 被推荐但尚未 Human Confirm → 需要「确认新经营路线」
      out.push({
        t: `确认新经营路线：${r.name}`,
        d: `智脑推荐「${r.name}」作为新的经营路线，等待人工确认后转入执行准备。`,
        act: '查看并确认',
        routeId: r.id,
        kind: 'CONFIRM_ROUTE'
      });
    } else if (r.status === 'CONFIRMED' && !r.dispatchedDecisionId) {
      // 路线已确认但尚未派发 → 需要「确认正式派发」
      out.push({
        t: `确认正式派发：${r.name}`,
        d: `路线「${r.name}」已确认，等待派发执行（对象分群 + Owner + 时间 + Evidence）。`,
        act: '查看并派发',
        routeId: r.id,
        kind: 'CONFIRM_DISPATCH'
      });
    }
  });
  return out;
}

// -------------------------------------------------------------
// 经营结果结论投影（统一 Result 语义，验收问题 4 的 Result 部分）
// -------------------------------------------------------------
// 底层结论用 OUTCOMES 枚举（唯一真相）；页面文案一律由本函数投影，
// 禁止在多处写互相冲突的自由文本结论。
export function selectResultVerdict(outcome) {
  return (OUTCOMES[outcome] && OUTCOMES[outcome].label) || '—';
}

// -------------------------------------------------------------
// 预留：P05 经营导航中心 / P06 事项详情 投影（本阶段不实现 UI）
// -------------------------------------------------------------
export function selectNavigationCenter(ni) {
  // TODO（后续阶段）：返回经营导航中心所需的聚合投影
  return {
    id: ni.id,
    title: ni.title,
    currentWorkState: ni.currentWorkState,
    activeRouteId: ni.activeRouteId,
    judgments: ni.judgments,
    routes: ni.routes,
    milestonesCount: ni.milestones.length
  };
}

export function selectNavigationDetail(ni) {
  // TODO（后续阶段）：返回 P06 事项详情所需的完整投影
  return {
    id: ni.id,
    title: ni.title,
    goal: ni.goal,
    signal: ni.signal,
    currentWorkState: ni.currentWorkState,
    activeRouteId: ni.activeRouteId,
    judgments: ni.judgments,
    routes: ni.routes,
    humanDecisions: ni.humanDecisions,
    actions: ni.actions,
    dispatches: ni.dispatches,
    executions: ni.executions,
    checkpoints: ni.checkpoints,
    results: ni.results,
    milestones: ni.milestones,
    nextStep: ni.nextStep
  };
}
