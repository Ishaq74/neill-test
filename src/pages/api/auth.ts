import type { APIRoute } from 'astro';
import type { AuthPayload, AuthResponse } from '../../types/Auth';
import type { Utilisateur } from '../../types/Utilisateur';

// Dummy users (in-memory)
const users: Utilisateur[] = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@site.com',
    passwordHash: '$2b$10$saltsaltadmin', // fake hash
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

function verifyPassword(password: string, hash: string) {
  // TODO: use bcrypt in real app
  return password === 'admin';
}

export const POST: APIRoute = async ({ request }) => {
  const { email, password } = await request.json() as AuthPayload;
  const user = users.find(u => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }
  // Simulate JWT
  const token = btoa(`${user.id}:${user.email}:${user.role}`);
  const response: AuthResponse = {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
  return new Response(JSON.stringify(response), { status: 200 });
};
