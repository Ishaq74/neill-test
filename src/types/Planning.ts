export type Planning = {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'Libre' | 'Occupé' | 'Indisponible';
  description?: string;
  createdAt: string;
  updatedAt: string;
};
