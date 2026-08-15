// =============================================================
// 渲染层（Render Layer）
// -------------------------------------------------------------
// 职责：
//   纯模板函数，把「数据」转换为 HTML 字符串。
//   所有函数都接收 data（来自 api.js / data.js）作为参数，
//   不在本文件内写死任何业务数值（数值归 data.js 管理）。
//   本层不负责取数、不负责图表，只负责「画页面」。
// =============================================================

import { NAV, LIGHT_PAGES } from './data.js';

// -------------------------------------------------------------
// 侧边导航
// -------------------------------------------------------------
export function sidebarHtml(activePage, data) {
  const items = NAV.map(n =>
    `<div class="nav-item ${n.id === activePage ? 'active' : ''}" onclick="gotoPage('${n.id}')">
       <span class="ic">${n.ic}</span>${n.n}
     </div>`
  ).join('');

  return `<div class="sidebar">
    <div class="brand">
      <div class="logo">智</div>
      <div><div class="name">超级智脑</div><div class="sub">经营导航中枢</div></div>
    </div>
    <div class="nav-group">一级经营空间</div>
    <div class="nav">${items}</div>
    <div class="side-foot"><span class="dot"></span>智脑运行中 · 数据已更新至 ${data.context.dataDate}</div>
  </div>`;
}

// -------------------------------------------------------------
// 顶部上下文栏
// -------------------------------------------------------------
export function ctxBarHtml(data) {
  const c = data.context;
  return `<div class="ctxbar">
    <div class="ctx-scope"><span>🏢</span><span>${c.org}</span><span style="color:var(--text-3)">▼</span></div>
    <div class="ctx-item"><span class="k">时间范围</span><span class="v">${c.period}</span></div>
    <div class="ctx-item"><span class="k">数据截止</span><span class="v">${c.dataDate} 09:30</span></div>
    <span class="ctx-chip">数据可靠性：${c.dataConfidence}</span>
    <div class="ctx-bar-spacer"></div>
    <div class="search"><span>🔍</span><span>搜索指标、门店、策略、决策…</span></div>
    <button class="evidence-btn" onclick="toast('打开证据速查：追溯当前判断的原始数据与快照')">证据速查</button>
    <button class="ask-btn" onclick="toast('智脑问答入口：可追问当前判断与证据')">询问超级智脑</button>
    <div class="user"><div class="avatar">董</div><div style="font-size:13px;font-weight:700">董事长</div></div>
  </div>`;
}

// -------------------------------------------------------------
// 页面路由：根据 pageId 选择对应渲染函数
// -------------------------------------------------------------
export function renderPage(pageId, data) {
  if (pageId === 'P01') return renderP01(data);
  if (pageId === 'province') return provincePageHtml(data);
  return renderLight(pageId, data);
}

// =============================================================
// P01 首页
// =============================================================
function renderP01(data) {
  return `${heroDecisionGrid(data)}
  ${dataMapModule(data)}
  ${bottomModule(data)}`;
}

/** 首屏：左 Hero + 右 等待决策 */
function heroDecisionGrid(data) {
  return `<div class="grid layout-hero">
    ${heroModule(data)}
    ${decisionModule(data)}
  </div>`;
}

/** 今日经营导航（Hero） */
function heroModule(data) {
  const h = data.hero;
  const badges = h.badges.map(b => `<span class="badge ${b.type}">${b.text}</span>`).join('');
  const stats = h.stats.map(s =>
    `<div class="hstat">
       <div class="k">${s.label}</div>
       <div class="v">${s.value}</div>
       <div class="delta ${s.trend}">${s.delta}</div>
     </div>`
  ).join('');

  return `<div class="hero">
    <div class="eyebrow">${badges}</div>
    <h2>${h.title}</h2>
    <div class="lead">${h.lead}</div>
    <div class="hero-stats">${stats}</div>
    <div class="brain-signal">
      <div class="ic">🧠</div>
      <div class="tx"><b>智脑信号：</b>${h.signal}</div>
    </div>
    <div class="suggest-next">
      <div class="arr">→</div>
      <div class="tx"><b>建议下一步：</b>${h.nextStep}</div>
      <button class="btn primary" onclick="toast('进入经营导航：查看路线与行动')">进入经营导航 →</button>
    </div>
  </div>`;
}

/** 等待决策（右侧卡片） */
function decisionModule(data) {
  const list = data.decisions.map((d, i) =>
    `<div class="decitem" onclick="toast('打开决策：${d.t}')">
       <div class="num">${i + 1}</div>
       <div class="body"><div class="t">${d.t}</div><div class="d">${d.d}</div></div>
       <div class="act">${d.act} →</div>
     </div>`
  ).join('');

  return `<div class="card" style="display:flex;flex-direction:column">
    <div class="ch"><span>等待你的决策</span><span class="badge brand">${data.decisions.length}</span></div>
    <div class="cb" style="flex:1;display:flex;flex-direction:column;gap:10px">${list}</div>
  </div>`;
}

