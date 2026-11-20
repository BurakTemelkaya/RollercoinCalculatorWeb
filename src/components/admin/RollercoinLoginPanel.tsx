import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  RollerCoinLoginStep,
  startRollercoinLogin,
  submitRollercoinCaptcha,
  verifyRollercoinLoginCode,
} from '../../services/adminApi';

type Dot = { x: number; y: number };

const buttonStyle = (busy: boolean): React.CSSProperties => ({
  background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8,
  fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
});

/**
 * Admin-assisted RollerCoin sign-in. The backend does every request (through its proxy);
 * the admin only clicks the captcha here and types the code RollerCoin e-mails.
 */
export default function RollercoinLoginPanel() {
  const { getValidToken } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<RollerCoinLoginStep | null>(null);
  const [dots, setDots] = useState<Dot[]>([]);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const run = async (action: (token: string) => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      const token = await getValidToken();
      if (!token) throw new Error(t('auth.sessionExpired', 'You are not authorized or your session has expired.'));
      await action(token);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.detail || err.message || t('event.error', 'An error occurred.') });
    } finally {
      setBusy(false);
    }
  };

  const showStep = (next: RollerCoinLoginStep, wrongCaptcha = false) => {
    setStep(next);
    setDots([]);
    if (wrongCaptcha && next.step === 'captcha')
      setMessage({ type: 'error', text: t('admin.captchaWrong', 'Wrong selection, try the new image.') });
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!step || dots.length >= step.maxDots) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // The image may be shrunk on small screens; RollerCoin expects image pixels.
    const scale = step.width / rect.width;
    setDots([...dots, { x: Math.round((e.clientX - rect.left) * scale), y: Math.round((e.clientY - rect.top) * scale) }]);
  };

  const start = () => run(async token => showStep(await startRollercoinLogin(token)));
  const confirmCaptcha = () => run(async token =>
    showStep(await submitRollercoinCaptcha(dots.map(d => `${d.x},${d.y}`).join(','), token), true));
  const verify = () => run(async token => {
    if (await verifyRollercoinLoginCode(code.trim(), token)) {
      setStep(null);
      setCode('');
      setMessage({ type: 'success', text: t('admin.tokenSuccess', 'Token updated successfully!') });
    } else {
      setMessage({ type: 'error', text: t('admin.tokenFail', 'Token update failed.') });
    }
  });

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
      <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.15rem' }}>
        {t('admin.rollercoinLogin', 'Sign in with e-mail code')}
      </h2>
      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
        {t('admin.rollercoinLoginDesc', 'Solve the captcha, then enter the code RollerCoin e-mails to the bot account. The new tokens are saved automatically.')}
      </p>

      {message && (
        <div role="status" style={{
          padding: '10px 14px', borderRadius: 8,
          background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: message.type === 'success' ? '#4ade80' : '#f87171',
        }}>
          {message.text}
        </div>
      )}

      {!step && (
        <button type="button" onClick={start} disabled={busy} style={{ ...buttonStyle(busy), alignSelf: 'flex-start' }}>
          {busy ? t('admin.saving', 'Saving...') : t('admin.startLogin', 'Start sign-in')}
        </button>
      )}

      {step?.step === 'captcha' && step.captchaImg && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: step.width }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1' }}>
            <span>{t('admin.captchaClickOn', 'Click on:')}</span>
            {step.thumbImg && <img src={step.thumbImg} alt="" style={{ height: 40 }} />}
          </div>
          <div style={{ position: 'relative' }}>
            <img
              src={step.captchaImg}
              alt={t('admin.captchaImageAlt', 'Captcha')}
              onClick={handleImageClick}
              draggable={false}
              style={{ width: '100%', display: 'block', borderRadius: 8, cursor: 'crosshair' }}
            />
            {dots.map((d, i) => (
              <button
                key={i}
                type="button"
                aria-label={t('admin.captchaRemoveDot', 'Remove point {{n}}', { n: i + 1 })}
                onClick={() => setDots(dots.filter((_, j) => j !== i))}
                style={{
                  position: 'absolute', left: `${(d.x / step.width) * 100}%`, top: `${(d.y / step.height) * 100}%`,
                  transform: 'translate(-50%, -50%)', width: 26, height: 26, borderRadius: '50%',
                  border: '2px solid #fff', background: '#8b5cf6', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={confirmCaptcha} disabled={busy || dots.length === 0} style={buttonStyle(busy || dots.length === 0)}>
              {t('admin.captchaConfirm', 'Confirm')}
            </button>
            <button type="button" onClick={start} disabled={busy} style={{ ...buttonStyle(busy), background: '#334155' }}>
              {t('admin.captchaRefresh', 'New image')}
            </button>
          </div>
        </div>
      )}

      {step?.step === 'code' && (
        <form onSubmit={e => { e.preventDefault(); verify(); }} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
          <label htmlFor="rcLoginCode" style={{ color: '#cbd5e1' }}>
            {t('admin.loginCodeLabel', 'Code sent to {{email}}', { email: step.email })}
          </label>
          <input
            id="rcLoginCode"
            value={code}
            onChange={e => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            style={{
              padding: 10, borderRadius: 8, background: 'rgba(15,15,30,0.5)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0', fontSize: '1.1rem', letterSpacing: 4,
            }}
          />
          <button type="submit" disabled={busy || !code.trim()} style={buttonStyle(busy || !code.trim())}>
            {busy ? t('admin.saving', 'Saving...') : t('admin.verifyCode', 'Verify and save tokens')}
          </button>
        </form>
      )}
    </section>
  );
}
