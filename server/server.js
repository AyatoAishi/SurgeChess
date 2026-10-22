'use strict';
/* Surge Chess room relay. Host-authoritative: the host's browser runs the game, this server only
   tracks rooms/seats/spectators, relays snapshots (host -> everyone) and intents (guest -> host),
   and handles disconnect pause + 90s reconnect window + forfeit. */
const http = require('http');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8787;
const GRACE_MS = +process.env.GRACE_MS || 90000;
const MAX_SPEC = 5;
const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const ENVS = ['random', 'volcano', 'sky', 'rain'];
const rooms = new Map();

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain', 'access-control-allow-origin': '*' });
  res.end('surge ok rooms=' + rooms.size);
});
const wss = new WebSocketServer({ server: httpServer, maxPayload: 2 * 1024 * 1024 });

const rid = () => crypto.randomBytes(6).toString('hex');
function newKey() {
  for (let n = 0; n < 50; n++) {
    let k = '';
    const b = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) k += ALPH[b[i] % ALPH.length];
    if (!rooms.has(k)) return k;
  }
  throw new Error('no key');
}
const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
const seatOf = (r, id) => r.seats.indexOf(id);
const cleanName = s => String(s || '').replace(/[^\w \-.]/g, '').trim().slice(0, 14);

function roomView(r) {
  return {
    t: 'room', key: r.key, host: r.hostId, status: r.status, env: r.env, seats: r.seats,
    members: [...r.members.values()].map(m => ({ id: m.id, name: m.name, online: m.online })),
    pause: r.pause ? { id: r.pause.id, seat: r.pause.seat, until: r.pause.until } : null,
    max: MAX_SPEC
  };
}
function bcast(r, o, except) { for (const m of r.members.values()) if (m.online && m.id !== except) send(m.ws, o); }
function pushRoom(r) { bcast(r, roomView(r)); }
const unseated = r => [...r.members.values()].filter(m => !r.seats.includes(m.id)).length;
const specCount = r => unseated(r);

function destroy(r) {
  clearTimeout(r.pauseTimer);
  for (const m of r.members.values()) { clearTimeout(m.purge); if (m.ws) { try { send(m.ws, { t: 'closed' }); m.ws.close(); } catch (e) {} } }
  rooms.delete(r.key);
}
function removeMember(r, id, notify) {
  const m = r.members.get(id); if (!m) return;
  clearTimeout(m.purge);
  const s = seatOf(r, id); if (s >= 0) r.seats[s] = null;
  r.members.delete(id);
  if (notify && m.ws) { send(m.ws, { t: notify }); try { m.ws.close(); } catch (e) {} }
}

/* in a running game, the host and both seated players matter: if one is offline, pause everyone */
function evalPause(r) {
  if (r.status !== 'playing') {
    if (r.pause) { clearTimeout(r.pauseTimer); r.pause = null; }
    return;
  }
  const need = [...r.members.values()].filter(m => !m.online && (m.id === r.hostId || r.seats.includes(m.id)));
  if (!need.length) {
    if (r.pause) {
      clearTimeout(r.pauseTimer); r.pause = null; pushRoom(r);
      const h = r.members.get(r.hostId);
      if (r.snap) bcast(r, { t: 'snap', d: r.snap, resync: 1 }, r.hostId);
      if (h && h.online) send(h.ws, { t: 'resume', snap: r.snap });
    }
    return;
  }
  if (r.pause && r.members.has(r.pause.id) && !r.members.get(r.pause.id).online) return;
  const m = need[0];
  clearTimeout(r.pauseTimer);
  r.pause = { id: m.id, seat: seatOf(r, m.id), until: Date.now() + GRACE_MS };
  r.pauseTimer = setTimeout(() => forfeit(r, m.id), GRACE_MS + 200);
  pushRoom(r);
}
function forfeit(r, id) {
  if (!rooms.has(r.key) || r.status !== 'playing') return;
  const seat = seatOf(r, id);
  r.pause = null;
  if (seat < 0) { destroy(r); return; }              // unseated host vanished: nobody can run the game
  r.status = 'over';
  bcast(r, { t: 'forfeit', winner: 1 - seat, seat });
  pushRoom(r);
}

