import type { MiddlewareHandler } from 'astro';
import { auth } from '../lib/auth';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { request, url } = context;
  
  // For admin routes only
  if (url.pathname.startsWith('/admin')) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers
      });
      
      if (!session || !session.user) {
        return Response.redirect('/login');
      }
      
      // Check if user has admin role
      if (session.user.role !== 'admin') {
        return Response.redirect('/login');
      }
      
      // @ts-ignore
      context.locals.user = session.user;
      // @ts-ignore  
      context.locals.session = session;
    } catch (error) {
      console.error('Auth middleware error:', error);
      return Response.redirect('/login');
    }
  }
  
  return next();
};
