/**
 * InventorySection — product inventory with full API-backed CRUD
 */
import { useState, type FormEvent } from 'react';
import { useStore } from '@/lib/store';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit2, X, Check, Package, Loader2 } from 'lucide-react';

export function InventorySection() {
  const { products, productsLoading, addProduct, updateProduct, deleteProduct } = useStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [saving, setSaving]           = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', quantity: '', unit: 'pcs', hsn: '',
  });
  const [editForm, setEditForm] = useState({
    name: '', price: '', quantity: '', unit: '', hsn: '',
  });

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.quantity) return;
    setSaving(true);
    try {
      await addProduct({
        name:     newProduct.name,
        price:    parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity),
        unit:     newProduct.unit,
        hsn:      newProduct.hsn,
      });
      setNewProduct({ name: '', price: '', quantity: '', unit: 'pcs', hsn: '' });
      setShowAddForm(false);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name, price: String(product.price),
      quantity: String(product.quantity), unit: product.unit, hsn: product.hsn,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateProduct(editingId, {
        name:     editForm.name,
        price:    parseFloat(editForm.price),
        quantity: parseInt(editForm.quantity),
        unit:     editForm.unit,
        hsn:      editForm.hsn,
      });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct(id);
  };

  return (
    <div className="bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Inventory</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {products.length} items
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-9 w-48 text-sm"
          />
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="h-9"
            variant={showAddForm ? 'secondary' : 'default'}
          >
            {showAddForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showAddForm ? 'Cancel' : 'Add Product'}
          </Button>
        </div>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="p-4 bg-muted/50 border-b border-border">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Product Name *</label>
              <Input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="Product name" className="h-9" />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Price *</label>
              <Input value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="₹0" type="number" className="h-9" />
            </div>
            <div className="w-20 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Qty *</label>
              <Input value={newProduct.quantity} onChange={e => setNewProduct(p => ({ ...p, quantity: e.target.value }))} placeholder="0" type="number" className="h-9" />
            </div>
            <div className="w-20 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Unit</label>
              <select value={newProduct.unit} onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="ltr">ltr</option>
                <option value="mtr">mtr</option>
                <option value="box">box</option>
              </select>
            </div>
            <div className="w-28 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">HSN Code</label>
              <Input value={newProduct.hsn} onChange={e => setNewProduct(p => ({ ...p, hsn: e.target.value }))} placeholder="HSN" className="h-9" />
            </div>
            <Button type="submit" size="sm" className="h-9 px-4" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Add</>}
            </Button>
          </div>
        </form>
      )}

      {/* Products Table */}
      <div className="inventory-scroll overflow-y-auto" style={{ maxHeight: '420px' }}>
        {productsLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading products...
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-primary text-primary-foreground z-10">
              <tr>
                <th className="text-left text-xs font-semibold px-4 py-2.5 w-12">#</th>
                <th className="text-left text-xs font-semibold px-4 py-2.5">Product Name</th>
                <th className="text-left text-xs font-semibold px-4 py-2.5 w-20">HSN</th>
                <th className="text-right text-xs font-semibold px-4 py-2.5 w-24">Price</th>
                <th className="text-right text-xs font-semibold px-4 py-2.5 w-20">Qty</th>
                <th className="text-center text-xs font-semibold px-4 py-2.5 w-16">Unit</th>
                <th className="text-center text-xs font-semibold px-4 py-2.5 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    {products.length === 0 ? 'No products yet. Add your first product above!' : 'No products match your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((product, idx) => (
                  <tr key={product.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                    {editingId === product.id ? (
                      <>
                        <td className="px-4 py-2 text-sm text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-2"><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-sm" /></td>
                        <td className="px-4 py-2"><Input value={editForm.hsn} onChange={e => setEditForm(f => ({ ...f, hsn: e.target.value }))} className="h-8 text-sm" /></td>
                        <td className="px-4 py-2"><Input value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} type="number" className="h-8 text-sm text-right" /></td>
                        <td className="px-4 py-2"><Input value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))} type="number" className="h-8 text-sm text-right" /></td>
                        <td className="px-4 py-2 text-center">
                          <select value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))} className="h-8 rounded border border-input bg-background px-1 text-xs">
                            <option value="pcs">pcs</option><option value="kg">kg</option>
                            <option value="ltr">ltr</option><option value="mtr">mtr</option><option value="box">box</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={saveEdit} disabled={saving} className="p-1 text-success hover:bg-success/10 rounded">
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><X className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-foreground">{product.name}</td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{product.hsn || '-'}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-medium">₹{product.price.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-sm text-right">{product.quantity}</td>
                        <td className="px-4 py-2.5 text-sm text-center text-muted-foreground">{product.unit}</td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => startEdit(product)} className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(product.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
