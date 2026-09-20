/**
 * Профиль пользователя.
 *
 * Пять вкладок: аккаунт на сайте (имя, язык, пароль) и четыре про игру —
 * общие данные, питомцы, герои, артефакты. Разделено вкладками, а не одной
 * длинной страницей, потому что заполняют их в разное время: настройки сайта
 * один раз, состав питомцев и героев — регулярно.
 *
 * Всё, что относится к игре, попадает в каталог /accounts только когда
 * владелец включает «Показывать в каталоге»: по умолчанию профиль закрыт.
 */
import { h, clear, api, num, dateTime, empty, loading } from '../util.js';
import { auth } from '../app.js';
import {
  loadCatalogs, petLabel, petPortrait, itemCard, unitLabel,
  UNITS, PLAY_STYLES, CONTACT_KINDS, QUALITIES,
} from './roster-common.js';

const TABS = [
  ['account', 'gp.tab.account'],
  ['game', 'gp.tab.game'],
  ['pets', 'gp.tab.pets'],
  ['heroes', 'gp.tab.heroes'],
  ['artifacts', 'gp.tab.artifacts'],
];
const KIND_OF_TAB = { pets: 'pet', heroes: 'hero', artifacts: 'artifact' };

export function render(mount, ctx) {
  const { t, store, link } = ctx;

  if (!store.user) {
    mount.append(h('section', { class: 'kc-panel' }, h('div', { class: 'kc-panel-body' },
      empty(t('auth.hint')),
      h('div', { style: { textAlign: 'center' } },
        h('a', { class: 'kc-btn is-primary', href: '/login', onclick: link('/login') }, t('auth.submitIn'))))));
    return;
  }

  let tab = new URLSearchParams(location.search).get('tab') || 'account';
  if (!TABS.some(([id]) => id === tab)) tab = 'account';

  const state = { profile: null, catalogs: null, limits: { perKind: 60 } };
  const body = h('div', {});
  const tabsHost = h('div', { class: 'kc-chips' });

  function drawTabs() {
    clear(tabsHost);
    for (const [id, key] of TABS) {
      tabsHost.append(h('button', {
        class: 'kc-chip' + (id === tab ? ' is-active' : ''), type: 'button',
        onclick: () => { tab = id; history.replaceState({}, '', `/profile?tab=${id}`); drawTabs(); draw(); },
      }, t(key)));
    }
  }

  async function draw() {
    clear(body);
    body.append(loading(t('common.loading')));
    try {
      // Справочники и профиль нужны всем вкладкам кроме первой — тянем один
      // раз и держим в state, чтобы переключение вкладок было мгновенным.
      if (tab !== 'account' && !state.profile) await loadState(state);
      clear(body);
      if (tab === 'account') accountTab(body, ctx);
      else if (tab === 'game') gameTab(body, ctx, state, draw);
      else itemsTab(body, ctx, state, KIND_OF_TAB[tab], draw);
    } catch (e) {
      clear(body);
      body.append(h('div', { class: 'kc-error' }, t('common.error') + ' — ' + e.message));
    }
  }

  mount.append(
    h('div', { class: 'kc-breadcrumb' },
      h('a', { href: '/', onclick: link('/') }, t('common.home')), ' / ', t('profile.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h1', {}, store.user.name), h('p', {}, store.user.email)),
        h('div', { class: 'kc-toolbar' },
          h('span', { class: 'kc-badge' + (store.user.role === 'admin' ? ' is-gold' : '') }, t('role.' + store.user.role)),
          store.user.role === 'admin'
            ? h('a', { class: 'kc-btn sm', href: '/admin', onclick: link('/admin') }, t('admin.title'))
            : null,
          h('button', {
            class: 'kc-btn sm', type: 'button',
            onclick: async () => { await auth.logout(); ctx.navigate('/'); },
          }, t('nav.signOut')))),
      h('div', { class: 'kc-panel-body', style: { paddingBottom: '0' } }, tabsHost)),
    body);

  drawTabs();
  draw();
}

