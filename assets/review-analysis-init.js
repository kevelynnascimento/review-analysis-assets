/* eslint-env browser, node */
(function init() {
  const root =
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    {};

  /**
   * Review Analysis initialization and chart rendering utilities.
   * Exposes a small API on `root.ReviewAnalysisInit` to initialize Normalize data
   * and render all charts/legends for the New Review Analysis PDF/HTML.
   */

  const COLORS = Object.freeze({
    on: '#4A35A3',
    off: '#F6BA79',
    any: '#F4737E',
  });

  /**
   * Safely coerce a value to a finite number or return null when invalid.
   * @param {unknown} value Raw value which may or may not be a number.
   * @returns {number|null} Finite number or null if not usable.
   */
  function safeNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  /**
   * Format an ISO date (yyyy-mm-dd) into a short day label in UTC.
   * Falls back to the host locale if DateHelpers is unavailable.
   * @param {string} isoDate ISO date string.
   * @returns {string} Human readable day label.
   */
  function formatISOToDayLabel(isoDate) {
    return root.DateHelpers &&
      typeof root.DateHelpers.formatISODateAsUTCDay === 'function'
      ? root.DateHelpers.formatISODateAsUTCDay(isoDate)
      : new Date(isoDate).toLocaleDateString();
  }
  /**
   * Build a standard line dataset configuration used across charts.
   * Data should be aligned to the same x-axis and use NaN for gaps.
   * @param {object} opts
   * @param {string} opts.label Dataset label
   * @param {number[]} opts.data Y values aligned to axis, use NaN for gaps
   * @param {string} opts.color Stroke/point color
   * @returns {object} Chart.js dataset config for a line series
   */
  function buildLineDataset({ label, data, color }) {
    const segmentIfSkipped = (ctx, value) =>
      (ctx.p0 && ctx.p0.skip) || (ctx.p1 && ctx.p1.skip) ? value : undefined;

    return {
      label,
      data,
      borderColor: color,
      backgroundColor: color,
      tension: 0.3,
      pointRadius: 0,
      spanGaps: true,
      segment: {
        borderColor: (ctx) => segmentIfSkipped(ctx, 'rgb(0,0,0,0.2)'),
        borderDash: (ctx) => segmentIfSkipped(ctx, [6, 6]),
      },
    };
  }

  /**
   * Initialize Normalize store with provided server data and update header counters.
   * Defensive against missing globals and DOM elements.
   * @param {object} data Server payload used by Normalize.
   * @returns {void}
   */
  function initNormalize(data) {
    if (!(root.Normalize && typeof root.Normalize.init === 'function')) return;
    root.Normalize.init(data);

    const locationsCountElement =
      root.document && root.document.getElementById('locations-count');
    if (
      locationsCountElement &&
      typeof root.Normalize.countDistinctLocations === 'function'
    ) {
      locationsCountElement.textContent = String(
        root.Normalize.countDistinctLocations(),
      );
    }

    const publishersCountElement =
      root.document && root.document.getElementById('publishers-count');
    if (
      publishersCountElement &&
      typeof root.Normalize.toArray === 'function'
    ) {
      publishersCountElement.textContent = String(
        root.Normalize.toArray().length,
      );
    }
  }

  /**
   * Render the publisher-level total reviews doughnut chart and matching legend.
   * @returns {void}
   */
  function renderPublisherDoughnutAndLegend() {
    if (!(root.Normalize && root.Normalize.hasData && root.Normalize.hasData()))
      return;

    const publishers = root.Normalize.toArray();
    const { labels, values, colors } = publishers.reduce(
      (acc, p) => {
        acc.labels.push(p.publisher);
        acc.values.push(Array.isArray(p.data) ? p.data.length : 0);
        acc.colors.push(p.color);
        return acc;
      },
      { labels: [], values: [], colors: [] },
    );

    if (
      root.ChartHelpers &&
      typeof root.ChartHelpers.renderDoughnutChart === 'function'
    ) {
      root.ChartHelpers.renderDoughnutChart(
        'total-review-doughnut-publisher-chart',
        labels,
        values,
        colors,
        'Reviews',
      );
    }

    if (
      root.ProvidersHelper &&
      typeof root.ProvidersHelper.renderLegendWithValues === 'function'
    ) {
      const legendItems = publishers.map((p) => ({
        label: p.publisher,
        color: p.color,
        value: Array.isArray(p.data) ? p.data.length : 0,
      }));
      root.ProvidersHelper.renderLegendWithValues(
        'total-review-doughnut-legend',
        legendItems,
      );
    }
  }

  /**
   * Render average rating trends over time by publisher as a line chart.
   * Computes mean rating per publisher for each available date.
   * @returns {void}
   */
  function renderPublisherLine() {
    if (!(root.Normalize && root.Normalize.hasData && root.Normalize.hasData()))
      return;
    if (
      !(
        root.ChartHelpers &&
        typeof root.ChartHelpers.renderLineChart === 'function'
      )
    )
      return;

    const reviewsByPublisher = root.Normalize.byPublisher({
      formatDate: false,
    });

    const isoDateSet = new Set();
    Object.values(reviewsByPublisher).forEach((items) => {
      items.forEach((it) => {
        if (it && it.Date) isoDateSet.add(it.Date);
      });
    });
    const axisIsoDates = Array.from(isoDateSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
    const labels = axisIsoDates.map(formatISOToDayLabel);

    const ratingStatsByPublisher = {};
    Object.entries(reviewsByPublisher).forEach(([publisher, items]) => {
      const dateToStats = {};
      items.forEach((it) => {
        const iso = it && it.Date;
        const rating = safeNumber(it && it.Rating);
        if (!iso || rating == null) return;
        if (!dateToStats[iso]) dateToStats[iso] = { sum: 0, count: 0 };
        dateToStats[iso].sum += rating;
        dateToStats[iso].count += 1;
      });
      ratingStatsByPublisher[publisher] = dateToStats;
    });

    const publishersMeta = root.Normalize.toArray();
    const datasets = publishersMeta.map((p) => {
      const dateToStats = ratingStatsByPublisher[p.publisher] || {};
      const series = axisIsoDates.map((isoDate) => {
        const stats = dateToStats[isoDate];
        return stats && stats.count > 0
          ? Number((stats.sum / stats.count).toFixed(2))
          : Number.NaN;
      });
      return buildLineDataset({
        label: p.publisher,
        data: series,
        color: p.color || '#3b82f6',
      });
    });

    root.ChartHelpers.renderLineChart(
      'rating-trends-over-time-line-chart-publisher',
      labels,
      datasets,
    );
  }

  /**
   * Render the providers row (icons/labels) with on/off premise badges.
   * @returns {void}
   */
  function renderProvidersRow() {
    if (
      !(
        root.ProvidersHelper &&
        typeof root.ProvidersHelper.renderProviders === 'function'
      )
    )
      return;
    if (!(root.Normalize && root.Normalize.hasData && root.Normalize.hasData()))
      return;

    const providers = root.Normalize.toArray().map((_provider) => ({
      label: _provider.publisher,
      color: _provider.color,
      onPremises: _provider.onPremises,
    }));
    root.ProvidersHelper.renderProviders('providers', providers);
  }

  /**
   * Render premise-based legend (On/Off) and the matching total reviews doughnut chart.
   * @returns {void}
   */
  function renderPremiseLegendAndChart() {
    if (!(root.Normalize && root.Normalize.hasData && root.Normalize.hasData()))
      return;

    const providers = root.Normalize.toArray();
    const sumCount = (predicate) =>
      providers
        .filter(predicate)
        .reduce(
          (sum, _provider) =>
            sum + (Array.isArray(_provider.data) ? _provider.data.length : 0),
          0,
        );
    const onCount = sumCount((p) => p.onPremises === true);
    const offCount = sumCount((p) => p.onPremises === false);

    if (
      root.ProvidersHelper &&
      typeof root.ProvidersHelper.renderLegendWithValues === 'function'
    ) {
      const legendItems = [
        { label: 'On Premise', color: COLORS.on, value: onCount },
        { label: 'Off Premise', color: COLORS.off, value: offCount },
      ].filter((it) => it.value > 0);
      root.ProvidersHelper.renderLegendWithValues(
        'total-review-doughnut-premise-legend',
        legendItems,
      );
    }

    if (
      root.ChartHelpers &&
      typeof root.ChartHelpers.renderDoughnutChart === 'function'
    ) {
      const premiseItems = [
        { label: 'On Premise', value: onCount, color: COLORS.on },
        { label: 'Off Premise', value: offCount, color: COLORS.off },
      ].filter((item) => item.value > 0);

      const { labels, values, colors } = premiseItems.reduce(
        (acc, { label, value, color }) => {
          acc.labels.push(label);
          acc.values.push(value);
          acc.colors.push(color);
          return acc;
        },
        { labels: [], values: [], colors: [] },
      );

      root.ChartHelpers.renderDoughnutChart(
        'total-review-doughnut-premise-chart',
        labels,
        values,
        colors,
        'Reviews',
      );
    }
  }

  /**
   * Render average rating trends grouped by premise (On, Off, Any) over time.
   * @returns {void}
   */
  function renderPremiseLine() {
    const hasNormalizeData = !!(
      root.Normalize &&
      root.Normalize.hasData &&
      root.Normalize.hasData()
    );
    const canRenderLine = !!(
      root.ChartHelpers &&
      typeof root.ChartHelpers.renderLineChart === 'function'
    );
    if (!hasNormalizeData || !canRenderLine) return;

    const reviewsByPublisher = root.Normalize.byPublisher({
      formatDate: false,
    });

    const isoDateSet = new Set();
    Object.values(reviewsByPublisher).forEach((items) =>
      items.forEach((it) => {
        if (it && it.Date) isoDateSet.add(it.Date);
      }),
    );
    const axisIsoDates = Array.from(isoDateSet).sort(
      (a, b) => new Date(a) - new Date(b),
    );
    const labels = axisIsoDates.map(formatISOToDayLabel);

    const onPremiseByPublisher = new Map(
      root.Normalize.toArray().map((p) => [p.publisher, p.onPremises === true]),
    );
    const buckets = {
      on: Object.create(null),
      off: Object.create(null),
      any: Object.create(null),
    };
    const addToBucket = (map, iso, rating) => {
      // eslint-disable-next-line no-param-reassign
      const state = map[iso] || (map[iso] = { sum: 0, count: 0 });
      state.sum += rating;
      state.count += 1;
    };

    Object.entries(reviewsByPublisher).forEach(([publisher, items]) => {
      const bucketKey = onPremiseByPublisher.get(publisher) ? 'on' : 'off';
      items.forEach((it) => {
        const iso = it && it.Date;
        const rating = safeNumber(it && it.Rating);
        if (!iso || rating == null) return;
        addToBucket(buckets[bucketKey], iso, rating);
        addToBucket(buckets.any, iso, rating);
      });
    });

    const toAverageSeries = (map) =>
      axisIsoDates.map((iso) => {
        const stats = map[iso];
        return stats && stats.count
          ? +(stats.sum / stats.count).toFixed(2)
          : Number.NaN;
      });

    const datasets = [
      { id: 'on', label: 'On Premise', color: COLORS.on },
      { id: 'off', label: 'Off Premise', color: COLORS.off },
      { id: 'any', label: 'Any Premise', color: COLORS.any },
    ].map(({ id, label, color }) =>
      buildLineDataset({ label, data: toAverageSeries(buckets[id]), color }),
    );

    root.ChartHelpers.renderLineChart(
      'rating-trends-over-time-line-chart-premise',
      labels,
      datasets,
    );
  }

  /**
   * Entry point that initializes Normalize and renders all charts/legends in order.
   * @param {object} data Server payload used by Normalize.
   * @returns {void}
   */
  function initAll(data) {
    initNormalize(data);
    renderPublisherDoughnutAndLegend();
    renderPublisherLine();
    renderProvidersRow();
    renderPremiseLegendAndChart();
    renderPremiseLine();
  }

  root.ReviewAnalysisInit = {
    initNormalize,
    renderPublisherDoughnutAndLegend,
    renderPublisherLine,
    renderProvidersRow,
    renderPremiseLegendAndChart,
    renderPremiseLine,
    initAll,
  };
})();
