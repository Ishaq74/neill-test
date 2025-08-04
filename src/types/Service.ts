export interface Service {
  id: number;
  nom: string;
  description: string;
  content?: string;
  notes?: string;
  prix: number;
  image?: string;
  imageAlt?: string;
  icon?: string;
  categorie?: string;
  tags?: string[];
  steps?: string[];
  duree?: string;
  durationMinutes?: number;
  slug: string;
  isActive?: boolean;
  isFeatured?: boolean;
}
