export const prerender = false;
import type { APIRoute } from 'astro';
import db from '@lib/db';


export const GET: APIRoute = async () => {
  const stmt = db.prepare('SELECT * FROM services');
  const services = stmt.all();
  return new Response(JSON.stringify(services), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const {
    nom, description, content, notes, prix, image, imageAlt, icon, categorie, tags, steps, duree, durationMinutes, slug, isActive, isFeatured
  } = body;
  // Sanitize tags et steps : doivent être array de strings
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
  const safeSteps = sanitizeArray(steps);
  const stmt = db.prepare(`INSERT INTO services
    (nom, description, content, notes, prix, image, imageAlt, icon, categorie, tags, steps, duree, durationMinutes, slug, isActive, isFeatured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(
    nom, description, content, notes, prix, image, imageAlt, icon, categorie, JSON.stringify(safeTags), JSON.stringify(safeSteps), duree, durationMinutes, slug || '', isActive ? 1 : 0, isFeatured ? 1 : 0
  );
  return new Response(JSON.stringify({ id: info.lastInsertRowid, ...body, tags: safeTags, steps: safeSteps }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const body = await request.json();
  const fields = [
    'nom', 'description', 'content', 'notes', 'prix', 'image', 'imageAlt', 'icon', 'categorie', 'tags', 'steps', 'duree', 'durationMinutes', 'slug', 'isActive', 'isFeatured'
  ];
  const updates = [];
  const values = [];
  for (const key of fields) {
    if (key in body) {
      updates.push(`${key} = ?`);
      if (key === 'tags' || key === 'steps') values.push(body[key] ? JSON.stringify(body[key]) : null);
      else if (key === 'isActive' || key === 'isFeatured') values.push(body[key] ? 1 : 0);
      else values.push(body[key]);
    }
  }
  if (!updates.length) return new Response('No fields to update', { status: 400 });
  const stmt = db.prepare(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values, id);
  const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  db.prepare('DELETE FROM services WHERE id = ?').run(id);
  return new Response('Deleted', { status: 200 });
};
