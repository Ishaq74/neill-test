import type { APIRoute } from 'astro';
import type { Galerie } from '../../types/Galerie';

let galeries: Galerie[] = [];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(galeries), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const newGalerie = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  galeries.push(newGalerie);
  return new Response(JSON.stringify(newGalerie), { status: 201 });
};

export const PUT: APIRoute = async ({ request }) => {
  const data = await request.json();
  const idx = galeries.findIndex(g => g.id === data.id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  galeries[idx] = { ...galeries[idx], ...data };
  return new Response(JSON.stringify(galeries[idx]), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json();
  galeries = galeries.filter(g => g.id !== id);
  return new Response('Deleted', { status: 200 });
};
