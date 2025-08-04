export const prerender = false;

import type { APIRoute } from 'astro';
import db from '@lib/db';
import bcrypt from 'bcryptjs';

export const GET: APIRoute = async () => {
  const stmt = db.prepare('SELECT * FROM utilisateurs');
  const utilisateurs = stmt.all();
  return new Response(JSON.stringify(utilisateurs), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const { nom, email, role, password } = await request.json();
  if (!nom || !email || !role || !password) {
    return new Response('Champs manquants', { status: 400 });
  }
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO utilisateurs (nom, email, role, password) VALUES (?, ?, ?, ?)');
  const info = stmt.run(nom, email, role, hash);
  return new Response(JSON.stringify({ id: info.lastInsertRowid, nom, email, role }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PATCH update utilisateur
export const PATCH: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const { nom, email, role, password } = await request.json();
  if (!nom || !email || !role) return new Response('Champs manquants', { status: 400 });
  let query = 'UPDATE utilisateurs SET nom=?, email=?, role=?';
  const values: any[] = [nom, email, role];
  if (password) {
    query += ', password=?';
    values.push(bcrypt.hashSync(password, 10));
  }
  query += ' WHERE id=?';
  values.push(id);
  db.prepare(query).run(...values);
  return new Response(JSON.stringify({ id, nom, email, role }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE utilisateur
export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  db.prepare('DELETE FROM utilisateurs WHERE id=?').run(id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
