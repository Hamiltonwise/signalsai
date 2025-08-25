import * as React from 'react';

export default function LazyBoundary({ children, label = 'LazyBoundary' }: { children: React.ReactNode; label?: string }) {
  return (
    <React.Suspense fallback={<div style={{padding:12}}>Loading…</div>}>
      <ErrorCatcher label={label}>{children}</ErrorCatcher>
    </React.Suspense>
  );
}

class ErrorCatcher extends React.Component<{label?: string; children: React.ReactNode}, {err?: any}> {
  state = { err: undefined as any };
  static getDerivedStateFromError(err: any) { return { err }; }
  componentDidCatch(err: any, info: any) {
    console.error(`[LazyBoundary] ${this.props.label} error:`, err, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{padding:12, color:'#b91c1c', fontFamily:'system-ui'}}>
          <div style={{fontWeight:600, marginBottom:6}}>Module failed to load</div>
          <div style={{fontSize:12, whiteSpace:'pre-wrap'}}>{String(this.state.err?.message || this.state.err)}</div>
          <div style={{fontSize:12, opacity:.8}}>Check DevTools → Network for the dynamic import URL and its Response tab.</div>
        </div>
      );
    }
    return this.props.children;
  }
}