
import type { APIRoute } from 'astro';
import { db } from '@lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const params = url.searchParams;
    const serviceId = params.get('serviceId');
    const formationId = params.get('formationId');
    const globalFlag = params.get('global');
    const servicesGlobal = params.get('servicesGlobal');
    const formationsGlobal = params.get('formationsGlobal');
    
    const where: any = {};
    
    if (serviceId) {
      where.serviceId = parseInt(serviceId);
    }
    if (formationId) {
      where.formationId = parseInt(formationId);
    }
    if (globalFlag) {
      where.global = 1;
    }
    if (servicesGlobal) {
      where.servicesGlobal = 1;
    }
    if (formationsGlobal) {
      where.formationsGlobal = 1;
    }
    
    const avis = await db.avis.findMany({
      where,
      include: {
        service: { select: { nom: true } },
        formation: { select: { titre: true } }
      },
      orderBy: { id: 'desc' }
    });
    
    return new Response(JSON.stringify(avis), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      utilisateur,
      commentaire,
      note,
      global = 0,
      servicesGlobal = 0,
      formationsGlobal = 0,
      serviceId = null,
      formationId = null
    } = body;
    
    if (!utilisateur || !note) {
      return new Response('Utilisateur et note requis', { status: 400 });
    }
    
    const newAvis = await db.avis.create({
      data: {
        utilisateur,
        commentaire,
        note: parseInt(note),
        global: parseInt(global),
        servicesGlobal: parseInt(servicesGlobal),
        formationsGlobal: parseInt(formationsGlobal),
        serviceId: serviceId ? parseInt(serviceId) : null,
        formationId: formationId ? parseInt(formationId) : null
      }
    });
    
    return new Response(JSON.stringify(newAvis), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    const body = await request.json();
    const updateData: any = {};
    
    const fields = ['utilisateur', 'commentaire', 'note', 'global', 'servicesGlobal', 'formationsGlobal', 'serviceId', 'formationId'];
    for (const key of fields) {
      if (key in body) {
        if (key === 'note' || key === 'global' || key === 'servicesGlobal' || key === 'formationsGlobal') {
          updateData[key] = parseInt(body[key]);
        } else if (key === 'serviceId' || key === 'formationId') {
          updateData[key] = body[key] ? parseInt(body[key]) : null;
        } else {
          updateData[key] = body[key];
        }
      }
    }
    
    const updated = await db.avis.update({
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

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    await db.avis.delete({
      where: { id: parseInt(id) }
    });
    
    return new Response('Deleted', { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};
