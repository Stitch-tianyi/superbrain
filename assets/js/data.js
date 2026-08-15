// =============================================================
// 数据层 · Mock 数据（演示用）
// -------------------------------------------------------------
// 重要约定（数据契约 / Data Contract）：
//   1. 本文件中的全部数值均为【演示数据】，仅用于前端结构与交互验证。
//   2. 下方字段结构即「接口返回的数据契约」。未来接入后端时，
//      api.js 只需返回相同结构的真实数据，渲染层 / 图表层无需改动。
//   3. 页面逻辑（render.js / charts.js / app.js）一律不写死业务数值，
//      全部从这里取数，方便后端对接与替换。
//
// 本阶段新增：
//   4. NAVIGATION_ITEMS 是「经营导航事项（Navigation Item）」的唯一真相源
//      （Single Source of Truth）。P01 / P05 / P06 都只是它的不同 Projection，
//      绝不允许在 hero / effectChain / navQueue 等处再复制一份 NI 状态。
//   5. DASHBOARD 保留「企业经营地图 / 全局 KPI / 全国经营数据」等
//      不属于单个 Navigation Item 的 Dashboard 级数据。
// =============================================================

/**
 * 一级经营空间导航（侧边栏）
 * id 同时作为页面路由标识，ic 为装饰图标。
 */
export const NAV = [
  { id: 'P01', n: '总览台',       ic: '◈' },
  { id: 'P02', n: '战略与目标',   ic: '◉' },
  { id: 'P03', n: '经营地图',     ic: '◎' },
  { id: 'P04', n: '经营导航',     ic: '➤' },
  { id: 'P05', n: '执行与协同',   ic: '✚' },
  { id: 'P06', n: '反馈闭环',     ic: '↻' },
  { id: 'P07', n: '风险雷达',     ic: '◐' },
  { id: 'P08', n: '案例与知识',   ic: '◆' },
  { id: 'P09', n: '数据治理',     ic: '◫' },
  { id: 'P10', n: '系统管理',     ic: '⚙' }
];

/**
 * 轻量占位页文案（P02~P10 尚未深化的经营空间）
 * key 对应 NAV.id，content 为占位说明。
 */
export const LIGHT_PAGES = {
  P02: { n: '战略与目标', lead: '企业要去哪，当前有哪些目标与边界。本页承载企业级/区域级/业务主题级目标、约束与影响评估。' },
  P03: { n: '经营地图',   lead: '真实经营世界发生了什么。承载全国/区域/城市/门店/账号/内容/交易/核销等事实世界与证据下钻。' },
  P04: { n: '经营导航',   lead: '当前有哪些经营事情需要持续管理。智脑先做经营事项分层聚合，把注意力压到最该持续经营的那一件。' },
  P05: { n: '执行与协同', lead: '路线要真正进入组织：谁负责、什么对象、何时完成、如何反馈。' },
  P06: { n: '反馈闭环',   lead: '执行后系统继续观察，到达效果观察点时判断结果，必要时重新归因与改道。' },
  P07: { n: '风险雷达',   lead: '主动识别经营风险信号：增长背后的核销承接、异常售后、退款率波动等。' },
  P08: { n: '案例与知识', lead: '已沉淀的经营经验与候选知识，经过验证后进入可复制的打法库。' },
  P09: { n: '数据治理',   lead: '数据日期、来源、质量、冲突、版本与可追溯性治理。' },
  P10: { n: '系统管理',   lead: '组织/用户权限、基础配置、自动化授权政策与审计。' }
};

// =============================================================
// 经营导航事项 · 唯一真相源（Navigation Item Single Source of Truth）
// -------------------------------------------------------------
// 这是本阶段的核心。后续 P01 / P05 / P06 都只是它的投影。
//
// 设计要点（硬约束）：
//   - 同一个经营事项只有一份 canonical state；
//   - 历史不覆盖：Judgment V1 → V2 共存、Route A → B 共存、Result 用数组；
//   - 两个人工确认（确认路线 / 确认派发）是两个独立 humanDecision 记录；
//   - currentWorkState 永远只有五种之一（见 WORK_STATES）；
//   - activeRouteId 在当前阶段仍指向 Route A（Route B 仅 RECOMMENDED）。
// =============================================================

