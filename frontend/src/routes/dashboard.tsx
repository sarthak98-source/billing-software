import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { InventorySection } from '@/components/dashboard/InventorySection';
import { BillingSection } from '@/components/dashboard/BillingSection';
import { ProfilePopup } from '@/components/dashboard/ProfilePopup';
import { Footer } from '@/components/layout/Footer';
import { User, FileText, Download } from 'lucide-react';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function getExportUrl(): string {
  const token = localStorage.getItem('billcraft_token') || '';
  return `/api/bills/export?auth=${token}`;
}

function Dashboard() {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!currentUser) navigate({ to: '/' });
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const handleLogout = () => { logout(); navigate({ to: '/' }); };

  const handleExport = () => {
    const token = localStorage.getItem('billcraft_token') || '';
    fetch('/api/bills/export', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.blob())
      .then(blob => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = `BillCraft_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Export failed. Make sure the backend is running.'));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-sm font-medium opacity-70">BillCraft</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Export to Excel button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium hidden sm:block">{currentUser.name}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 space-y-6">
        <div className="text-center py-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            {currentUser.shopName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentUser.address && `${currentUser.address}, `}
            {currentUser.city}
            {currentUser.district && `, ${currentUser.district}`}
          </p>
        </div>

        <StatsCards />
        <InventorySection />

        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">✨ Create Your Bill</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <BillingSection />
      </main>

      <Footer />

      <ProfilePopup
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onLogout={handleLogout}
      />
    </div>
  );
}
