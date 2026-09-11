/**
 * Bridge between the original War Pet Builder page and the Kraken Chronicles shell.
 *
 * Loaded by /warpets/index.html AFTER optimizer.js. It never touches the damage
 * engine, the optimiser or any of the builder's own state — it only adjusts
 * chrome so the page fits inside the unified site.
 *
 *  ?embed=1  → the page is inside the site's frame: hide the duplicated
 *              language switch in the builder's own top nav (the shell has one)
 *              and forward support-widget clicks to the parent.
 *  standalone → add a slim bar linking back to the unified site, plus the same
 *              "we'd love to hear your ideas" entry point.
 */
(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const embedded = params.get('embed') === '1' || window.top !== window.self;
  const lang = params.get('lang') === 'en' ? 'en' : 'ru';

  const T = {
    ru: { back: '← Хроники Кракена 888', support: '💬 Выслушаем ваши идеи', tabs: 'Все вкладки сайта' },
    en: { back: '← Kraken Chronicles 888', support: '💬 We’d love to hear your ideas', tabs: 'All site tabs' },
  }[lang];

  function whenReady(fn) {
    if (document.getElementById('wpo-site-nav')) { fn(); return; }
    const obs = new MutationObserver(() => {
      if (document.getElementById('wpo-site-nav')) { obs.disconnect(); fn(); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 20000);
  }

  const style = document.createElement('style');
  style.id = 'kc-embed-style';
  style.textContent = embedded
    ? `
      /* The shell already renders a language switch in the header. */
      #wpo-site-nav .wpo-nav-lang { display: none !important; }
      #wpo-site-nav { top: 0; }
      body { padding-bottom: 74px; }
    `
    : `
      #kc-standalone-bar {
        position: sticky; top: 0; z-index: 120; display: flex; align-items: center; gap: 10px;
        flex-wrap: wrap; padding: 9px 16px; border-bottom: 1px solid rgba(216,180,93,.34);
        background: rgba(3,16,21,.95); backdrop-filter: blur(14px);
      }
      #kc-standalone-bar a, #kc-standalone-bar button {
        display: inline-flex; align-items: center; height: 32px; padding: 0 12px;
        border: 1px solid rgba(216,180,93,.32); border-radius: 9px;
        background: rgba(4,22,27,.75); color: #efd687;
        font: 800 11px/1 -apple-system, 'Segoe UI', Roboto, sans-serif; letter-spacing: .05em;
        text-decoration: none; cursor: pointer;
      }
      #kc-standalone-bar a:hover, #kc-standalone-bar button:hover { border-color: #e7c96e; background: rgba(13,58,62,.85); color: #fff0b2; }
      #kc-standalone-bar .spacer { flex: 1; }
      #kc-standalone-bar .brand { color: #9fc8c5; font: 700 11px -apple-system,'Segoe UI',sans-serif; letter-spacing: .14em; text-transform: uppercase; }
    `;
  document.head.appendChild(style);

  whenReady(() => {
    if (embedded) {
      // Let the builder's own support entry point (if any) reach the shell widget.
      document.addEventListener('click', (e) => {
        const el = e.target.closest?.('[data-kc-support]');
        if (!el) return;
        e.preventDefault();
        window.parent.postMessage({ kc: 'open-support' }, location.origin);
      });
      return;
    }

    if (document.getElementById('kc-standalone-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'kc-standalone-bar';
    bar.innerHTML = `
      <a href="/?lang=${lang}">${T.back}</a>
      <a href="/pets/top?lang=${lang}">${T.tabs}</a>
      <span class="spacer"></span>
      <span class="brand">CALL OF DRAGONS</span>
      <a href="/?lang=${lang}#support">${T.support}</a>`;
    document.body.insertBefore(bar, document.body.firstChild);
  });
})();
