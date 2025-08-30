
// Astro v5: rendre l'API server-only pour supporter PATCH/DELETE
export const prerender = false;
import type { APIRoute } from 'astro';
import { db } from '@lib/db';

// GET all reservations
export const GET: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (id) {
      const reservation = await db.reservation.findUnique({
        where: { id: parseInt(id) },
        include: {
          service: { select: { nom: true } },
          user: { select: { nom: true } }
        }
      });
      
      if (!reservation) return new Response('Not found', { status: 404 });
      
      return new Response(JSON.stringify({
        ...reservation,
        serviceName: reservation.service?.nom || null,
        userName: reservation.user?.nom || null
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const reservations = await db.reservation.findMany({
      include: {
        service: { select: { nom: true } },
        user: { select: { nom: true } }
      },
      orderBy: { id: 'desc' }
    });
    
    const processedReservations = reservations.map((r) => ({
      id: r.id,
      userId: r.userId,
      serviceId: r.serviceId,
      date: r.date,
      time: r.time,
      status: r.status,
      notes: r.notes || '',
      serviceName: r.service?.nom || null,
      userName: r.user?.nom || null
    }));
    
    return new Response(JSON.stringify(processedReservations), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// POST create reservation
export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId, serviceId, date, time, status, notes } = await request.json();
    
    const newReservation = await db.reservation.create({
      data: {
        userId: parseInt(userId),
        serviceId: parseInt(serviceId),
        date,
        time,
        status,
        notes: notes || ''
      }
    });
    
    return new Response(JSON.stringify(newReservation), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// PATCH update reservation
export const PATCH: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    const body = await request.json();
    const updateData: any = {};
    
    const fields = ['userId', 'serviceId', 'date', 'time', 'status', 'notes'];
    for (const key of fields) {
      if (key in body) {
        if (key === 'userId' || key === 'serviceId') {
          updateData[key] = parseInt(body[key]);
        } else {
          updateData[key] = body[key];
        }
      }
    }
    
    const updated = await db.reservation.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// DELETE reservation
export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    await db.reservation.delete({
      where: { id: parseInt(id) }
    });
    
    return new Response('Deleted', { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};
