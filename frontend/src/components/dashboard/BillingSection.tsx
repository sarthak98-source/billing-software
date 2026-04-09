/**
 * BillingSection — search products, add to bill, manage quantities, generate invoice
 * Bill is saved to backend on "Generate Invoice"
 */
import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import type { Product } from '@/lib/types';
import { generateInvoicePDF } from '@/lib/invoice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search, Plus, Minus, Trash2, FileText,
  AlertCircle, X, ShoppingCart, Loader2, Download,
} from 'lucide-react';

export function BillingSection() {
  const {
    products, currentBillItems, addToBill, removeFromBill,
    updateBillItemQty, clearBill, saveBill, currentUser,
  } = useStore();

  const [searchTerm, setSearchTerm]         = useState('');
  const [showDropdown, setShowDropdown]     = useState(false);
  const [toast, setToast]                   = useState('');
  const [customerName, setCustomerName]     = useState('');
  const [customerPhone, setCustomerPhone]   = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [cgst, setCgst]                     = useState('9');
  const [sgst, setSgst]                     = useState('9');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [generating, setGenerating]         = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = searchTerm.trim()
    ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAddProduct = (product: Product) => {
    const result = addToBill(product, 1);
    if (!result.success) showToast(result.error || 'Already added');
    setSearchTerm('');
    setShowDropdown(false);
  };

  const subTotal   = currentBillItems.reduce((sum, item) => sum + item.amount, 0);
  const cgstAmount = subTotal * parseFloat(cgst || '0') / 100;
  const sgstAmount = subTotal * parseFloat(sgst || '0') / 100;
  const grandTotal = subTotal + cgstAmount + sgstAmount;

  const handleGenerateBill = async () => {
    if (currentBillItems.length === 0) {
      showToast('Please add products to the bill first.');
      return;
    }
    if (!currentUser) return;
    setGenerating(true);
    try {
      const bill = await saveBill(
        customerName, customerPhone, customerAddress,
        parseFloat(cgst || '0'), parseFloat(sgst || '0'),
      );
      generateInvoicePDF(bill, currentUser);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      showToast('Invoice generated and downloaded!');
    } catch {
      showToast('Failed to save bill. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-bold text-foreground">Make Your Bill</h3>
        </div>
        {currentBillItems.length > 0 && (
          <Button
            variant="outline" size="sm"
            onClick={() => setShowClearConfirm(true)}
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Bill
          </Button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-animate mx-4 mt-3 flex items-center gap-2 bg-primary/10 text-primary rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div className="mx-4 mt-3 flex items-center justify-between bg-warning/10 border border-warning/30 rounded-lg p-3">
          <p className="text-sm text-foreground">Are you sure you want to clear the current bill?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={() => { clearBill(); setShowClearConfirm(false); }}>Yes, Clear</Button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div ref={searchRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products to add to bill..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              className="pl-10 h-11"
            />
          </div>
          {showDropdown && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
              {filtered.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors text-sm text-left"
                >
                  <span className="font-medium text-foreground">{product.name}</span>
                  <span className="text-muted-foreground">₹{product.price.toFixed(2)} / {product.unit}</span>
                </button>
              ))}
            </div>
          )}
          {showDropdown && searchTerm.trim() && filtered.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 p-4 text-center text-sm text-muted-foreground">
              No products found. Add them to inventory first.
            </div>
          )}
        </div>

        {/* Bill Items */}
        {currentBillItems.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left text-xs font-semibold px-4 py-2 w-10">#</th>
                  <th className="text-left text-xs font-semibold px-4 py-2">Product</th>
                  <th className="text-center text-xs font-semibold px-4 py-2 w-28">Quantity</th>
                  <th className="text-right text-xs font-semibold px-4 py-2 w-24">Rate</th>
                  <th className="text-right text-xs font-semibold px-4 py-2 w-28">Amount</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {currentBillItems.map((item, idx) => (
                  <tr key={item.productId} className="border-t border-border/50">
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium">{item.name}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => item.quantity > 1 && updateBillItemQty(item.productId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateBillItemQty(item.productId, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 h-7 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min={1}
                        />
                        <button
                          onClick={() => updateBillItemQty(item.productId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right">₹{item.rate.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-semibold">₹{item.amount.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => removeFromBill(item.productId)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Customer + Totals */}
        {currentBillItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Customer Details</p>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer Name" className="h-9" />
              <div className="grid grid-cols-2 gap-3">
                <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone Number" className="h-9" />
                <Input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Address" className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">CGST %</label>
                  <Input value={cgst} onChange={e => setCgst(e.target.value)} type="number" className="h-9" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">SGST %</label>
                  <Input value={sgst} onChange={e => setSgst(e.target.value)} type="number" className="h-9" />
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sub Total</span>
                <span className="font-medium">₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CGST ({cgst || 0}%)</span>
                <span>₹{cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SGST ({sgst || 0}%)</span>
                <span>₹{sgstAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between">
                <span className="text-base font-bold text-foreground">Grand Total</span>
                <span className="text-base font-bold text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>

              <Button
                onClick={handleGenerateBill}
                disabled={generating}
                className="w-full h-11 mt-3 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {generating
                  ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                  : <><FileText className="w-5 h-5 mr-2" /> Generate Invoice</>
                }
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {currentBillItems.length === 0 && (
          <div className="text-center py-8">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Search and select products above to start billing</p>
          </div>
        )}
      </div>
    </div>
  );
}
