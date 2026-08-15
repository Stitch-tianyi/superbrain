// =============================================================
// 图表层（Charts Layer）
// -------------------------------------------------------------
// 职责：
//   基于 ECharts 渲染 4 张图（趋势 / 来源结构 / 评分分布 / 经营分分布）。
//   所有数据来自传入的 data 对象，不含硬编码数值。
//   自行管理实例生命周期（initCharts / destroyCharts），
//   切换页面时先销毁再重建，避免内存泄漏与容器错位。
// =============================================================

/** 已创建的图表实例（模块内部维护） */
let _charts = [];

/** 字体（与全局 CSS --font 保持一致） */
function fontFamily() {
  return '-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';
}

/** 销毁全部图表实例 */
export function destroyCharts() {
  _charts.forEach(c => c.dispose());
  _charts = [];
}

/** 窗口缩放时自适应（仅重绘图表，不重建 DOM） */
export function resizeCharts() {
  _charts.forEach(c => c.resize());
}

/** 初始化 P01 首页全部图表 + 图内小卡片 */
export function initCharts(data) {
  destroyCharts();
  initTrendChart(data);
  initSourceChart(data);
  initRatingChart(data);
  initScoreChart(data);
}

/** 公共配置：字体、提示框、网格 */
function commonOption() {
  return {
    textStyle: { fontFamily: fontFamily() },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e2e6ec',
      textStyle: { color: '#0f172a' }
    },
    grid: { left: 10, right: 16, top: 34, bottom: 10, containLabel: true }
  };
}

// -------------------------------------------------------------
// 支付 GMV / 核销金额 趋势（折线）
// -------------------------------------------------------------
function initTrendChart(data) {
  const dom = document.getElementById('chart-trend');
  if (!dom) return;
  const chart = echarts.init(dom, null, { locale: 'ZH' });
  const t = data.trend;

  chart.setOption(Object.assign(commonOption(), {
    legend: {
      data: ['支付 GMV（万元）', '核销金额（万元）'],
      top: 4, right: 4,
      textStyle: { color: '#475569', fontSize: 11 },
      itemWidth: 12, itemHeight: 8
    },
    xAxis: {
      type: 'category', data: t.months,
      axisLine: { lineStyle: { color: '#e2e6ec' } },
      axisLabel: { color: '#475569' }
    },
    yAxis: {
      type: 'value', name: '万元',
      nameTextStyle: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f3f6' } },
      axisLabel: { color: '#475569' }
    },
    series: [
      {
        name: '支付 GMV（万元）', type: 'line', data: t.pay,
        smooth: true, symbolSize: 8,
        itemStyle: { color: '#1e4fa3' }, lineStyle: { width: 3 },
        areaStyle: { color: 'rgba(30,79,163,0.08)' }
      },
      {
        name: '核销金额（万元）', type: 'line', data: t.hx,
        smooth: true, symbolSize: 8,
        itemStyle: { color: '#0F6E56' }, lineStyle: { width: 3 }
      }
    ]
  }));
  _charts.push(chart);

  // 图内左上角小卡片：当前核销率
  const card = document.createElement('div');
  card.className = 'chart-top-card';
  const rate = data.kpi.hexiaoRate;
  const rateMoM = data.kpi.hexiaoRateMoM;
  card.innerHTML = `<div class="k">当前核销率</div>
    <div class="v">${rate}%<span style="font-size:11px;color:var(--risk);font-weight:700">较上期 ${rateMoM}pp ↓</span></div>`;
  dom.appendChild(card);
}

