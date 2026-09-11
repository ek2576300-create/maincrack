import { h, getJSON, empty } from '../util.js';

export async function render(mount, { t, i18n }) {
  const lang = i18n.lang;
  const data = await getJSON('/data/site/tournament.json');
  const isPending = !data.status || data.status === 'coming-soon';

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('tournament.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('tournament.title')), h('p', {}, t('tournament.desc')))),
      h('div', { class: 'kc-panel-body' }, isPending
        ? empty(t('tournament.pendingTitle'), t('tournament.pendingHint'))
        : h('div', {},
          data.status !== 'coming-soon' && h('span', { class: 'kc-badge is-gold', style: { marginBottom: '10px' } }, t('tournament.status.' + data.status, data.status)),
          data.cover && h('img', {
            src: data.cover, alt: '', loading: 'lazy',
            style: { width: '100%', borderRadius: '12px', margin: '10px 0' },
          }),
          data.name?.[lang] && h('h3', { style: { margin: '0 0 8px' } }, data.name[lang]),
          data.description?.[lang] && h('p', { class: 'kc-prose', style: { color: 'var(--text-dim)' } }, data.description[lang]),
          data.ctaEnabled && data.ctaUrl && h('div', { class: 'kc-toolbar', style: { marginTop: '14px' } },
            h('a', {
              class: 'kc-btn is-primary', href: data.ctaUrl,
              ...(data.ctaUrl.startsWith('http') ? { target: '_blank', rel: 'noopener', 'data-external': '1' } : {}),
            }, t('tournament.cta')))))));
}
