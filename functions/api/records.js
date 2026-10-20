// Ranking de Ladrillos: GET devuelve el top 10, POST guarda una partida.
// Necesita una base de datos D1 enlazada al proyecto de Pages con el nombre DB.
import { malsonante } from '../_filtro.js';

// Puntos máximos posibles en cada uno de los 8 niveles (ladrillo normal 20, duro 50).
const MAX_NIVEL = [1000, 1100, 900, 1380, 1100, 780, 1060, 1640];
const ESPERA_MS = 20000;   // como mucho un envío cada 20 s por conexión
const GUARDAR = 100;       // se conservan las 100 mejores; se muestran 10

let preparada = false;
async function preparar(db) {
  if (preparada) return;
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, score INTEGER NOT NULL, nivel INTEGER NOT NULL, fecha TEXT NOT NULL)'),
    db.prepare('CREATE INDEX IF NOT EXISTS records_score ON records (score DESC, fecha ASC)'),
    db.prepare('CREATE TABLE IF NOT EXISTS envios (clave TEXT PRIMARY KEY, ts INTEGER NOT NULL)'),
  ]);
  preparada = true;
}

const json = (datos, status = 200) => new Response(JSON.stringify(datos), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

async function top10(db) {
  const { results } = await db.prepare('SELECT id, nombre, score, nivel, fecha FROM records ORDER BY score DESC, fecha ASC LIMIT 10').all();
  return results;
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'Falta enlazar la base de datos D1 (DB).' }, 500);
  await preparar(env.DB);
  return json(await top10(env.DB));
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Falta enlazar la base de datos D1 (DB).' }, 500);
  const db = env.DB;
  await preparar(db);

  let p;
  try { p = await request.json(); } catch { return json({ error: 'Datos no válidos.' }, 400); }

  const nombre = String(p.nombre || '').toUpperCase().replace(/[^A-Z0-9ÑÇ .\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10);
  const score = Number(p.score), nivel = Number(p.nivel);
  if (!nombre) return json({ error: 'Falta el nombre.' }, 400);
  if (malsonante(nombre)) return json({ error: 'Nombre no permitido.' }, 400);
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > 200) return json({ error: 'Nivel no válido.' }, 400);
  let maximo = 0;
  for (let i = 0; i < nivel; i++) maximo += MAX_NIVEL[i % MAX_NIVEL.length];
  if (!Number.isInteger(score) || score <= 0 || score > maximo) return json({ error: 'Puntuación no válida.' }, 400);

  // Límite de envíos. La IP no se guarda: solo un resumen (hash) que caduca en una hora.
  const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((env.SAL || 'ladrillos') + ip));
  const clave = [...new Uint8Array(bytes)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
  const ahora = Date.now();
  const previo = await db.prepare('SELECT ts FROM envios WHERE clave = ?').bind(clave).first();
  if (previo && ahora - previo.ts < ESPERA_MS) return json({ error: 'Demasiados envíos. Espera un momento.' }, 429);

  const id = crypto.randomUUID();
  await db.batch([
    db.prepare('INSERT INTO records (id, nombre, score, nivel, fecha) VALUES (?, ?, ?, ?, ?)').bind(id, nombre, score, nivel, new Date().toISOString()),
    db.prepare('INSERT INTO envios (clave, ts) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET ts = excluded.ts').bind(clave, ahora),
    db.prepare('DELETE FROM envios WHERE ts < ?').bind(ahora - 3600000),
    db.prepare('DELETE FROM records WHERE id NOT IN (SELECT id FROM records ORDER BY score DESC, fecha ASC LIMIT ?)').bind(GUARDAR),
  ]);
  return json({ id, top: await top10(db) });
}
