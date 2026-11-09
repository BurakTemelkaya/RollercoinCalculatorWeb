import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import './ImportGuideAnimation.css';

const COLORS = ['#e05a9a', '#f2b33d', '#5ad1e0', '#7c6cf0', '#61d27a', '#ef7b4b', '#c9cdd8'];
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
/** A small drawn miner: casing in `color`, a screen and blinking LEDs. */
const Miner = ({ color, delay = 0 }: { color: string; delay?: number }) =>
    <span className="iga-miner" style={{ '--c': color, '--d': `${delay}s` } as CSSProperties} />;
type At = (n: number) => '' | 'now' | 'done';

/** Plays a drawn screen recording: `cursor` holds the cursor target per step in % of the stage. */
function GuidePlayer({ title, steps, cursor, keys, render }: {
    title: string; steps: string[]; cursor: number[][]; keys: string[];
    render: (step: number, at: At) => ReactNode;
}) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [playing, setPlaying] = useState(() => !reducedMotion());
    useEffect(() => {
        if (!playing) return;
        const timer = window.setTimeout(() => setStep(s => (s + 1) % steps.length), step === steps.length - 1 ? 4500 : 3400);
        return () => window.clearTimeout(timer);
    }, [playing, step, steps.length]);

    // '' before the step, 'now' while it plays (appears after the click), 'done' afterwards.
    const at: At = n => step < n ? '' : step === n ? 'now' : 'done';
    const [x, y] = cursor[step];
    return <figure className="iga" aria-label={title}>
        <div className="iga-stage" aria-hidden="true">
            {render(step, at)}
            {keys[step] && <kbd className="iga-key" key={step}>{keys[step]}</kbd>}
            <span className="iga-cursor" style={{ left: `${x}%`, top: `${y}%` }}>
                <svg viewBox="0 0 16 22"><path d="M1 1v17l4.5-4.2 3 6.7 3-1.4-3-6.4H15z" fill="#fff" stroke="#111" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                <span className="iga-click" key={step} />
            </span>
        </div>
        <figcaption>
            <p aria-live={playing ? 'off' : 'polite'}><b>{step + 1}/{steps.length}</b> {steps[step]}</p>
            <div className="iga-controls">
                <button type="button" onClick={() => setPlaying(p => !p)} aria-label={t(playing ? 'minerImport.anim.pause' : 'minerImport.anim.play')}
                    title={t(playing ? 'minerImport.anim.pause' : 'minerImport.anim.play')}>{playing ? '❚❚' : '▶'}</button>
                {steps.map((_, n) => <button type="button" key={n} className={`iga-dot ${n === step ? 'active' : ''}`} aria-current={n === step ? 'step' : undefined}
                    aria-label={t('minerImport.anim.step', { n: n + 1 })} onClick={() => setStep(n)} />)}
            </div>
        </figcaption>
    </figure>;
}

function PasteBox({ text }: { text: string }) {
    const { t } = useTranslation();
    return <div className="iga-paste">
        <strong>{t('minerImport.title')}</strong>
        <div className="iga-textarea"><span className="now">{text}</span></div>
        <b className="now">{t('minerImport.read')}</b>
    </div>;
}

