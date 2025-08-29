/* eslint-env browser, node */
/* global Chart */
(function init() {
  const chartAreaBorder = {
    id: 'chartAreaBorder',
    afterDraw(chart) {
      const {
        ctx,
        chartArea: { left, top, width, height },
      } = chart;
      ctx.save();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(left, top, width, height);
      ctx.restore();
    },
  };

  const defaultLineOptions = {
    animation: false,
    // maintainAspectRatio: false,
    responsive: false,
    interaction: { mode: 'index', intersect: false, axis: 'x' },
    scales: {
      x: {
        grid: { display: false },
        display: true,
        title: {
          display: true,
          text: 'Days',
          color: 'rgba(0, 0, 0, 0.85)',
          font: {
            family: 'Roboto',
            size: 16,
            style: 'normal',
            lineHeight: 1.2,
          },
        },
        ticks: { display: true, autoSkip: false, maxRotation: 0 },
      },
      y: {
        grid: { display: false },
        display: true,
        title: {
          display: true,
          text: 'Ratings',
          color: 'rgba(0, 0, 0, 0.85)',
          font: {
            family: 'Roboto',
            size: 16,
            style: 'normal',
            lineHeight: 1.2,
          },
          padding: { top: 0 },
        },
        ticks: {
          stepSize: 0.5,
          callback: (value) => Number(value),
          padding: 10,
        },
        type: 'linear',
        min: 1,
        max: 5,
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  function createLineConfig(labels = [], datasets = []) {
    const options = defaultLineOptions;
    return {
      type: 'line',
      data: { labels, datasets },
      options,
      plugins: [chartAreaBorder],
    };
  }

  function renderWithConfig(elementOrId, config) {
    const el =
      typeof elementOrId === 'string'
        ? document.getElementById(elementOrId)
        : elementOrId;
    if (!el) return null;
    return new Chart(el, config);
  }

  function renderLineChart(elementOrId, labels, datasets) {
    const config = createLineConfig(labels, datasets);
    return renderWithConfig(elementOrId, config);
  }

  const root =
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    {};

  root.ChartHelpers = {
    ...(root.ChartHelpers || {}),
    renderLineChart,
  };
})();
