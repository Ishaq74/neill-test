
// Astro v5: rendre l'API server-only pour supporter PATCH/DELETE
export const prerender = false;
import type { APIRoute } from 'astro';
import db from '@lib/db';

// GET all reservations
export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (id) {
    const r = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id) as any;
    if (!r) return new Response('Not found', { status: 404 });
    // Récupérer le nom du service ou de la formation
    let serviceName = null, formationName = null;
    if (r.serviceId) {
      const s = db.prepare('SELECT nom FROM services WHERE id = ?').get(r.serviceId) as any;
      if (s) serviceName = s.nom;
    }
    if (r.formationId) {
      const f = db.prepare('SELECT titre FROM formations WHERE id = ?').get(r.formationId) as any;
      if (f) formationName = f.titre;
    }
    return new Response(JSON.stringify({ ...r, serviceName, formationName, notes: (typeof r === 'object' && r !== null && 'notes' in r) ? r.notes : '' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const stmt = db.prepare('SELECT * FROM reservations');
  const reservations = stmt.all().map((r: any) => ({
    id: r.id,
    userId: r.userId,
    serviceId: r.serviceId,
    formationId: r.formationId,
    date: r.date,
    time: r.time,
    status: r.status,
    notes: r.notes || ''
  }));
  return new Response(JSON.stringify(reservations), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST create reservation
export const POST: APIRoute = async ({ request }) => {
  const { userId, serviceId, date, time, status, notes } = await request.json();
  const stmt = db.prepare('INSERT INTO reservations (userId, serviceId, date, time, status, notes) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(userId, serviceId, date, time, status, notes || '');
  return new Response(JSON.stringify({ id: info.lastInsertRowid, userId, serviceId, date, time, status, notes }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PATCH update reservation
export const PATCH: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  if (!id) {
    console.warn('[PATCH /api/reservation-db] Missing id in query');
    return new Response('Missing id', { status: 400 });
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error('[PATCH /api/reservation-db] Invalid JSON body', e);
    return new Response('Invalid JSON', { status: 400 });
  }
  const { userId, serviceId, date, time, status, notes } = body;
  // Log payload pour debug
  console.log('[PATCH /api/reservation-db] Payload:', body);
  // Validation des champs obligatoires
  if (!userId || !serviceId || !date || !time || !status) {
    console.warn('[PATCH /api/reservation-db] Missing required fields', { userId, serviceId, date, time, status });
    return new Response('Missing required fields', { status: 400 });
  }
  const stmt = db.prepare('UPDATE reservations SET userId=?, serviceId=?, date=?, time=?, status=?, notes=? WHERE id=?');
  stmt.run(userId, serviceId, date, time, status, notes || '', id);
  return new Response(JSON.stringify({ id, userId, serviceId, date, time, status, notes }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE reservation
export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id) {
    console.warn('[DELETE /api/reservation-db] Missing id in query');
    return new Response('Missing id', { status: 400 });
  }
  console.log('[DELETE /api/reservation-db] id:', id);
  const stmt = db.prepare('DELETE FROM reservations WHERE id=?');
  stmt.run(id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
