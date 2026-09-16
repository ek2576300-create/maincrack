import { h, clear, api, getJSON, empty, dateTime } from '../util.js';

export async function render(mount, { t, i18n, store, navigate, link }) {
  const lang = i18n.lang;

  if (!store.user) {
    mount.append(
      h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('pets.builds.title')),
      h('section', { class: 'kc-panel' }, h('div', { class: 'kc-panel-body' },
        empty(t('pets.builds.needAuth'), t('auth.hint')),
        h('div', { style: { textAlign: 'center' } },
          h('a', { class: 'kc-btn is-primary', href: '/login', onclick: link('/login') }, t('auth.submitIn'))))));
    return;
  }

  const pets = (await getJSON('/data/pets.json')).items;
  const petByName = new Map(pets.map((p) => [p.name, p]));
  const petLabel = (name) => (lang === 'ru' && petByName.get(name)?.name_ru) || name;
  const listHost = h('div', {});
  const status = h('div', { class: 'kc-note' });

  const titleInput = h('input', { class: 'kc-input', placeholder: t('pets.builds.titleField') });
  const petSelect = h('select', { class: 'kc-select' },
    h('option', { value: '' }, t('pets.builds.petField') + '…'),
    ...pets.map((p) => h('option', { value: p.name }, petLabel(p.name))));
  const notesInput = h('textarea', { class: 'kc-textarea', placeholder: t('pets.builds.notesField') });

  async function load() {
    clear(listHost);
    try {
      const r = await api('/builds');
      if (!r.items.length) {
        listHost.append(empty(t('pets.builds.empty'), t('pets.builds.emptyHint')));
        return;
      }
      listHost.append(h('div', { class: 'kc-grid auto-lg' }, ...r.items.map((b) => {
        let payload = {};
        try { payload = JSON.parse(b.payload); } catch { /* legacy row */ }
        const pet = pets.find((p) => p.name === b.pet);
        return h('div', { class: 'kc-card' },
          h('div', { style: { display: 'flex', gap: '10px', alignItems: 'flex-start' } },
            pet && h('img', {
              src: '/static/img/warpets/' + pet.portrait, alt: '', loading: 'lazy',
              style: { width: '42px', height: '42px', borderRadius: '8px', border: '1px solid var(--line)' },
            }),
            h('div', { style: { flex: '1', minWidth: '0' } },
              h('strong', { style: { color: 'var(--gold-soft)' } }, b.title),
              h('div', { class: 'kc-note', style: { marginTop: '3px' } }, (b.pet && petLabel(b.pet)) || '—'))),
          payload.notes && h('p', { class: 'kc-note', style: { margin: '10px 0 0', whiteSpace: 'pre-wrap', color: 'var(--text-dim)' } }, payload.notes),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '11px' } },
            h('small', { style: { color: 'var(--muted-2)', flex: '1' } }, dateTime(b.created_at, lang)),
            h('button', {
              class: 'kc-btn sm is-danger', type: 'button',
              onclick: async () => { await api('/builds', { method: 'DELETE', body: { id: b.id } }); load(); },
            }, t('common.delete'))));
      })));
    } catch (e) {
      listHost.append(h('div', { class: 'kc-error' }, e.message));
    }
  }

  async function save() {
    const title = titleInput.value.trim();
    if (!title) { status.textContent = t('pets.builds.titleField'); return; }
    await api('/builds', {
      method: 'POST',
      body: { title, pet: petSelect.value, payload: { notes: notesInput.value.trim() } },
    });
    titleInput.value = ''; notesInput.value = ''; petSelect.value = '';
    status.textContent = t('profile.saved');
    setTimeout(() => { status.textContent = ''; }, 2500);
    load();
  }

  mount.append(
    h('div', { class: 'kc-breadcrumb' }, h('a', { href: '/' }, t('common.home')), ' / ', t('pets.builds.title')),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' },
        h('div', {}, h('h2', {}, t('pets.builds.new'))),
        h('a', { class: 'kc-btn sm', href: '/pets/builder', onclick: link('/pets/builder') }, '🐉 ' + t('pets.builder.title'))),
      h('div', { class: 'kc-panel-body' },
        h('div', { class: 'kc-grid c2' },
          h('div', { class: 'kc-field' }, h('label', {}, t('pets.builds.titleField')), titleInput),
          h('div', { class: 'kc-field' }, h('label', {}, t('pets.builds.petField')), petSelect)),
        h('div', { class: 'kc-field' }, h('label', {}, t('pets.builds.notesField')), notesInput),
        h('div', { class: 'kc-toolbar' },
          h('button', { class: 'kc-btn is-primary', type: 'button', onclick: save }, t('common.save')), status))),
    h('section', { class: 'kc-panel' },
      h('div', { class: 'kc-panel-head' }, h('div', {}, h('h2', {}, t('pets.builds.title')))),
      h('div', { class: 'kc-panel-body' }, listHost)));

  load();
}