/** 五态（P06 工作态）冻结定义：永远只有这五个 */
export const WORK_STATES = {
  ANALYSIS:              { code: 'ANALYSIS',              label: '分析判断态' },
  ROUTE_CONFIRMATION:    { code: 'ROUTE_CONFIRMATION',    label: '经营路线确认态' },
  EXECUTION_PREPARATION: { code: 'EXECUTION_PREPARATION', label: '执行准备态' },
  ORGANIZATION_EXECUTION:{ code: 'ORGANIZATION_EXECUTION',label: '组织执行态' },
  RESULT_REVIEW:         { code: 'RESULT_REVIEW',         label: '结果观察 / 改道态' }
};

/**
 * 经营航迹里程碑类型（仅记录“经营级里程碑”，普通操作不计入）
 * 每个 type 对应中文标签，供 buildJourney 投影使用。
 */
export const MILESTONE_TYPES = {
  SIGNAL_DISCOVERED:   '经营信号发现',
  JUDGMENT_CREATED:    '形成经营判断',
  ROUTE_RECOMMENDED:   '智脑推荐路线',
  ROUTE_CONFIRMED:     '路线人工确认',
  EXECUTION_PREPARED:  '执行准备完成',
  DISPATCH_CONFIRMED:  '派发正式确认',
  EXECUTION_STARTED:   '组织执行启动',
  CHECKPOINT_REACHED:  '到达效果观察点',
  RESULT_ASSESSED:     '结果评估',
  JUDGMENT_REVISED:    '判断修订',
  STABLE_OBSERVATION:  '稳定观察',
  CLOSE_SUGGESTED:     '建议关闭',
  CLOSED:              '事项关闭'
};

/**
 * 经营结果结论枚举（统一 Result 语义）
 * 底层只用 `outcome` 这个枚举值作为「业务结论的唯一真相」，页面文案由 Selector 投影
 * （见 selectors.selectResultVerdict）。禁止在 result / checkpoint 等多处写
 * 相互冲突的自由文本结论。
 */
export const OUTCOMES = {
  EXCEEDED:          { code: 'EXCEEDED',          label: '超预期' },
  ON_TRACK:          { code: 'ON_TRACK',          label: '符合预期' },
  PARTIAL_EFFECT:    { code: 'PARTIAL_EFFECT',    label: '部分有效' },
  UNDER_EXPECTATION: { code: 'UNDER_EXPECTATION', label: '低于预期' },
  NO_EFFECT:         { code: 'NO_EFFECT',         label: '基本无效' }
};

/**
 * 路线生命周期状态枚举（Route 状态语义拆分）
 *   - `activeRouteId` 表示「当前正式路线」（当前 = R-A）；
 *   - `route.status` 表示「路线实际生命周期」：推荐 → 确认 → 执行 → 观察/完成 → 关闭。
 * 二者解耦：Route A 已执行完并产出 Checkpoint/Result，其 status 不再为 EXECUTING，
 * 而是 OBSERVED（结果观察中）；Route B 仅被推荐，status 保持 RECOMMENDED。
 */
export const ROUTE_STATUSES = {
  RECOMMENDED:  { code: 'RECOMMENDED',  label: '推荐中（待确认）' },
  CONFIRMED:    { code: 'CONFIRMED',    label: '已确认' },
  EXECUTING:    { code: 'EXECUTING',    label: '执行中' },
  OBSERVED:     { code: 'OBSERVED',     label: '结果观察中' },
  COMPLETED:    { code: 'COMPLETED',    label: '已完成' },
  CLOSED:       { code: 'CLOSED',       label: '已关闭' }
};

/**
 * 主案例 NI-001：门店短视频经营能力提升
 * 包含从 07-28 信号发现到 08-07 改道建议的完整经营历史。
 */