async function loadState(state) {
  const [catalogs, data] = await Promise.all([loadCatalogs(), api('/profile/game')]);
  state.catalogs = catalogs;
  state.profile = data.profile;
  state.limits = data.limits || state.limits;
}

/* --------------------------------------------------------- вкладка «сайт» */
function accountTab(host, { t, i18n, store }) {
  const lang = i18n.lang;
  const user = store.user;

  const nameInput = h('input', { class: 'kc-input', value: user.name });
  const langSelect = h('select', { class: 'kc-select' },
    h('option', { value: 'ru', selected: user.lang === 'ru' }, 'Русский'),
    h('option', { value: 'en', selected: user.lang === 'en' }, 'English'));
  const saveStatus = h('span', { class: 'kc-note' });

  const curPass = h('input', { class: 'kc-input', type: 'password', autocomplete: 'current-password' });
  const newPass = h('input', { class: 'kc-input', type: 'password', autocomplete: 'new-password' });
  const passStatus = h('div', {});

  host.append(
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-grid c2' },
          field(t('auth.name'), nameInput),
          field('Язык / Language', langSelect)),
        h('div', { class: 'kc-toolbar' },
          h('button', {
            class: 'kc-btn is-primary', type: 'button',
            onclick: async () => {
              const r = await api('/auth/profile', {
                method: 'POST',
                body: { name: nameInput.value, lang: langSelect.value },
              });
              store.setUser(r.user);
              i18n.set(r.user.lang);
              flash(saveStatus, t('profile.saved'));
            },
          }, t('common.save')),
          saveStatus),
        h('dl', { class: 'kc-kv', style: { marginTop: '18px' } },
          h('dt', {}, t('profile.registered')), h('dd', {}, dateTime(user.createdAt, lang)),
          h('dt', {}, t('profile.role')), h('dd', {}, t('role.' + user.role)))),
      h('div', { class: 'kc-panel-foot' },
        h('a', { href: '/pets/builds' }, t('pets.builds.title')))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('profile.changePassword')))),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-grid c2' },
          field(t('profile.currentPassword'), curPass),
          field(t('profile.newPassword'), newPass)),
        passStatus,
        h('button', {
          class: 'kc-btn', type: 'button',
          onclick: async () => {
            clear(passStatus);
            try {
              await api('/auth/password', { method: 'POST', body: { current: curPass.value, next: newPass.value } });
              curPass.value = ''; newPass.value = '';
              passStatus.append(h('div', { class: 'kc-ok' }, t('profile.saved')));
            } catch (e) {
              passStatus.append(h('div', { class: 'kc-error' }, t('auth.err.' + (e.code || 'bad_credentials'), e.message)));
            }
          },
        }, t('common.save')))));
}

