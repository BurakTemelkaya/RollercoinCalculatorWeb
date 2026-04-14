import { useTranslation } from 'react-i18next';
import './Pagination.css';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    onPageChange: (page: number) => void;
}

/**
 * Reusable pagination component.
 * Works with any paginated API endpoint following the standard
 * { index, pages, hasPrevious, hasNext } pattern.
 * 
 * `currentPage` is 0-based (matching API index).
 */
export default function Pagination({
    currentPage,
    totalPages,
    hasPrevious,
    hasNext,
    onPageChange,
}: PaginationProps) {
    const { t } = useTranslation();

    if (totalPages <= 1) return null;

    // Build page numbers to display
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
        // Show all pages
        for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
        // Always show first page
        pages.push(0);

        let start = Math.max(1, currentPage - 1);
        let end = Math.min(totalPages - 2, currentPage + 1);

        // Adjust window near boundaries
        if (currentPage <= 2) {
            end = Math.min(totalPages - 2, maxVisible - 2);
        } else if (currentPage >= totalPages - 3) {
            start = Math.max(1, totalPages - maxVisible + 1);
        }

        if (start > 1) pages.push('ellipsis');
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages - 2) pages.push('ellipsis');

        // Always show last page
        pages.push(totalPages - 1);
    }

    return (
        <div className="pagination">
            <button
                className="pagination-btn pagination-nav"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPrevious}
                aria-label={t('pagination.previous')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="pagination-nav-text">{t('pagination.previous')}</span>
            </button>

            <div className="pagination-pages">
                {pages.map((page, i) =>
                    page === 'ellipsis' ? (
                        <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
                    ) : (
                        <button
                            key={page}
                            className={`pagination-btn pagination-page ${page === currentPage ? 'active' : ''}`}
                            onClick={() => onPageChange(page)}
                            aria-current={page === currentPage ? 'page' : undefined}
                        >
                            {page + 1}
                        </button>
                    )
                )}
            </div>

            <button
                className="pagination-btn pagination-nav"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNext}
                aria-label={t('pagination.next')}
            >
                <span className="pagination-nav-text">{t('pagination.next')}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
        </div>
    );
}
