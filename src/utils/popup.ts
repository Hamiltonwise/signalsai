export function openBlankPopup(name = 'connect', w = 520, h = 700) {
  // SAFE sizing that never touches window.top.* (cross-origin risk).
  const winW = (window.outerWidth || window.innerWidth || 1280);
  const winH = (window.outerHeight || window.innerHeight || 800);
  const screenX = (window.screenX !== undefined ? window.screenX : window.screenLeft || 0);
  const screenY = (window.screenY !== undefined ? window.screenY : window.screenTop || 0);

  const left = Math.max(0, screenX + Math.round((winW - w) / 2));
  const top  = Math.max(0, screenY + Math.round((winH - h) / 2));

  const features = [
    'popup=yes',
    'toolbar=0',
    'location=0',
    'status=0',
    'menubar=0',
    'scrollbars=1',
    'resizable=1',
    `width=${w}`,
    `height=${h}`,
    `left=${left}`,
    `top=${top}`,
  ].join(',');

  const win = window.open('', name, features);
  if (!win) throw new Error('Popup blocked. Please allow popups and try again.');
  
  // Minimal waiting UI in popup (same-origin blank doc)
  try {
    win.document.title = 'Connecting…';
    win.document.body.innerHTML = '<div style="font:14px system-ui;padding:12px">Opening consent…</div>';
  } catch {
    // If cross-origin blank document, ignore.
  }
  return win;
}

export function navigatePopup(win: Window, url: string) {
  try { 
    win.location.href = url; 
  } catch { 
    // ignore cross-origin errors
  }
}

export function waitForMessage<T = unknown>(
  predicate: (e: MessageEvent) => boolean,
  timeoutMs = 120_000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => {
      window.removeEventListener('message', onMsg);
      try { winRef?.close?.(); } catch {}
      reject(new Error('Popup timed out'));
    }, timeoutMs);

    // Keep a weak ref to close on timeout if possible
    let winRef: Window | null = null;
    function setRef(w: Window) { winRef = w; }

    function onMsg(e: MessageEvent) {
      try {
        if (predicate(e)) {
          clearTimeout(to);
          window.removeEventListener('message', onMsg);
          resolve(e.data as T);
        }
      } catch {
        // ignore
      }
    }
    window.addEventListener('message', onMsg);

    // expose a setter so callers can register popup ref
    (waitForMessage as any)._setPopupRef = setRef;
  });
}

// Helper for callers to pair the popup ref with the waiter
export function registerPopupRef(win: Window) {
  const f = (waitForMessage as any)._setPopupRef;
  if (typeof f === 'function') f(win);
}

export function openPopup(url: string, name = 'connect', w = 520, h = 700) {
  const y = window.top?.outerHeight ? Math.max(0, (window.top.outerHeight - h) / 2) : 0;
  const x = window.top?.outerWidth ? Math.max(0, (window.top.outerWidth - w) / 2) : 0;
  const features = `popup=yes,toolbar=0,location=0,status=0,menubar=0,scrollbars=1,resizable=1,width=${w},height=${h},left=${x},top=${y}`;
  const win = window.open(url, name, features);
  if (!win) throw new Error('Popup blocked. Please allow popups and try again.');
  return win;
}