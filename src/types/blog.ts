/** Blog and Language type definitions */

export interface Language {
  id: number;
  code: string;
  name: string;
  nativeName: string;
}

export const ReviewStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
  RevisionRequested: 3
} as const;

export type ReviewStatus = typeof ReviewStatus[keyof typeof ReviewStatus];

export const BlogCommentReviewStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2
} as const;

export type BlogCommentReviewStatus = typeof BlogCommentReviewStatus[keyof typeof BlogCommentReviewStatus];

/** Blog list item returned from GET /api/Blog or get-admin-blogs */
export interface BlogListItem {
  id: string;
  thumbnailImageUrl: string;
  creatorUserId: string;
  creatorUserName?: string;
  creatorUser?: CreatorUser;
  mainLanguageId?: number | null;
  title?: string; // Present in public list
  slug?: string; // Present in public list
  createdDate: string;
  updatedDate?: string | null;
  status?: ReviewStatus; // Present in admin list
  blogContents?: { // Present in admin list
    languageId: number;
    title: string;
    slug: string;
  }[];
  blogContent?: { // Present in public list
    title: string;
    slug: string;
  };
  approvedDate?: string | null;
}

/** Paginated blog list response */
export interface BlogListResponse {
  items: BlogListItem[];
  index: number;
  size: number;
  count: number;
  pages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/** Individual blog content entry (one per language) */
export interface BlogContentDto {
  id?: string;
  thumbnailImageUrl?: string | null;
  title: string;
  content: string;
  slug: string;
  languageId: number;
  createdDate?: string;
  updatedDate?: string | null;
}

export interface CreatorUser {
  id: string;
  name?: string;
  email?: string;
  createdDate?: string;
}

/** Full blog detail returned from get-by-slug */
export interface BlogDetail {
  id: string;
  thumbnailImageUrl: string;
  creatorUserId: string;
  creatorUserName?: string;
  creatorUser?: CreatorUser;
  mainLanguageId?: number | null;
  blogContent: BlogContentDto;
  createdDate: string;
  updatedDate?: string | null;
  availableLanguages: AvailableLanguageDto[];
}

/** Available language + slug pair for a blog post */
export interface AvailableLanguageDto {
  languageId: number;
  slug: string;
}

/** Payload for creating a new blog */
export interface CreateBlogDto {
  thumbnailImageUrl: string;
  creatorUserId: string;
  mainLanguageId?: number | null;
  blogContents: BlogContentDto[];
}

/** Payload for updating an existing blog */
export interface UpdateBlogDto {
  id: string;
  thumbnailImageUrl: string;
  creatorUserId: string;
  mainLanguageId?: number | null;
  blogContents: BlogContentDto[];
}

/** Admin blog content detail (from get-admin-by-id) */
export interface AdminBlogContentDto {
  id: string;
  thumbnailImageUrl?: string | null;
  title: string;
  content: string;
  slug: string;
  languageId: number;
  language?: { id: number; code: string; name: string; nativeName: string };
  blogId: string;
  createdDate: string;
  updatedDate?: string | null;
  deletedDate?: string | null;
}

/** Full admin blog detail (from get-admin-by-id) */
export interface AdminBlogDetail {
  id: string;
  thumbnailImageUrl: string;
  creatorUserId: string;
  creatorUser?: CreatorUser;
  blogContents: AdminBlogContentDto[];
  mainLanguageId: number;
  approvedUser?: CreatorUser | null;
  approvedUserId?: string | null;
  approvedDate?: string | null;
  createdDate: string;
  updatedDate?: string | null;
  deletedDate?: string | null;
  status?: ReviewStatus;
}


/** Image upload response */
export interface ImageUploadResponse {
  isSuccess: boolean;
  url: string;
  errorCode: string | null;
  size: number;
  contentType: string;
}

/** Blog review DTO for creating reviews */
export interface CreateBlogReviewDto {
  reviewNote?: string;
  status: ReviewStatus;
  reviewerUserId?: string;
  blogId: string;
}

/** Blog review list item (admin view) */
export interface BlogReviewListDto {
  id: string;
  reviewNote?: string;
  status: ReviewStatus;
  reviewerUserId: string;
  reviewerUser?: CreatorUser;
  blogId: string;
  createdDate: string;
  updatedDate?: string | null;
  deletedDate?: string | null;
}

/** Blog review by blog ID (user view) */
export interface BlogReviewByBlogIdDto {
  id: string;
  reviewNote?: string;
  status: ReviewStatus;
  blogId: string;
  createdDate: string;
  updatedDate?: string | null;
}
