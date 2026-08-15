// =============================================================
// 阶段一 · 经营数据与状态底座 自动化校验（node，无浏览器依赖）
// -------------------------------------------------------------
// 运行：在 超级智脑-Demo/ 目录下执行  node tests/foundation.test.mjs
// 覆盖：
//   A. 语法检查（8 个 JS 模块）
//   B. 逻辑单测（NI 唯一真相源 / 五态 / Judgment V1/V2 / Route A/B /
//      activeRouteId / 两个 Human Confirm / milestones / buildJourney / Selector 投影结构）
//   C. 渲染冒烟（renderP01 / province / renderLight + 内容命中）
//   D. 验收问题修复：4 项新增断言
// =============================================================

import {
  NAVIGATION_ITEMS, DASHBOARD, WORK_STATES, MILESTONE_TYPES,
  OUTCOMES, ROUTE_STATUSES
} from '../assets/js/data.js';
import {
  selectHomeHero, selectHomeEffect, selectHomeQueue,
  selectHomeDecisions, selectResultVerdict,
  selectNavigationCenter, selectNavigationDetail
} from '../assets/js/selectors.js';
import { buildJourney, getCurrentJourneyNodes } from '../assets/js/journey.js';
import { renderPage } from '../assets/js/render.js';
import { enterRouteConfirmation, confirmRoute } from '../assets/js/store.js';

// -------------------------------------------------------------
// 极简断言框架
// -------------------------------------------------------------
let pass = 0, fail = 0;
const failures = [];
function assert(cond, name) {
  if (cond) { pass++; }
  else { fail++; failures.push(name); console.log('  ✗ ' + name); }
}
function section(title) { console.log('\n== ' + title + ' =='); }

const ni = NAVIGATION_ITEMS[0];

// =============================================================
// B. 逻辑单测（原阶段一）
// =============================================================
section('B1 · Navigation Item 唯一真相源');
assert(NAVIGATION_ITEMS.length === 1, 'NAVIGATION_ITEMS 仅 1 项');
assert(ni.id === 'NI-001', 'NI-001 存在');

section('B2 · 五态冻结');
assert(Object.keys(WORK_STATES).length === 5, 'WORK_STATES 仅 5 态');
assert(
  ['ANALYSIS','ROUTE_CONFIRMATION','EXECUTION_PREPARATION','ORGANIZATION_EXECUTION','RESULT_REVIEW']
    .every(k => WORK_STATES[k]), '五态 code 齐全'
);

section('B3 · Judgment V1/V2 共存（历史不覆盖）');
const jV1 = ni.judgments.find(j => j.version === 1);
const jV2 = ni.judgments.find(j => j.version === 2);
assert(jV1 && jV1.status === 'SUPERSEDED', 'V1 存在且 SUPERSEDED');
assert(jV2 && jV2.status === 'ACTIVE', 'V2 存在且 ACTIVE');
assert(jV2.support === 38, 'V2 support = 38');

section('B4 · Route A/B 共存，B 仅推荐');
const rA = ni.routes.find(r => r.id === 'R-A');
const rB = ni.routes.find(r => r.id === 'R-B');
assert(rA && rB, 'Route A 与 B 共存');
assert(rB.status === 'RECOMMENDED' && rB.confirmedDecisionId === null, 'Route B 仅 RECOMMENDED 且未确认');

section('B5 · activeRouteId');
assert(ni.activeRouteId === 'R-A', 'activeRouteId = R-A（当前正式路线）');

section('B6 · 两个 Human Confirm 独立');
assert(ni.humanDecisions.length === 2, 'humanDecisions 共 2 条');
const hdIds = ni.humanDecisions.map(h => h.id);
assert(hdIds.includes('HD-ROUTE-A') && hdIds.includes('HD-DISPATCH-A'), '两条独立 id 齐全');
assert(new Set(hdIds).size === 2, '两条 id 不重复');
assert(ni.humanDecisions.find(h => h.id === 'HD-ROUTE-A').type === 'ROUTE_CONFIRMATION', 'HD-ROUTE-A 为路线确认');
assert(ni.humanDecisions.find(h => h.id === 'HD-DISPATCH-A').type === 'DISPATCH_CONFIRMATION', 'HD-DISPATCH-A 为派发确认');
assert(ni.humanDecisions.every(h => h.routeId === 'R-A'), '两个确认均关联 R-A');

