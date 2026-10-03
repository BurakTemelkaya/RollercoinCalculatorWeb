import { useState } from 'react';

interface Props {
  value: number | null;
  min: number;
  max: number;
  label: string;
  allowEmpty?: boolean;
  stepper?: boolean;
  onChange: (value: number | null) => void;
}

export default function HamsterNumberInput({ value, min, max, label, allowEmpty = false, stepper = false, onChange }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (number: number) => Math.min(max, Math.max(min, Math.floor(number)));
  const change = (next: number | null) => { setDraft(null); onChange(next); };
  return <div className={`hamster-number-input ${stepper ? 'stat-stepper' : 'level-picker'}`} title={label}>
    {stepper && <button type="button" aria-label={`${label} −1`} disabled={value === null || value <= min} onClick={() => change(clamp((value ?? min) - 1))}>⌄</button>}
    <input type="number" inputMode="numeric" min={min} max={max} step={1} aria-label={label} value={draft ?? value ?? ''}
      onChange={event => {
        const text = event.target.value;
        setDraft(text);
        const number = Number(text);
        if (text === '' && allowEmpty) onChange(null);
        else if (text !== '' && Number.isFinite(number) && number >= min && number <= max) onChange(Math.floor(number));
      }}
      onBlur={() => {
        if (draft !== null) onChange(draft === '' && allowEmpty ? null : clamp(Number(draft) || min));
        setDraft(null);
      }}
      onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
    {stepper
      ? <button type="button" aria-label={`${label} +1`} disabled={value !== null && value >= max} onClick={() => change(clamp((value ?? min) + 1))}>⌃</button>
      : <><span aria-hidden="true">▾</span><select aria-label={label} value={value ?? ''} onChange={event => change(event.target.value === '' ? null : Number(event.target.value))}>
        {allowEmpty && <option value="">—</option>}
        {Array.from({ length: max - min + 1 }, (_, index) => min + index).map(number => <option value={number} key={number}>{number}</option>)}
      </select></>}
  </div>;
}
