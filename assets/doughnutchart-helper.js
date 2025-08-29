/* eslint-env browser, node */
/* global Chart */
(function init() {
  const defaultDoughnutOptions = {
    animation: {
      animateRotate: false,
    },
    plugins: { legend: { display: false } },
  };

  function createDoughnutConfig(labels = [], datasets = []) {
    const options = defaultDoughnutOptions;
    return {
      type: 'doughnut',
      data: { labels, datasets },
      options,
    };
  }

  function renderWithConfig(elementOrId, config) {
    return new Chart(document.getElementById(elementOrId), config);
  }

  function normalizeDoughnutDatasets(
    maybeDatasets,
    colors,
    datasetLabel = 'Total',
  ) {
    const data = Array.isArray(maybeDatasets) ? maybeDatasets : [];
    const backgroundColor = Array.isArray(colors) ? colors : undefined;

    return [
      {
        label: datasetLabel,
        data,
        backgroundColor,
        borderWidth: 0,
      },
    ];
  }

  function renderDoughnutChart(
    elementOrId,
    labels,
    datasetsOrData,
    colors,
    datasetLabel,
  ) {
    const datasets = normalizeDoughnutDatasets(
      datasetsOrData,
      colors,
      datasetLabel,
    );
    const config = createDoughnutConfig(labels, datasets);
    return renderWithConfig(elementOrId, config);
  }

  const root =
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    {};

  root.ChartHelpers = {
    ...(root.ChartHelpers || {}),
    renderDoughnutChart,
  };
})();
