import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, message } = await request.json();
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Champs manquants' }), { status: 400 });
    }
    // Persistance en base
    const db = (await import('../../lib/db')).default;
    db.prepare('INSERT INTO contact (name, email, message) VALUES (?, ?, ?)').run(name, email, message);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
};

import type { APIRoute as APIRouteGet } from 'astro';
export const GET: APIRouteGet = async ({ url }) => {
  // Pour l'admin : retourne tous les messages si ?all=1
  if (url.searchParams.get('all') === '1') {
    try {
      const db = (await import('../../lib/db')).default;
      const rows = db.prepare('SELECT name, email, message, created_at FROM contact ORDER BY created_at DESC').all();
      return new Response(JSON.stringify(rows), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
  }
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
};
