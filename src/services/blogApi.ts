/**
 * Blog & Language API Service
 *
 * Handles blog CRUD operations, language listing, and image upload.
 * All mutating operations require a Bearer token.
 */

import { buildApiUrl } from '../config/api';
import { apiFetch, apiGet } from './apiClient';
import type {
  Language,
  BlogListResponse,
  BlogDetail,
  CreateBlogDto,
  UpdateBlogDto,
  DeleteBlogCommand,
  ImageUploadResponse,
} from '../types/blog';

/**
 * Fetch all available languages from the API.
 */
export async function fetchLanguages(): Promise<Language[]> {
  const url = buildApiUrl('/api/Language');
  return apiGet<Language[]>(url);
}

/**
 * Fetch paginated blog list, filtered by language ID.
 */
export async function fetchBlogList(
  languageId: number,
  pageIndex: number = 0,
  pageSize: number = 10
): Promise<BlogListResponse> {
  const params = new URLSearchParams({
    LanguageId: String(languageId),
    'PageRequest.PageIndex': String(pageIndex),
    'PageRequest.PageSize': String(pageSize),
  });
  const url = buildApiUrl(`/api/Blog?${params.toString()}`);
  return apiGet<BlogListResponse>(url);
}

/**
 * Fetch a single blog post by its slug.
 */
export async function fetchBlogBySlug(slug: string): Promise<BlogDetail> {
  const params = new URLSearchParams({ slug });
  const url = buildApiUrl(`/api/Blog/get-by-slug?${params.toString()}`);
  return apiGet<BlogDetail>(url);
}

/**
 * Create a new blog post. Requires admin token.
 */
export async function createBlog(dto: CreateBlogDto, token: string): Promise<void> {
  const url = buildApiUrl('/api/Blog');
  await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ createBlogDto: dto }),
  });
}

/**
 * Update an existing blog post. Requires admin token.
 */
export async function updateBlog(dto: UpdateBlogDto, token: string): Promise<void> {
  const url = buildApiUrl('/api/Blog');
  await apiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ blog: dto }),
  });
}

/**
 * Delete a blog post. Requires admin token.
 */
export async function deleteBlog(cmd: DeleteBlogCommand, token: string): Promise<void> {
  const url = buildApiUrl('/api/Blog');
  await apiFetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cmd),
  });
}

/**
 * Upload an image for blog content or thumbnail.
 * Returns the public URL of the uploaded image.
 */
export async function uploadBlogImage(file: File, token: string): Promise<ImageUploadResponse> {
  const url = buildApiUrl('/api/Blog/upload-image');
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json() as Promise<ImageUploadResponse>;
}
