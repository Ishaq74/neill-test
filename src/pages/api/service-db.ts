export const prerender = false;
import type { APIRoute } from 'astro';
import { db } from '@lib/db';


export const GET: APIRoute = async () => {
  try {
    const services = await db.service.findMany({
      orderBy: {
        id: 'asc'
      }
    });
    return new Response(JSON.stringify(services), {
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
      nom, description, content, notes, prix, image, imageAlt, icon, categorie, tags, steps, duree, durationMinutes, slug, isActive, isFeatured
    } = body;
    
    // Sanitize tags et steps : doivent être array de strings
    function sanitizeArray(val: unknown): string[] {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(v => typeof v === 'string');
      if (typeof val === 'string') {
        try {
          const arr = JSON.parse(val);
          return Array.isArray(arr) ? arr.filter(v => typeof v === 'string') : [];
        } catch { return []; }
      }
      return [];
    }
    
    const safeTags = sanitizeArray(tags);
    const safeSteps = sanitizeArray(steps);
    
    const newService = await db.service.create({
      data: {
        nom,
        description,
        content,
        notes,
        prix,
        image,
        imageAlt,
        icon,
        categorie,
        tags: JSON.stringify(safeTags),
        steps: JSON.stringify(safeSteps),
        duree,
        durationMinutes,
        slug: slug || '',
        isActive: isActive ? 1 : 0,
        isFeatured: isFeatured ? 1 : 0
      }
    });
    
    return new Response(JSON.stringify({ ...newService, tags: safeTags, steps: safeSteps }), {
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
    
    const fields = [
      'nom', 'description', 'content', 'notes', 'prix', 'image', 'imageAlt', 'icon', 'categorie', 'tags', 'steps', 'duree', 'durationMinutes', 'slug', 'isActive', 'isFeatured'
    ];
    
    for (const key of fields) {
      if (key in body) {
        if (key === 'tags' || key === 'steps') {
          updateData[key] = body[key] ? JSON.stringify(body[key]) : null;
        } else if (key === 'isActive' || key === 'isFeatured') {
          updateData[key] = body[key] ? 1 : 0;
        } else {
          updateData[key] = body[key];
        }
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return new Response('No fields to update', { status: 400 });
    }
    
    const updated = await db.service.update({
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

export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    await db.service.delete({
      where: { id: parseInt(id) }
    });
    
    return new Response('Deleted', { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};
