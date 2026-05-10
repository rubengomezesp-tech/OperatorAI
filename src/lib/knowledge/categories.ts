/**
 * 📚 KNOWLEDGE CATEGORIES
 *
 * Definiciones compartidas para clasificación de documentos.
 * Usado en KB UI, onboarding, y RAG retrieval.
 */

import type { LucideIcon } from 'lucide-react';
import { Palette, Briefcase, Users, FileText, Folder } from 'lucide-react';

export type DocumentCategory = 'brand' | 'business' | 'customers' | 'content' | 'other';

export interface CategoryMeta {
  id: DocumentCategory;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  icon: LucideIcon;
  color: string; // Tailwind color hint or hex
  hint: string; // What goes here (UI tooltip)
  hintEs: string;
}

export const KNOWLEDGE_CATEGORIES: CategoryMeta[] = [
  {
    id: 'brand',
    name: 'Brand Assets',
    nameEs: 'Identidad de Marca',
    description: 'Logos, brand book, fonts, color guides, voice & tone',
    descriptionEs: 'Logos, brand book, fuentes, paletas, voz y tono',
    icon: Palette,
    color: '#D4AF37',
    hint: 'Logos, brand book, color palette, fonts, voice/tone guides',
    hintEs: 'Logos, brand book, paleta, fuentes, guías de voz y tono',
  },
  {
    id: 'business',
    name: 'Business',
    nameEs: 'Negocio',
    description: 'Pitch decks, business plans, strategy, financials, market research',
    descriptionEs: 'Pitch decks, planes de negocio, estrategia, finanzas, research de mercado',
    icon: Briefcase,
    color: '#0066CC',
    hint: 'Pitch deck, business plan, strategy docs, financials, competitors',
    hintEs: 'Pitch deck, plan de negocio, estrategia, finanzas, competencia',
  },
  {
    id: 'customers',
    name: 'Customers',
    nameEs: 'Clientes',
    description: 'Personas, ICP, audience research, testimonials, case studies',
    descriptionEs: 'Personas, ICP, research de audiencia, testimonios, casos de éxito',
    icon: Users,
    color: '#5C8001',
    hint: 'Buyer personas, ICP definitions, audience research, testimonials',
    hintEs: 'Buyer personas, ICP, research de audiencia, testimonios',
  },
  {
    id: 'content',
    name: 'Content',
    nameEs: 'Contenido',
    description: 'Templates, copy examples, ad references, blog posts, FAQs',
    descriptionEs: 'Plantillas, ejemplos de copy, anuncios anteriores, blog posts, FAQs',
    icon: FileText,
    color: '#A855F7',
    hint: 'Templates, copy examples, previous ads, blog posts, social templates',
    hintEs: 'Plantillas, ejemplos de copy, anuncios previos, posts, social',
  },
  {
    id: 'other',
    name: 'Other',
    nameEs: 'Otros',
    description: 'Everything else',
    descriptionEs: 'Todo lo demás',
    icon: Folder,
    color: '#6B7280',
    hint: 'Misc files that don\'t fit elsewhere',
    hintEs: 'Archivos varios que no encajan en otras categorías',
  },
];

export function getCategoryMeta(id: DocumentCategory): CategoryMeta {
  return KNOWLEDGE_CATEGORIES.find((c) => c.id === id) ?? KNOWLEDGE_CATEGORIES[KNOWLEDGE_CATEGORIES.length - 1];
}

export const ALL_CATEGORY_IDS: DocumentCategory[] = ['brand', 'business', 'customers', 'content', 'other'];
