import type { APIRoute } from 'astro';
import db from '@lib/db';

export const prerender = false;

export const GET: APIRoute = async () => {
  const stmt = db.prepare('SELECT * FROM gallery ORDER BY id DESC');
  const gallery = stmt.all();
  return new Response(JSON.stringify(gallery), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { titre, description, tags, images, slug, isActive } = body;
  function sanitizeArray(val: unknown): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(v => typeof v === 'string');
    if (typeof val === 'string') {
      try {
        const arr = JSON.parse(val);
        return Array.isArray(arr) ? arr.filter(v => typeof v === 'string') : [];
      } catch { return []; }
    }
    return [];
  }
  const safeTags = sanitizeArray(tags);
  const safeImages = sanitizeArray(images);
  const stmt = db.prepare(`INSERT INTO gallery
    (titre, description, tags, images, slug, isActive)
    VALUES (?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(
    titre, description, JSON.stringify(safeTags), JSON.stringify(safeImages), slug || '', isActive ? 1 : 0
  );
  return new Response(JSON.stringify({ id: info.lastInsertRowid, ...body, tags: safeTags, images: safeImages }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const body = await request.json();
  const fields = [
    'titre', 'description', 'tags', 'images', 'slug', 'isActive'
  ];
  const updates = [];
  const values = [];
  for (const key of fields) {
    if (key in body) {
      updates.push(`${key} = ?`);
      if (key === 'tags' || key === 'images') values.push(body[key] ? JSON.stringify(body[key]) : null);
      else if (key === 'isActive') values.push(body[key] ? 1 : 0);
      else values.push(body[key]);
    }
  }
  if (!updates.length) return new Response('No fields to update', { status: 400 });
  const stmt = db.prepare(`UPDATE gallery SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values, id);
  const updated = db.prepare('SELECT * FROM gallery WHERE id = ?').get(id);
  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  db.prepare('DELETE FROM gallery WHERE id = ?').run(id);
  return new Response('Deleted', { status: 200 });
};
