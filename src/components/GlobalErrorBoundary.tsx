import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[GlobalErrorBoundary] caught error:', error, errorInfo);
    
    // Log to external service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '24px'
            }}>
              ⚠️
            </div>
            
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              Application Error
            </h2>
            
            <p style={{
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Something went wrong while loading the application. This has been logged and will be investigated.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Go Home
              </button>
            </div>
            
            {isDev && this.state.error && (
              <details style={{ marginTop: '24px' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  color: '#6b7280', 
                  fontSize: '12px',
                  marginBottom: '8px'
                }}>
                  Error Details (Development)
                </summary>
                <pre style={{
                  background: '#f9fafb',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#374151',
                  overflow: 'auto',
                  maxHeight: '200px',
                  border: '1px solid #e5e7eb'
                }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}