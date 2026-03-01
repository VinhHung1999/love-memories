import { useState } from 'react';
import { Heart, Plus, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useAppName } from '../lib/useAppName';

export default function LoginPage() {
  const { login, register } = useAuth();
  const appName = useAppName();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [coupleMode, setCoupleMode] = useState<'create' | 'join' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [coupleName, setCoupleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold text-center">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>

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
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setCoupleMode(null); setError(''); }}
              className="text-sm text-primary hover:underline"
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
