/**
 * RegisterForm — registers a new vendor via real API
 */
import { useState, type FormEvent } from 'react';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserPlus, AlertCircle, CheckCircle, Copy, Check } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register } = useStore();
  const [form, setForm] = useState({
    name: '', age: '', email: '', mobile: '', shopName: '',
    gstNo: '', address: '', city: '', district: '', state: '',
    password: '', confirmPassword: '',
  });
  const [error, setError]           = useState('');
  const [generatedId, setGeneratedId] = useState('');
  const [loading, setLoading]       = useState(false);
  const [copied, setCopied]         = useState(false);

  const updateField = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.mobile || !form.shopName || !form.password) {
      setError('Please fill all required fields.'); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Please enter a valid email address.'); return;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      setError('Please enter a valid 10-digit mobile number.'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.'); return;
    }

    setLoading(true);
    const result = await register({
      name: form.name, age: form.age, email: form.email,
      mobile: form.mobile, shopName: form.shopName, gstNo: form.gstNo,
      address: form.address, city: form.city, district: form.district,
      state: form.state, password: form.password,
    });
    setLoading(false);

    if (result.success && result.uniqueId) {
      setGeneratedId(result.uniqueId);
    } else {
      setError(result.error || 'Registration failed.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Success Screen ── */
  if (generatedId) {
    return (
      <div className="auth-card w-full max-w-md mx-auto">
        <div className="bg-card rounded-xl shadow-lg border border-border p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Registration Successful!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your unique Vendor ID has been generated. Save it — you&apos;ll need it to login.
          </p>
          <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4 mb-6">
            <p className="text-xs text-muted-foreground mb-1">Your Unique Vendor ID</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-bold font-mono text-primary tracking-widest">{generatedId}</span>
              <button onClick={handleCopy} className="text-primary hover:text-primary/80 transition-colors">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-destructive font-medium mb-6">
            ⚠️ Please save this ID. You will need it to login. It cannot be recovered.
          </p>
          <Button onClick={onSwitchToLogin} className="w-full h-11">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  /* ── Registration Form ── */
  return (
    <div className="auth-card w-full max-w-lg mx-auto">
      <div className="bg-card rounded-xl shadow-lg border border-border p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-accent-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Register Your Shop</h2>
          <p className="text-muted-foreground mt-1 text-sm">Fill in your details to get started</p>
        </div>

        {error && (
          <div className="toast-animate flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg p-3 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Name *</Label>
              <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="John Doe" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Age</Label>
              <Input value={form.age} onChange={e => updateField('age', e.target.value)} placeholder="25" type="number" className="h-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email *</Label>
              <Input value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="john@email.com" type="email" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Mobile No. *</Label>
              <Input value={form.mobile} onChange={e => updateField('mobile', e.target.value)} placeholder="9876543210" className="h-10" maxLength={10} />
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Shop Details</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Shop Name *</Label>
              <Input value={form.shopName} onChange={e => updateField('shopName', e.target.value)} placeholder="My Shop" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">GST No.</Label>
              <Input value={form.gstNo} onChange={e => updateField('gstNo', e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" className="h-10 uppercase" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Address</Label>
            <Input value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="123, Main Street" className="h-10" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">City</Label>
              <Input value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="City" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">District</Label>
              <Input value={form.district} onChange={e => updateField('district', e.target.value)} placeholder="District" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">State</Label>
              <Input value={form.state} onChange={e => updateField('state', e.target.value)} placeholder="State" className="h-10" />
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Set Password</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Password *</Label>
              <Input value={form.password} onChange={e => updateField('password', e.target.value)} type="password" placeholder="Min 6 characters" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Confirm Password *</Label>
              <Input value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} type="password" placeholder="Re-enter password" className="h-10" />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-base font-semibold mt-2" disabled={loading}>
            {loading ? 'Registering...' : 'Register & Get Vendor ID'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already registered?{' '}
          <button onClick={onSwitchToLogin} className="text-primary font-semibold hover:underline">
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
