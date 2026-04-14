/**
 * Generic Paginated API Response
 * 
 * Reusable type for any paginated endpoint following the standard
 * { items, index, size, count, pages, hasPrevious, hasNext } pattern.
 */

export interface PaginatedResponse<T> {
    items: T[];
    /** Current page index (0-based) */
    index: number;
    /** Page size */
    size: number;
    /** Total item count */
    count: number;
    /** Total page count */
    pages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}
