export const prerender = false;
import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) return new Response('No file', { status: 400 });
  // Validation type et taille
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
  const ext = path.extname(file.name).toLowerCase() || '.jpg';
  if (!allowedExts.includes(ext)) {
    return new Response('Type de fichier non autorisé', { status: 400 });
  }
  const maxSize = 5 * 1024 * 1024; // 5 Mo
  if (file.size > maxSize) {
    return new Response('Fichier trop volumineux (max 5 Mo)', { status: 400 });
  }
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  let base = formData.get('name') as string | null;
  function slugify(str: string) {
    return str.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (base) {
    base = slugify(base);
  } else {
    base = slugify(path.basename(file.name, ext));
  }
  const filename = `${base}${ext}`;
  const uploadDir = path.resolve(process.cwd(), 'public/assets');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  return new Response(JSON.stringify({ filename }), { headers: { 'Content-Type': 'application/json' } });
};
