import React, { useState } from 'react';
import { ArrowRight, Shield, Eye, RefreshCw, CheckCircle, AlertCircle, Loader2, MapPin, Activity } from 'lucide-react';

type ConnectionState = 'empty' | 'loading' | 'success' | 'error';

export const OnboardingGBP: React.FC = () => {
  const [email, setEmail] = useState('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('empty');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setConnectionState('loading');
    
    // Simulate connection process
    setTimeout(() => {
      // Simulate random success/error for demo
      const success = Math.random() > 0.3;
      setConnectionState(success ? 'success' : 'error');
    }, 3000);
  };

  const resetConnection = () => {
    setConnectionState('empty');
    setEmail('');
  };

  const renderConnectionState = () => {
    switch (connectionState) {
      case 'loading':
        return (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-blue-500/20">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
            <p className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Connecting your profile…
            </p>
            <p className="text-gray-400" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              This may take a few moments
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-emerald-500/10 to-green-600/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-emerald-500/20">
              <CheckCircle className="w-12 h-12 text-emerald-500 animate-pulse" />
            </div>
            <p className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Connected! Pulling your first patient opportunities.
            </p>
            <p className="text-gray-400 mb-12" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Your dashboard will update with live data within minutes
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-teal-500/25 transform hover:scale-105 transition-all duration-300"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Go to Dashboard
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-red-500/10 to-rose-600/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-red-500/20">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <p className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              We couldn't connect — please check your email or try again.
            </p>
            <p className="text-gray-400 mb-12" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Make sure you're using the email associated with your Google Business Profile
            </p>
            <button
              onClick={resetConnection}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-teal-500/25 transform hover:scale-105 transition-all duration-300"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Try Again
            </button>
          </div>
        );

      default:
        return (
          <div className="space-y-12">
            {/* Cinematic Visual Connection */}
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center space-x-16">
                {/* Google Business Profile Logo */}
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
                    <img 
                      src="/assets/gbp-logo.svg" 
                      alt="Google Business Profile"
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                    <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      Google Business Profile
                    </span>
                  </div>
                </div>

                {/* Pulsing Connection Line */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-1 bg-gradient-to-r from-blue-500/50 via-teal-500 to-teal-600 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-300 to-transparent opacity-75 animate-ping"></div>
                  </div>
                  <ArrowRight className="w-8 h-8 text-teal-400 animate-pulse" />
                  <div className="w-20 h-1 bg-gradient-to-r from-teal-600 via-indigo-500 to-indigo-600 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-75 animate-ping"></div>
                  </div>
                </div>

                {/* Signals Logo */}
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-br from-blue-600/20 to-indigo-700/20 rounded-3xl backdrop-blur-sm border border-blue-500/30 flex items-center justify-center shadow-2xl">
                    <img 
                      src="/assets/signals-logo.svg" 
                      alt="Signals"
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                    <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      Signals
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Form */}
            <form onSubmit={handleConnect} className="space-y-8 max-w-md mx-auto">
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your Google Business Profile email"
                  className={`w-full px-8 py-6 bg-white/5 backdrop-blur-sm border rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-white placeholder-gray-400 text-lg transition-all duration-300 ${
                    connectionState === 'error' ? 'border-red-500/50 ring-2 ring-red-500/25' : 'border-white/20 hover:border-white/30'
                  }`}
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  required
                />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-blue-500/5 rounded-2xl pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <button
                type="submit"
                disabled={!email.trim() || connectionState === 'loading'}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-8 py-6 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-teal-500/25 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none flex items-center justify-center space-x-3 relative overflow-hidden group"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Connect My GBP</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </button>

              {connectionState === 'error' && (
                <p className="text-red-400 text-sm text-center animate-fade-in" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  We couldn't connect — please check your email or try again.
                </p>
              )}
            </form>

            {/* Trust Chips */}
            <div className="flex items-center justify-center space-x-6 pt-4">
              <div 
                className="flex items-center space-x-3 text-sm text-gray-400 cursor-help relative group"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-green-500/20">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Secure connection</span>
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-6 py-3 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-xl whitespace-nowrap z-10 shadow-2xl border border-white/10 animate-fade-in">
                    Signals only reads your data. No edits are ever made to your GBP.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/90"></div>
                  </div>
                )}
              </div>
              
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-blue-500/20">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Read-only access</span>
              </div>
              
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-purple-500/20">
                  <RefreshCw className="w-5 h-5 text-purple-400" />
                </div>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Updated in real time</span>
              </div>
            </div>

            {/* Empty State Message */}
            {connectionState === 'empty' && (
              <div className="mt-12 p-6 bg-blue-500/5 backdrop-blur-sm rounded-2xl border border-blue-500/20 max-w-2xl mx-auto">
                <p className="text-sm text-blue-300 text-center" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  <span className="font-semibold">No GBP connected yet</span> → Connect now to unlock patient journey insights.
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/30 relative overflow-hidden">
      {/* Cinematic Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Main Content - 3 columns */}
            <div className="lg:col-span-3">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-12 lg:p-20 relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-blue-500/5 pointer-events-none"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="text-center mb-16">
                    <h1 className="text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#FFFFFF' }}>
                      Connect Your Google Business Profile
                    </h1>
                    <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      See patient opportunities flow into your dashboard instantly.
                    </p>
                  </div>

                  {/* Connection State Content */}
                  {renderConnectionState()}
                </div>
              </div>
            </div>

            {/* Helper Sidebar - 1 column */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 sticky top-8 relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      Why GBP?
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      Most patients find practices on Google. By connecting, you'll see leads and consults tracked automatically.
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-green-500/20">
                        <Activity className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Track New Patients</h4>
                        <p className="text-sm text-gray-400" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>See exactly how patients discover your practice</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-blue-500/20">
                        <Shield className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Monitor Reviews</h4>
                        <p className="text-sm text-gray-400" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Get alerts for new reviews and response opportunities</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-purple-500/20">
                        <RefreshCw className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Growth Insights</h4>
                        <p className="text-sm text-gray-400" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>AI-powered recommendations to increase visibility</p>
                      </div>
                    </div>
                  </div>

                  {/* Trust Badge */}
                  <div className="mt-10 p-6 bg-gradient-to-br from-gray-800/20 to-slate-800/20 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Enterprise Security</span>
                    </div>
                    <p className="text-sm text-gray-400" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      Bank-level encryption. Your data never leaves our secure servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};