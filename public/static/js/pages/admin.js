import { h, clear, api, num, dateTime, timeShort, empty, loading, dataTable, debounce, counted } from '../util.js';

export function render(mount, ctx) {
  const { t, store, link } = ctx;

  if (!store.user || store.user.role !== 'admin') {
    mount.append(h('section', { class: 'kc-panel' }, h('div', { class: 'kc-panel-body' },
      empty(t('admin.needAuth'), t('admin.needAuthHint')),
      h('div', { style: { textAlign: 'center' } },
        h('a', { class: 'kc-btn is-primary', href: '/login', onclick: link('/login') }, t('auth.submitIn'))))));
    return;
  }

  let tab = new URLSearchParams(location.search).get('tab') || 'overview';
  const body = h('div', {});
  const tabsHost = h('div', { class: 'kc-chips' });

  function drawTabs() {
    clear(tabsHost);
    for (const k of ['overview', 'users', 'support']) {
      tabsHost.append(h('button', {
        class: 'kc-chip' + (k === tab ? ' is-active' : ''), type: 'button',
        onclick: () => { tab = k; history.replaceState({}, '', `/admin?tab=${k}`); drawTabs(); draw(); },
      }, t('admin.tab.' + k)));
    }
  }

  async function draw() {
    clear(body);
    body.append(loading(t('common.loading')));
    try {
      if (tab === 'overview') await overview(body, ctx);
      else if (tab === 'users') await users(body, ctx);
      else await support(body, ctx);
    } catch (e) {
      clear(body);
      body.append(h('div', { class: 'kc-error' }, e.message));
    }
  }

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('admin.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('admin.title')), h('p', {}, store.user.email)),
        h('button', { class: 'kc-btn sm', type: 'button', onclick: () => draw() }, '⟳')),
      h('div', { class: 'kc-panel-body', style: { paddingBottom: '0' } }, tabsHost)),
    body);

  drawTabs();
  draw();
}

/* -------------------------------------------------------------- overview */
async function overview(host, { t, i18n }) {
  const lang = i18n.lang;
  const d = await api('/admin/overview');
  clear(host);

  const sparkline = (rows, key, labelFn) => {
    const max = Math.max(1, ...rows.map((r) => r[key]));
    return h('div', { class: 'kc-sparkline' },
      ...rows.map((r) => h('div', {
        style: { height: `${Math.max(3, (r[key] / max) * 100)}%` },
        dataset: { label: labelFn(r) },
      })));
  };

  host.append(
    h('div', { class: 'kc-grid c4', style: { marginBottom: '16px' } },
      tile(t('admin.users'), num(d.users, lang), `+${d.newUsers7} ${lang === 'ru' ? 'за неделю' : 'this week'}`),
      tile(t('admin.online'), num(d.online, lang), `${t('admin.sessions')}: ${num(d.sessions, lang)}`),
      tile(t('admin.threads'), num(d.threads, lang), `${t('admin.messages')}: ${num(d.messages, lang)}`),
      tile(t('admin.unread'), num(d.unread, lang), d.unread > 0 ? (lang === 'ru' ? 'ждут ответа' : 'awaiting reply') : '—'),
      tile(t('admin.visits'), num(d.visits.total, lang)),
      tile(t('admin.uniques'), num(d.visits.uniques, lang)),
      tile(t('admin.roster'), num(d.rosterListed, lang), `${t('admin.rosterItems')}: ${num(d.profileItems, lang)}`),
      ...d.byRole.map((r) => tile(t('role.' + r.role, r.role), num(r.c, lang)))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h3', {}, t('admin.trafficByDay')))),
      h('div', { class: 'kc-panel-body' },
        d.visits.byDay.length
          ? sparkline(d.visits.byDay, 'c', (r) => `${r.d}: ${r.c} / ${r.u}`)
          : empty(t('common.nothing')))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h3', {}, t('admin.topPages')))),
      d.visits.topPages.length
        ? dataTable(d.visits.topPages, [
          { key: 'path', label: 'URL', sortable: false, render: (r) => h('a', { href: r.path }, r.path) },
          { key: 'c', label: t('admin.visits'), num: true, sortable: false },
        ], { lang })
        : h('div', { class: 'kc-panel-body' }, empty(t('common.nothing')))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h3', {}, t('admin.signups')))),
      h('div', { class: 'kc-panel-body' },
        d.signupsByDay.length
          ? sparkline(d.signupsByDay, 'c', (r) => `${r.d}: ${r.c}`)
          : empty(t('common.nothing')))));

  function tile(label, value, note) {
    return h('div', { class: 'kc-tile' },
      h('div', { class: 'kc-tile-label' }, label),
      h('div', { class: 'kc-tile-value' }, value),
      note && h('small', { class: 'kc-tile-note' }, note));
  }
}

