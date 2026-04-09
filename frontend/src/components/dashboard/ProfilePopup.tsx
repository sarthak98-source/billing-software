/**
 * ProfilePopup — 80% width slide-in panel; saves to real API
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Save, User, Shield, LogOut, Loader2 } from 'lucide-react';

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function ProfilePopup({ isOpen, onClose, onLogout }: ProfilePopupProps) {
  const { currentUser, updateProfile } = useStore();
  const [form, setForm] = useState({
    name: '', age: '', email: '', mobile: '', shopName: '',
    gstNo: '', address: '', city: '', district: '', state: '', password: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name, age: currentUser.age, email: currentUser.email,
        mobile: currentUser.mobile, shopName: currentUser.shopName, gstNo: currentUser.gstNo,
        address: currentUser.address, city: currentUser.city,
        district: currentUser.district, state: currentUser.state, password: '',
      });
    }
  }, [currentUser]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: Record<string, string> = { ...form };
      if (!payload.password) delete payload.password;
      await updateProfile(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  if (!isOpen || !currentUser) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/30 z-40" onClick={onClose} />
      <div className="profile-slide fixed inset-y-0 left-0 w-[80%] max-w-2xl bg-card z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{currentUser.name}</h2>
              <p className="text-sm opacity-80">{currentUser.shopName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Unique ID — read only */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Your Unique Vendor ID (cannot be changed)</p>
              <p className="text-lg font-bold font-mono text-primary tracking-wider">{currentUser.uniqueId}</p>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personal Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input value={form.name} onChange={e => updateField('name', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Age</Label>
                <Input value={form.age} onChange={e => updateField('age', e.target.value)} type="number" className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={form.email} onChange={e => updateField('email', e.target.value)} type="email" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mobile</Label>
                <Input value={form.mobile} onChange={e => updateField('mobile', e.target.value)} className="h-10" />
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Shop Information</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Shop Name</Label>
                <Input value={form.shopName} onChange={e => updateField('shopName', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">GST No.</Label>
                <Input value={form.gstNo} onChange={e => updateField('gstNo', e.target.value.toUpperCase())} className="h-10 uppercase" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Input value={form.address} onChange={e => updateField('address', e.target.value)} className="h-10" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Input value={form.city} onChange={e => updateField('city', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">District</Label>
                <Input value={form.district} onChange={e => updateField('district', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State</Label>
                <Input value={form.state} onChange={e => updateField('state', e.target.value)} className="h-10" />
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Change Password (optional)</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New Password</Label>
              <Input
                value={form.password}
                onChange={e => updateField('password', e.target.value)}
                type="password"
                placeholder="Leave blank to keep current"
                className="h-10"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 h-11" disabled={saving}>
                {saving
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  : <><Save className="w-4 h-4 mr-2" />{saved ? 'Saved ✓' : 'Save Changes'}</>
                }
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="outline" onClick={onLogout} className="w-full h-10 text-destructive border-destructive/30 hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </>
  );
}