const NI_001 = {
  id: 'NI-001',
  title: '门店短视频经营能力提升',
  priority: 'hi',                 // hi / mid / low（与导航队列优先级一致）
  priorityLabel: '高',

  // —— 目标（属于本事项的专项目标，区别于 DASHBOARD.goals 的全局目标） ——
  goal: {
    label: '持续经营覆盖率',
    current: 62,                  // 执行前/当前覆盖率
    target: 80,                   // 阶段目标
    unit: '%',
    deviation: -18,               // 偏离（目标 - 当前）= 80 - 62 = -18
    impactRegions: 28,            // 影响区域数
    impactStores: 1536,           // 影响门店数
    summary: '大量已具备基础条件的门店，尚未跨过“启动 → 持续经营”门槛。这是当前最值得持续经营的瓶颈。'
  },

  // —— 经营信号（智脑主动发现） ——
  signal: '已培训门店中，持续经营掉队是当前覆盖缺口的主要来源。建议优先处理掉队门店，提升持续内容产出与分发效率。',

  // —— 当前五态：结果观察 / 改道态 ——
  // 语义澄清（验收补充）：currentWorkState 表达「用户此刻在页面主要处理什么（工作模式）」，
  // 而不是「系统最后生成了什么业务对象」。
  // 当前 Demo 时刻：Route A 已执行 → Checkpoint 到达 → Result 改善不足 →
  //   Judgment V2 形成 → Route B 被智脑推荐 → 等待用户查看新路线并进入决策。
  // 该时刻用户仍处在「结果观察 / 改道态」（⑤），故 = RESULT_REVIEW。
  // 注意：Route B.status = RECOMMENDED、activeRouteId = R-A 均保持不变；
  // 经营航迹当前节点仍可是「智脑推荐路线 B（待确认）」——Living Route 表达已发生事件，
  // currentWorkState 表达用户当前工作模式，二者不矛盾。
  // 只有当用户显式点击「查看新路线并决策」后，才进入 ROUTE_CONFIRMATION（见 store.enterRouteConfirmation）。
  currentWorkState: WORK_STATES.RESULT_REVIEW.code,

  // —— 当前激活路线：仍为 Route A（Route B 仅被推荐，未正式确认） ——
  activeRouteId: 'R-A',

  // —— 路线（历史不覆盖，Route A / Route B 共存） ——
  routes: [
    {
      id: 'R-A',
      name: '扩大内容供给',
      status: 'OBSERVED',         // 结果观察中（已执行完并产出 Checkpoint / Result，非执行中）
      recommendedAt: '2026-07-28',
      confirmedDecisionId: 'HD-ROUTE-A',   // 关联 Human Confirm ①
      dispatchedDecisionId: 'HD-DISPATCH-A',// 关联 Human Confirm ②
      // 预期效果（Route A 立项时设定）
      expected: { coverage: 72, contentSupply: '+30%', storeGmv: '+15%' },
      // 行动效果投影用：展示态的“已执行动作”文案（源自路线名称）
      effectActionLabel: '提升内容供给<br>专项行动'
    },
    {
      id: 'R-B',
      name: '分层提升门店持续经营能力',
      status: 'RECOMMENDED',      // 仅被推荐，尚未 Human Confirm
      recommendedAt: '2026-08-07',
      confirmedDecisionId: null,
      dispatchedDecisionId: null
    }
  ],

  // —— 判断（版本历史，不覆盖；V1 仍保留） ——
  judgments: [
    {
      version: 1,
      createdAt: '2026-07-28',
      support: 72,                // 原支持度 %
      conclusion: '内容供给不足是当前主要瓶颈，扩大内容供给可显著提升覆盖率。',
      status: 'SUPERSEDED'        // 已被 V2 部分替代，但历史保留
    },
    {
      version: 2,
      createdAt: '2026-08-07',
      support: 38,                // 新结果出现后支持度下降
      conclusion: '内容不足已经不是唯一主要瓶颈，部分门店缺少持续经营机制和激励机制。',
      status: 'ACTIVE'
    }
  ],
  activeJudgmentVersion: 2,

  // —— 两个人工确认（独立记录，绝不合并） ——
  humanDecisions: [
    {
      id: 'HD-ROUTE-A',
      type: 'ROUTE_CONFIRMATION',         // ① 确认经营路线：AI 推荐 → 人工确认
      routeId: 'R-A',
      decision: '确认采纳 Route A（扩大内容供给）作为当前经营路线',
      confirmedBy: '董事长',
      confirmedAt: '2026-07-29',
      note: '第一次人工确认：路线确认'
    },
    {
      id: 'HD-DISPATCH-A',
      type: 'DISPATCH_CONFIRMATION',      // ② 正式 Action 派发确认
      routeId: 'R-A',
      decision: '确认正式派发 Route A 行动（对象分群 + Owner + 时间 + Evidence 要求 + Checkpoint）',
      confirmedBy: '董事长',
      confirmedAt: '2026-07-30',
      note: '第二次人工确认：派发'
    }
  ],

  // —— 行动（Route A 的 3 个真实行动，3/3 已执行） ——
  actions: [
    { id: 'A-1', routeId: 'R-A', name: '提升内容供给专项行动', owner: '门店运营组', status: 'EXECUTED', executedAt: '2026-07-30' },
    { id: 'A-2', routeId: 'R-A', name: '持续发布节奏建立',     owner: '区域督导',   status: 'EXECUTED', executedAt: '2026-07-30' },
    { id: 'A-3', routeId: 'R-A', name: '正反馈闭环激励',       owner: '激励组',     status: 'EXECUTED', executedAt: '2026-07-30' }
  ],

  // —— 派发（Route A 的正式派发单） ——
  dispatches: [
    {
      id: 'D-A', routeId: 'R-A', decisionId: 'HD-DISPATCH-A',
      targetSegment: '掉队门店', owner: '门店运营组',
      dueAt: '2026-08-06',
      evidenceRequirement: '发布记录 + 成交记录',
      checkpointId: 'CP-1'
    }
  ],

  // —— 执行（Route A 组织执行窗口） ——
  executions: [
    { routeId: 'R-A', startAt: '2026-07-30', endAt: '2026-08-06', executedActions: 3, totalActions: 3 }
  ],

  // —— 检查点（效果观察点 ①） ——
  checkpoints: [
    {
      id: 'CP-1', routeId: 'R-A', label: 'Checkpoint ①', reachedAt: '2026-08-07',
      metrics: [
        { name: '持续经营覆盖率', before: 62,  expected: 72,    actual: 64 },
        { name: '短视频内容供给', before: 100, expected: '+30%', actual: '108 / +8%' },
        { name: '内容有效率',     before: '14.2%', expected: '18%', actual: '16.8%' }
      ],
      // 行动效果投影补充字段（门店 GMV 口径，区别于覆盖率）
      storeGmvActual: '+11%',
      storeGmvSub: '+68 家 · +2.6pp'
    }
  ],

  // —— 结果（历史数组，不覆盖） ——
  results: [
    {
      id: 'RES-A', routeId: 'R-A', checkpointId: 'CP-1', assessedAt: '2026-08-07',
      summary: '覆盖率 62→64（预期 72），内容供给 +8%（预期 +30%）：改善幅度低于目标。',
      outcome: 'PARTIAL_EFFECT',  // 业务结论唯一真相（枚举）；页面文案由 selectResultVerdict 投影，不再用自由文本结论
      metrics: [
        { name: '持续经营覆盖率', before: 62, expected: 72, actual: 64 },
        { name: '短视频内容供给', before: 100, expected: '+30%', actual: '108 / +8%' },
        { name: '内容有效率',     before: '14.2%', expected: '18%', actual: '16.8%' }
      ]
    }
  ],

  // —— 下一步（来自当前 RESULT_REVIEW 态） ——
  nextStep: '优先处理 28 个区域掉队门店，建立持续发布节奏与正反馈闭环；评估 Route B（分层提升持续经营能力）并等待人工确认。',

  // —— 行动效果投影（自由文本，源自 result + nextStep） ——
  effectNextStep: '建议继续观察<br>7 天',
  effectNote: '短视频内容供给提升带动门店 GMV 增长，但覆盖率缺口仍大。下一阶段建议：把已验证打法复制到同档位掉队区域，而非继续追加头部门店资源。',

  // —— 导航队列展示字段：仅保留「展示 / 更新时间」类字段 ——
  // 当前阶段 / 落地率 / 下一步一律由 Selector 从 currentWorkState / executions / routes 推导，
  // 绝不允许 queueStatus 成为第二套业务状态源（见 selectHomeQueue）。
  queueStatus: {
    updated: '2026-08-11 09:30'
  },

  // —— 经营航迹里程碑（全部历史，不覆盖；仅经营级里程碑） ——
  milestones: [
    { id: 'M1',  type: 'SIGNAL_DISCOVERED',     at: '2026-07-28', status: 'done' },
    { id: 'M2',  type: 'JUDGMENT_CREATED',      at: '2026-07-28', judgmentVersion: 1, status: 'done' },
    { id: 'M3',  type: 'ROUTE_RECOMMENDED',     at: '2026-07-28', routeId: 'R-A', status: 'done' },
    { id: 'M4',  type: 'ROUTE_CONFIRMED',       at: '2026-07-29', routeId: 'R-A', decisionId: 'HD-ROUTE-A', status: 'done' },
    { id: 'M5',  type: 'EXECUTION_PREPARED',    at: '2026-07-30', routeId: 'R-A', status: 'done' },
    { id: 'M6',  type: 'DISPATCH_CONFIRMED',    at: '2026-07-30', routeId: 'R-A', decisionId: 'HD-DISPATCH-A', status: 'done' },
    { id: 'M7',  type: 'EXECUTION_STARTED',     at: '2026-07-30', routeId: 'R-A', status: 'done' },
    { id: 'M8',  type: 'CHECKPOINT_REACHED',    at: '2026-08-07', routeId: 'R-A', checkpointId: 'CP-1', status: 'done' },
    { id: 'M9',  type: 'RESULT_ASSESSED',       at: '2026-08-07', routeId: 'R-A', resultId: 'RES-A', status: 'done' },
    { id: 'M10', type: 'JUDGMENT_REVISED',      at: '2026-08-07', judgmentVersion: 2, status: 'done' },
    { id: 'M11', type: 'ROUTE_RECOMMENDED',     at: '2026-08-07', routeId: 'R-B', status: 'current' }  // Route B 推荐，当前态（待人工确认 = 当前节点）
  ]
};

