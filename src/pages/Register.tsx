import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuthReady } from '../hooks/useAuthReady';

/**
 * Minimal Register page to satisfy route import and allow optional email/password signup.
 * If your product does NOT allow public registration, you can:
 *   - remove this route from App.tsx, OR
 *   - keep this file and show a "Registration disabled" message.
 */
export default function Register() {
  const { ready, session } = useAuthReady();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!ready) return;
    if (session) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [ready, session, navigate, location.state]);

  if (!ready) return <div style={{ padding: 24 }}>Loading…</div>;
  if (session) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null); setInfo(null); setSubmitting(true);

    try {
      // If your Supabase project disables public signups, replace this with a "Registration disabled" message.
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password
      });

      if (signUpErr) {
        const msg = (signUpErr.message || '').toLowerCase();
        if (msg.includes('email rate limit')) setError('Too many attempts. Please try again later.');
        else setError(signUpErr.message || 'Registration failed.');
        setSubmitting(false);
        return;
      }

      // If email confirmation is required, inform the user.
      if (data?.user && !data.session) {
        setInfo('Check your inbox to confirm your email, then sign in.');
        setSubmitting(false);
        return;
      }

      // If session was created (auto-confirm), send to dashboard (or intended page)
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? 'Registration failed.');
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 460, margin: '48px auto', padding: 16 }}>
      <h1 style={{ marginBottom: 16 }}>Create account</h1>

      {/* If registration is disabled, replace the form with a notice and a link to Sign In */}
      {/* <p>Registration is currently disabled. Please contact support.</p> */}

      <form onSubmit={onSubmit} noValidate>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input
            id="email" name="email" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error} aria-describedby="register-msg"
            style={{ width: '100%', padding: '8px 10px' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 4 }}>Password</label>
          <input
            id="password" name="password" type="password" autoComplete="new-password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error} aria-describedby="register-msg"
            style={{ width: '100%', padding: '8px 10px' }}
          />
        </div>

        <div id="register-msg" role="alert" aria-live="polite" style={{ minHeight: 22, marginBottom: 12 }}>
          {error ? <span style={{ color: 'crimson' }}>{error}</span> : info ? <span style={{ color: 'teal' }}>{info}</span> : null}
        </div>

        <button type="submit" disabled={submitting} style={{ width: '100%', padding: '10px 12px' }}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </main>
  );
}