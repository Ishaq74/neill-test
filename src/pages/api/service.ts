import type { APIRoute } from 'astro';
import type { Service } from '../../types/Service';

let services: Service[] = [];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(services), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const newService = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  services.push(newService);
  return new Response(JSON.stringify(newService), { status: 201 });
};

export const PUT: APIRoute = async ({ request }) => {
  const data = await request.json();
  const idx = services.findIndex(s => s.id === data.id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  services[idx] = { ...services[idx], ...data, updatedAt: new Date().toISOString() };
  return new Response(JSON.stringify(services[idx]), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json();
  services = services.filter(s => s.id !== id);
  return new Response('Deleted', { status: 200 });
};
