export interface Avis {
  id: string;
  userId: string;
  serviceId?: string;
  formationId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}
