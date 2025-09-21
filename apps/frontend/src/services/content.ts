import { api, ApiResponse } from '../lib/api';
import { FaqRecord, TestimonialRecord } from './public';

export type SiteSetting = { key: string; value: any; updatedAt: string; updatedBy?: string };

export async function fetchSiteSettings(keys?: string[]) {
  const { data } = await api.get<ApiResponse<SiteSetting[]>>('/content/settings', {
    params: keys && keys.length > 0 ? { keys } : undefined
  });
  return data.data;
}

export async function upsertSiteSetting(input: { key: string; value: any }) {
  const { data } = await api.put<ApiResponse<SiteSetting>>('/content/settings', input);
  return data.data;
}

export async function fetchTestimonials() {
  const { data } = await api.get<ApiResponse<TestimonialRecord[]>>('/content/testimonials');
  return data.data;
}

export async function createTestimonial(input: Partial<TestimonialRecord>) {
  const { data } = await api.post<ApiResponse<TestimonialRecord>>('/content/testimonials', input);
  return data.data;
}

export async function updateTestimonial(id: string, input: Partial<TestimonialRecord>) {
  const { data } = await api.patch<ApiResponse<TestimonialRecord>>(`/content/testimonials/${id}`, input);
  return data.data;
}

export async function deleteTestimonial(id: string) {
  const { data } = await api.delete<ApiResponse<{ id: string }>>(`/content/testimonials/${id}`);
  return data.data;
}

export async function fetchFaqs() {
  const { data } = await api.get<ApiResponse<FaqRecord[]>>('/content/faqs');
  return data.data;
}

export async function createFaq(input: Partial<FaqRecord>) {
  const { data } = await api.post<ApiResponse<FaqRecord>>('/content/faqs', input);
  return data.data;
}

export async function updateFaq(id: string, input: Partial<FaqRecord>) {
  const { data } = await api.patch<ApiResponse<FaqRecord>>(`/content/faqs/${id}`, input);
  return data.data;
}

export async function deleteFaq(id: string) {
  const { data } = await api.delete<ApiResponse<{ id: string }>>(`/content/faqs/${id}`);
  return data.data;
}