section('B7 · milestones（移除 STABLE_OBSERVATION 后 = 11 条）');
assert(ni.milestones.length === 11, `milestones 共 11 条（实际 ${ni.milestones.length}）`);
assert(!ni.milestones.some(m => m.type === 'STABLE_OBSERVATION'), '无 STABLE_OBSERVATION milestone');

section('B8 · buildJourney 正确');
const journey = buildJourney(ni);
const m3 = journey.find(n => n.id === 'M3');   // ROUTE_RECOMMENDED R-A
const m8 = journey.find(n => n.id === 'M8');   // CHECKPOINT_REACHED
const m11 = journey.find(n => n.id === 'M11'); // ROUTE_RECOMMENDED R-B（当前）
assert(m3 && m3.state === 'completed' && m3.branchFrom === null, 'M3(R-A 推荐) completed 且 branchFrom=null');
assert(m8 && m8.state === 'checkpoint', 'M8(Checkpoint) checkpoint');
assert(m11 && m11.state === 'current' && m11.branchFrom === 'R-A', 'M11(R-B 推荐) current 且 branchFrom=R-A');
assert(m11.label.includes('分层提升门店持续经营能力'), 'M11 文案含路线名（推荐路线 B）');
const currents = getCurrentJourneyNodes(ni);
assert(currents.length === 1 && currents[0].id === 'M11', '当前节点仅 M11（Route B 推荐）');
assert(journey[journey.length - 1].id === 'M11', '航迹末尾节点 = M11');

section('B9 · Selector 投影结构不变（无 UI 回归）');
const hero = selectHomeHero(ni);
assert(['badges','title','lead','stats','signal','nextStep'].every(k => k in hero), 'hero 结构字段齐全');
const eff = selectHomeEffect(ni);
assert(['steps','note'].every(k => k in eff) && eff.steps.length === 5, 'effect 结构：steps(5)+note');
assert(eff.steps.every(s => ['icon','label','value'].every(k => k in s)), 'effect 每步含 icon/label/value');
const q0 = selectHomeQueue(ni, DASHBOARD)[0];
assert(['pri','name','signal','range','stage','rate','next','updated'].every(k => k in q0), 'queue 队首结构字段齐全');
const dec = selectHomeDecisions(ni, DASHBOARD);
assert(Array.isArray(dec) && dec.every(d => ['t','d','act'].every(k => k in d)), 'decisions 每项含 t/d/act');

// =============================================================
// C. 渲染冒烟
// =============================================================
section('C · 渲染冒烟（render.js 真实渲染函数）');
let renderOk = true, renderLen = 0, renderHtml = '';
try {
  const data = {
    ...DASHBOARD,
    hero: selectHomeHero(ni),
    effectChain: selectHomeEffect(ni),
    navQueue: selectHomeQueue(ni, DASHBOARD),
    decisions: selectHomeDecisions(ni, DASHBOARD)
  };
  const p01 = renderPage('P01', data);
  const prov = renderPage('province', data);
  const p05 = renderPage('P05', data);
  renderHtml = p01 + prov + p05;
  renderLen = renderHtml.length;
  assert(typeof p01 === 'string' && p01.length > 0, 'renderP01 产出非空');
  assert(typeof prov === 'string' && prov.length > 0, 'province 页产出非空');
  assert(typeof p05 === 'string' && p05.length > 0, 'P05 占位页产出非空');
} catch (e) {
  renderOk = false;
  console.log('  ✗ 渲染抛出异常：' + e.message);
}
assert(renderOk, '渲染全程无异常');

