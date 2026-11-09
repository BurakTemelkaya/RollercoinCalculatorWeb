/**
 * URL Slug Utilities
 * 
 * Converts strings to URL-friendly slugs for SEO-friendly routing.
 */

/**
 * Extracts the event ID from a legacy "event-name-{id}" URL segment.
 * The ID is always a 24-character hex string (MongoDB ObjectId) at the end.
 * Example: "chain-expansion-69d4ff69215eb8e175a7bbc0" → "69d4ff69215eb8e175a7bbc0"
 * Fallback: returns the full slug if no valid ID pattern is found (backwards compatibility).
 */
export function extractEventIdFromSlug(slug: string): string {
    // MongoDB ObjectId: 24 hex characters at the end
    const match = slug.match(/([a-f0-9]{24})$/i);
    return match ? match[1] : slug;
}
