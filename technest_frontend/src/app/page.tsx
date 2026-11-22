'use client';
import PageTransition from '@/components/layout/PageTransition';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import BestSellers from '@/components/home/BestSellers';
import ReviewSection from '@/components/home/ReviewSection';
import NewsletterSection from '@/components/marketing/NewsletterSection';

export default function Home() {
  return (
    <PageTransition>
      <HeroBanner />
      <CategoryGrid />
      <FeaturedProducts />
      <BestSellers />
      <ReviewSection />
      <NewsletterSection />
    </PageTransition>
  );
}