/**
 * Forgot Password Page
 *
 * Multi-step password reset flow:
 * 1. Enter email → API sends verification code
 * 2. Enter code + new password → API resets password and returns access token
 * 3. Auto-login and redirect to home
 *
 * Premium glassmorphism design matching LoginPage / RegisterPage.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/apiClient';
import { forgotPassword, forgotPasswordReset } from '../../services/authApi';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import './AuthPages.css';

type Step = 'email' | 'code';

export default function ForgotPasswordPage() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loginWithToken } = useAuth();

  // Step state
  const [step, setStep] = useState<Step>('email');

  // Step 1: Email
  const [email, setEmail] = useState('');

  // Step 2: Code + New Password
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Expiration timer
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Common state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Turnstile
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
  const hasSiteKey = siteKey.trim().length > 0;

  // Countdown timer for code expiration
  useEffect(() => {
    if (!expirationDate) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expTime = expirationDate.getTime();
      const diff = Math.max(0, Math.floor((expTime - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) {
        setExpirationDate(null);
        setError(t('auth.codeExpired'));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expirationDate, t]);

  const formatTime = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  // Step 1: Send reset code
  const handleSendCode = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError(t('auth.fillAllFields'));
      return;
    }

    if (hasSiteKey && !turnstileToken) {
      setError(t('input.errors.turnstileFailed'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await forgotPassword(
        { createPasswordResetCodeDto: { email: email.trim() } },
        turnstileToken
      );

      setExpirationDate(new Date(response.expirationDate));
      setSuccessMessage(t('auth.codeSent'));
      setStep('code');
      setTurnstileToken('');
      turnstileRef.current?.reset();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isRateLimit) {
          setError(t('input.errors.tooManyRequests'));
        } else if (err.isForbidden) {
          setError(t('input.errors.turnstileFailed'));
        } else {
          setError(err.detail || t('auth.forgotPasswordError'));
        }
      } else {
        setError(t('auth.forgotPasswordError'));
      }
      setTurnstileToken('');
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify code and reset password
  const handleResetPassword = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!resetCode.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError(t('auth.fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (hasSiteKey && !turnstileToken) {
      setError(t('input.errors.turnstileFailed'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await forgotPasswordReset(
        {
          email: email.trim(),
          resetCode: resetCode.trim(),
          newPassword,
          ipAddress: '',
        },
        turnstileToken
      );

      // Login with the returned access token
      loginWithToken(response.token);
      navigate(`/${lang || 'en'}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isRateLimit) {
          setError(t('input.errors.tooManyRequests'));
        } else if (err.isForbidden) {
          setError(t('input.errors.turnstileFailed'));
        } else {
          setError(err.detail || t('auth.resetPasswordError'));
        }
      } else {
        setError(t('auth.resetPasswordError'));
      }
      setTurnstileToken('');
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    setError(null);
    setSuccessMessage(null);

    if (hasSiteKey && !turnstileToken) {
      setError(t('input.errors.turnstileFailed'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await forgotPassword(
        { createPasswordResetCodeDto: { email: email.trim() } },
        turnstileToken
      );
      setExpirationDate(new Date(response.expirationDate));
      setSuccessMessage(t('auth.codeResent'));
      setTurnstileToken('');
      turnstileRef.current?.reset();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isRateLimit) {
          setError(t('input.errors.tooManyRequests'));
        } else {
          setError(err.detail || t('auth.forgotPasswordError'));
        }
      } else {
        setError(t('auth.forgotPasswordError'));
      }
      setTurnstileToken('');
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <>
        <title>{`${t('auth.forgotPasswordTitle')} | Rollercoin Calculator`}</title>
        <meta name="description" content="Reset your Rollercoin Calculator account password." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/forgot-password`} />
      </>

      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <h1>{t('auth.forgotPasswordTitle')}</h1>
          <p className="auth-subtitle">
            {step === 'email'
              ? t('auth.forgotPasswordSubtitle')
              : t('auth.enterCodeSubtitle')}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="auth-steps">
          <div className={`auth-step ${step === 'email' ? 'active' : 'completed'}`}>
            <div className="auth-step-circle">
              {step === 'email' ? '1' : (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span>{t('auth.email')}</span>
          </div>
          <div className="auth-step-line" />
          <div className={`auth-step ${step === 'code' ? 'active' : ''}`}>
            <div className="auth-step-circle">2</div>
            <span>{t('auth.verifyCode')}</span>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="auth-success">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="auth-error">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* Step 1: Email Form */}
        {step === 'email' && (
          <form onSubmit={handleSendCode} className="auth-form">
            <div className="auth-field">
              <label htmlFor="forgot-email">{t('auth.email')}</label>
              <div className="auth-input-wrapper">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="auth-input-icon">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {hasSiteKey && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={siteKey}
                  onSuccess={setTurnstileToken}
                  options={{
                    theme: 'dark',
                    size: 'normal',
                  }}
                />
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={isSubmitting || (hasSiteKey && !turnstileToken)}>
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  {t('auth.sendingCode')}
                </>
              ) : (
                t('auth.sendCode')
              )}
            </button>
          </form>
        )}

        {/* Step 2: Code + New Password Form */}
        {step === 'code' && (
          <form onSubmit={handleResetPassword} className="auth-form">
            {/* Expiration Timer */}
            {expirationDate && timeLeft > 0 && (
              <div className="auth-timer">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {t('auth.codeExpiresIn', { time: formatTime(timeLeft) })}
              </div>
            )}

            {/* Reset Code Input */}
            <div className="auth-field">
              <label htmlFor="reset-code">{t('auth.resetCode')}</label>
              <div className="auth-input-wrapper">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="auth-input-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="reset-code"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder={t('auth.resetCodePlaceholder')}
                  autoComplete="one-time-code"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* New Password Input */}
            <div className="auth-field">
              <label htmlFor="new-password">{t('auth.newPassword')}</label>
              <div className="auth-input-wrapper">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="auth-input-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('auth.newPasswordPlaceholder')}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="auth-field">
              <label htmlFor="confirm-new-password">{t('auth.confirmPassword')}</label>
              <div className="auth-input-wrapper">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="auth-input-icon">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {hasSiteKey && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={siteKey}
                  onSuccess={setTurnstileToken}
                  options={{
                    theme: 'dark',
                    size: 'normal',
                  }}
                />
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={isSubmitting || (hasSiteKey && !turnstileToken)}>
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  {t('auth.resettingPassword')}
                </>
              ) : (
                t('auth.resetPassword')
              )}
            </button>

            {/* Resend Code */}
            <button
              type="button"
              className="auth-resend-btn"
              onClick={handleResendCode}
              disabled={isSubmitting || (timeLeft > 0 && !!expirationDate)}
            >
              {timeLeft > 0 && expirationDate
                ? t('auth.resendCodeIn', { time: formatTime(timeLeft) })
                : t('auth.resendCode')}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span>{t('auth.rememberPassword')}</span>
          <Link to={`/${lang || 'en'}/login`}>{t('auth.login')}</Link>
        </div>
      </div>
    </div>
  );
}
