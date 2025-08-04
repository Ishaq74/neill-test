
import type { APIRoute } from 'astro';
import db from '@lib/db';

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const serviceId = params.get('serviceId');
  const formationId = params.get('formationId');
  const globalFlag = params.get('global');
  const servicesGlobal = params.get('servicesGlobal');
  const formationsGlobal = params.get('formationsGlobal');
  let query = 'SELECT * FROM avis WHERE 1=1';
  const values: any[] = [];
  if (serviceId) {
    query += ' AND serviceId = ?';
    values.push(serviceId);
  }
  if (formationId) {
    query += ' AND formationId = ?';
    values.push(formationId);
  }
  if (globalFlag) {
    query += ' AND global = 1';
  }
  if (servicesGlobal) {
    query += ' AND servicesGlobal = 1';
  }
  if (formationsGlobal) {
    query += ' AND formationsGlobal = 1';
  }
  const stmt = db.prepare(query);
  const avis = stmt.all(...values);
  return new Response(JSON.stringify(avis), {
    headers: { 'Content-Type': 'application/json' },
  });
};


export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const {
    utilisateur,
    commentaire,
    note,
    global = 0,
    servicesGlobal = 0,
    formationsGlobal = 0,
    serviceId = null,
    formationId = null
  } = body;
  const stmt = db.prepare(`INSERT INTO avis (utilisateur, commentaire, note, global, servicesGlobal, formationsGlobal, serviceId, formationId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(
    utilisateur,
    commentaire,
    note,
    global,
    servicesGlobal,
    formationsGlobal,
    serviceId,
    formationId
  );
  return new Response(JSON.stringify({ id: info.lastInsertRowid, ...body }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const body = await request.json();
  const fields = [
    'utilisateur', 'commentaire', 'note', 'global', 'servicesGlobal', 'formationsGlobal', 'serviceId', 'formationId'
  ];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (f in body) {
      updates.push(`${f} = ?`);
      values.push(body[f]);
    }
  }
  if (!updates.length) return new Response('No fields to update', { status: 400 });
  const stmt = db.prepare(`UPDATE avis SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values, id);
  return new Response(JSON.stringify({ id, ...body }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const stmt = db.prepare('DELETE FROM avis WHERE id = ?');
  stmt.run(id);
  return new Response(JSON.stringify({ id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
