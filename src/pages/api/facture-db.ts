import type { APIRoute } from 'astro';
import db from '@lib/db';

// GET all factures
export const GET: APIRoute = async () => {
  const stmt = db.prepare('SELECT * FROM factures ORDER BY id DESC');
  const factures = stmt.all();
  return new Response(JSON.stringify(factures), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST add facture
export const POST: APIRoute = async ({ request }) => {
  const { reservationId, userId, amount, status, pdfUrl } = await request.json();
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;
  const stmt = db.prepare('INSERT INTO factures (reservationId, userId, amount, status, pdfUrl, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(reservationId, userId, amount, status, pdfUrl, createdAt, updatedAt);
  return new Response(JSON.stringify({ id: info.lastInsertRowid, reservationId, userId, amount, status, pdfUrl, createdAt, updatedAt }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PATCH update facture
export const PATCH: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const { reservationId, userId, amount, status, pdfUrl } = await request.json();
  const updatedAt = new Date().toISOString();
  const stmt = db.prepare('UPDATE factures SET reservationId=?, userId=?, amount=?, status=?, pdfUrl=?, updatedAt=? WHERE id=?');
  stmt.run(reservationId, userId, amount, status, pdfUrl, updatedAt, id);
  return new Response(JSON.stringify({ id, reservationId, userId, amount, status, pdfUrl, updatedAt }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE facture
export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const stmt = db.prepare('DELETE FROM factures WHERE id=?');
  stmt.run(id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
