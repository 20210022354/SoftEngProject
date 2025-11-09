import { useEffect, useState } from 'react';
import { StorageService } from '@/lib/storage';
import { Product, StockTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowDown, ArrowUp, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Transactions = () => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const txs = StorageService.getTransactions();
    const prods = StorageService.getProducts();

    // Enrich transactions with product names
    const enrichedTxs = txs.map((tx) => ({
      ...tx,
      productName: prods.find((p) => p.id === tx.productId)?.name || 'Unknown',
    }));

    setTransactions(enrichedTxs.reverse());
    setProducts(prods);
  };

  const handleTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = formData.get('productId') as string;
    const transactionType = formData.get('transactionType') as 'IN' | 'OUT' | 'ADJUSTMENT';
    const quantity = parseInt(formData.get('quantity') as string);
    const reason = formData.get('reason') as string;

    const product = products.find((p) => p.id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }

    const user = StorageService.getCurrentUser();
    if (!user) {
      toast.error('User not logged in');
      return;
    }

    // Calculate new quantity
    let newQuantity = product.quantity;
    if (transactionType === 'IN') {
      newQuantity += quantity;
    } else if (transactionType === 'OUT') {
      if (quantity > product.quantity) {
        toast.error('Insufficient stock');
        return;
      }
      newQuantity -= quantity;
    } else if (transactionType === 'ADJUSTMENT') {
      newQuantity = quantity;
    }

    // Create transaction
    const transaction: StockTransaction = {
      id: Date.now().toString(),
      productId,
      productName: product.name,
      userId: user.id,
      userName: user.fullName,
      transactionType,
      quantity: transactionType === 'OUT' ? -quantity : quantity,
      reason,
      transactionDate: new Date().toISOString(),
    };

    StorageService.addTransaction(transaction);
    StorageService.updateProduct(productId, { quantity: newQuantity });

    toast.success(`Transaction recorded: ${transactionType}`);
    loadData();
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">Stock movement history</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-red glow-red">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20">
            <DialogHeader>
              <DialogTitle>Record Stock Transaction</DialogTitle>
              <DialogDescription>Add, remove, or adjust inventory stock</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTransaction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Product *</Label>
                <Select name="productId" required>
                  <SelectTrigger className="bg-secondary border-primary/20">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Current: {product.quantity} {product.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionType">Transaction Type *</Label>
                <Select name="transactionType" required>
                  <SelectTrigger className="bg-secondary border-primary/20">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">Stock In (Receiving)</SelectItem>
                    <SelectItem value="OUT">Stock Out (Usage)</SelectItem>
                    <SelectItem value="ADJUSTMENT">Stock Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  required
                  className="bg-secondary border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason / Notes</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="e.g., Received from supplier, Used for event, Damaged goods"
                  className="bg-secondary border-primary/20"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-red">
                  Record Transaction
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions List */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All stock movements and adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-4 bg-secondary rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div
                    className={`p-3 rounded-lg ${
                      transaction.transactionType === 'IN'
                        ? 'bg-primary/20 text-primary'
                        : transaction.transactionType === 'OUT'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-muted/20 text-muted-foreground'
                    }`}
                  >
                    {transaction.transactionType === 'IN' ? (
                      <ArrowDown className="h-5 w-5" />
                    ) : transaction.transactionType === 'OUT' ? (
                      <ArrowUp className="h-5 w-5" />
                    ) : (
                      <Settings className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{transaction.productName}</p>
                      <Badge
                        variant={
                          transaction.transactionType === 'IN'
                            ? 'default'
                            : transaction.transactionType === 'OUT'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {transaction.transactionType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.transactionDate).toLocaleString()}
                      {transaction.reason && ` • ${transaction.reason}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold font-mono ${
                        transaction.quantity >= 0 ? 'text-primary' : 'text-accent'
                      }`}
                    >
                      {transaction.quantity >= 0 ? '+' : ''}
                      {transaction.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No transactions recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
