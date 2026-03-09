import { useState } from 'react';
import { Heart, Plus, Users } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth, GoogleProfile } from '../lib/auth';
import { useAppName } from '../lib/useAppName';

type GoogleStep = 'idle' | 'couple-setup';

export default function LoginPage() {
  const { login, register, loginWithGoogle, completeGoogleSignup } = useAuth();
  const appName = useAppName();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [coupleMode, setCoupleMode] = useState<'create' | 'join' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [coupleName, setCoupleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google OAuth state
  const [googleStep, setGoogleStep] = useState<GoogleStep>('idle');
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState('');
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<GoogleProfile | null>(null);
  const [googleCoupleMode, setGoogleCoupleMode] = useState<'create' | 'join' | null>(null);
  const [googleCoupleName, setGoogleCoupleName] = useState('');
  const [googleInviteCode, setGoogleInviteCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && !coupleMode) {
      setError('Please select an option: create a new couple or join an existing one');
      return;
    }
    if (mode === 'register' && coupleMode === 'create' && !coupleName.trim()) {
      setError('Please enter a couple name');
      return;
    }
    if (mode === 'register' && coupleMode === 'join' && !inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }
    if (mode === 'register' && confirmPassword !== password) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name, {
          inviteCode: coupleMode === 'join' ? inviteCode : undefined,
          coupleName: coupleMode === 'create' ? coupleName.trim() : undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      if (result?.needsCouple) {
        setPendingGoogleIdToken(credentialResponse.credential);
        setPendingGoogleProfile(result.googleProfile);
        setGoogleCoupleName(result.googleProfile.name ? `${result.googleProfile.name}'s couple` : '');
        setGoogleStep('couple-setup');
      }
      // else: auth context sets user → app redirects automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCoupleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!googleCoupleMode) {
      setError('Please select an option: create a new couple or join an existing one');
      return;
    }
    if (googleCoupleMode === 'create' && !googleCoupleName.trim()) {
      setError('Please enter a couple name');
      return;
    }
    if (googleCoupleMode === 'join' && !googleInviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }
    setLoading(true);
    try {
      await completeGoogleSignup(pendingGoogleIdToken, {
        inviteCode: googleCoupleMode === 'join' ? googleInviteCode : undefined,
        coupleName: googleCoupleMode === 'create' ? googleCoupleName.trim() : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">{appName}</h1>
          <p className="text-text-light text-sm mt-1">Our little world 🌸</p>
        </div>

        {/* Google couple setup card */}
        {googleStep === 'couple-setup' && pendingGoogleProfile && (
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="text-center">
              {pendingGoogleProfile.picture && (
                <img src={pendingGoogleProfile.picture} alt={pendingGoogleProfile.name} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
              )}
              <h2 className="font-heading text-xl font-semibold">Welcome, {pendingGoogleProfile.name}!</h2>
              <p className="text-text-light text-sm mt-1">One more step — set up your couple</p>
            </div>

            <form onSubmit={handleGoogleCoupleComplete} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Couple</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setGoogleCoupleMode('create'); setError(''); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                      googleCoupleMode === 'create'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-text-light hover:border-primary/30'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-xs font-medium">Create new</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGoogleCoupleMode('join'); setError(''); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                      googleCoupleMode === 'join'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-text-light hover:border-primary/30'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-medium">Join existing</span>
                  </button>
                </div>
              </div>

              {googleCoupleMode === 'create' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Couple name</label>
                  <input
                    type="text"
                    value={googleCoupleName}
                    onChange={(e) => setGoogleCoupleName(e.target.value)}
                    placeholder="e.g. Hung & Nhu"
                    required
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}

              {googleCoupleMode === 'join' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Invite code</label>
                  <input
                    type="text"
                    value={googleInviteCode}
                    onChange={(e) => setGoogleInviteCode(e.target.value)}
                    placeholder="Enter code from your partner"
                    required
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}

              {error && (
                <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors mt-1"
              >
                {loading ? 'Creating...' : 'Create account'}
              </button>
            </form>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setGoogleStep('idle'); setError(''); }}
                className="text-sm text-text-light hover:underline"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Main login/register card */}
        {googleStep === 'idle' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold text-center">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>

            {/* Google Sign-In button */}
            <div className="flex justify-center" data-tour="google-signin">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed. Please try again.')}
                text={mode === 'login' ? 'signin_with' : 'signup_with'}
                shape="rectangular"
                size="large"
                width="100%"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-light">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Couple option selector */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Couple</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setCoupleMode('create'); setError(''); }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                          coupleMode === 'create'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-text-light hover:border-primary/30'
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                        <span className="text-xs font-medium">Create new</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCoupleMode('join'); setError(''); }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                          coupleMode === 'join'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-text-light hover:border-primary/30'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-xs font-medium">Join existing</span>
                      </button>
                    </div>
                  </div>

                  {coupleMode === 'create' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Couple name</label>
                      <input
                        type="text"
                        value={coupleName}
                        onChange={(e) => setCoupleName(e.target.value)}
                        placeholder="e.g. Hung & Nhu"
                        required
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  )}

                  {coupleMode === 'join' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Invite code</label>
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Enter code from your partner"
                        required
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}

              {error && (
                <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors mt-1"
              >
                {loading ? (mode === 'login' ? 'Signing in...' : 'Creating...') : (mode === 'login' ? 'Sign in' : 'Create account')}
              </button>
            </form>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setCoupleMode(null); setConfirmPassword(''); setError(''); }}
                className="text-sm text-primary hover:underline"
              >
                {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
