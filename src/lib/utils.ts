// Fonction utilitaire shadcn/ui pour concaténer les classes conditionnelles
// https://ui.shadcn.com/docs/installation/next

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}