/* ----------------------------------------------------------------- users */
async function users(host, { t, i18n, store }) {
  const lang = i18n.lang;
  let q = '';
  const tableHost = h('div', {});
  const foot = h('div', { class: 'kc-panel-foot' });

  const search = h('input', {
    class: 'kc-input grow', type: 'search', placeholder: t('common.searchPlaceholder'),
    oninput: debounce((e) => { q = e.target.value.trim(); load(); }),
  });

  clear(host);
  host.append(h('section', { class: 'kc-panel' },
    h('div', { class: 'kc-panel-head' },
      h('div', {}, h('h3', {}, t('admin.tab.users'))),
      h('div', { class: 'kc-toolbar' }, search)),
    tableHost, foot));

  async function load() {
    clear(tableHost);
    tableHost.append(loading(t('common.loading')));
    const d = await api('/admin/users' + (q ? `?q=${encodeURIComponent(q)}` : ''));
    clear(tableHost);

    if (!d.items.length) { tableHost.append(empty(t('common.nothing'))); clear(foot); return; }

    tableHost.append(dataTable(d.items, [
      { key: 'id', label: 'ID', num: true, sortable: false, width: '56px' },
      {
        key: 'name', label: t('common.name'), sortable: false,
        render: (u) => h('div', {},
          h('div', { style: { fontWeight: '700' } }, u.name,
            u.role === 'admin' ? h('span', { class: 'kc-badge is-gold', style: { marginLeft: '6px' } }, 'ADM') : null,
            u.status === 'blocked' ? h('span', { class: 'kc-badge is-danger', style: { marginLeft: '6px' } }, t('admin.status.blocked')) : null),
          h('small', { style: { color: 'var(--muted)' } }, u.email)),
      },
      {
        key: 'game', label: lang === 'ru' ? 'В игре' : 'In game', sortable: false,
        render: (u) => (u.gameNick || u.gameServer
          ? h('div', {}, h('div', {}, u.gameNick || '—'), h('small', { style: { color: 'var(--muted)' } }, u.gameServer ? `S${u.gameServer}` : ''))
          : '—'),
      },
      { key: 'created_at', label: t('admin.user.registered'), sortable: false, render: (u) => dateTime(u.created_at, lang) },
      { key: 'last_seen_at', label: t('admin.user.lastSeen'), sortable: false, render: (u) => (u.last_seen_at ? timeShort(u.last_seen_at, lang) : '—') },
      { key: 'visits', label: t('admin.user.visits'), num: true, sortable: false },
      { key: 'last_ip', label: t('admin.user.ip'), sortable: false, render: (u) => h('small', { style: { color: 'var(--muted-2)' } }, u.last_ip || '—') },
      {
        key: '__act', label: '', sortable: false,
        render: (u) => h('div', { style: { display: 'flex', gap: '5px', justifyContent: 'flex-end' } },
          u.id !== store.user.id && h('button', {
            class: 'kc-btn sm', type: 'button', title: u.role === 'admin' ? t('admin.user.makeUser') : t('admin.user.makeAdmin'),
            onclick: async (e) => { e.stopPropagation(); await api('/admin/user', { method: 'PATCH', body: { id: u.id, role: u.role === 'admin' ? 'user' : 'admin' } }); load(); },
          }, u.role === 'admin' ? '↓' : '↑'),
          u.id !== store.user.id && h('button', {
            class: 'kc-btn sm', type: 'button', title: u.status === 'blocked' ? t('admin.user.unblock') : t('admin.user.block'),
            onclick: async (e) => { e.stopPropagation(); await api('/admin/user', { method: 'PATCH', body: { id: u.id, status: u.status === 'blocked' ? 'active' : 'blocked' } }); load(); },
          }, u.status === 'blocked' ? '✓' : '⛔'),
          u.id !== store.user.id && h('button', {
            class: 'kc-btn sm is-danger', type: 'button', title: t('admin.user.delete'),
            onclick: async (e) => {
              e.stopPropagation();
              if (!confirm(t('admin.user.confirmDelete'))) return;
              await api('/admin/user', { method: 'DELETE', body: { id: u.id } });
              load();
            },
          }, '✕')),
      },
    ], { lang, minWidth: '900px' }));

    clear(foot);
    foot.append(counted(d.items.length, d.total, t, lang) + '.');
  }

  await load();
}