/* ------------------------------------------------- вкладка «игровой профиль» */
function gameTab(host, { t, i18n, store, link }, state, redraw) {
  const lang = i18n.lang;
  const p = state.profile;
  const status = h('span', { class: 'kc-note' });

  // Без .kc-input: там padding и высота текстового поля, галочка от них раздувается.
  const listed = h('input', { type: 'checkbox', checked: p.listed, style: { width: '16px', height: '16px', accentColor: 'var(--accent)' } });

  const avatar = h('select', { class: 'kc-select' },
    h('option', { value: '' }, t('gp.avatarNone')),
    ...state.catalogs.pets.map((pet) =>
      h('option', { value: pet.name, selected: pet.name === p.avatar }, petLabel(pet, lang))));

  const preview = h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } });
  const drawPreview = () => {
    clear(preview);
    const pet = state.catalogs.petBy.get(avatar.value);
    preview.append(
      pet
        ? h('img', {
          src: petPortrait(pet), alt: '',
          style: { width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 1px var(--line-2)' },
        })
        : h('span', { class: 'kc-note' }, t('gp.avatarNone')),
      avatar);
  };
  avatar.addEventListener('change', drawPreview);
  drawPreview();

  const text = (value, max) => h('input', { class: 'kc-input', value: value ?? '', maxlength: String(max) });
  const number = (value, min, max) => h('input', {
    class: 'kc-input', type: 'number', inputmode: 'numeric',
    value: value == null ? '' : String(value), min: String(min), max: String(max),
  });

  const fields = {
    gameNick: text(p.gameNick === p.name ? (store.user.gameNick || '') : p.gameNick, 60),
    gameServer: text(p.gameServer, 20),
    playerId: text(p.playerId, 30),
    allianceTag: text(p.allianceTag, 10),
    allianceName: text(p.allianceName, 60),
    power: number(p.power, 0, 1e12),
    kills: number(p.kills, 0, 1e12),
    merits: number(p.merits, 0, 1e12),
    tcLevel: number(p.tcLevel, 1, 30),
    vipLevel: number(p.vipLevel, 0, 20),
    timezone: text(p.timezone, 40),
  };

  const mainUnit = h('select', { class: 'kc-select' },
    h('option', { value: '' }, '—'),
    ...UNITS.map((u) => h('option', { value: u, selected: u === p.mainUnit }, unitLabel(u, t))));

  const playStyle = h('select', { class: 'kc-select' },
    h('option', { value: '' }, '—'),
    ...PLAY_STYLES.map((s) => h('option', { value: s, selected: s === p.playStyle }, t('gp.style.' + s))));

  const about = h('textarea', { class: 'kc-textarea', rows: '5', maxlength: '1500' });
  about.value = p.about || '';

  /* Контакты — повторяющиеся строки, до пяти. */
  const contactsHost = h('div', {});
  const contactRows = [];
  function addContactRow(row = { kind: 'discord', value: '' }) {
    if (contactRows.length >= 5) return;
    const kind = h('select', { class: 'kc-select' },
      ...CONTACT_KINDS.map((k) => h('option', { value: k, selected: k === row.kind }, t('gp.contact.' + k))));
    const value = h('input', { class: 'kc-input grow', value: row.value, maxlength: '120' });
    const entry = { kind, value };
    const el = h('div', { class: 'kc-toolbar', style: { marginBottom: '8px' } },
      kind, value,
      h('button', {
        class: 'kc-btn sm', type: 'button',
        onclick: () => {
          const i = contactRows.indexOf(entry);
          if (i >= 0) contactRows.splice(i, 1);
          el.remove();
        },
      }, t('common.delete')));
    contactRows.push(entry);
    contactsHost.append(el);
  }
  (p.contacts || []).forEach(addContactRow);

  async function save() {
    const body = {
      listed: listed.checked,
      avatar: avatar.value,
      gameNick: fields.gameNick.value,
      gameServer: fields.gameServer.value,
      playerId: fields.playerId.value,
      allianceTag: fields.allianceTag.value,
      allianceName: fields.allianceName.value,
      power: fields.power.value,
      kills: fields.kills.value,
      merits: fields.merits.value,
      tcLevel: fields.tcLevel.value,
      vipLevel: fields.vipLevel.value,
      timezone: fields.timezone.value,
      mainUnit: mainUnit.value,
      playStyle: playStyle.value,
      about: about.value,
      contacts: contactRows.map((r) => ({ kind: r.kind.value, value: r.value.value })),
    };
    const r = await api('/profile/game', { method: 'POST', body });
    state.profile = r.profile;
    store.setUser(r.user);
    flash(status, t('gp.saved'));
  }

  host.append(
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('gp.title')), h('p', {}, t('gp.desc'))),
        p.listed
          ? h('a', {
            class: 'kc-btn sm', href: `/accounts/${p.id}`, onclick: link(`/accounts/${p.id}`),
          }, t('gp.openPublic'))
          : null),

      h('div', { class: 'kc-panel-body' },
        h('label', {
          class: 'kc-toolbar',
          style: { alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '4px' },
        }, listed, h('span', { style: { fontWeight: '600' } }, t('gp.listed'))),
        h('p', { class: 'kc-help', style: { marginTop: '0' } }, t('gp.listedHint')),

        h('div', { class: 'kc-section-title', style: { marginTop: '20px' } }, t('gp.avatar')),
        preview,
        h('p', { class: 'kc-help' }, t('gp.avatarHint')),

        h('div', { class: 'kc-grid c2', style: { marginTop: '18px' } },
          field(t('gp.nick'), fields.gameNick),
          field(t('gp.server'), fields.gameServer),
          field(t('gp.playerId'), fields.playerId),
          field(t('gp.allianceTag'), fields.allianceTag),
          field(t('gp.allianceName'), fields.allianceName),
          field(t('gp.mainUnit'), mainUnit),
          field(t('gp.playStyle'), playStyle),
          field(t('gp.timezone'), fields.timezone)),

        h('div', { class: 'kc-section-title', style: { marginTop: '20px' } }, t('gp.numbers')),
        h('div', { class: 'kc-grid c2' },
          field(t('gp.power'), fields.power),
          field(t('gp.tcLevel'), fields.tcLevel),
          field(t('gp.kills'), fields.kills),
          field(t('gp.merits'), fields.merits),
          field(t('gp.vipLevel'), fields.vipLevel)),

        h('div', { class: 'kc-section-title', style: { marginTop: '20px' } }, t('gp.contacts')),
        contactsHost,
        h('button', { class: 'kc-btn sm', type: 'button', onclick: () => addContactRow() }, t('gp.contactAdd')),
        h('p', { class: 'kc-help' }, t('gp.contactsHint')),

        h('div', { class: 'kc-section-title', style: { marginTop: '20px' } }, t('gp.about')),
        about,
        h('p', { class: 'kc-help' }, t('gp.aboutHint')),

        h('div', { class: 'kc-toolbar', style: { marginTop: '18px' } },
          h('button', {
            class: 'kc-btn is-primary', type: 'button',
            onclick: (e) => {
              e.target.disabled = true;
              save().catch((err) => flash(status, t('common.error') + ' — ' + err.message))
                .finally(() => { e.target.disabled = false; redraw(); });
            },
          }, t('common.save')),
          status))));
}

