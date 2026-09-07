import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Component ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#0b0f19',
          color: '#f8fafc',
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#131b2e',
            border: '1px solid #23304c',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 16px'
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Something went wrong</h2>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.5 }}>
              An unexpected error occurred while rendering this view.
            </p>
            {this.state.error?.message && (
              <pre style={{
                backgroundColor: '#0b0f19',
                color: '#f87171',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '20px',
                border: '1px solid #23304c'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
