import { h, clear, banner } from '../util.js';
import { auth } from '../app.js';

export function render(mount, { t, i18n, store, navigate }) {
  const lang = i18n.lang;
  let mode = 'in';

  const formHost = h('div', {});
  const status = h('div', {});

  if (store.user) { navigate('/profile'); return; }

  function draw() {
    clear(formHost);
    clear(status);

    const email = h('input', { class: 'kc-input', type: 'email', autocomplete: 'email', placeholder: 'you@example.com' });
    const password = h('input', { class: 'kc-input', type: 'password', autocomplete: mode === 'in' ? 'current-password' : 'new-password' });
    const name = h('input', { class: 'kc-input', type: 'text', autocomplete: 'nickname' });
    const password2 = h('input', { class: 'kc-input', type: 'password', autocomplete: 'new-password' });

    const submit = h('button', { class: 'kc-btn is-primary block', type: 'submit' },
      mode === 'in' ? t('auth.submitIn') : t('auth.submitUp'));

    const form = h('form', {
      onsubmit: async (e) => {
        e.preventDefault();
        clear(status);
        submit.disabled = true;
        try {
          if (mode === 'up') {
            if (password.value !== password2.value) throw Object.assign(new Error('mismatch'), { code: 'mismatch' });
            await auth.register({ email: email.value, password: password.value, name: name.value });
          } else {
            await auth.login(email.value, password.value);
          }
          navigate('/profile');
        } catch (err) {
          status.append(h('div', { class: 'kc-error' }, t('auth.err.' + (err.code || 'bad_credentials'), err.message)));
        } finally {
          submit.disabled = false;
        }
      },
    },
      mode === 'up' ? h('div', { class: 'kc-field' }, h('label', {}, t('auth.name')), name) : null,
      h('div', { class: 'kc-field' }, h('label', {}, t('auth.email')), email),
      h('div', { class: 'kc-field' }, h('label', {}, t('auth.password')), password),
      mode === 'up' ? h('div', { class: 'kc-field' }, h('label', {}, t('auth.passwordAgain')), password2) : null,
      status,
      submit,
      h('button', {
        class: 'kc-btn is-ghost block', type: 'button', style: { marginTop: '9px' },
        onclick: () => { mode = mode === 'in' ? 'up' : 'in'; draw(); },
      }, mode === 'in' ? t('auth.switchToUp') : t('auth.switchToIn')));

    formHost.append(form);
    email.focus();
  }

  draw();

  mount.append(
    banner(t('auth.signIn') + ' / ' + t('auth.signUp'), null, { compact: true }),
    h('div', { style: { maxWidth: '440px', margin: '0 auto' } },
      h('section', { class: 'kc-panel' },
        h('div', { class: 'kc-panel-body' },
          formHost,
          h('p', { class: 'kc-note', style: { marginTop: '14px' } }, t('auth.hint')),
          h('p', { class: 'kc-note', style: { marginTop: '6px', color: 'var(--muted)' } }, t('auth.firstAdmin'))))));
}
