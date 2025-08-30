import type { APIRoute } from 'astro';
import { db } from '@lib/db';

// GET all factures
export const GET: APIRoute = async () => {
  try {
    const factures = await db.facture.findMany({
      include: {
        reservation: { 
          select: { id: true, date: true, time: true } 
        },
        user: { 
          select: { nom: true, email: true } 
        }
      },
      orderBy: { id: 'desc' }
    });
    
    return new Response(JSON.stringify(factures), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// POST add facture
export const POST: APIRoute = async ({ request }) => {
  try {
    const { reservationId, userId, amount, status, pdfUrl } = await request.json();
    
    if (!reservationId || !userId || !amount || !status) {
      return new Response('Champs requis manquants', { status: 400 });
    }
    
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    
    const newFacture = await db.facture.create({
      data: {
        reservationId: parseInt(reservationId),
        userId: parseInt(userId),
        amount: parseFloat(amount),
        status,
        pdfUrl,
        createdAt,
        updatedAt
      }
    });
    
    return new Response(JSON.stringify(newFacture), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// PATCH update facture
export const PATCH: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    const { reservationId, userId, amount, status, pdfUrl } = await request.json();
    const updatedAt = new Date().toISOString();
    
    const updateData: any = { updatedAt };
    if (reservationId !== undefined) updateData.reservationId = parseInt(reservationId);
    if (userId !== undefined) updateData.userId = parseInt(userId);
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (status !== undefined) updateData.status = status;
    if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl;
    
    const updated = await db.facture.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// DELETE facture
export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    await db.facture.delete({
      where: { id: parseInt(id) }
    });
    
    return new Response('Deleted', { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};
  if (!id) return new Response('Missing id', { status: 400 });
  const stmt = db.prepare('DELETE FROM factures WHERE id=?');
  stmt.run(id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