// -------------------------------------------------------------
// GMV 来源结构（堆叠柱状，占比 %）
// -------------------------------------------------------------
function initSourceChart(data) {
  const dom = document.getElementById('chart-source');
  if (!dom) return;
  const chart = echarts.init(dom, null, { locale: 'ZH' });
  const s = data.source;
  const colors = ['#1e4fa3', '#0F6E56', '#b07416', '#94a3b8'];

  chart.setOption(Object.assign(commonOption(), {
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: params => {
        let h = params[0].name + '<br/>';
        params.forEach(p => {
          h += `<span style="display:inline-block;width:8px;height:8px;background:${p.color};border-radius:50%;margin-right:4px"></span>${p.seriesName}：${p.value}%<br/>`;
        });
        return h;
      }
    },
    legend: {
      data: ['总部', '门店', '达人', '其他'],
      top: 4, right: 4,
      textStyle: { color: '#475569', fontSize: 10 },
      itemWidth: 10, itemHeight: 6
    },
    xAxis: {
      type: 'category', data: s.months,
      axisLine: { lineStyle: { color: '#e2e6ec' } },
      axisLabel: { color: '#475569' }
    },
    yAxis: {
      type: 'value', max: 100, name: '占比',
      nameTextStyle: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f3f6' } },
      axisLabel: { color: '#475569', formatter: '{value}%' }
    },
    series: [
      { name: '总部', type: 'bar', stack: 'total', data: s.hq,     itemStyle: { color: colors[0] }, barWidth: 34, label: { show: true, position: 'inside', formatter: '{c}%', fontSize: 10, color: '#fff' } },
      { name: '门店', type: 'bar', stack: 'total', data: s.store,  itemStyle: { color: colors[1] }, label: { show: true, position: 'inside', formatter: '{c}%', fontSize: 10, color: '#fff' } },
      { name: '达人', type: 'bar', stack: 'total', data: s.talent, itemStyle: { color: colors[2] }, label: { show: true, position: 'inside', formatter: '{c}%', fontSize: 10, color: '#fff' } },
      { name: '其他', type: 'bar', stack: 'total', data: s.other,  itemStyle: { color: colors[3] }, label: { show: true, position: 'inside', formatter: '{c}%', fontSize: 10, color: '#fff' } }
    ]
  }));
  _charts.push(chart);
}

// -------------------------------------------------------------
// 门店评分分布（环形饼图）
// -------------------------------------------------------------
function initRatingChart(data) {
  const dom = document.getElementById('chart-rating');
  if (!dom) return;
  const chart = echarts.init(dom, null, { locale: 'ZH' });
  const colors = ['#94a3b8', '#f87171', '#fbbf24', '#60a5fa', '#0F6E56'];

  chart.setOption(Object.assign(commonOption(), {
    tooltip: { trigger: 'item', formatter: '{b}：{c} 家（{d}%）' },
    legend: { show: false },
    grid: { left: 10, right: 10, top: 20, bottom: 10, containLabel: true },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['50%', '55%'],
      label: { show: true, formatter: '{b}\n{c}家', color: '#475569', fontSize: 11 },
      data: data.ratingDist.map((d, i) => ({
        value: d.value, name: d.label, itemStyle: { color: colors[i] }
      }))
    }]
  }));
  _charts.push(chart);
}

// -------------------------------------------------------------
// 门店经营分分布（柱状）
// -------------------------------------------------------------
function initScoreChart(data) {
  const dom = document.getElementById('chart-score');
  if (!dom) return;
  const chart = echarts.init(dom, null, { locale: 'ZH' });
  const colors = ['#f87171', '#fbbf24', '#60a5fa', '#0F6E56'];

  chart.setOption(Object.assign(commonOption(), {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => `${p[0].name}：${p[0].value} 家` },
    grid: { left: 10, right: 10, top: 30, bottom: 10, containLabel: true },
    xAxis: {
      type: 'category', data: data.scoreDist.map(d => d.label),
      axisLine: { lineStyle: { color: '#e2e6ec' } },
      axisLabel: { color: '#475569' }
    },
    yAxis: {
      type: 'value', name: '门店数',
      nameTextStyle: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f3f6' } },
      axisLabel: { color: '#475569' }
    },
    series: [{
      type: 'bar',
      data: data.scoreDist.map((d, i) => ({
        value: d.value, itemStyle: { color: colors[i], borderRadius: [4, 4, 0, 0] }
      })),
      barWidth: 32
    }]
  }));
  _charts.push(chart);
}
