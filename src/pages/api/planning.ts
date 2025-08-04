import type { APIRoute } from 'astro';
import type { Planning } from '../../types/Planning';

let planningData: Planning[] = [];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(planningData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  // Validation simplifiée
  if (!body.date || !body.startTime || !body.endTime || !body.status) {
    return new Response(JSON.stringify({ error: 'Champs requis manquants.' }), { status: 400 });
  }
  const newPlanning: Planning = {
    id: crypto.randomUUID(),
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    status: body.status,
    description: body.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  planningData.push(newPlanning);
  return new Response(JSON.stringify(newPlanning), { status: 201 });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  const idx = planningData.findIndex((p) => p.id === body.id);
  if (idx === -1) {
    return new Response(JSON.stringify({ error: 'Planning non trouvé.' }), { status: 404 });
  }
  planningData[idx] = {
    ...planningData[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return new Response(JSON.stringify(planningData[idx]), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json();
  const idx = planningData.findIndex((p) => p.id === body.id);
  if (idx === -1) {
    return new Response(JSON.stringify({ error: 'Planning non trouvé.' }), { status: 404 });
  }
  const deleted = planningData.splice(idx, 1)[0];
  return new Response(JSON.stringify(deleted), { status: 200 });
};
