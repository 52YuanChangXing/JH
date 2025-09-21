import { api, ApiResponse } from '../lib/api';
import { ServiceRecord, PhotographerRecord } from './public';

export type BookingRecord = {
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
  serviceId?: string;
  photographer?: PhotographerRecord;
  photographerId?: string;
  createdAt: string;
  progress: {
    id: string;
    stage: string;
    label: string;
    sortOrder: number;
    completedAt?: string | null;
    note?: string | null;
  }[];
};

export async function fetchBookings(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  serviceId?: string;
  photographerId?: string;
}) {
  const { data } = await api.get<
    ApiResponse<{ data: BookingRecord[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>
  >('/bookings', { params });
  return data.data;
}

export async function fetchBooking(id: string) {
  const { data } = await api.get<ApiResponse<BookingRecord>>(`/bookings/${id}`);
  return data.data;
}

export async function createBooking(input: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  eventDate?: string;
  venue?: string;
  status?: string;
  note?: string;
  serviceId?: string;
  photographerId?: string;
  accessCode?: string;
}) {
  const { data } = await api.post<ApiResponse<{ booking: BookingRecord; accessCode: string }>>('/bookings', input);
  return data.data;
}

export async function updateBooking(id: string, input: {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  eventDate?: string;
  venue?: string;
  status?: string;
  note?: string;
  serviceId?: string | null;
  photographerId?: string | null;
}) {
  const { data } = await api.patch<ApiResponse<BookingRecord>>(`/bookings/${id}`, input);
  return data.data;
}

export async function updateBookingProgress(id: string, progress: { stage: string; completed?: boolean; note?: string }[]) {
  const { data } = await api.patch<ApiResponse<BookingRecord>>(`/bookings/${id}/progress`, { progress });
  return data.data;
}
