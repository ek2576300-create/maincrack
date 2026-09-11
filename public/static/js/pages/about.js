import { h, getJSON, empty } from '../util.js';
import { SITE } from '../routes.js';

export async function render(mount, { t, i18n, link }) {
  const lang = i18n.lang;
  const about = await getJSON('/data/site/about.json');
  const summary = about.project?.summary?.[lang];
  const teaser = about.history?.teaser?.[lang];
  const milestoneCount = (about.history?.milestones || []).length;

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('about.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('about.title')), h('p', {}, SITE.tagline[lang]))),
      h('div', { class: 'kc-panel-body' },
        summary
          ? h('p', { class: 'kc-prose', style: { color: 'var(--text-dim)' } }, summary)
          : empty(t('about.pendingTitle'), t('about.pendingHint')))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('about.historyTitle')))),
      h('div', { class: 'kc-panel-body' },
        teaser
          ? h('p', { class: 'kc-prose', style: { color: 'var(--text-dim)' } }, teaser)
          : empty(t('about.historyPendingTitle'), t('about.historyPendingHint')),
        milestoneCount > 0 && h('div', { class: 'kc-toolbar', style: { marginTop: '14px' } },
          h('a', { class: 'kc-btn is-teal', href: '/about/history', onclick: link('/about/history') }, t('about.historyCta'))))));
}
