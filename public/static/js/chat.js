/**
 * Floating support widget — "Выслушаем ваши идеи".
 * Present on every tab (including the embedded War Pet Builder, which posts
 * its own open request up to this shell). Messages go straight to the admin panel.
 */
import { h, clear, api, timeShort } from './util.js';

let panelEl = null;
let launcherEl = null;
let poll = null;
let ctx = null;
let thread = null;
let messages = [];
let seenCount = 0;

export function mountSupport(context) {
  ctx = context;

  launcherEl = h('button', {
    class: 'kc-support-launcher', type: 'button', id: 'kc-support-launcher',
    'aria-label': ctx.t('support.launcher'),
    onclick: () => toggle(true),
  }, h('span', { class: 'mark' }, '💬'), h('span', { class: 'label' }, ctx.t('support.launcher')));

  document.body.append(launcherEl);

  ctx.i18n.onChange(() => {
    launcherEl.querySelector('.label').textContent = ctx.t('support.launcher');
    if (panelEl) { const open = true; close(); toggle(open); }
  });

  // The builder runs in an iframe and asks the shell to open the widget.
  window.addEventListener('message', (e) => {
    if (e.data && e.data.kc === 'open-support') toggle(true);
  });

  refresh().then(() => { seenCount = messages.length; updateBadge(); });
  poll = setInterval(() => { if (!document.hidden) refresh().then(updateBadge); }, 25_000);
  window.addEventListener('beforeunload', () => clearInterval(poll));
}

async function refresh() {
  try {
    const r = await api('/support/thread');
    thread = r.thread;
    messages = r.messages || [];
    if (panelEl) renderMessages();
  } catch { /* offline — keep the last known state */ }
}

function updateBadge() {
  if (!launcherEl) return;
  const adminMsgs = messages.filter((m) => m.author_role === 'admin').length;
  const unread = panelEl ? 0 : Math.max(0, messages.length - seenCount);
  let badge = launcherEl.querySelector('.kc-unread');
  if (unread > 0 && adminMsgs > 0) {
    if (!badge) { badge = h('span', { class: 'kc-unread' }); launcherEl.append(badge); }
    badge.textContent = String(unread);
  } else if (badge) badge.remove();
}

function toggle(open) {
  if (open && !panelEl) openPanel();
  else close();
}

function close() {
  panelEl?.remove();
  panelEl = null;
  launcherEl.hidden = false;
  seenCount = messages.length;
  updateBadge();
}

function openPanel() {
  const { t, store } = ctx;
  launcherEl.hidden = true;

  const log = h('div', { class: 'kc-support-body', id: 'kc-support-log' });

  const textarea = h('textarea', {
    class: 'kc-textarea', placeholder: t('support.placeholder'), rows: '3',
    onkeydown: (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); },
  });

  const subject = h('select', { class: 'kc-select' },
    ...['idea', 'bug', 'question', 'other'].map((s) =>
      h('option', { value: s }, t('support.subject.' + s))));

  const nameInput = h('input', { class: 'kc-input', placeholder: t('support.name'), value: store.user?.name || '' });
  const contactInput = h('input', { class: 'kc-input', placeholder: t('support.contact'), value: store.user?.email || '' });

  const status = h('div', { class: 'kc-note', style: { minHeight: '14px' } });
  const sendBtn = h('button', { class: 'kc-btn is-primary', type: 'button', onclick: () => send() }, t('common.send'));

  const identityRow = h('div', { class: 'kc-support-row', id: 'kc-support-identity' }, nameInput, contactInput);

  const foot = h('div', { class: 'kc-support-foot' },
    h('div', { class: 'kc-support-row' }, subject),
    !store.user && !thread ? identityRow : null,
    textarea,
    h('div', { class: 'kc-support-row', style: { alignItems: 'center' } },
      status, h('div', { style: { flex: '1' } }), sendBtn));

  panelEl = h('div', { class: 'kc-support-panel', role: 'dialog', 'aria-label': t('support.title') },
    h('div', { class: 'kc-support-head' },
      h('div', {},
        h('h3', {}, '💡 ' + t('support.title')),
        h('p', {}, t('support.subtitle'))),
      h('button', { class: 'kc-support-close', type: 'button', 'aria-label': t('common.close'), onclick: close }, '✕')),
    log, foot);

  document.body.append(panelEl);
  renderMessages();
  textarea.focus();

  async function send() {
    const body = textarea.value.trim();
    if (body.length < 2) { status.textContent = t('support.tooShort'); return; }
    sendBtn.disabled = true;
    status.textContent = '…';
    try {
      const r = await api('/support/message', {
        method: 'POST',
        body: {
          body, subject: subject.value, lang: ctx.i18n.lang,
          name: nameInput.value, contact: contactInput.value,
          page: location.pathname,
        },
      });
      thread = r.thread;
      messages = [...messages, r.message];
      textarea.value = '';
      status.textContent = t('support.sent');
      identityRow.remove();
      renderMessages();
      setTimeout(() => { status.textContent = ''; }, 4000);
    } catch (e) {
      status.textContent = e.code === 'too_many_requests' ? ctx.t('auth.err.too_many_requests') : t('support.error');
    } finally {
      sendBtn.disabled = false;
    }
  }

  function renderMessagesLocal() { renderMessages(); }
  renderMessagesLocal();
}

function renderMessages() {
  const log = document.getElementById('kc-support-log');
  if (!log) return;
  const { t, i18n } = ctx;
  clear(log);

  if (!messages.length) {
    log.append(h('div', { class: 'kc-msg from-system' }, t('support.empty')));
    return;
  }
  for (const m of messages) {
    const mine = m.author_role === 'user';
    log.append(h('div', { class: 'kc-msg from-' + (m.author_role === 'admin' ? 'admin' : mine ? 'user' : 'system') },
      m.body,
      h('span', { class: 'kc-msg-time' },
        (mine ? t('support.you') : t('support.admin')) + ' · ' + timeShort(m.created_at, i18n.lang))));
  }
  log.scrollTop = log.scrollHeight;
}
