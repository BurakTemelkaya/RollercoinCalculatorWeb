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
  ReviewStatus,
  AdminBlogDetail,
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
 * Fetch paginated blog list for the logged-in creator.
 * Uses get-blogs-by-creator endpoint which returns status, approvedDate etc.
 */
export async function fetchBlogsByCreator(
  creatorId: string,
  token: string,
  pageIndex: number = 0,
  pageSize: number = 10,
  reviewStatus?: ReviewStatus
): Promise<BlogListResponse> {
  const params = new URLSearchParams({
    CreatorId: creatorId,
    'PageRequest.PageIndex': String(pageIndex),
    'PageRequest.PageSize': String(pageSize),
  });

  if (reviewStatus !== undefined && reviewStatus !== null) {
    params.append('ReviewStatus', String(reviewStatus));
  }

  const url = buildApiUrl(`/api/Blog/get-blogs-by-creator?${params.toString()}`);
  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json() as Promise<BlogListResponse>;
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
 * Fetch a single blog post by ID for admin panel.
 */
export async function fetchAdminBlogById(blogId: string, token: string): Promise<AdminBlogDetail> {
  const params = new URLSearchParams({ BlogId: blogId });
  const url = buildApiUrl(`/api/Blog/get-admin-by-id?${params.toString()}`);
  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json() as Promise<AdminBlogDetail>;
}

/**
 * Create a blog review (approve/reject with note). Requires admin token.
 * POST /api/BlogReview
 */
export async function createBlogReview(
  blogId: string,
  status: ReviewStatus,
  reviewNote: string,
  token: string
): Promise<void> {
  const url = buildApiUrl('/api/BlogReview');
  await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      CreateBlogReview: {
        BlogId: blogId,
        Status: status,
        ReviewNote: reviewNote || null,
      }
    }),
  });
}

/**
 * Fetch admin blog review list. Requires admin token.
 * GET /api/BlogReview (PageRequest + optional Status)
 */
export async function fetchAdminBlogReviews(
  token: string,
  status?: number,
  pageIndex: number = 0,
  pageSize: number = 20
): Promise<any> {
  const params = new URLSearchParams({
    'PageRequest.PageIndex': String(pageIndex),
    'PageRequest.PageSize': String(pageSize),
  });
  if (status !== undefined && status !== null) params.append('Status', String(status));

  const url = buildApiUrl(`/api/BlogReview?${params.toString()}`);
  const response = await apiFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

/**
 * Fetch admin blog reviews filtered by blog ID. Requires admin token.
 * GET /api/BlogReview/get-admin-blog-reviews/{blogId}
 */
export async function fetchAdminBlogReviewsByBlogId(
  blogId: string,
  token: string,
  pageIndex: number = 0,
  pageSize: number = 20
): Promise<any> {
  const params = new URLSearchParams({
    'PageRequest.PageIndex': String(pageIndex),
    'PageRequest.PageSize': String(pageSize),
  });

  const url = buildApiUrl(`/api/BlogReview/get-admin-blog-reviews/${blogId}?${params.toString()}`);
  const response = await apiFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

/**
 * Fetch blog reviews by blog ID (for logged-in user).
 * GET /api/BlogReview/user-blog-reviews/{blogId}
 */
export async function fetchUserBlogReviewsByBlogId(
  blogId: string,
  token: string
): Promise<any> {
  const url = buildApiUrl(`/api/BlogReview/user-blog-reviews/${blogId}`);
  const response = await apiFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

/**
 * Create a new blog post (non-admin). Requires auth token and Turnstile.
 */
export async function createBlog(dto: CreateBlogDto, token: string, turnstileToken: string): Promise<void> {
  const url = buildApiUrl('/api/Blog');
  await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ createBlogDto: dto }),
    turnstileToken,
  });
}

/**
 * Update an existing blog post (non-admin). Requires auth token and Turnstile.
 */
export async function updateBlog(dto: UpdateBlogDto, token: string, turnstileToken: string): Promise<void> {
  const url = buildApiUrl('/api/Blog');
  await apiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ blog: dto }),
    turnstileToken,
  });
}

/**
 * Create a new blog post as admin. Requires admin token, no Turnstile.
 */
export async function createBlogByAdmin(dto: CreateBlogDto, token: string): Promise<void> {
  const url = buildApiUrl('/api/Blog/create-blog-by-admin');
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
 * Update an existing blog post as admin. Requires admin token, no Turnstile.
 */
export async function updateBlogByAdmin(dto: UpdateBlogDto, token: string): Promise<void> {
  const url = buildApiUrl('/api/Blog/update-blog-by-admin');
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
export async function createComment(blogId: string, authorName: string, content: string, languageId: number, turnstileToken: string, authToken?: string): Promise<void> {
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
    turnstileToken,
  });
}
