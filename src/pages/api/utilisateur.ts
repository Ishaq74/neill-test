import type { APIRoute } from 'astro';
import type { Utilisateur } from '../../types/Utilisateur';

let utilisateurs: Utilisateur[] = [];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(utilisateurs), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const newUser = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  utilisateurs.push(newUser);
  return new Response(JSON.stringify(newUser), { status: 201 });
};

export const PUT: APIRoute = async ({ request }) => {
  const data = await request.json();
  const idx = utilisateurs.findIndex(u => u.id === data.id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  utilisateurs[idx] = { ...utilisateurs[idx], ...data, updatedAt: new Date().toISOString() };
  return new Response(JSON.stringify(utilisateurs[idx]), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json();
  utilisateurs = utilisateurs.filter(u => u.id !== id);
  return new Response('Deleted', { status: 200 });
};