/** DevTools → Network → inventory request → Response → paste. */
export function ApiGuideAnimation() {
    const { t } = useTranslation();
    const read = t('minerImport.read');
    return <GuidePlayer title={t('minerImport.anim.title')}
        steps={[1, 2, 3, 4, 5, 6, 7].map(n => t(`minerImport.anim.s${n}`, { read }))}
        // Matches the element positions in ImportGuideAnimation.css (game is the left 58%, DevTools the right 42%).
        cursor={[[91, 4], [72, 13], [20.9, 70], [52.5, 87], [90.5, 49], [79, 76], [29, 69]]}
        keys={['F12', '', '', '', '', 'Ctrl+A · Ctrl+C', 'Ctrl+V']}
        render={(step, at) => {
            const page = step >= 3 ? 1 : 0;
            return <>
                <div className="iga-game">
                    <div className="iga-room">
                        {Array.from({ length: 12 }, (_, shelf) => <div className="iga-shelf" key={shelf}>
                            {Array.from({ length: 4 }, (_, slot) => <i key={slot} className={at(2)}>
                                {step >= 2 && <Miner color={COLORS[(shelf * 4 + slot) * 5 % COLORS.length]} delay={(shelf * 4 + slot) % 7 * 0.3} />}
                            </i>)}
                        </div>)}
                    </div>
                    <div className="iga-rooms"><span>Rooms:</span>
                        {[0, 1, 2, 3].map(n => <b key={n} className={n === 1 ? at(2) : ''} style={{ left: `${22 + n * 10}%` }}>{n}</b>)}
                    </div>
                    <div className="iga-dock">
                        {Array.from({ length: 5 }, (_, card) => <i key={`${page}-${card}`} className={page ? at(3) : ''}>
                            <Miner color={COLORS[(card + page * 3) % COLORS.length]} delay={card * 0.4} />
                        </i>)}
                        <b className="iga-prev">‹</b><b className={`iga-next ${at(3)}`}>›</b>
                    </div>
                    {step === 6 && <PasteBox text={'{"success":true,"data":{"items":[{"name":"Retreat","quantity":1,…'} />}
                </div>
                <div className={`iga-devtools ${step === 0 ? 'opening' : ''}`}>
                    <div className="iga-tabs"><span>Elements</span><span>Console</span><span className={`iga-network ${at(0)}`}>Network</span></div>
                    <div className="iga-filter">
                        <span className="iga-filter-input">{step >= 1 && <span className={`iga-typed ${at(1)}`}>inventory</span>}</span>
                        <span className="iga-pill">Fetch/XHR</span>
                    </div>
                    <div className="iga-list">
                        <div className="iga-list-head"><span>Name</span><span>Status</span></div>
                        {step >= 2 && <div className={`iga-row ${at(2)} ${step >= 4 ? 'selected' : ''}`}><span>inventory?itemType=miner&amp;sort…</span><span>200</span></div>}
                        {step >= 3 && <div className={`iga-row ${at(3)}`}><span>inventory?itemType=miner&amp;sort…</span><span>200</span></div>}
                    </div>
                    <div className="iga-details">
                        <div className="iga-tabs"><span>Headers</span><span>Preview</span><span className={`iga-response ${at(4)}`}>Response</span></div>
                        {step >= 4 && <pre className={`${at(4)} ${step === 5 ? 'copied' : ''}`}>
                            {'{"success":true,"data":{\n "items":[{"name":"Retreat",\n  "quantity":1,"power":17070,\n  …},{"name":"Hamnata",…}]\n}}'}
                        </pre>}
                    </div>
                </div>
            </>;
        }} />;
}

const CARDS = [['+26%', 'Steel Tank', '4.000 Eh/s'], ['+15%', 'Who Dis', '4.500 Eh/s'], ['+10%', 'Who Dis', '1.700 Eh/s'],
    ['+7%', 'Phantasmagoria', '45.000 Ph/s'], ['+25%', "Don't Open", '5.500 Eh/s'], ['+16%', 'Bazaar Bags', '25.000 Ph/s']];

/** Miners page → select every card's text → copy → paste. */
export function CopyGuideAnimation({ url }: { url: string }) {
    const { t } = useTranslation();
    const read = t('minerImport.read');
    return <GuidePlayer title={t('minerImport.copyAnim.title')}
        steps={[1, 2, 3, 4, 5].map(n => t(`minerImport.copyAnim.s${n}`, { read }))}
        // Matches .iga-address / .iga-cards / .iga-paste in ImportGuideAnimation.css.
        cursor={[[40, 4.5], [6.5, 16], [94, 92], [94, 92], [50, 69]]}
        keys={['', '', '', 'Ctrl+C', 'Ctrl+V']}
        render={(step, at) => <div className="iga-page">
            <div className="iga-address"><span className={`iga-typed-url ${at(0)}`}>{url.replace(/^https?:\/\//, '')}</span></div>
            {<div className={`iga-cards ${at(0)}`}>
                {CARDS.map(([bonus, name, power], i) => <div className="iga-card" key={i}>
                    <span className={step >= 2 ? 'sel' : ''} style={{ transitionDelay: step === 2 ? `${1 + i * 0.12}s` : '0s' }}>
                        <em>Bonus power <b>{bonus}</b></em>
                        <i><Miner color={COLORS[i]} delay={i * 0.35} /></i>
                        <strong>{name}</strong>
                        <small><span>Power:</span><span>{power}</span></small>
                    </span>
                </div>)}
            </div>}
            {step === 4 && <PasteBox text={'Bonus power +26% Steel Tank Power: 4.000 Eh/s Bonus power +15% Who Dis …'} />}
        </div>} />;
}
