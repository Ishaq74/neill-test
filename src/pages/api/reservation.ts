import type { APIRoute } from 'astro';
import type { Reservation } from '../../types/Reservation';

let reservations: Reservation[] = [];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(reservations), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const newReservation = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  reservations.push(newReservation);
  return new Response(JSON.stringify(newReservation), { status: 201 });
};

export const PUT: APIRoute = async ({ request }) => {
  const data = await request.json();
  const idx = reservations.findIndex(r => r.id === data.id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  reservations[idx] = { ...reservations[idx], ...data, updatedAt: new Date().toISOString() };
  return new Response(JSON.stringify(reservations[idx]), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json();
  reservations = reservations.filter(r => r.id !== id);
  return new Response('Deleted', { status: 200 });
};
