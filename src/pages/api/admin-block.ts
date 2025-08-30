// API endpoint pour gérer les créneaux bloqués (CRUD)

import { db } from '@lib/db';
import type { APIContext } from 'astro';

// GET: liste tous les créneaux bloqués
export async function GET({ request }: APIContext) {
  try {
    const blockedSlots = await db.blockedSlot.findMany({
      orderBy: { id: 'desc' }
    });
    return new Response(JSON.stringify(blockedSlots), { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      } 
    });
  } catch (e) {
    console.error('[admin-block][GET] Error:', e);
    return new Response('Erreur serveur', { status: 500 });
  }
}

// POST: créer un nouveau créneau bloqué
export async function POST({ request }: APIContext) {
  try {
    const body = await request.json();
    const { title, start, end, allDay } = body;
    
    if (!title || !start) {
      return new Response('Title et start requis', { status: 400 });
    }
    
    const newSlot = await db.blockedSlot.create({
      data: {
        title,
        start,
        end: end || null,
        allDay: allDay ? 1 : 0
      }
    });
    
    return new Response(JSON.stringify(newSlot), { 
      status: 201, 
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      } 
    });
  } catch (e) {
    console.error('[admin-block][POST] Error:', e);
    return new Response('Erreur serveur', { status: 500 });
  }
}

// PATCH: met à jour un créneau bloqué
export async function PATCH({ request, url }: APIContext) {
  try {
    const id = url?.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    const body = await request.json();
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.start !== undefined) updateData.start = body.start;
    if (body.end !== undefined) updateData.end = body.end;
    if (body.allDay !== undefined) updateData.allDay = body.allDay ? 1 : 0;
    
    const updated = await db.blockedSlot.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    return new Response(JSON.stringify(updated), { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      } 
    });
  } catch (e) {
    console.error('[admin-block][PATCH] Error:', e);
    return new Response('Erreur serveur', { status: 500 });
  }
}

// DELETE: supprime un créneau bloqué
export async function DELETE({ url }: APIContext) {
  try {
    const id = url?.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    await db.blockedSlot.delete({
      where: { id: parseInt(id) }
    });
    
    return new Response('Deleted', { 
      status: 200, 
      headers: { 
        'Access-Control-Allow-Origin': '*' 
      } 
    });
  } catch (e) {
    console.error('[admin-block][DELETE] Error:', e);
    return new Response('Erreur serveur', { status: 500 });
  }
}