import type { APIRoute } from 'astro';
import type { Formation } from '../../types/Formation';

// Dummy in-memory data
let formations: Formation[] = [];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(formations), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const newFormation = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  formations.push(newFormation);
  return new Response(JSON.stringify(newFormation), { status: 201 });
};

export const PUT: APIRoute = async ({ request }) => {
  const data = await request.json();
  const idx = formations.findIndex(f => f.id === data.id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  formations[idx] = { ...formations[idx], ...data, updatedAt: new Date().toISOString() };
  return new Response(JSON.stringify(formations[idx]), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json();
  formations = formations.filter(f => f.id !== id);
  return new Response('Deleted', { status: 200 });
};