wss.on('connection', ws => {
  let room = null, me = null;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  const attach = (r, m) => { room = r; me = m; m.ws = ws; m.online = true; clearTimeout(m.purge); };

  ws.on('message', raw => {
    let d; try { d = JSON.parse(raw); } catch (e) { return; }
    if (!d || typeof d.t !== 'string') return;
    if (d.t === 'ping') { send(ws, { t: 'pong' }); return; }

    if (d.t === 'create' && !room) {
      const r = { key: newKey(), hostId: null, members: new Map(), seats: [null, null], env: 'random', status: 'lobby', snap: null, pause: null, pauseTimer: null, made: Date.now() };
      const m = { id: rid(), token: rid() + rid(), name: cleanName(d.name) || 'Host', ws, online: true };
      r.hostId = m.id; r.members.set(m.id, m); rooms.set(r.key, r);
      attach(r, m);
      send(ws, { t: 'joined', you: m.id, token: m.token, key: r.key });
      pushRoom(r);
      return;
    }
    if (d.t === 'join' && !room) {
      const r = rooms.get(String(d.key || ''));
      if (!r) { send(ws, { t: 'err', code: 'nokey', msg: 'No room with that key.' }); return; }
      let m = d.token ? [...r.members.values()].find(x => x.token === d.token) : null;
      if (m) {                                         // reconnect
        if (m.ws && m.ws !== ws) { try { m.ws.close(); } catch (e) {} }
        attach(r, m);
        send(ws, { t: 'joined', you: m.id, token: m.token, key: r.key, back: 1 });
        pushRoom(r);
        evalPause(r);
        if (r.status === 'playing' && r.snap) send(ws, { t: 'snap', d: r.snap, resync: 1, restore: m.id === r.hostId ? 1 : 0 });
        return;
      }
      if (specCount(r) >= MAX_SPEC) { send(ws, { t: 'err', code: 'full', msg: 'That room is full (5 spectators).' }); return; }
      m = { id: rid(), token: rid() + rid(), name: cleanName(d.name) || 'Guest ' + (r.members.size), ws, online: true };
      r.members.set(m.id, m);
      attach(r, m);
      send(ws, { t: 'joined', you: m.id, token: m.token, key: r.key });
      pushRoom(r);
      if (r.status === 'playing' && r.snap) send(ws, { t: 'snap', d: r.snap, resync: 1 });
      return;
    }
    if (!room || !me || !rooms.has(room.key)) return;
    const r = room, isHost = me.id === r.hostId;

    switch (d.t) {
      case 'seat': {
        if (r.status !== 'lobby') return;
        const s = d.s === 0 ? 0 : d.s === 1 ? 1 : -1, cur = seatOf(r, me.id);
        if (s === cur) return;
        if (s >= 0) {
          if (r.seats[s] && r.seats[s] !== me.id) { send(ws, { t: 'err', code: 'taken', msg: 'That seat is taken.' }); return; }
          if (cur >= 0) r.seats[cur] = null;
          r.seats[s] = me.id;
        } else {
          if (cur < 0) return;
          r.seats[cur] = null;
          if (specCount(r) > MAX_SPEC) { r.seats[cur] = me.id; send(ws, { t: 'err', code: 'full', msg: 'Spectator slots are full.' }); return; }
        }
        pushRoom(r); return;
      }
      case 'kick': {
        if (!isHost) return;
        const id = String(d.id); if (id === r.hostId) return;
        if (r.status === 'playing' && r.seats.includes(id)) return;   // can't yank a player mid-game; spectators only
        removeMember(r, id, 'kicked'); pushRoom(r); return;
      }
      case 'set': {
        if (!isHost || r.status !== 'lobby') return;
        if (ENVS.includes(d.env)) r.env = d.env;
        pushRoom(r); return;
      }
      case 'start': {
        if (!isHost || (r.status !== 'lobby')) return;
        if (r.seats[0] == null || r.seats[1] == null) { send(ws, { t: 'err', code: 'seats', msg: 'Both seats need a player.' }); return; }
        const off = r.seats.map(id => r.members.get(id)).some(m => !m || !m.online);
        if (off) { send(ws, { t: 'err', code: 'offline', msg: 'A seated player is offline.' }); return; }
        r.status = 'playing'; r.snap = null; r.pause = null; clearTimeout(r.pauseTimer);
        bcast(r, { t: 'start', env: r.env });
        pushRoom(r); return;
      }
      case 'snap': {
        if (!isHost || r.status !== 'playing') return;
        r.snap = d.d;
        bcast(r, { t: 'snap', d: d.d }, me.id);
        if (d.over) { r.status = 'over'; r.pause = null; clearTimeout(r.pauseTimer); pushRoom(r); }
        return;
      }
      case 'intent': {
        if (isHost || r.status !== 'playing' || r.pause) return;
        const seat = seatOf(r, me.id); if (seat < 0) return;
        const h = r.members.get(r.hostId);
        if (h && h.online) send(h.ws, { t: 'intent', seat, d: d.d });
        return;
      }
      case 'lobby': {
        if (!isHost || r.status !== 'over') return;
        r.status = 'lobby'; r.snap = null; r.pause = null;
        for (const m of [...r.members.values()]) if (!m.online) removeMember(r, m.id);
        pushRoom(r); return;
      }
      case 'leave': {
        if (isHost) { destroy(r); return; }
        removeMember(r, me.id); room = null;
        if (r.status === 'playing') evalPause(r);
        pushRoom(r); try { ws.close(); } catch (e) {} return;
      }
    }
  });

  ws.on('close', () => {
    if (!room || !me || !rooms.has(room.key)) return;
    if (me.ws !== ws) return;                          // replaced by a reconnect
    const r = room; me.online = false;
    if (r.status === 'playing') { evalPause(r); pushRoom(r); }
    else {
      pushRoom(r);
      me.purge = setTimeout(() => {
        if (!rooms.has(r.key) || me.online) return;
        if (me.id === r.hostId) destroy(r); else { removeMember(r, me.id); pushRoom(r); }
      }, GRACE_MS);
    }
    if (![...r.members.values()].some(m => m.online)) {
      r.idle = setTimeout(() => { if (rooms.has(r.key) && ![...r.members.values()].some(m => m.online)) destroy(r); }, 10 * 60000);
    }
  });
});

setInterval(() => {
  for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch (e) {} }
}, 25000);

httpServer.listen(PORT, () => console.log('surge rooms listening on ' + PORT));