if (renderOk) {
  const mustContain = [
    '门店短视频经营能力提升',
    '部分有效',                 // 由 outcome 枚举投影（PARTIAL_EFFECT → 部分有效）
    '+68 家 · +2.6pp',
    '各省支付 GMV',
    '显示更多',
    '行动效果',
    '企业经营导航队列',
    '等待你的决策',
    '结果观察',                 // 新：阶段由 currentWorkState(RESULT_REVIEW) 推导
    '确认新经营路线'            // 新：NI 投影决策（RECOMMENDED 路线驱动，与 currentWorkState 无关）
  ];
  mustContain.forEach(s => assert(renderHtml.includes(s), `内容命中：「${s}」`));
  // 矛盾守卫：旧的硬编码 queueStatus 值 '68%' 不得再出现
  assert(!renderHtml.includes('68%'), '内容不含旧的硬编码落地率 68%');
}

// =============================================================
// D. 验收问题修复 · 4 项新增断言
// =============================================================
section('D1 · 问题1：当前节点停在「推荐路线 B（待人工确认）」，无 STABLE_OBSERVATION');
assert(!ni.milestones.some(m => m.type === 'STABLE_OBSERVATION'), 'NI-001 无 STABLE_OBSERVATION');
const lastNode = buildJourney(ni)[buildJourney(ni).length - 1];
assert(
  lastNode.type === 'ROUTE_RECOMMENDED' && lastNode.routeId === 'R-B' &&
  lastNode.state === 'current' && lastNode.branchFrom === 'R-A',
  'buildJourney 当前节点 = Route B 推荐（current, branchFrom=R-A）'
);
assert(ni.currentWorkState === 'RESULT_REVIEW', 'currentWorkState = RESULT_REVIEW（用户此刻工作模式仍为结果观察 / 改道态，与「Route B 待确认」不矛盾）');

section('D2 · 问题2：决策从 NI canonical 投影；Route B 确认后自动消失');
const dec2 = selectHomeDecisions(ni, DASHBOARD);
assert(
  dec2.some(d => d.kind === 'CONFIRM_ROUTE' && d.routeId === 'R-B' && d.t.includes('确认新经营路线')),
  'P01 自动出现「确认新经营路线」（来自 NI RECOMMENDED route）'
);
assert(
  !DASHBOARD.decisions.some(d => d.t.includes('门店短视频经营专项策略')),
  'Dashboard 不再包含 NI 相关的路线确认决策（仅保留企业级独立决策）'
);
// 未来场景模拟：Route B 被确认
const cloned = structuredClone(ni);
cloned.routes.find(r => r.id === 'R-B').status = 'CONFIRMED';
const decAfterConfirm = selectHomeDecisions(cloned, DASHBOARD);
assert(
  !decAfterConfirm.some(d => d.kind === 'CONFIRM_ROUTE' && d.routeId === 'R-B'),
  'Route B 确认后，「确认新经营路线」决策自动消失'
);
assert(
  decAfterConfirm.some(d => d.kind === 'CONFIRM_DISPATCH' && d.routeId === 'R-B'),
  'Route B 确认后，自动转为「确认正式派发」（status 驱动，无硬编码）'
);

section('D3 · 问题3：queueStatus 不再含业务状态字段；阶段由 currentWorkState 推导无矛盾');
const qs = ni.queueStatus;
assert(!('stage' in qs) && !('rate' in qs) && !('next' in qs), 'queueStatus 无 stage/rate/next（仅展示字段）');
assert('updated' in qs, 'queueStatus 保留 updated（展示/更新时间）');
const q0b = selectHomeQueue(ni, DASHBOARD)[0];
assert(q0b.stage === '结果观察', '队列阶段由 currentWorkState 推导（RESULT_REVIEW → 结果观察）');
assert(q0b.rate === '100%', '队列落地率由 executions 推导（R-A 3/3 → 100%）');
assert(q0b.next.includes('确认新经营路线'), '队列下一步由待确认路线推导');
// 矛盾守卫：currentWorkState 与展示阶段不可能背离（阶段本就由 currentWorkState 推导）
assert(!(ni.currentWorkState === 'RESULT_REVIEW' && q0b.stage === '执行中'), '无「RESULT_REVIEW vs 执行中」式矛盾');
assert(
  q0b.stage === ({ ANALYSIS:'分析中', ROUTE_CONFIRMATION:'路线确认中', EXECUTION_PREPARATION:'准备中', ORGANIZATION_EXECUTION:'执行中', RESULT_REVIEW:'结果观察' }[ni.currentWorkState]),
  '队列阶段严格等于 currentWorkState 的单一映射（不可能矛盾）'
);