/** 经营导航事项集合（当前仅 NI-001 为完整 canonical；后续事项在此追加） */
export const NAVIGATION_ITEMS = [NI_001];

// =============================================================
// Dashboard 级数据（企业经营地图 / 全局 KPI / 全国经营数据）
// 注意：以下数据不属于单个 Navigation Item，继续留在 Dashboard 层。
// 已从本对象中移除 hero / effectChain / navQueue —— 它们属于 NI-001 的状态，
// 现统一由 NAVIGATION_ITEMS + selectors 投影，杜绝重复维护。
// =============================================================
export const DASHBOARD = {
  // ---------- 顶部上下文栏 ----------
  context: {
    org: '德联集团 / 全国',
    period: '近 30 天（2026-07-01 ~ 2026-07-31）',
    dataDate: '2026-08-14',
    dataConfidence: '高',
    comparePeriod: '2026年6月',
    cyclePeriod: '2026年7月'
  },

  // ---------- 企业级独立决策（真正与 Navigation Item 无关；NI 相关决策改由 selectHomeDecisions 投影） ----------
  // 注意：原「确认门店短视频经营专项策略（第5版 华北优先）」属于 NI-001 路线域决策，
  // 已从此处移除 —— 现在由 selectHomeDecisions 从 NI canonical state 投影（如 Route B 推荐 → 确认新经营路线）。
  decisions: [
    { t: '区域资源调度建议（华北 → 华东）', d: '预计覆盖提升 +6 个百分点，需审批投放预算', act: '查看方案' },
    { t: '确认直播专项激励预算（8月）',     d: '预算 280 万元，预计新增 320 家门店参与', act: '查看并确认' }
  ],

  // ---------- 5 个核心 KPI ----------
  kpi: {
    payGMV: 222.9,            // 支付成交额（万元）
    payGMVMoM: 24,           // 环比（%）
    targetGMV: 129,          // 目标成交额（万元）
    hexiao: 78.5,            // 核销金额（万元）
    hexiaoMoM: 6,            // 核销环比（百分点）
    hexiaoRate: 35,          // 核销率（%）
    hexiaoRateMoM: -6,       // 核销率环比（百分点）
    storeGMV: 79.1,          // 门店成交额（万元）
    storeGMVShare: 35,       // 门店成交额占比（%）
    storeGMVShareMoM: 10,    // 占比环比（百分点）
    refundRate: 32,          // 销售退款率（%）
    refundRateMoM: 3,        // 退款率环比（百分点）
    refundMoney: 72.7,       // 已退款金额（万元）
    dailyDealStore: 108,     // 日均成交门店（家）
    dailyDealStoreMoM: 16,   // 环比（家）
    dailyDealStorePP: 1,     // 环比（百分点）
    dailyDealStoreShare: 7   // 占全部门店比例（%），由 108 / 约 1536 估算
  },

  /**
   * KPI 悬浮解释（人话解释 / 公式 / 数字代入 / 口径）
   * key 与 KPI 卡片的 data-tip 对应。
   */
  kpiTips: {
    '支付成交额': {
      human: '用户在抖音完成下单并支付的总金额，反映销售热度与营销转化能力。',
      formula: '支付成交额 = Σ 各门店页成交金额',
      example: '2026 年 7 月 Σ = 222.9 万元',
      scope: '按订单支付时间统计，含退款前金额。'
    },
    '核销金额': {
      human: '用户到店实际消费并完成核销的金额，反映真实到店收入与履约能力。',
      formula: '核销金额 = Σ 各门店核销金额',
      example: '2026 年 7 月 Σ = 78.5 万元',
      scope: '按实际核销时间统计。'
    },
    '门店成交额': {
      human: '由门店自主账号与内容直接带来的成交额，衡量门店自主经营能力。',
      formula: '门店成交额 = 支付成交额 × 门店贡献占比',
      example: '222.9 万 × 35% ≈ 79.1 万元',
      scope: '按订单支付时间统计，不含总部账号贡献。'
    },
    '销售退款率': {
      human: '成交后退款的金额占成交额的比重，反映履约压力与售后风险。',
      formula: '销售退款率 = 当前销售周期支付订单中已退款金额 ÷ 当前周期支付 GMV',
      example: '2026 年 7 月约 32%，对应退款约 72.7 万元',
      scope: '当月销售当月退款率口径：统计当前销售周期支付的订单，其中同期已发生退款的金额 ÷ 当前周期支付 GMV，避免跨期错位退款率。'
    },
    '日均成交门店': {
      human: '统计周期内平均每天至少产生一笔成交的门店数量。',
      formula: '日均成交门店 = Σ 每日产生支付成交的门店数量 ÷ 统计周期天数',
      example: '约 907 家（每日成交门店数之和）÷ 30 天 ≈ 108 家/天',
      scope: '按成交日期统计，分母为统计周期天数。'
    }
  },

  // ---------- 支付 GMV / 核销金额 趋势 ----------
  trend: {
    months: ['2月', '3月', '4月', '5月', '6月', '7月'],
    pay: [142, 168, 187, 210, 182, 222.9],   // 支付 GMV（万元）
    hx:  [46,  54,  63,  72,  65,  78.5]      // 核销金额（万元）
  },

  // ---------- GMV 来源结构（占比，%） ----------
  source: {
    months: ['5月', '6月', '7月'],
    hq:     [61, 58, 60],    // 总部
    store:  [28, 32, 35],    // 门店
    talent: [7,  6,  4],     // 达人
    other:  [4,  4,  1]      // 其他
  },

  // ---------- 各省支付 GMV 排名 ----------
  provinceRank: [
    { name: '河南', gmv: 34.8, stores: 130, avg: 2675 },
    { name: '山东', gmv: 33.5, stores: 140, avg: 2393 },
    { name: '山西', gmv: 22.9, stores: 53,  avg: 4316 },
    { name: '河北', gmv: 22.4, stores: 66,  avg: 3401 },
    { name: '江苏', gmv: 13.4, stores: 52,  avg: 2578 },
    { name: '甘肃', gmv: 13.3, stores: 67,  avg: 1979 },
    { name: '陕西', gmv: 11.4, stores: 34,  avg: 3351 },
    { name: '新疆', gmv: 10.2, stores: 46,  avg: 2225 }
  ],

  /**
   * 重点关注省份（与排名分离的专项高亮）
   * 这里的数值用于「门店密度高、但店均 GMV 偏低」的专项提示，
   * 与上方排名中该省的常规汇总口径不同，属于独立的分析视角。
   */
  focusProvince: { name: '河北', gmv: 8.1, stores: 143, avg: 566, max: 22.4 },

  // ---------- 门店评分分布（真实） ----------
  ratingDist: [
    { label: '未评分',   value: 421 },
    { label: '3.5分以下', value: 3   },
    { label: '3.5-4.0分', value: 15  },
    { label: '4.0-4.5分', value: 248 },
    { label: '4.5-5.0分', value: 129 }
  ],

  // ---------- 门店经营分分布 ----------
  scoreDist: [
    { label: '80分以下',   value: 299 },
    { label: '80-90分',   value: 87  },
    { label: '90-100分',  value: 400 },
    { label: '100分以上', value: 171 }
  ],

  // ---------- 当前经营目标（全局目标，区别于 NI-001.goal 的专项目标） ----------
  goals: [
    { name: '支付成交额',     current: 222.9, target: 300, unit: '万', color: '#1e4fa3', deviation: -74 },
    { name: '门店成交额占比', current: 35,    target: 45,  unit: '%',  color: '#0F6E56', deviation: -10 }
  ],

  // ---------- 经营导航队列（非 NI-001 的其他经营事项；NI-001 由 selector 投影插入队首） ----------
  queueTabs: [
    { key: 'all',     name: '全部'     },
    { key: 'now',     name: '立即处理 2' },
    { key: 'nav',     name: '导航中 5'  },
    { key: 'watch',   name: '观察中 4'  },
    { key: 'summary', name: '周期汇总 8' }
  ],
  queueOthers: [
    { pri: 'mid', name: '区域直播投放效率优化',   signal: '华北区域直播投入产出比偏低',          range: '8 个区域 / 2,208 家门店', stage: '分析中',   rate: '32%', next: '优化投放策略与资源分配',   updated: '2026-08-11 09:28' },
    { pri: 'mid', name: '售后异常率上升趋势拦截', signal: '7月异常售后较6月明显恶化',            range: '全国',                    stage: '观察中',   rate: '—',   next: '定位高频售后原因并拦截',   updated: '2026-08-10 18:00' },
    { pri: 'low', name: '新店开业爬坡支持',       signal: '华南新店内容产出未达基准',            range: '3 个省 / 27 家门店',     stage: '执行中',   rate: '45%', next: '补齐基础内容与培训',       updated: '2026-08-10 16:45' },
    { pri: 'low', name: '标杆门店投流奖励结算',   signal: '当月发布≥15条奖励待结算',             range: '16 家门店 / 17 个账号', stage: '周期汇总', rate: '—',   next: '完成奖励核算与发放',       updated: '2026-08-09 10:00' }
  ],

  // ---------- 底部说明 ----------
  pageFoot: {
    updated: '2026-08-07 10:00',
    nextUpdate: '2026-08-08 10:00'
  }
};
