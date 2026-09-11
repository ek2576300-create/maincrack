/**
 * The War Pet Builder — the site's core tab.
 *
 * The original coddb.app/warpets page (Next.js bundle + optimizer.js v6) is
 * embedded verbatim in a full-bleed frame, so its damage engine, the exhaustive
 * BEST BUILD search and the pet-coin budget mode all behave exactly as before.
 * Only the language is synced from the shell via ?lang=.
 */
import { h } from '../util.js';

export function render(mount, { t, i18n }) {
  const src = () => `/warpets?lang=${i18n.lang}&embed=1`;

  const frame = h('iframe', {
    src: src(),
    title: t('pets.builder.title'),
    loading: 'eager',
    // The builder is same-origin, so no sandbox is needed; it must reach its own bundle.
  });

  const bar = h('div', {
    style: {
      display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
      padding: '10px 16px', borderBottom: '1px solid var(--line)',
      background: 'rgba(3,16,21,.7)',
    },
  },
    h('span', { class: 'kc-badge is-gold' }, t('pets.builder.title')),
    h('span', { class: 'kc-note', style: { flex: '1 1 260px', minWidth: '0' } }, t('pets.builder.note')),
    h('a', {
      class: 'kc-btn sm', href: src(), target: '_blank', rel: 'noopener', 'data-external': '1',
    }, '↗ ' + t('pets.builder.openNew')));

  const wrap = h('div', { class: 'kc-frame-wrap', style: { height: 'calc(100vh - var(--header-h) - 52px)' } }, frame);

  mount.append(bar, wrap);

  const off = i18n.onChange(() => {
    frame.src = src();
    bar.querySelector('a').href = src();
  });
  return off;
}
