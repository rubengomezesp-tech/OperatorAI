import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTourBySlug, PRODUCT_TOURS } from '@/lib/help/tours';
import { TourPlayerClient } from './tour-player-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PRODUCT_TOURS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour) return { title: 'Tour — Operator AI' };
  return {
    title: `${tour.title} — Operator AI Tour`,
    description: tour.subtitle,
  };
}

export default async function TourPage({ params }: Props) {
  const { slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour) notFound();

  return <TourPlayerClient tour={tour} />;
}
