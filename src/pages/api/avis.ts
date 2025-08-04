import type { APIRoute } from 'astro';
import type { Avis } from '../../types/Avis';

let avis: Avis[] = [];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(avis), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const newAvis = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  avis.push(newAvis);
  return new Response(JSON.stringify(newAvis), { status: 201 });
};

export const PUT: APIRoute = async ({ request }) => {
  const data = await request.json();
  const idx = avis.findIndex(a => a.id === data.id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  avis[idx] = { ...avis[idx], ...data };
  return new Response(JSON.stringify(avis[idx]), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json();
  avis = avis.filter(a => a.id !== id);
  return new Response('Deleted', { status: 200 });
};