/* -------------------------------- вкладки «питомцы» / «герои» / «артефакты» */
function itemsTab(host, ctx, state, kind, redraw) {
  const { t, i18n } = ctx;
  const lang = i18n.lang;
  const items = state.profile.items.filter((it) => it.kind === kind);
  const atLimit = items.length >= state.limits.perKind;

  const listHost = h('div', {});
  const formHost = h('div', {});

  const drawList = () => {
    clear(listHost);
    if (!items.length) {
      listHost.append(empty(t('gp.items.empty' + kind[0].toUpperCase() + kind.slice(1)), t('gp.items.emptyHint')));
      return;
    }
    listHost.append(h('div', { class: 'kc-grid auto-lg' }, ...items.map((it) =>
      itemCard(it, state.catalogs, lang, t, h('div', {
        class: 'kc-toolbar',
        style: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--line)' },
      },
      h('button', {
        class: 'kc-btn sm', type: 'button',
        onclick: () => openForm(it),
      }, t('gp.items.edit')),
      h('button', {
        class: 'kc-btn sm is-danger', type: 'button',
        onclick: async () => {
          if (!confirm(t('gp.item.deleteConfirm'))) return;
          await api('/profile/item', { method: 'DELETE', body: { id: it.id } });
          state.profile.items = state.profile.items.filter((x) => x.id !== it.id);
          redraw();
        },
      }, t('common.delete')))))));
  };

  const openForm = (item) => {
    clear(formHost);
    formHost.append(itemForm(ctx, state, kind, item, redraw, () => clear(formHost)));
    formHost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  host.append(h('section', { class: 'kc-panel' },
    h('div', { class: 'kc-panel-head' },
      h('div', {}, h('h2', {}, t('gp.items.' + kind)), h('p', {}, t('gp.items.' + kind + 'Desc'))),
      h('button', {
        class: 'kc-btn sm is-primary', type: 'button', disabled: atLimit,
        onclick: () => openForm(null),
      }, t('gp.items.add'))),
    h('div', { class: 'kc-panel-body' },
      atLimit
        ? h('div', { class: 'kc-error', style: { marginBottom: '12px' } },
          t('gp.items.limit').replace('{n}', num(state.limits.perKind, lang)))
        : null,
      formHost,
      listHost)));

  drawList();
}

