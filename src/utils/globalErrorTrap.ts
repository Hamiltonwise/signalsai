let __installed = false;

export function installGlobalErrorTrap() {
  if (__installed) return;
  __installed = true;

  // Filter out known third-party errors that don't affect functionality
  const isIgnorableError = (error: any) => {
    const message = error?.message || error?.toString() || '';
    return (
      message.includes('getReplayId is not a function') ||
      message.includes('Sentry') ||
      message.includes('u?.getReplayId') ||
      message.includes('Non-Error promise rejection captured') ||
      message.includes('ready is not defined') // Ignore this specific error during loading
    );
  };

  // Window-level traps (non-crashing)
  window.addEventListener('error', (e) => {
    try {
      // Skip logging for ignorable third-party errors
      if (isIgnorableError(e?.error)) {
        return;
      }
      
      // Prefer console.error, avoid throwing
      // You can integrate external logging here if desired
      // eslint-disable-next-line no-console
      console.error('[window.error]', e?.error || e?.message || e);
    } catch {}
  });

  window.addEventListener('unhandledrejection', (e) => {
    try {
      // Skip logging for ignorable third-party errors
      if (isIgnorableError(e?.reason)) {
        return;
      }
      
      // eslint-disable-next-line no-console
      console.error('[unhandledrejection]', e?.reason || e);
    } catch {}
  });
}