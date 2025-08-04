export interface Facture {
  id: string;
  reservationId: string;
  userId: string;
  amount: number;
  status: 'paid' | 'pending' | 'cancelled';
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}
