/**
 * Публичная страница одного аккаунта — /accounts/<id>.
 *
 * Открывается для всех, если владелец включил показ в каталоге. Сам владелец
 * (и админ) видит её и закрытой — иначе нельзя проверить, как она выглядит,
 * до публикации; в этом случае сверху висит предупреждение.
 */
import { h, api, num, dateTime, empty, setMeta } from '../util.js';
import { SITE } from '../routes.js';
import {
  loadCatalogs, avatarEl, displayNick, unitIcon, unitLabel, bigNumber, itemCard,
} from './roster-common.js';

const KINDS = ['pet', 'hero', 'artifact'];

export async function render(mount, { t, i18n, params, link, store }) {
  const lang = i18n.lang;
  const id = Number(params.id);

  const [catalogs, data] = await Promise.all([
    loadCatalogs(),
    api(`/roster/profile?id=${id}`).catch((e) => (e.status === 404 ? null : Promise.reject(e))),
  ]);

  if (!data) {
    mount.append(
      crumb(t, link, t('roster.notFoundTitle')),
      h('section', { class: 'kc-panel' }, h('div', { class: 'kc-panel-body' },
        empty(t('roster.notFoundTitle'), t('roster.notFoundHint')),
        h('div', { style: { textAlign: 'center', marginTop: '10px' } },
          h('a', { class: 'kc-btn', href: '/accounts', onclick: link('/accounts') }, '← ' + t('roster.title'))))));
    return;
  }

  const p = data.profile;
  const nick = displayNick(p);
  setMeta({
    title: `${nick} — ${t('roster.title')} | ${SITE.name[lang]}`,
    description: p.about ? p.about.slice(0, 180) : undefined,
  });

  const alliance = [p.allianceTag && `[${p.allianceTag}]`, p.allianceName].filter(Boolean).join(' ');
  const byKind = Object.fromEntries(KINDS.map((k) => [k, p.items.filter((it) => it.kind === k)]));

  mount.append(...[
    crumb(t, link, nick),

    // Закрытый профиль сюда попадает только для владельца и админа.
    !p.listed
      ? h('div', { class: 'kc-error', style: { marginBottom: '14px' } }, t('roster.hiddenNotice'))
      : null,

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', minWidth: '0' } },
          avatarEl(p, catalogs, 64),
          h('div', { style: { minWidth: '0' } },
            h('h1', { style: { margin: '0', fontSize: '22px' } }, nick),
            h('p', { style: { margin: '4px 0 0' } },
              [alliance, p.gameServer && `${t('common.server')} ${p.gameServer}`, p.playerId && `ID ${p.playerId}`]
                .filter(Boolean).join(' · ') || '—'))),
        data.own
          ? h('a', { class: 'kc-btn sm', href: '/profile?tab=game', onclick: link('/profile?tab=game') }, t('gp.items.edit'))
          : null),

      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-statrow is-4' },
          cell(bigNumber(p.power, lang), t('gp.power')),
          cell(p.tcLevel ? num(p.tcLevel, lang) : '—', t('gp.tcLevel')),
          cell(bigNumber(p.kills, lang), t('gp.kills')),
          cell(bigNumber(p.merits, lang), t('gp.merits'))),

        h('dl', { class: 'kc-kv', style: { marginTop: '18px' } },
          ...kv(t('gp.mainUnit'), p.mainUnit
            ? h('span', { class: 'kc-iconcell' }, unitIcon(p.mainUnit), unitLabel(p.mainUnit, t))
            : null),
          ...kv(t('gp.playStyle'), p.playStyle ? t('gp.style.' + p.playStyle, p.playStyle) : null),
          ...kv(t('gp.vipLevel'), p.vipLevel != null ? num(p.vipLevel, lang) : null),
          ...kv(t('gp.timezone'), p.timezone || null),
          ...kv(t('roster.memberSince'), dateTime(p.createdAt, lang)),
          ...kv(t('roster.updated'), p.updatedAt ? dateTime(p.updatedAt, lang) : null)),

        p.about
          ? h('p', { class: 'kc-prose', style: { marginTop: '18px', whiteSpace: 'pre-wrap' } }, p.about)
          : null,

        p.contacts.length
          ? h('div', { class: 'kc-chips', style: { marginTop: '16px' } },
            ...p.contacts.map((c) => h('span', { class: 'kc-chip' },
              `${t('gp.contact.' + c.kind, c.kind)}: ${c.value}`)))
          : null)),

    ...KINDS.map((kind) => section(kind, byKind[kind], catalogs, lang, t)),
  ].filter(Boolean));
}

/** Раздел с записями одного вида. Пустой у чужого профиля не показываем. */
function section(kind, items, catalogs, lang, t) {
  if (!items.length) return null;
  return h('section', { class: 'kc-panel', id: kind },
    h('div', { class: 'kc-panel-head' },
      h('div', {}, h('h2', {}, t('gp.items.' + kind))),
      h('span', { class: 'kc-badge' }, String(items.length))),
    h('div', { class: 'kc-panel-body' },
      h('div', { class: 'kc-grid auto-lg' }, ...items.map((it) => itemCard(it, catalogs, lang, t)))));
}

const crumb = (t, link, tail) => h('div', { class: 'kc-breadcrumb' },
  h('a', { href: '/', onclick: link('/') }, t('common.home')), ' / ',
  h('a', { href: '/accounts', onclick: link('/accounts') }, t('roster.title')), ' / ', tail);

/** Пару <dt>/<dd> рисуем, только если значение есть — иначе строка-прочерк. */
const kv = (label, value) => (value == null || value === '' ? [] : [h('dt', {}, label), h('dd', {}, value)]);

const cell = (value, label) => h('div', {},
  h('div', { class: 'v' }, value),
  h('div', { class: 'k' }, label));
