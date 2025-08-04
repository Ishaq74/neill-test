import type { MiddlewareHandler } from 'astro';

type Utilisateur = { id: number; nom: string; email: string; role: string; password: string };

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { request, url } = context;
  // Pour les routes admin uniquement
  if (url.pathname.startsWith('/admin')) {
    const cookies = request.headers.get('cookie') || '';
    const match = cookies.match(/auth=([^;]+)/);
    if (!match) {
      return Response.redirect('/login');
    }
    const token = match[1];
    // Vérification du token (ici simplifiée, à remplacer par une vraie vérif JWT ou session)
    const db = (await import('../lib/db')).default;
    const user = db.prepare('SELECT * FROM utilisateurs WHERE id = ?').get(token) as Utilisateur | undefined;
    if (!user || user.role !== 'admin') {
      return Response.redirect('/login');
    }
    // @ts-ignore
    context.locals.user = user;
  }
  return next();
};
