export const prerender = false;
import type { APIRoute } from 'astro';
import { db } from '@lib/db';

// Helper pour parser les champs JSON (tags, steps)
function parseArrayField(val: any) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val.split(',').map((v: string) => v.trim()).filter(Boolean); }
  }
  return [];
}

// GET formations 
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get('pageSize') || '20', 10)));
    
    const where: any = {};
    
    // Apply filters
    if (url.searchParams.get('search')) {
      const searchTerm = url.searchParams.get('search')!;
      where.OR = [
        { titre: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { categorie: { contains: searchTerm } },
        { content: { contains: searchTerm } },
        { notes: { contains: searchTerm } }
      ];
    } else if (url.searchParams.get('titre')) {
      where.titre = { contains: url.searchParams.get('titre')! };
    }
    
    if (url.searchParams.get('categorie')) {
      where.categorie = url.searchParams.get('categorie')!;
    }
    
    if (url.searchParams.get('isActive')) {
      where.isActive = url.searchParams.get('isActive') === 'true' ? 1 : 0;
    }

    const [formations, total] = await Promise.all([
      db.formation.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.formation.count({ where })
    ]);

    const processedFormations = formations.map(f => ({
      ...f,
      tags: parseArrayField(f.tags),
      steps: parseArrayField(f.steps)
    }));

    return new Response(JSON.stringify({ data: processedFormations, total }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// POST (create)
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      titre, description, content, notes, prix, image, imageAlt, icon, categorie, tags, steps, duree, durationMinutes, slug, isActive, isFeatured, certification
    } = body;
    
    if (!titre || !prix || !slug) {
      return new Response('Titre, prix et slug requis', { status: 400 });
    }
    
    const now = new Date().toISOString();
    
    const newFormation = await db.formation.create({
      data: {
        titre,
        description,
        content,
        notes,
        prix,
        image,
        imageAlt,
        icon,
        categorie,
        tags: JSON.stringify(tags || []),
        steps: JSON.stringify(steps || []),
        duree,
        durationMinutes,
        slug,
        isActive: isActive ? 1 : 0,
        isFeatured: isFeatured ? 1 : 0,
        certification,
        createdAt: now,
        updatedAt: now
      }
    });
    
    return new Response(JSON.stringify({ ...newFormation, tags: tags || [], steps: steps || [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// PATCH (update)
export const PATCH: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    const body = await request.json();
    const updateData: any = {};
    
    const fields = [
      'titre', 'description', 'content', 'notes', 'prix', 'image', 'imageAlt', 'icon', 'categorie', 'tags', 'steps', 'duree', 'durationMinutes', 'slug', 'isActive', 'isFeatured', 'certification'
    ];
    
    for (const key of fields) {
      if (key in body) {
        if (key === 'tags' || key === 'steps') {
          updateData[key] = JSON.stringify(body[key] || []);
        } else if (key === 'isActive' || key === 'isFeatured') {
          updateData[key] = body[key] ? 1 : 0;
        } else {
          updateData[key] = body[key];
        }
      }
    }
    
    updateData.updatedAt = new Date().toISOString();
    
    const updated = await db.formation.update({
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

// DELETE
export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    await db.formation.delete({
      where: { id: parseInt(id) }
    });
    
    return new Response('Deleted', { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};
