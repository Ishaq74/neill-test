import type { APIRoute } from 'astro';
import { db } from '@lib/db';

// GET images with dynamic filters
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
    
    const galerie = await db.galerie.findMany({
      where,
      include: {
        service: { select: { nom: true } },
        formation: { select: { titre: true } }
      },
      orderBy: { id: 'desc' }
    });
    
    return new Response(JSON.stringify(galerie), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// POST add image
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      title, 
      imageUrl, 
      alt, 
      description, 
      uploadedBy,
      global = 0,
      servicesGlobal = 0,
      formationsGlobal = 0,
      serviceId = null,
      formationId = null
    } = body;
    
    if (!title || !imageUrl) {
      return new Response('Title et imageUrl requis', { status: 400 });
    }
    
    const createdAt = new Date().toISOString();
    const newImage = await db.galerie.create({
      data: {
        title,
        imageUrl,
        alt,
        description,
        uploadedBy,
        createdAt,
        global: parseInt(global),
        servicesGlobal: parseInt(servicesGlobal),
        formationsGlobal: parseInt(formationsGlobal),
        serviceId: serviceId ? parseInt(serviceId) : null,
        formationId: formationId ? parseInt(formationId) : null
      }
    });
    
    return new Response(JSON.stringify(newImage), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// PATCH update image
export const PATCH: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    const body = await request.json();
    const updateData: any = {};
    
    const fields = ['title', 'imageUrl', 'alt', 'description', 'uploadedBy', 'global', 'servicesGlobal', 'formationsGlobal', 'serviceId', 'formationId'];
    for (const key of fields) {
      if (key in body) {
        if (key === 'global' || key === 'servicesGlobal' || key === 'formationsGlobal') {
          updateData[key] = parseInt(body[key]);
        } else if (key === 'serviceId' || key === 'formationId') {
          updateData[key] = body[key] ? parseInt(body[key]) : null;
        } else {
          updateData[key] = body[key];
        }
      }
    }
    
    const updated = await db.galerie.update({
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

// DELETE image
export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    await db.galerie.delete({
      where: { id: parseInt(id) }
    });
    
    return new Response('Deleted', { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// PATCH update image
export const PATCH: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const { title, imageUrl, alt, description, uploadedBy } = await request.json();
  const stmt = db.prepare('UPDATE galerie SET title=?, imageUrl=?, alt=?, description=?, uploadedBy=? WHERE id=?');
  stmt.run(title, imageUrl, alt, description, uploadedBy, id);
  return new Response(JSON.stringify({ id, title, imageUrl, alt, description, uploadedBy }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE image
export const DELETE: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });
  const stmt = db.prepare('DELETE FROM galerie WHERE id=?');
  stmt.run(id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
