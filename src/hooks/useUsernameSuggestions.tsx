import { CSSProperties, KeyboardEvent, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchUsernameSuggestions, UsernameSuggestion } from '../services/userApi';
import { parseUsernameInput } from '../utils/usernameParser';
import '../components/UsernameSuggestions.css';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

/**
 * Username autocomplete as an ARIA combobox. Spread `inputProps` on the input, call `handleKeyDown`
 * first in its onKeyDown (true = the key was consumed), `close()` in its onBlur, and render `listbox`
 * anywhere. Picking an option passes its profile link to `onSelect`, which is the value the user lookup needs.
 */
export function useUsernameSuggestions(value: string, onSelect: (profileLink: string) => void) {
    const listId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [items, setItems] = useState<UsernameSuggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [position, setPosition] = useState<CSSProperties>();
    const isFocused = () => inputRef.current !== null && document.activeElement === inputRef.current;

    useEffect(() => {
        const parsed = parseUsernameInput(value);
        const query = parsed && !parsed.isProfileLink ? parsed.username : '';
        if (query.length < MIN_QUERY_LENGTH) {
            setItems([]);
            return;
        }
        // Only for typing: the saved username is written into the input on page load, and right
        // after picking a suggestion the value is already one of them
        if (!isFocused() || items.some(i => i.profileLink === query)) return;

        const controller = new AbortController();
        const timer = setTimeout(() => {
            fetchUsernameSuggestions(query, controller.signal)
                .then(result => {
                    setItems(result);
                    setActive(-1);
                    setOpen(isFocused());
                })
                .catch(() => { /* autocomplete is best-effort; typing still works */ });
        }, DEBOUNCE_MS);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- items is only read to skip a redundant fetch
    }, [value]);

    // The value already in the input is not a suggestion
    const shown = items.filter(i => i.profileLink !== value.trim());
    const expanded = open && shown.length > 0;

    // The list is portaled to <body> (the input sits in overflow:hidden cards). It is placed in page
    // coordinates so window scrolling moves it natively with the input; JS only re-places it on
    // resize or when an inner scroll container moves the input.
    useLayoutEffect(() => {
        if (!expanded) return;
        const place = () => {
            const rect = inputRef.current?.getBoundingClientRect();
            if (!rect) return;
            // body is position:relative, so it is the list's containing block
            const body = document.body.getBoundingClientRect();
            const top = rect.bottom - body.top + 6;
            const left = rect.left - body.left;
            setPosition(p => (p?.top === top && p.left === left && p.width === rect.width ? p : { top, left, width: rect.width }));
        };
        place();
        window.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);
        return () => {
            window.removeEventListener('scroll', place, true);
            window.removeEventListener('resize', place);
        };
    }, [expanded]);

    const select = (item: UsernameSuggestion) => {
        setOpen(false);
        setActive(-1);
        onSelect(item.profileLink);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): boolean => {
        if (!expanded) {
            if (e.key === 'ArrowDown' && shown.length > 0) {
                e.preventDefault();
                setOpen(true);
                setActive(0);
                return true;
            }
            return false;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActive(i => (i + 1) % shown.length);
                return true;
            case 'ArrowUp':
                e.preventDefault();
                setActive(i => (i <= 0 ? shown.length - 1 : i - 1));
                return true;
            case 'Enter':
                if (active < 0) {
                    setOpen(false); // nothing highlighted: Enter runs the lookup, so get the list out of the way
                    return false;
                }
                e.preventDefault();
                select(shown[active]);
                return true;
            case 'Escape':
                e.preventDefault();
                setOpen(false);
                return true;
            default:
                return false;
        }
    };

    const optionId = (index: number) => `${listId}-opt-${index}`;

    const inputProps = {
        ref: inputRef,
        role: 'combobox' as const,
        autoComplete: 'off',
        'aria-autocomplete': 'list' as const,
        'aria-expanded': expanded,
        'aria-controls': listId,
        'aria-activedescendant': expanded && active >= 0 ? optionId(active) : undefined,
        onFocus: () => setOpen(true),
    };

    const listbox = expanded && position ? createPortal(
        <ul id={listId} role="listbox" className="username-suggestions" style={position}>
            {shown.map((item, index) => (
                <li
                    key={item.profileLink}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === active}
                    className={`username-suggestion${index === active ? ' active' : ''}`}
                    // Keep focus in the input so its blur doesn't close the list before the click lands
                    onMouseDown={e => e.preventDefault()}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => select(item)}
                >
                    <span className="username-suggestion-name">{item.name}</span>
                    {item.name !== item.profileLink && (
                        <span className="username-suggestion-link">/p/{item.profileLink}</span>
                    )}
                </li>
            ))}
        </ul>,
        document.body,
    ) : null;

    return { inputProps, handleKeyDown, close: () => setOpen(false), listbox };
}
