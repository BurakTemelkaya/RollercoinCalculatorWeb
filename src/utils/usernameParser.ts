export interface ParsedUsername {
    username: string;
    isProfileLink: boolean;
}

export class InvalidUsernameInputError extends Error {
    constructor() {
        super('INVALID_USERNAME_INPUT');
        this.name = 'InvalidUsernameInputError';
    }
}

/** Accept plain names or RollerCoin /p/<name> links, retaining the name's case. */
export function parseUsernameInput(input: string): ParsedUsername | null {
    let value = input.trim();
    if (!value) return null;
    const markdown = value.match(/^\[[^\]]*\]\(([^\s]+)\)$/);
    if (markdown) value = markdown[1];
    if (value.startsWith('<') && value.endsWith('>')) value = value.slice(1, -1).trim();

    let urlValue: string | undefined;
    if (/^\/?p\//.test(value)) urlValue = `https://rollercoin.com/${value.replace(/^\//, '')}`;
    else if (/^https?:\/\//i.test(value)) urlValue = value;
    else if (value.startsWith('//')) urlValue = `https:${value}`;
    else if (/^(?:www\.)?rollercoin\.com(?:[/?#]|$)/i.test(value)) urlValue = `https://${value}`;

    const isName = (name: string) => name.length > 0 && !/[\/\\?#\u0000-\u001f\u007f]/.test(name);
    if (!urlValue) {
        if (!isName(value) || /^[a-z][a-z\d+.-]*:/i.test(value)) return null;
        return { username: value, isProfileLink: false };
    }

    try {
        const url = new URL(urlValue);
        if (!['rollercoin.com', 'www.rollercoin.com'].includes(url.hostname.toLowerCase())
            || url.username || url.password || url.port) return null;
        const parts = url.pathname.split('/');
        if (parts[1] !== 'p' || !parts[2]) return null;
        const decoded = decodeURIComponent(parts[2]);
        if (!isName(decoded)) return null;
        const username = decoded.trim();
        return isName(username) ? { username, isProfileLink: true } : null;
    } catch {
        return null;
    }
}
