// =============================================================
// 应用入口（App Controller）
// -------------------------------------------------------------
// 职责：
//   1. 启动时通过 api.js 异步拉取数据（未来即后端接口）；
//   2. 维护页面状态（当前页、数据）；
//   3. 调用 render.js 渲染界面、charts.js 渲染图表；
//   4. 绑定交互：KPI 悬浮解释、轻提示 toast、窗口缩放自适应。
// 本文件不存放业务数据，也不写死页面结构。
// =============================================================

import { getDashboard, getNavigationItem } from './api.js';
import { sidebarHtml, ctxBarHtml, renderPage } from './render.js';
import { initCharts, resizeCharts } from './charts.js';
import { selectHomeHero, selectHomeEffect, selectHomeQueue, selectHomeDecisions } from './selectors.js';

// -------------------------------------------------------------
// 应用状态
// -------------------------------------------------------------
const state = {
  page: 'P01',     // 当前页面路由（对应 NAV.id）
  data: null       // 首页全部数据（来自 api.getDashboard）
};

// -------------------------------------------------------------
// 全局轻提示（toast）
// -------------------------------------------------------------
function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1800);
}
// 暴露给模板内的 onclick="toast(...)" 调用
window.toast = toast;

// -------------------------------------------------------------
// 页面路由：切换页面并重新渲染
// -------------------------------------------------------------
function gotoPage(pageId) {
  state.page = pageId;
  renderApp();
  window.scrollTo(0, 0);
}
// 暴露给模板内 onclick="gotoPage(...)" 调用
window.gotoPage = gotoPage;

// -------------------------------------------------------------
// 主渲染流程
// -------------------------------------------------------------
function renderApp() {
  const app = document.getElementById('app');

  // 组装：侧边导航 + 主区（上下文栏 + 画布内容）
  app.innerHTML =
    sidebarHtml(state.page, state.data) +
    `<div class="main">${ctxBarHtml(state.data)}<div class="canvas">${renderPage(state.page, state.data)}</div></div>`;

  // 仅 P01 首页需要图表与 KPI 悬浮解释
  if (state.page === 'P01') {
    initCharts(state.data);
    bindKpiTooltips();
  }
}

// -------------------------------------------------------------
// KPI 悬浮解释（鼠标悬停右上角 ? 图标）
// -------------------------------------------------------------
function bindKpiTooltips() {
  const tooltip = document.getElementById('kpiTooltip');

  document.querySelectorAll('.kpi .qicon').forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      const name = icon.dataset.tip;
      const t = state.data.kpiTips[name];
      if (!t) return;

      tooltip.innerHTML =
        `<div class="tt">${name}</div>
         <div><b>人话解释：</b>${t.human}</div>
         <div class="tl"><b>公式：</b><span class="tv">${t.formula}</span></div>
         <div class="tl"><b>当前数字代入：</b><span class="tv">${t.example}</span></div>
         <div class="tl"><b>时间口径：</b><span class="tv">${t.scope}</span></div>`;
      tooltip.classList.add('show');
      positionTooltip(icon, tooltip);
    });
    icon.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
  });
}

/** 计算悬浮卡片位置（避免超出视口） */
function positionTooltip(icon, tooltip) {
  const rect = icon.getBoundingClientRect();
  const tRect = tooltip.getBoundingClientRect();
  let top = rect.top - tRect.height - 8;
  let left = rect.left + rect.width / 2 - tRect.width / 2;
  if (left < 10) left = 10;
  if (left + tRect.width > window.innerWidth - 10) left = window.innerWidth - tRect.width - 10;
  tooltip.style.top = top + 'px';
  tooltip.style.left = left + 'px';
}

// -------------------------------------------------------------
// 窗口缩放：图表自适应（仅重绘图表，不重建 DOM）
// -------------------------------------------------------------
window.addEventListener('resize', () => {
  if (state.page === 'P01') resizeCharts();
});

// -------------------------------------------------------------
// 启动：先拉数据，再渲染
// -------------------------------------------------------------
async function bootstrap() {
  try {
    const dashboard = await getDashboard();
    const ni = await getNavigationItem();   // 默认取 NI-001（canonical）

    // 装配页面数据：
    // - 企业经营地图 / 全局 KPI / 全国数据 → 直接来自 Dashboard；
    // - 首屏 Hero / 行动效果 / 导航队列队首（NI-001 部分）→ 由 Selector 从
    //   Navigation Item 唯一真相源投影，杜绝在 hero/effectChain/navQueue 重复维护；
    // - 等待决策 → 来自 Dashboard 决策数据（非 NI 复制状态）。
    state.data = {
      ...dashboard,
      hero: selectHomeHero(ni),
      effectChain: selectHomeEffect(ni),
      navQueue: selectHomeQueue(ni, dashboard),
      decisions: selectHomeDecisions(ni, dashboard)
    };

    renderApp();
  } catch (err) {
    console.error('首页数据加载失败：', err);
    document.getElementById('app').innerHTML =
      `<div style="padding:40px;color:var(--risk)">数据加载失败，请检查接口或网络。</div>`;
  }
}

bootstrap();
