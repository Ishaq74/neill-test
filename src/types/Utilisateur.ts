export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  role: 'admin' | 'client';
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}
