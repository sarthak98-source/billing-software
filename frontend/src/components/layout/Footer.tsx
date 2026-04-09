/**
 * Footer — app footer with credits
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-8">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} BillCraft — Professional Billing Software
        </p>
        <p className="text-xs text-muted-foreground">
          Made with <span className="text-destructive">❤</span> by <span className="font-semibold text-foreground">Shela Gang</span> 🧣
        </p>
      </div>
    </footer>
  );
}
