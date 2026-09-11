import { h, clear, api, dateTime, empty } from '../util.js';
import { auth } from '../app.js';

export function render(mount, { t, i18n, store, navigate, link }) {
  const lang = i18n.lang;
  const user = store.user;

  if (!user) {
    mount.append(h('section', { class: 'kc-panel' }, h('div', { class: 'kc-panel-body' },
      empty(t('auth.hint')),
      h('div', { style: { textAlign: 'center' } },
        h('a', { class: 'kc-btn is-primary', href: '/login', onclick: link('/login') }, t('auth.submitIn'))))));
    return;
  }

  const nameInput = h('input', { class: 'kc-input', value: user.name });
  const serverInput = h('input', { class: 'kc-input', value: user.gameServer || '', placeholder: '888' });
  const nickInput = h('input', { class: 'kc-input', value: user.gameNick || '' });
  const langSelect = h('select', { class: 'kc-select' },
    h('option', { value: 'ru', selected: user.lang === 'ru' }, 'Русский'),
    h('option', { value: 'en', selected: user.lang === 'en' }, 'English'));
  const saveStatus = h('span', { class: 'kc-note' });

  const curPass = h('input', { class: 'kc-input', type: 'password', autocomplete: 'current-password' });
  const newPass = h('input', { class: 'kc-input', type: 'password', autocomplete: 'new-password' });
  const passStatus = h('div', {});

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('profile.title')),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {},
          h('h2', {}, user.name),
          h('p', {}, user.email)),
        h('div', { class: 'kc-toolbar' },
          h('span', { class: 'kc-badge' + (user.role === 'admin' ? ' is-gold' : '') }, t('role.' + user.role)),
          user.role === 'admin' && h('a', { class: 'kc-btn sm', href: '/admin', onclick: link('/admin') }, '🛡 ' + t('admin.title')),
          h('button', {
            class: 'kc-btn sm', type: 'button',
            onclick: async () => { await auth.logout(); navigate('/'); },
          }, t('nav.signOut')))),

      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-grid c2' },
          h('div', { class: 'kc-field' }, h('label', {}, t('auth.name')), nameInput),
          h('div', { class: 'kc-field' }, h('label', {}, 'Язык / Language'), langSelect),
          h('div', { class: 'kc-field' }, h('label', {}, t('profile.gameServer')), serverInput),
          h('div', { class: 'kc-field' }, h('label', {}, t('profile.gameNick')), nickInput)),
        h('div', { class: 'kc-toolbar' },
          h('button', {
            class: 'kc-btn is-primary', type: 'button',
            onclick: async () => {
              const r = await api('/auth/profile', {
                method: 'POST',
                body: { name: nameInput.value, lang: langSelect.value, gameServer: serverInput.value, gameNick: nickInput.value },
              });
              store.setUser(r.user);
              i18n.set(r.user.lang);
              saveStatus.textContent = t('profile.saved');
              setTimeout(() => { saveStatus.textContent = ''; }, 2500);
            },
          }, t('common.save')),
          saveStatus),

        h('dl', { class: 'kc-kv', style: { marginTop: '16px' } },
          h('dt', {}, t('profile.registered')), h('dd', {}, dateTime(user.createdAt, lang)),
          h('dt', {}, t('profile.role')), h('dd', {}, t('role.' + user.role)))),

      h('div', { class: 'kc-panel-foot' },
        h('a', { href: '/pets/builds', onclick: link('/pets/builds') }, '🐉 ' + t('pets.builds.title')))),

    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('profile.changePassword')))),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-grid c2' },
          h('div', { class: 'kc-field' }, h('label', {}, t('profile.currentPassword')), curPass),
          h('div', { class: 'kc-field' }, h('label', {}, t('profile.newPassword')), newPass)),
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
