import type { APIRoute } from 'astro';
import { db } from '@lib/db';

// GET all FAQ
export const GET: APIRoute = async () => {
  try {
    const faqs = await db.faq.findMany({
      orderBy: { id: 'asc' }
    });
    return new Response(JSON.stringify(faqs), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// POST add FAQ
export const POST: APIRoute = async ({ request }) => {
  try {
    const { 
      question, 
      reponse, 
      global = 0, 
      servicesGlobal = 0, 
      formationsGlobal = 0, 
      serviceId = null, 
      formationId = null 
    } = await request.json();
    
    if (!question || !reponse) {
      return new Response('Question et réponse requises', { status: 400 });
    }
    
    const newFaq = await db.faq.create({
      data: {
        question,
        reponse,
        global: parseInt(global),
        servicesGlobal: parseInt(servicesGlobal),
        formationsGlobal: parseInt(formationsGlobal),
        serviceId: serviceId ? parseInt(serviceId) : null,
        formationId: formationId ? parseInt(formationId) : null
      }
    });
    
    return new Response(JSON.stringify(newFaq), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};
  const stmt = db.prepare('INSERT INTO faq (question, reponse, global, servicesGlobal, formationsGlobal, serviceId, formationId) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(question, reponse, global, servicesGlobal, formationsGlobal, serviceId, formationId);
  return new Response(JSON.stringify({ id: info.lastInsertRowid, question, reponse, global, servicesGlobal, formationsGlobal, serviceId, formationId }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PATCH update FAQ
export const PATCH: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const { question, reponse, global = 0, servicesGlobal = 0, formationsGlobal = 0, serviceId = null, formationId = null } = await request.json();
  const stmt = db.prepare('UPDATE faq SET question=?, reponse=?, global=?, servicesGlobal=?, formationsGlobal=?, serviceId=?, formationId=? WHERE id=?');
  stmt.run(question, reponse, global, servicesGlobal, formationsGlobal, serviceId, formationId, id);
  return new Response(JSON.stringify({ id, question, reponse, global, servicesGlobal, formationsGlobal, serviceId, formationId }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE FAQ
export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const stmt = db.prepare('DELETE FROM faq WHERE id=?');
  stmt.run(id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