section('D4 · 问题4：Route 状态语义拆分 + 统一 Result 语义（outcome 枚举）');
assert(rA.status === 'OBSERVED' && rA.status !== 'EXECUTING', 'Route A 不再 EXECUTING，改为 OBSERVED（已执行并产出 Checkpoint/Result）');
assert(Object.keys(ROUTE_STATUSES).includes(rA.status), 'R-A status 属 ROUTE_STATUSES 枚举');
assert(rB.status === 'RECOMMENDED', 'Route B 保持 RECOMMENDED');
assert(ni.activeRouteId === 'R-A', 'activeRouteId 仍指向当前正式路线 R-A');
const resA = ni.results.find(r => r.id === 'RES-A');
assert(resA && resA.outcome === 'PARTIAL_EFFECT', 'Result 用 outcome 枚举（PARTIAL_EFFECT）');
assert(!('shortVerdict' in resA), 'Result 不再用自由文本 shortVerdict（唯一真相 = outcome）');
assert(selectResultVerdict(resA.outcome) === '部分有效', 'selectResultVerdict 将 outcome 投影为「部分有效」');
assert(Object.keys(OUTCOMES).length === 5, 'OUTCOMES 枚举齐全（5 类结论）');

// =============================================================
// E. 验收补充 · 状态语义修正（currentWorkState = 工作模式，非业务对象）
// =============================================================
section('E1 · 初始冻结状态（RESULT_REVIEW / R-B RECOMMENDED / activeRouteId = R-A）');
assert(ni.currentWorkState === 'RESULT_REVIEW', '初始 currentWorkState = RESULT_REVIEW');
assert(rB.status === 'RECOMMENDED', '初始 Route B.status = RECOMMENDED');
assert(ni.activeRouteId === 'R-A', '初始 activeRouteId = R-A');

section('E2 · 即使处于 RESULT_REVIEW，RECOMMENDED 路线仍驱动 P01 出现新路线决策');
const decE = selectHomeDecisions(ni, DASHBOARD);
assert(
  decE.some(d => d.kind === 'CONFIRM_ROUTE' && d.routeId === 'R-B' && d.t.includes('确认新经营路线')),
  'currentWorkState=RESULT_REVIEW 下，P01 仍自动出现「确认新经营路线」（R-B）'
);
const qE = selectHomeQueue(ni, DASHBOARD)[0];
assert(qE.stage === '结果观察', '此时队列阶段 = 结果观察（由 RESULT_REVIEW 投影，不再显示「路线确认中」）');
assert(!(ni.currentWorkState === 'ROUTE_CONFIRMATION'), '此时 currentWorkState 未被 Route B 推荐自动改为 ROUTE_CONFIRMATION');

section('E3 · 用户显式进入路线确认态（enterRouteConfirmation）');
enterRouteConfirmation('NI-001', 'R-B');
assert(ni.currentWorkState === 'ROUTE_CONFIRMATION', 'enterRouteConfirmation 后 currentWorkState = ROUTE_CONFIRMATION（② 经营路线确认态）');
assert(rB.status === 'RECOMMENDED', '此时 Route B 仍只是 RECOMMENDED（尚未 Human Confirm）');
assert(ni.activeRouteId === 'R-A', '此时 activeRouteId 仍为 R-A（正式路线未变）');

section('E4 · Route B Human Confirm 后（confirmRoute）');
confirmRoute('NI-001', 'R-B');
assert(ni.activeRouteId === 'R-B', 'confirmRoute 后 activeRouteId = R-B');
assert(rB.status === 'CONFIRMED', 'confirmRoute 后 Route B.status = CONFIRMED');
assert(ni.currentWorkState === 'EXECUTION_PREPARATION', 'confirmRoute 后 currentWorkState = EXECUTION_PREPARATION（③ 执行准备态）');

// =============================================================
// 汇总
// =============================================================
console.log('\n========================================');
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
if (fail > 0) {
  console.log('失败项：\n - ' + failures.join('\n - '));
  process.exit(1);
} else {
  console.log('✅ 全部断言通过');
  process.exit(0);
}
