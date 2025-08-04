export const prerender = false;
import type { APIRoute } from 'astro';
import db from '@lib/db';

// Helper pour parser les champs JSON (tags, steps)
function parseArrayField(val: any) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val.split(',').map((v: string) => v.trim()).filter(Boolean); }
  }
  return [];
}

// GET formations (pagination, tri, filtres)
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get('pageSize') || '20', 10)));
  const sort = url.searchParams.get('sort') || 'createdAt';
  const dir = url.searchParams.get('dir') === 'asc' ? 'ASC' : 'DESC';
  const filters: string[] = [];
  const values: any[] = [];
  if (url.searchParams.get('search')) {
    const s = `%${url.searchParams.get('search')}%`;
    filters.push(`(
      titre LIKE ? OR
      description LIKE ? OR
      categorie LIKE ? OR
      tags LIKE ? OR
      content LIKE ? OR
      notes LIKE ?
    )`);
    values.push(s, s, s, s, s, s);
  } else if (url.searchParams.get('titre')) {
    filters.push('titre LIKE ?');
    values.push(`%${url.searchParams.get('titre')}%`);
  }
  if (url.searchParams.get('categorie')) {
    filters.push('categorie = ?');
    values.push(url.searchParams.get('categorie'));
  }
  if (url.searchParams.get('isActive')) {
    filters.push('isActive = ?');
    values.push(url.searchParams.get('isActive') === 'true' ? 1 : 0);
  }
  let query = 'SELECT * FROM formations';
  if (filters.length) query += ' WHERE ' + filters.join(' AND ');
  query += ` ORDER BY ${sort} ${dir} LIMIT ? OFFSET ?`;
  values.push(pageSize, (page - 1) * pageSize);
  const stmt = db.prepare(query);
  const formations = (stmt.all(...values) as Record<string, any>[]).map(f => ({
    ...f,
    tags: parseArrayField(f.tags),
    steps: parseArrayField(f.steps)
  }));
  // Total count for pagination
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM formations' + (filters.length ? ' WHERE ' + filters.join(' AND ') : '')).get(...values.slice(0, -2)) as { count?: number };
  const total = totalRow && typeof totalRow.count === 'number' ? totalRow.count : 0;
  return new Response(JSON.stringify({ data: formations, total }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST (create)
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      titre, description, content, notes, prix, image, imageAlt, icon, categorie, tags, steps, duree, durationMinutes, slug, isActive, isFeatured, certification
    } = body;
    if (!titre || !prix || !slug) return new Response('Titre, prix et slug requis', { status: 400 });
    const now = new Date().toISOString();
    const stmt = db.prepare(`INSERT INTO formations (titre, description, content, notes, prix, image, imageAlt, icon, categorie, tags, steps, duree, durationMinutes, slug, isActive, isFeatured, certification, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const info = stmt.run(
      titre, description, content, notes, prix, image, imageAlt, icon, categorie,
      JSON.stringify(tags || []), JSON.stringify(steps || []), duree, durationMinutes, slug, isActive ? 1 : 0, isFeatured ? 1 : 0, certification, now, now
    );
    return new Response(JSON.stringify({ id: info.lastInsertRowid, ...body, createdAt: now, updatedAt: now }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response('Erreur création formation', { status: 500 });
  }
};

// PATCH (update)
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body.id) return new Response('ID requis', { status: 400 });
    const fields = [
      'titre', 'description', 'content', 'notes', 'prix', 'image', 'imageAlt', 'icon', 'categorie', 'tags', 'steps', 'duree', 'durationMinutes', 'slug', 'isActive', 'isFeatured', 'certification'
    ];
    const updates = [];
    const values = [];
    for (const f of fields) {
      if (f in body) {
        if (f === 'tags' || f === 'steps') {
          updates.push(`${f} = ?`);
          values.push(JSON.stringify(body[f] || []));
        } else if (f === 'isActive' || f === 'isFeatured') {
          updates.push(`${f} = ?`);
          values.push(body[f] ? 1 : 0);
        } else {
          updates.push(`${f} = ?`);
          values.push(body[f]);
        }
      }
    }
    // always update updatedAt
    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    if (!updates.length) return new Response('Aucune donnée à mettre à jour', { status: 400 });
    const stmt = db.prepare(`UPDATE formations SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values, body.id);
    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response('Erreur update formation', { status: 500 });
  }
};

// DELETE
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    if (!id) return new Response('ID requis', { status: 400 });
    db.prepare('DELETE FROM formations WHERE id = ?').run(id);
    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response('Erreur suppression formation', { status: 500 });
  }
};
