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
  ImageUploadResponse,
} from '../types/blog';

let cachedLanguages: Language[] | null = null;
let fetchLanguagesPromise: Promise<Language[]> | null = null;

/**
 * Fetch all available languages from the API (cached in memory).
 */
export async function fetchLanguages(): Promise<Language[]> {
  if (cachedLanguages) {
    return cachedLanguages;
  }
  if (fetchLanguagesPromise) {
    return fetchLanguagesPromise;
  }
  
  const url = buildApiUrl('/api/Language');
  fetchLanguagesPromise = apiGet<Language[]>(url).then(data => {
    cachedLanguages = data;
    fetchLanguagesPromise = null;
    return data;
  }).catch(err => {
    fetchLanguagesPromise = null;
    throw err;
  });
  
  return fetchLanguagesPromise;
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
 * Fetch paginated blog list for a specific user.
 */
export async function fetchBlogsByUserId(
  userId: string,
  languageId: number,
  pageIndex: number = 0,
  pageSize: number = 10
): Promise<BlogListResponse> {
  const params = new URLSearchParams({
    UserId: userId,
    LanguageId: String(languageId),
    'PageRequest.PageIndex': String(pageIndex),
    'PageRequest.PageSize': String(pageSize),
  });
  const url = buildApiUrl(`/api/Blog/get-blogs-by-user-id?${params.toString()}`);
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
 * Fetch paginated blog list for admin panel.
 */
export async function fetchAdminBlogList(
  token: string,
  pageIndex: number = 0,
  pageSize: number = 10
): Promise<BlogListResponse> {
  const params = new URLSearchParams({
    'PageRequest.PageIndex': String(pageIndex),
    'PageRequest.PageSize': String(pageSize),
  });
  const url = buildApiUrl(`/api/Blog/get-admin-blogs?${params.toString()}`);
  
  // get-admin-blogs requires auth
  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json() as Promise<BlogListResponse>;
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
    requiresTurnstile: true,
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
    requiresTurnstile: true,
  });
}

/**
 * Delete a blog post. Requires admin token.
 */
export async function deleteBlog(blogId: string, token: string): Promise<void> {
  const url = buildApiUrl(`/api/Blog?blogId=${blogId}`);
  await apiFetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
    requiresTurnstile: true,
  });

  return response.json() as Promise<ImageUploadResponse>;
}

/**
 * Fetch comments for a specific blog post.
 */
export async function fetchCommentsByBlogId(blogId: string, languageId: number, pageIndex: number = 0, pageSize: number = 50): Promise<any> {
  const params = new URLSearchParams({
    LanguageId: String(languageId),
    BlogId: blogId,
    'PageRequest.PageIndex': String(pageIndex),
    'PageRequest.PageSize': String(pageSize),
  });
  const url = buildApiUrl(`/api/BlogComment?${params.toString()}`);
  return apiGet<any>(url);
}

/**
 * Create a new comment.
 */
export async function createComment(blogId: string, authorName: string, content: string, languageId: number, authToken?: string): Promise<void> {
  const url = buildApiUrl('/api/BlogComment');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const payload = {
    BlogComment: {
      AuthorName: authorName,
      Content: content,
      BlogId: blogId,
      LanguageId: languageId
    }
  };

  await apiFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    requiresTurnstile: true,
  });
}
