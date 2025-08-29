/* eslint-env browser, node */
(function init() {
  const root =
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    {};

  function getIconSvg(provider) {
    if (!provider) return null;

    if (typeof provider.svg === 'string') return provider.svg;

    const key =
      provider.icon ||
      provider.iconKey ||
      provider.name ||
      (provider.label &&
        String(provider.label).toLowerCase().replace(/\s+/g, ''));

    return root.ProviderIcons[key] || null;
  }

  function createCircle(color = '#3b82f6') {
    const dot = document.createElement('span');
    Object.assign(dot.style, {
      backgroundColor: color,
      position: 'relative',
      zIndex: '0',
    });
    dot.className = 'inline-block w-4 h-4 rounded-full';
    return dot;
  }

  function createLogo(svg) {
    const logoWrap = document.createElement('span');
    logoWrap.className =
      'inline-flex w-4 h-4 rounded-full items-center justify-center overflow-hidden';
    Object.assign(logoWrap.style, {
      position: 'relative',
      zIndex: '1',
      marginLeft: '-10px',
    });
    logoWrap.innerHTML = svg || '';
    return logoWrap;
  }

  function renderProviders(target, providers) {
    const el =
      typeof target === 'string' ? document.getElementById(target) : target;
    if (!el || !Array.isArray(providers)) return;

    providers.forEach(({ label, color, ...rest }) => {
      const item = document.createElement('div');
      item.className = 'flex items-center gap-1 text-xs';

      const circles = document.createElement('span');
      circles.className = 'inline-flex items-center';

      circles.appendChild(createCircle(color));
      circles.appendChild(createLogo(getIconSvg({ label, color, ...rest })));

      const nameEl = document.createElement('span');
      nameEl.className = 'text-[#00000073]';
      nameEl.textContent = label || '';

      item.append(circles, nameEl);
      el.appendChild(item);
    });
  }

  function renderLegendWithValues(target, items) {
    const el =
      typeof target === 'string' ? document.getElementById(target) : target;
    if (!el || !Array.isArray(items)) return;

    const rowsHtml = items
      .map(({ label, color, value, ...rest }) => {
        const leftContainer = document.createElement('div');
        renderProviders(leftContainer, [{ label, color, ...rest }]);
        const left = leftContainer.firstElementChild;
        const leftHtml = left ? left.outerHTML : '';

        return `
          <div class="flex items-center justify-between gap-24 text-xs">
            ${leftHtml}
            <span class="text-black font-medium">${value}</span>
          </div>
        `;
      })
      .join('');

    el.innerHTML = rowsHtml;
  }

  root.ProvidersHelper = {
    renderProviders,
    renderLegendWithValues,
    icons: root.ProviderIcons,
  };
})();
