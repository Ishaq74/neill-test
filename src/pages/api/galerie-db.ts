import type { APIRoute } from 'astro';
import db from '@lib/db';

// GET images with dynamic filters
export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const serviceId = params.get('serviceId');
  const formationId = params.get('formationId');
  const globalFlag = params.get('global');
  const servicesGlobal = params.get('servicesGlobal');
  const formationsGlobal = params.get('formationsGlobal');
  let query = 'SELECT * FROM galerie WHERE 1=1';
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
  query += ' ORDER BY createdAt DESC';
  const stmt = db.prepare(query);
  const galerie = stmt.all(...values);
  // On renvoie bien le champ alt (texte alternatif)
  return new Response(JSON.stringify(galerie), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST add image
export const POST: APIRoute = async ({ request }) => {
  const { title, imageUrl, alt, description, uploadedBy } = await request.json();
  const createdAt = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO galerie (title, imageUrl, alt, description, uploadedBy, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(title, imageUrl, alt, description, uploadedBy, createdAt);
  return new Response(JSON.stringify({ id: info.lastInsertRowid, title, imageUrl, alt, description, uploadedBy, createdAt }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PATCH update image
export const PATCH: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const { title, imageUrl, alt, description, uploadedBy } = await request.json();
  const stmt = db.prepare('UPDATE galerie SET title=?, imageUrl=?, alt=?, description=?, uploadedBy=? WHERE id=?');
  stmt.run(title, imageUrl, alt, description, uploadedBy, id);
  return new Response(JSON.stringify({ id, title, imageUrl, alt, description, uploadedBy }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE image
export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const stmt = db.prepare('DELETE FROM galerie WHERE id=?');
  stmt.run(id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