/* --------------------------------------------------------------- support */
async function support(host, ctx) {
  const { t, i18n } = ctx;
  const lang = i18n.lang;
  let status = '';
  let q = '';
  let activeId = null;

  const listHost = h('div', { class: 'kc-thread-list' });
  const detailHost = h('div', {});

  const statusSel = h('select', { class: 'kc-select', onchange: (e) => { status = e.target.value; loadList(); } },
    h('option', { value: '' }, t('admin.thread.status') + ': ' + t('common.all')),
    ...['open', 'answered', 'closed'].map((s) => h('option', { value: s }, t('admin.thread.' + s))));

  const search = h('input', {
    class: 'kc-input grow', type: 'search', placeholder: t('common.searchPlaceholder'),
    oninput: debounce((e) => { q = e.target.value.trim(); loadList(); }),
  });

  clear(host);
  host.append(h('div', { class: 'kc-admin-layout' },
    h('section', { class: 'kc-panel', style: { margin: '0' } },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h3', {}, t('admin.tab.support'))),
        h('div', { class: 'kc-toolbar' }, statusSel)),
      h('div', { class: 'kc-panel-body', style: { paddingBottom: '10px' } }, search),
      listHost),
    h('section', { class: 'kc-panel', style: { margin: '0' } }, detailHost)));

  detailHost.append(h('div', { class: 'kc-panel-body' }, empty(t('admin.thread.pick'))));

  async function loadList() {
    clear(listHost);
    listHost.append(loading(t('common.loading')));
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const d = await api('/admin/threads' + (params.toString() ? '?' + params : ''));
    clear(listHost);

    if (!d.items.length) { listHost.append(empty(t('admin.thread.empty'))); return; }

    for (const th of d.items) {
      listHost.append(h('button', {
        class: 'kc-thread-item' + (th.id === activeId ? ' is-active' : ''), type: 'button',
        onclick: () => { activeId = th.id; loadList(); openThread(th.id); },
      },
        h('div', { class: 'who' },
          th.unread_admin > 0 && h('span', { class: 'kc-unread-dot' }),
          h('span', {}, th.display_name),
          h('span', { class: 'kc-badge', style: { marginLeft: 'auto' } }, t('support.subject.' + th.subject, th.subject))),
        h('div', { class: 'snippet' }, th.last_body || '—'),
        h('div', { class: 'meta' },
          h('span', {}, timeShort(th.updated_at, lang)),
          h('span', {}, '· ' + th.msg_count),
          h('span', { class: 'kc-badge' + (th.status === 'open' ? '' : th.status === 'answered' ? ' is-success' : ' is-danger') },
            t('admin.thread.' + th.status)))));
    }
  }

  async function openThread(id) {
    clear(detailHost);
    detailHost.append(h('div', { class: 'kc-panel-body' }, loading(t('common.loading'))));
    const d = await api('/admin/thread?id=' + id);
    const th = d.thread;
    clear(detailHost);

    const log = h('div', { class: 'kc-chat-log' },
      ...d.messages.map((m) => h('div', { class: 'kc-msg from-' + (m.author_role === 'admin' ? 'admin' : 'user') },
        m.body,
        h('span', { class: 'kc-msg-time' }, `${m.author_name} · ${dateTime(m.created_at, lang)}`))));

    const reply = h('textarea', {
      class: 'kc-textarea', placeholder: t('admin.thread.replyPlaceholder'),
      onkeydown: (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); },
    });

    const sendBtn = h('button', { class: 'kc-btn is-primary', type: 'button', onclick: () => send() }, t('admin.thread.reply'));

    async function send() {
      const text = reply.value.trim();
      if (!text) return;
      sendBtn.disabled = true;
      try {
        const r = await api('/admin/reply', { method: 'POST', body: { id, body: text } });
        reply.value = '';
        log.append(h('div', { class: 'kc-msg from-admin' }, r.message.body,
          h('span', { class: 'kc-msg-time' }, `${r.message.author_name} · ${dateTime(r.message.created_at, lang)}`)));
        log.scrollTop = log.scrollHeight;
        loadList();
      } finally { sendBtn.disabled = false; }
    }

    detailHost.append(
      h('div', { class: 'kc-panel-head' },
        h('div', {},
          h('h3', {}, th.display_name),
          h('p', {}, [
            d.user ? `${d.user.email} · ${t('role.' + d.user.role)}` : t('admin.thread.guest'),
            th.contact && th.contact !== d.user?.email ? th.contact : null,
            th.page ? `${t('admin.thread.page')}: ${th.page}` : null,
            th.lang.toUpperCase(),
          ].filter(Boolean).join(' · '))),
        h('div', { class: 'kc-toolbar' },
          h('select', {
            class: 'kc-select',
            onchange: async (e) => { await api('/admin/thread', { method: 'PATCH', body: { id, status: e.target.value } }); loadList(); },
          }, ...['open', 'answered', 'closed'].map((s) =>
            h('option', { value: s, selected: th.status === s }, t('admin.thread.' + s)))),
          h('button', {
            class: 'kc-btn sm is-danger', type: 'button', title: t('admin.thread.delete'),
            onclick: async () => {
              if (!confirm(t('admin.thread.delete') + '?')) return;
              await api('/admin/thread', { method: 'DELETE', body: { id } });
              activeId = null;
              clear(detailHost);
              detailHost.append(h('div', { class: 'kc-panel-body' }, empty(t('admin.thread.pick'))));
              loadList();
            },
          }, '✕'))),
      log,
      h('div', { class: 'kc-panel-body' }, reply, h('div', { class: 'kc-toolbar', style: { marginTop: '9px' } }, sendBtn)));

    log.scrollTop = log.scrollHeight;
  }

  await loadList();
}
