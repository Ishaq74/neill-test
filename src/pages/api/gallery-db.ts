import type { APIRoute } from 'astro';
import { db } from '@lib/db';

export const prerender = false;

// This is an alias for galerie-db.ts - redirecting to use the same galerie table
export const GET: APIRoute = async () => {
  try {
    const galerie = await db.galerie.findMany({
      orderBy: { id: 'desc' }
    });
    return new Response(JSON.stringify(galerie), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, imageUrl, alt, description, uploadedBy } = body;
    
    if (!title || !imageUrl) {
      return new Response('Title et imageUrl requis', { status: 400 });
    }
    
    const createdAt = new Date().toISOString();
    const newImage = await db.galerie.create({
      data: {
        title,
        imageUrl,
        alt,
        description,
        uploadedBy,
        createdAt,
        global: 0,
        servicesGlobal: 0,
        formationsGlobal: 0,
        serviceId: null,
        formationId: null
      }
    });
    
    return new Response(JSON.stringify(newImage), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};
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