/** 企业经营地图 / 数据地图 */
function dataMapModule(data) {
  const c = data.context;
  return `<div style="margin-top:18px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div class="sec-title" style="margin-bottom:0">
        <span class="ic" style="background:var(--brand)">数</span>企业经营地图 / 数据地图
        <span style="font-size:12px;color:var(--text-3);font-weight:400;margin-left:8px">经营全局概览</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;font-size:12px;color:var(--text-2)">
        <span>对比周期：${c.comparePeriod}</span>
        <span class="tag">周期：${c.cyclePeriod}</span>
        <span class="tag" style="cursor:pointer">筛选 ▼</span>
      </div>
    </div>

    <div class="kpi-grid" style="margin-bottom:16px">${kpiGridHtml(data)}</div>

    <div class="grid layout-charts">
      <div class="card">
        <div class="ch">支付 GMV / 核销金额趋势</div>
        <div class="cb">
          <div id="chart-trend" class="chart-box"></div>
          <div class="chart-footnote"><strong>说明：</strong>支付 GMV 按订单支付时间；核销金额按核销时间。</div>
        </div>
      </div>
      <div class="card">
        <div class="ch">
          <span>GMV 来源结构</span>
          <div class="right">
            <span class="tag" style="background:var(--brand-soft);color:var(--brand);border-color:var(--brand-line)">占比结构</span>
            <span class="tag" style="cursor:pointer">占比趋势</span>
          </div>
        </div>
        <div class="cb">
          <div id="chart-source" class="chart-box"></div>
          <div class="chart-footnote"><strong>门店 GMV ¥${data.kpi.storeGMV} 万 / 占比 ${data.kpi.storeGMVShare}% / 较上期 ↑ ${data.kpi.storeGMVShareMoM}pp</strong></div>
        </div>
      </div>
      <div class="card">
        <div class="ch">
          <span>各省支付 GMV</span>
          <div class="right" style="font-size:12px;color:var(--brand);font-weight:600">
            <span style="margin-right:4px">💡</span>智能说明：河北门店密度偏高，但店均 GMV 明显偏低
          </div>
        </div>
        <div class="cb" style="padding:12px 16px">${provinceRankHtml(data, 3)}</div>
      </div>
    </div>

    <div class="grid layout-goals">
      <div class="card">
        <div class="ch">当前经营目标</div>
        <div class="cb">${data.goals.map(goalRow).join('')}</div>
      </div>
      <div class="card">
        <div class="ch">门店评分分布</div>
        <div class="cb">
          <div id="chart-rating" class="chart-box-sm"></div>
          <div class="chart-footnote"><strong>说明：</strong>基于 2026-07-20 全部门店评分数据；未评分门店不纳入均值计算。</div>
        </div>
      </div>
      <div class="card">
        <div class="ch">门店经营分分布</div>
        <div class="cb">
          <div id="chart-score" class="chart-box-sm"></div>
          <div class="chart-footnote"><strong>说明：</strong>经营分反映门店基础运营能力，100 分以上为良好水平。</div>
        </div>
      </div>
    </div>
  </div>`;
}

// -------------------------------------------------------------
// KPI 卡片
// -------------------------------------------------------------
// KPI 卡片配置：仅描述「从 data.kpi 取哪个字段、如何展示」，
// 不存放数值本身。新增/调整指标只需改这里 + data.js。
const KPI_CARDS = [
  {
    tip: '支付成交额', label: '支付 GMV', field: 'payGMV', prefix: '¥', unit: '万',
    sub: d => `目标完成 ${Math.round(d.payGMV / d.targetGMV * 100)}%`,
    bottom: d => seg('up', `↑ ${d.payGMVMoM}%`, '较上期')
  },
  {
    tip: '核销金额', label: '核销', field: 'hexiao', prefix: '¥', unit: '万',
    sub: d => `核销率 ${d.hexiaoRate}%`,
    bottom: d => seg('down', `↓ ${Math.abs(d.hexiaoMoM)}pp`, '较上期')
  },
  {
    tip: '门店成交额', label: '门店 GMV', field: 'storeGMV', prefix: '¥', unit: '万',
    sub: d => `占比 ${d.storeGMVShare}%`,
    bottom: d => seg('up', `↑ ${d.storeGMVShareMoM}pp`, '较上期')
  },
  {
    tip: '销售退款率', label: '销售退款率', field: 'refundRate', prefix: '', unit: '%',
    valueClass: 'risk', // 数值标红
    sub: d => `已退款 <span>¥${d.refundMoney} 万</span>`,
    bottom: d => seg('up', `↑ ${d.refundRateMoM}pp`, '较上期')
  },
  {
    tip: '日均成交门店', label: '日均成交门店', field: 'dailyDealStore', prefix: '', unit: '家',
    sub: d => `占全部门店 <span>${d.dailyDealStoreShare}%</span>`,
    bottom: d => `${seg('up', `↑ +${d.dailyDealStoreMoM}家`, '')}<span class="divider">|</span>${seg('up', `↑ +${d.dailyDealStorePP}pp`, '较上期')}`
  }
];