/**
 * Форма записи. Питомец и герой выбираются из справочника — по имени сайт
 * достаёт портрет и характеристики; у артефакта справочника нет, поэтому там
 * обычное поле ввода.
 */
function itemForm({ t, i18n }, state, kind, item, redraw, close) {
  const lang = i18n.lang;
  const status = h('div', {});

  let nameEl;
  if (kind === 'pet') {
    nameEl = h('select', { class: 'kc-select' },
      h('option', { value: '' }, t('gp.item.pick')),
      ...state.catalogs.pets.map((p) =>
        h('option', { value: p.name, selected: p.name === item?.name }, petLabel(p, lang))));
  } else if (kind === 'hero') {
    nameEl = h('select', { class: 'kc-select' },
      h('option', { value: '' }, t('gp.item.pick')),
      ...state.catalogs.heroes.map((x) =>
        h('option', { value: x.name, selected: x.name === item?.name }, `${x.name} — ${x.title}`)));
  } else {
    nameEl = h('input', { class: 'kc-input', value: item?.name || '', maxlength: '80' });
  }

  const level = h('input', {
    class: 'kc-input', type: 'number', inputmode: 'numeric', min: '1',
    max: String(kind === 'hero' ? 80 : 40), value: item?.level == null ? '' : String(item.level),
  });
  const stars = h('input', {
    class: 'kc-input', type: 'number', inputmode: 'numeric', min: '0', max: '6',
    value: item?.stars == null ? '' : String(item.stars),
  });
  const note = h('textarea', { class: 'kc-textarea', rows: '2', maxlength: '300' });
  note.value = item?.note || '';

  /* --- extra: своё для каждого вида --------------------------------- */
  const extraHost = h('div', {});
  let readExtra = () => ({});

  if (kind === 'pet') {
    const rows = [];
    const rowsHost = h('div', {});

    /** Эксклюзивные навыки чужих питомцев в списке не нужны. */
    const optionsFor = (petName) => state.catalogs.skills
      .filter((s) => !s.petExclusive || s.petExclusive === petName);

    const addRow = (row = { name: '', level: 4 }) => {
      if (rows.length >= 8) return;
      const sel = h('select', { class: 'kc-select grow' },
        h('option', { value: '' }, t('gp.item.pick')),
        ...optionsFor(nameEl.value).map((s) =>
          h('option', { value: s.name, selected: s.name === row.name }, s.name)));
      const lvl = h('select', { class: 'kc-select' },
        ...[1, 2, 3, 4].map((n) => h('option', { value: String(n), selected: n === row.level }, String(n))));
      const entry = { sel, lvl };
      const el = h('div', { class: 'kc-toolbar', style: { marginBottom: '8px' } }, sel, lvl,
        h('button', {
          class: 'kc-btn sm', type: 'button',
          onclick: () => { const i = rows.indexOf(entry); if (i >= 0) rows.splice(i, 1); el.remove(); },
        }, t('common.delete')));
      rows.push(entry);
      rowsHost.append(el);
    };

    (item?.extra?.skills || []).forEach(addRow);
    // Список эксклюзивов зависит от выбранного питомца — перерисовываем.
    nameEl.addEventListener('change', () => {
      const current = rows.map((r) => ({ name: r.sel.value, level: Number(r.lvl.value) }));
      rows.length = 0;
      clear(rowsHost);
      current.forEach(addRow);
    });

    extraHost.append(
      h('div', { class: 'kc-section-title' }, t('gp.item.skills')),
      rowsHost,
      h('button', { class: 'kc-btn sm', type: 'button', onclick: () => addRow() }, t('gp.item.addSkill')),
      h('p', { class: 'kc-help' }, t('gp.item.skillsHint')));

    readExtra = () => ({
      skills: rows
        .map((r) => ({ name: r.sel.value, level: Number(r.lvl.value) }))
        .filter((r) => r.name),
    });
  } else if (kind === 'hero') {
    const levels = [0, 1, 2, 3].map((i) => h('input', {
      class: 'kc-input', type: 'number', inputmode: 'numeric', min: '0', max: '5',
      value: item?.extra?.skills?.[i] == null ? '' : String(item.extra.skills[i]),
    }));
    const expedition = h('input', {
      type: 'checkbox', checked: !!item?.extra?.expedition,
      style: { width: '16px', height: '16px', accentColor: 'var(--accent)' },
    });
    extraHost.append(
      h('div', { class: 'kc-section-title' }, t('gp.item.heroSkills')),
      h('div', { class: 'kc-grid c4' }, ...levels.map((el, i) => field(String(i + 1), el))),
      h('label', { class: 'kc-toolbar', style: { alignItems: 'center', gap: '10px', cursor: 'pointer' } },
        expedition, h('span', {}, t('gp.item.expedition'))));
    readExtra = () => ({
      skills: levels.map((el) => (el.value === '' ? null : Number(el.value))),
      expedition: expedition.checked,
    });
  } else {
    const quality = h('select', { class: 'kc-select' },
      h('option', { value: '' }, '—'),
      ...QUALITIES.map((q) => h('option', { value: q, selected: q === item?.extra?.quality }, t('gp.quality.' + q))));
    extraHost.append(field(t('gp.item.quality'), quality));
    readExtra = () => ({ quality: quality.value });
  }

  async function submit(btn) {
    clear(status);
    btn.disabled = true;
    try {
      const r = await api('/profile/item', {
        method: 'POST',
        body: {
          id: item?.id, kind,
          name: nameEl.value,
          level: level.value, stars: stars.value,
          note: note.value, extra: readExtra(),
        },
      });
      const list = state.profile.items;
      const i = list.findIndex((x) => x.id === r.item.id);
      if (i >= 0) list[i] = r.item; else list.push(r.item);
      redraw();
    } catch (e) {
      status.append(h('div', { class: 'kc-error' }, t('gp.err.' + (e.code || ''), e.message)));
      btn.disabled = false;
    }
  }

  return h('div', {
    class: 'kc-card kc-itemform',
    style: { marginBottom: '18px', borderColor: 'var(--line-2)' },
  },
  h('div', { class: 'kc-grid c2' },
    field(t('gp.item.name'), nameEl),
    field(t('gp.item.level'), level),
    field(t('gp.item.stars'), stars)),
  extraHost,
  field(t('gp.item.note'), note),
  status,
  h('div', { class: 'kc-toolbar', style: { marginTop: '12px' } },
    h('button', {
      class: 'kc-btn is-primary', type: 'button',
      onclick: (e) => submit(e.target),
    }, t('common.save')),
    h('button', { class: 'kc-btn', type: 'button', onclick: close }, t('common.cancel'))));
}

/* ------------------------------------------------------------------ helpers */
const field = (label, input) => h('div', { class: 'kc-field' }, h('label', {}, label), input);

function flash(el, text, ms = 2500) {
  el.textContent = text;
  setTimeout(() => { if (el.textContent === text) el.textContent = ''; }, ms);
}
