import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOutEverywhere } from '../lib/auth';

export default function SignOut() {
  const navigate = useNavigate();
  React.useEffect(() => {
    (async () => {
      await signOutEverywhere();
      navigate('/signin', { replace: true });
    })();
  }, [navigate]);
  return <div style={{ padding: 12 }}>Signing you out…</div>;
}