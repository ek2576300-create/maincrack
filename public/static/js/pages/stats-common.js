/* Shared helpers for the Tamaris War Stats section. */
import { h, getJSON, num, compact } from '../util.js';

export const manifest = () => getJSON('/data/webdata/manifest.json');
export const serverPlayers = (id) => getJSON(`/data/webdata/servers/${id}/players.json`);
export const serverAlliances = (id) => getJSON(`/data/webdata/servers/${id}/alliances.json`);
export const serverImmigration = (id) => getJSON(`/data/webdata/servers/${id}/immigration.json`);
export const serverSummary = (id) => getJSON(`/data/webdata/servers/${id}/summary.json`);
export const playerAchievements = (playerId) =>
  getJSON(`/data/webdata/players/${Number(playerId) % 1000}/${playerId}.achievements.json`);

export const METRICS = [
  { key: 'power', labelKey: 'stats.power' },
  { key: 'townCenterLvl', labelKey: 'stats.tc' },
  { key: 'resourcesGathered', labelKey: 'stats.rss' },
  { key: 'scenarioPoints', labelKey: 'stats.scenario' },
  { key: 'immigrationScore', labelKey: 'stats.immigration' },
  { key: 'merits', labelKey: 'stats.merits' },
  { key: 'honorKills', labelKey: 'stats.kills' },
];

export const ALLIANCE_METRICS = [
  { key: 'power', labelKey: 'stats.power' },
  { key: 'merits', labelKey: 'stats.merits' },
  { key: 'flags', labelKey: 'stats.flags' },
  { key: 'armorySeasonPoints', labelKey: 'stats.armory' },
  { key: 'kills', labelKey: 'stats.kills' },
];

/** Server picker that remembers the last choice. */
export function serverSelect(servers, onChange, t) {
  let current = read();
  if (!servers.some((s) => s.serverId === current)) current = servers[0]?.serverId;

  const sel = h('select', {
    class: 'kc-select',
    onchange: (e) => { current = e.target.value; write(current); onChange(current); },
  }, ...servers.map((s) => h('option', { value: s.serverId, selected: s.serverId === current },
    `${t('common.server')} ${s.serverId} · ${num(s.players)} ${t('stats.players').toLowerCase()}`)));

  return { el: sel, get value() { return current; } };

  function read() {
    const fromUrl = new URLSearchParams(location.search).get('server');
    if (fromUrl) return fromUrl;
    try { return localStorage.getItem('kc.server') || servers[0]?.serverId; } catch { return servers[0]?.serverId; }
  }
  function write(v) { try { localStorage.setItem('kc.server', v); } catch { /* private mode */ } }
}

export function powerCell(value, lang) {
  return h('span', { title: num(value, lang) }, compact(value, lang));
}

export function nameCell(name, sub, href) {
  const inner = h('div', {},
    h('div', { style: { fontWeight: '700', color: 'var(--text)' } }, name || '—'),
    sub && h('small', { style: { color: 'var(--muted)' } }, sub));
  return href ? h('a', { href, style: { color: 'inherit', display: 'block' } }, inner) : inner;
}
