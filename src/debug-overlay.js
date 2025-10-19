// src/debug-overlay.js
(() => {
  if (window.__DEBUG_OVERLAY_ACTIVE__) return;
  window.__DEBUG_OVERLAY_ACTIVE__ = true;

  const host = document.createElement('pre');
  host.id = 'debug-overlay';
  host.style.position = 'fixed';
  host.style.inset = '0';
  host.style.zIndex = '99999';
  host.style.background = '#111';
  host.style.color = '#eee';
  host.style.padding = '16px';
  host.style.margin = '0';
  host.style.overflow = 'auto';
  host.style.font = '13px/1.4 monospace';
  host.style.display = 'none'; // hidden until we log

  const show = (msg) => {
    host.style.display = 'block';
    host.textContent = String(msg);
  };
  const append = (msg) => {
    host.style.display = 'block';
    host.textContent += '\n' + String(msg);
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(host);
    show('Debug overlay active… (waiting for errors)');
  });

  // expose simple logger for other modules
  window.__debugShow = show;
  window.__debugAppend = append;

  window.addEventListener('error', (e) => {
    append('JS Error: ' + e.message + '\n' + (e.error && e.error.stack || ''));
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    append('Unhandled Rejection: ' + (r && (r.stack || r.message) || r));
  });

  const origFetch = window.fetch;
  window.fetch = async function(input, init) {
    const res = await origFetch(input, init);
    const url = typeof input === 'string' ? input : input && input.url;
    if (res && (res.status === 401 || res.status === 404)) {
      append(res.status + ' from: ' + url);
    }
    return res;
  };

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    this.addEventListener('load', function() {
      if (this.status === 401 || this.status === 404) append(this.status + ' from: ' + url);
    });
    return origOpen.apply(this, arguments);
  };
})();
