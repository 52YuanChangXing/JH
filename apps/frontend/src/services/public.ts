import { api, ApiResponse } from '../lib/api';

export type LandingPayload = {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    background: string;
  };
  metrics: {
    experienceYears: number;
    globalCities: number;
    satisfaction: number;
    awards: number;
  };
  features: { title: string; description: string }[];
  services: ServiceRecord[];
  photographers: PhotographerRecord[];
  testimonials: TestimonialRecord[];
  faqs: FaqRecord[];
  featuredPortfolio: PortfolioItemRecord[];
};

export type ServiceRecord = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  priceFrom: number;
  duration: number;
  deliverables: string[];
  isPopular: boolean;
};

export type PhotographerRecord = {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  bio: string;
  tagline?: string;
  specialties: string[];
  experienceYears: number;
  accolades: string[];
  socialLinks?: Record<string, string>;
  isFeatured: boolean;
  portfolioItems?: { id: string; title: string; coverImageUrl: string; slug?: string }[];
};

export type PortfolioItemRecord = {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string;
  galleryImages: string[];
  description?: string;
  location?: string;
  shotDate?: string;
  categories: string[];
  featured: boolean;
  photographer?: { id: string; name: string; avatarUrl?: string };
};

export type TestimonialRecord = {
  id: string;
  name: string;
  title?: string;
  message: string;
  rating: number;
  avatarUrl?: string;
};

export type FaqRecord = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type BookingProgressRecord = {
  id: string;
  reference: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  eventDate?: string;
  venue?: string;
  status: string;
  note?: string;
  service?: ServiceRecord;
  photographer?: { id: string; name: string };
  progress: {
    id: string;
    stage: string;
    label: string;
    sortOrder: number;
    completedAt?: string | null;
    note?: string | null;
  }[];
};

export async function fetchLanding() {
  const { data } = await api.get<ApiResponse<LandingPayload>>('/public/home');
  return data.data;
}

export async function fetchPublicServices() {
  const { data } = await api.get<ApiResponse<ServiceRecord[]>>('/public/services');
  return data.data;
}

export async function fetchPublicPhotographers(params?: { featured?: boolean }) {
  const { data } = await api.get<ApiResponse<PhotographerRecord[]>>('/public/photographers', {
    params: params?.featured !== undefined ? { featured: params.featured } : undefined
  });
  return data.data;
}

export async function fetchPublicPortfolio(params: { page?: number; pageSize?: number; category?: string; photographer?: string } = {}) {
  const { data } = await api.get<ApiResponse<{ data: PortfolioItemRecord[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>(
    '/public/portfolio',
    { params }
  );
  return data.data;
}

export async function createBookingRequest(input: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  eventDate?: string;
  venue?: string;
  serviceId?: string;
  photographerId?: string;
  note?: string;
}) {
  const { data } = await api.post<ApiResponse<{ reference: string; accessCode: string }>>('/public/bookings', input);
  return data.data;
}

export async function fetchBookingProgress(reference: string, code: string) {
  const { data } = await api.get<ApiResponse<BookingProgressRecord>>(`/public/bookings/${reference}/progress`, {
    params: { code }
  });
  return data.data;
}