/** 生成单段「涨跌标注」HTML（趋势色 + 文案 + 备注） */
function seg(trend, text, note) {
  return `<span class="delta ${trend}">${text}</span>${note ? `<span class="note">${note}</span>` : ''}`;
}

function kpiGridHtml(data) {
  const k = data.kpi;
  return KPI_CARDS.map(cfg => {
    const valueHtml = `<div class="v"${cfg.valueClass ? ` style="color:var(--${cfg.valueClass})"` : ''}>
        ${cfg.prefix ? `<span class="prefix">${cfg.prefix}</span>` : ''}${k[cfg.field]}${cfg.unit ? `<span class="unit">${cfg.unit}</span>` : ''}
      </div>`;
    return `<div class="kpi" data-kpi="${cfg.tip}">
        <div class="qicon" data-tip="${cfg.tip}">?</div>
        <div class="k">${cfg.label}</div>
        ${valueHtml}
        <div class="sub">${cfg.sub(k)}</div>
        <div class="bottom">${cfg.bottom(k)}</div>
      </div>`;
  }).join('');
}

// -------------------------------------------------------------
// 省份支付 GMV 排名
// -------------------------------------------------------------
// limit 存在时只显示前 N 名（首页用 3），并出现「显示更多」跳转按钮；
// 不传 limit 时显示全量（省份详情页用）。
function provinceRankHtml(data, limit) {
  const ranks = data.provinceRank;
  const max = ranks[0].gmv;
  const focus = data.focusProvince;
  const list = limit ? ranks.slice(0, limit) : ranks;

  const rows = list.map((p, i) =>
    `<div class="rank-row">
       <div class="idx">${i + 1}</div>
       <div class="prov">${p.name}</div>
       <div class="gmv-col">
         <div class="bar-wrap"><div class="bar-fill" style="width:${(p.gmv / max * 100).toFixed(1)}%"></div></div>
         <div class="val">${p.gmv.toFixed(1)}</div>
       </div>
       <div class="stores">${p.stores} 家</div>
       <div class="avg">${p.avg.toLocaleString()}</div>
     </div>`
  ).join('');

  // 底部：首页（limit 存在）显示「显示更多」按钮 + 重点关注标签；全量页只显示标签
  const footHtml = limit
    ? `<div class="province-foot">
         <div class="focus-label">🔍 重点关注</div>
         <button class="prov-more-btn" onclick="gotoPage('province')">显示更多 →</button>
       </div>`
    : `<div class="focus-label">🔍 重点关注</div>`;

  return `<div class="prov-scroll">
    <div class="province-wrap">
      <div class="rank-head">
        <div>排名</div><div>省份</div>
        <div class="gmv-head">支付 GMV（万元）</div>
        <div>门店数</div><div>店均 GMV（元）</div>
      </div>
      ${rows}
      ${footHtml}
      <div class="focus-row">
        <div class="idx">—</div>
        <div class="prov">${focus.name}</div>
        <div class="gmv-col">
          <div class="bar-wrap"><div class="bar-fill" style="width:${(focus.gmv / focus.max * 100).toFixed(1)}%"></div></div>
          <div class="val">${focus.gmv}</div>
        </div>
        <div class="stores">${focus.stores} 家</div>
        <div class="avg">${focus.avg}</div>
      </div>
      <div class="chart-footnote" style="margin-top:10px"><strong>说明：</strong>支付 GMV 按订单支付时间；店均 GMV = 支付 GMV ÷ 门店数。</div>
    </div>
  </div>`;
}

// -------------------------------------------------------------
// 底部模块：行动效果 + 经营目标 + 导航队列 + 页脚
// -------------------------------------------------------------
function bottomModule(data) {
  return `<div class="card" style="margin-top:18px">
      <div class="ch">行动效果</div>
      <div class="cb">${effectPathHtml(data)}${effectNoteHtml(data)}</div>
    </div>
    ${queueModule(data)}
    <div class="page-foot">
      <span class="update"><span>🕐</span>数据更新：${data.pageFoot.updated}</span>
      <span>数据口径说明</span>
      <span>下次更新：${data.pageFoot.nextUpdate}</span>
    </div>`;
}

