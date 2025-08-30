export const prerender = false;

import type { APIRoute } from 'astro';
import { db } from '@lib/db';
import bcrypt from 'bcryptjs';

export const GET: APIRoute = async () => {
  try {
    const utilisateurs = await db.user.findMany({
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        // Don't return password
      }
    });
    return new Response(JSON.stringify(utilisateurs), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { nom, email, role, password } = await request.json();
    if (!nom || !email || !role || !password) {
      return new Response('Champs manquants', { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response('Utilisateur déjà existant', { status: 400 });
    }
    
    const hash = await bcrypt.hash(password, 10);
    const newUser = await db.user.create({
      data: {
        nom,
        email,
        role,
        password: hash
      },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true
      }
    });
    
    return new Response(JSON.stringify(newUser), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// PATCH update utilisateur
export const PATCH: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    const { nom, email, role, password } = await request.json();
    if (!nom || !email || !role) return new Response('Champs manquants', { status: 400 });
    
    const updateData: any = { nom, email, role };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const updatedUser = await db.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        nom: true,
        email: true,
        role: true
      }
    });
    
    return new Response(JSON.stringify(updatedUser), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};

// DELETE utilisateur
export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    
    await db.user.delete({
      where: { id: parseInt(id) }
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Database error', { status: 500 });
  }
};
