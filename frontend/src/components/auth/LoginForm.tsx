/**
 * LoginForm — authenticates vendor using Unique ID + Password via real API
 */
import { useState, type FormEvent } from 'react';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void;
}

export function LoginForm({ onSwitchToRegister, onLoginSuccess }: LoginFormProps) {
  const { login, authLoading } = useStore();
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!uniqueId.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    const result = await login(uniqueId.trim(), password);
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Please enter the correct credentials.');
    }
  };

  return (
    <div className="auth-card w-full max-w-md mx-auto">
      <div className="bg-card rounded-xl shadow-lg border border-border p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
          <p className="text-muted-foreground mt-1 text-sm">Login with your Unique Vendor ID</p>
        </div>

        {error && (
          <div className="toast-animate flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg p-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          <input type="text" name="username" autoComplete="username" className="hidden" tabIndex={-1} />
          <input type="password" name="password" autoComplete="new-password" className="hidden" tabIndex={-1} />
          <div className="space-y-2">
            <Label htmlFor="uniqueId" className="text-sm font-medium">Unique Vendor ID</Label>
            <Input
              id="uniqueId"
              name="uniqueId"
              placeholder="VND-XXXXXX"
              value={uniqueId}
              onChange={e => setUniqueId(e.target.value)}
              className="h-11 uppercase tracking-wider font-mono"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <div className="relative">
                <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-11 pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={authLoading}>
            {authLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{' '}
          <button onClick={onSwitchToRegister} className="text-primary font-semibold hover:underline">
            Register Now
          </button>
        </p>
      </div>
    </div>
  );
}