/** 行动效果 5 步链路（图标+小字放左侧，主值放大放右侧） */
function effectPathHtml(data) {
  const steps = data.effectChain.steps.map((s, i) => {
    const subHtml = s.sub ? `<div class="sub">${s.sub}</div>` : '';
    const block = `<div class="effect-step">
        <div class="effect-left">
          <div class="icn">${s.icon}</div>
          <div class="lab">${s.label}</div>
        </div>
        <div class="effect-right">
          <div class="val">${s.value}</div>
          ${subHtml}
        </div>
      </div>`;
    // 步骤之间插入箭头（最后一步不加）
    return i < data.effectChain.steps.length - 1
      ? block + `<div class="effect-arrow">→</div>`
      : block;
  }).join('');
  return `<div class="effect-path">${steps}</div>`;
}

function effectNoteHtml(data) {
  return `<div class="effect-note"><strong>智脑判断：</strong>${data.effectChain.note}</div>`;
}

/** 单条经营目标进度 */
function goalRow(g) {
  const pct = Math.min((g.current / g.target * 100), 100).toFixed(0);
  const diffText = g.deviation < 0 ? `偏离 ${g.deviation}${g.unit}` : `达成 +${g.deviation}${g.unit}`;
  const diffColor = g.deviation < 0 ? 'var(--risk)' : 'var(--evi)';
  return `<div class="goal-row">
    <div class="name">${g.name}</div>
    <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${g.color}"></div></div>
    <div class="nums">当前 ${g.current}${g.unit} · 目标 ${g.target}${g.unit}</div>
    <div class="status" style="color:${diffColor}">${diffText}</div>
  </div>`;
}

/** 经营导航队列 */
function queueModule(data) {
  const tabHtml = data.queueTabs.map((t, i) =>
    `<span class="qtab ${i === 0 ? 'active' : ''}" onclick="toast('切换筛选：${t.name}')">${t.name}</span>`
  ).join('');

  const rows = data.navQueue.map(q =>
    `<tr>
       <td><span class="pri ${q.pri === 'hi' ? '' : q.pri === 'mid' ? 'mid' : 'low'}"></span><span class="name">${q.name}</span><div class="meta">${q.signal}</div></td>
       <td>${q.range}</td>
       <td><span class="tag">${q.stage}</span></td>
       <td><div class="progress-bg"><div class="progress-fill" style="width:${q.rate === '—' ? '0' : q.rate}"></div></div>${q.rate}</td>
       <td>${q.next}</td>
       <td>${q.updated}</td>
     </tr>`
  ).join('');

  return `<div style="margin-top:18px">
    <div class="sec-title"><span class="ic" style="background:var(--warn)">队</span>企业经营导航队列</div>
    <div class="card">
      <div class="ch"><span class="sub">按优先级与阶段持续跟踪</span></div>
      <div class="cb" style="padding:14px 18px">
        <div class="queue-tabs">${tabHtml}</div>
        <div style="overflow-x:auto">
          <table class="queue-table">
            <thead><tr>
              <th>优先级 / 事项名称</th><th>影响范围</th><th>当前阶段</th>
              <th>落地率</th><th>下一步建议</th><th>更新时间</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;
}

// =============================================================
// 省份详情页（轻量页，全量排名）
// =============================================================
function provincePageHtml(data) {
  return `<div class="light-page">
    <div class="eyebrow" style="font-size:12px;color:var(--brand);font-weight:700;margin-bottom:8px">省份经营详情</div>
    <h1>各省支付 GMV 排名</h1>
    <div class="lead">全国门店支付成交额按省份汇总，支持查看省份排名、门店密度与店均产出。</div>
    <div class="card">
      <div class="ch"><span>各省支付 GMV 全量排名</span><span class="sub">数据截止 ${data.context.dataDate}</span></div>
      <div class="cb" style="padding:12px 16px">${provinceRankHtml(data)}</div>
    </div>
    <div style="margin-top:18px"><button class="btn ghost" onclick="gotoPage('P01')">← 返回总览台</button></div>
  </div>`;
}

// =============================================================
// 其余经营空间（P02~P10）轻量占位页
// =============================================================
function renderLight(pageId, data) {
  const m = LIGHT_PAGES[pageId];
  return `<div class="light-page">
    <div class="eyebrow" style="font-size:12px;color:var(--brand);font-weight:700;margin-bottom:8px">${m.n}</div>
    <h1>${m.n}</h1>
    <div class="lead">${m.lead}</div>
    <div class="card"><div class="ch">${m.n} · 功能占位</div>
      <div class="cb" style="color:var(--text-2);line-height:1.8">
        当前 Demo 重点呈现 P01 企业经营导航首页。其他经营空间在本版本中仅保留入口与定位说明，后续按主故事验收优先级逐页深化。
        <div style="margin-top:16px"><button class="btn ghost" onclick="gotoPage('P01')">← 返回总览台</button></div>
      </div>
    </div>
  </div>`;
}
