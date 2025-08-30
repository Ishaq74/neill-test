import type { APIRoute } from 'astro';
import { auth } from '../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Use better-auth to handle the sign out
    const result = await auth.api.signOut({
      headers: request.headers
    });
    
    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: result.headers 
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Logout failed' }), { 
      status: 500 
    });
  }
};
