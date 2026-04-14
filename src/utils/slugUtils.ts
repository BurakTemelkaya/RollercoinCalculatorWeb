/**
 * URL Slug Utilities
 * 
 * Converts strings to URL-friendly slugs for SEO-friendly routing.
 */

/**
 * Converts a string to a URL-friendly slug.
 * Example: "Chain Expansion" → "chain-expansion"
 */
export function toSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')   // Remove non-word chars (except spaces and hyphens)
        .replace(/\s+/g, '-')       // Replace spaces with hyphens
        .replace(/-+/g, '-')        // Collapse multiple hyphens
        .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens
}

/**
 * Builds a SEO-friendly event URL segment: "event-name-{id}"
 * Example: buildEventSlug("Chain Expansion", "69d4ff69") → "chain-expansion-69d4ff69"
 */
export function buildEventSlug(name: string, id: string): string {
    const slug = toSlug(name);
    return slug ? `${slug}-${id}` : id;
}

/**
 * Extracts the event ID from a SEO-friendly slug.
 * The ID is always a 24-character hex string (MongoDB ObjectId) at the end.
 * Example: "chain-expansion-69d4ff69215eb8e175a7bbc0" → "69d4ff69215eb8e175a7bbc0"
 * Fallback: returns the full slug if no valid ID pattern is found (backwards compatibility).
 */
export function extractEventIdFromSlug(slug: string): string {
    // MongoDB ObjectId: 24 hex characters at the end
    const match = slug.match(/([a-f0-9]{24})$/i);
    return match ? match[1] : slug;
}
