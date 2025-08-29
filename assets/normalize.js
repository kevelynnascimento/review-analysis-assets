/* eslint-env browser, node */
const PROVIDERS = [
  {
    label: 'Google',
    color: '#F6BA79',
    onPremises: true,
  },
  {
    label: 'Yelp',
    color: '#6CA2ED',
    onPremises: true,
  },
  {
    label: 'Facebook',
    color: '#91B1D5',
    onPremises: true,
  },
  {
    label: 'Ezcater',
    color: '#96D4A0',
    onPremises: false,
  },
  {
    label: 'OpenTable',
    color: '#F4737E',
    onPremises: true,
  },
  {
    label: 'DoorDash',
    color: '#F799A1',
    onPremises: false,
  },
  {
    label: 'GrubHub',
    color: '#F68261',
    onPremises: false,
  },
  {
    label: 'TripAdvisor',
    color: '#9C75CD',
    onPremises: true,
  },
  {
    label: 'UberEats',
    color: '#4A35A3',
    onPremises: false,
  },
];

(function init() {
  const root =
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    {};

  // Internal stored dataset so callers don't need to pass it every time
  let storedData = [];

  function setData(data) {
    storedData = Array.isArray(data) ? data : [];
  }
  function getData() {
    return storedData;
  }
  function hasData() {
    return Array.isArray(storedData) && storedData.length > 0;
  }
  function clear() {
    storedData = [];
  }
  function initWith(data) {
    setData(data);
    return root.Normalize; // allow chaining
  }

  function resolveArgs(dataOrOpts, maybeOpts) {
    // Supports calls like byPublisher(data, opts) or byPublisher(opts) or byPublisher()
    if (Array.isArray(dataOrOpts)) {
      return { data: dataOrOpts, opts: maybeOpts || {} };
    }
    if (dataOrOpts && typeof dataOrOpts === 'object') {
      return { data: getData(), opts: dataOrOpts };
    }
    return { data: getData(), opts: maybeOpts || {} };
  }

  function formatDateValue(input, pattern, enable) {
    if (!enable) return input ?? null;
    const fmt = root.DateHelpers && root.DateHelpers.formatISODateAsUTCDay;
    if (typeof fmt === 'function') {
      return fmt(input, pattern) ?? input ?? null;
    }
    return input ?? null;
  }

  // Helper: map label -> provider meta (case/space insensitive)
  function normalizeLabelKey(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/\s+/g, '');
  }
  function providerMetaFor(label) {
    const key = normalizeLabelKey(label);
    return PROVIDERS.find((p) => normalizeLabelKey(p.label) === key) || null;
  }

  // Group entries by Publisher, keeping only Date and LocationId in each item
  // Options:
  //  - formatDate: boolean (default true) -> use DateHelpers.formatISODateAsUTCDay
  //  - datePattern: string (default 'MM-dd-yyyy')
  function byPublisher(dataOrOpts, maybeOpts) {
    const { data, opts } = resolveArgs(dataOrOpts, maybeOpts);
    const { formatDate = true, datePattern = 'MM-dd-yyyy' } = opts || {};

    if (!Array.isArray(data)) return {};

    // Sort input by raw ISO Date before any formatting to ensure chronological order
    const sortedData = data.slice().sort((a, b) => {
      let ta = Number.POSITIVE_INFINITY;
      if (a && a.Date) {
        const parsed = Date.parse(a.Date);
        if (!Number.isNaN(parsed)) ta = parsed;
      }
      let tb = Number.POSITIVE_INFINITY;
      if (b && b.Date) {
        const parsed = Date.parse(b.Date);
        if (!Number.isNaN(parsed)) tb = parsed;
      }
      return ta - tb;
    });

    return sortedData.reduce((acc, item) => {
      if (!item || typeof item !== 'object') return acc;

      const publisher = item.Publisher;
      if (!publisher) return acc;

      const simplified = {
        Date: formatDateValue(item.Date, datePattern, formatDate),
        LocationId: item.LocationId ?? null,
        Rating: item.Rating != null ? Number(item.Rating) : null,
      };

      if (!acc[publisher]) acc[publisher] = [];
      acc[publisher].push(simplified);
      return acc;
    }, {});
  }

  function toArray(dataOrOpts, maybeOpts) {
    const grouped = byPublisher(dataOrOpts, maybeOpts);
    return Object.keys(grouped).map((publisher) => {
      const meta = providerMetaFor(publisher) || {};
      return {
        publisher,
        color: meta.color,
        onPremises: meta.onPremises,
        data: grouped[publisher],
      };
    });
  }

  // Count distinct LocationId in the dataset
  function countDistinctLocations(dataOrOpts) {
    const { data } = resolveArgs(dataOrOpts);
    if (!Array.isArray(data)) return 0;
    const ids = new Set();
    for (let i = 0; i < data.length; i += 1) {
      const item = data[i];
      const id = item && item.LocationId;
      if (id != null) ids.add(id);
    }
    return ids.size;
  }

  root.Normalize = {
    // stateful API
    init: initWith,
    setData,
    getData,
    hasData,
    clear,

    // transforms
    byPublisher,
    toArray,
    countDistinctLocations,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.Normalize;
  }
})();
