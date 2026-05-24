/** Blog and Language type definitions */

export interface Language {
  id: number;
  code: string;
  name: string;
  nativeName: string;
}

/** Blog list item returned from GET /api/Blog */
export interface BlogListItem {
  id: string;
  thumbnailImageUrl: string;
  creatorUserId: string;
  mainLanguageId?: number | null;
  title: string;
  slug: string;
  createdDate: string;
  updatedDate?: string | null;
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

/** Full blog detail returned from get-by-slug */
export interface BlogDetail {
  id: string;
  thumbnailImageUrl: string;
  creatorUserId: string;
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

/** Payload for deleting a blog */
export interface DeleteBlogCommand {
  blogId: string;
  creatorUserId: string;
}

/** Image upload response */
export interface ImageUploadResponse {
  isSuccess: boolean;
  url: string;
  errorCode: string | null;
  size: number;
  contentType: string;
}
