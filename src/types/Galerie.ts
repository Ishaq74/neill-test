export interface Galerie {
  id: string;
  title: string;
  imageUrl: string;
  alt: string; // Texte alternatif explicite pour l’accessibilité
  description?: string;
  uploadedBy: string;
  createdAt: string;
}
