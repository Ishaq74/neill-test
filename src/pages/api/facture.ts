import type { APIRoute } from 'astro';
import type { Facture } from '../../types/Facture';

let factures: Facture[] = [];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(factures), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const newFacture = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  factures.push(newFacture);
  return new Response(JSON.stringify(newFacture), { status: 201 });
};

export const PUT: APIRoute = async ({ request }) => {
  const data = await request.json();
  const idx = factures.findIndex(f => f.id === data.id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  factures[idx] = { ...factures[idx], ...data, updatedAt: new Date().toISOString() };
  return new Response(JSON.stringify(factures[idx]), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json();
  factures = factures.filter(f => f.id !== id);
  return new Response('Deleted', { status: 200 });
};
