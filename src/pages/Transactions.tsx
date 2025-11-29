import { useEffect, useState } from "react";
import { StorageService } from "@/lib/storage";
import { Product, StockTransaction } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowDown, ArrowUp, Settings, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const Transactions = () => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Dialog & Form States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<StockTransaction | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // ✅ ASYNC: Load both lists in parallel
      const [txs, prods] = await Promise.all([
        StorageService.getTransactions(),
        StorageService.getProducts(),
      ]);

      // Enrich transactions with product names (in case product name changed)
      const enrichedTxs = txs.map((tx) => ({
        ...tx,
        productName:
          prods.find((p) => p.id === tx.productId)?.name || "Unknown Product",
      }));

      // Sort by newest first? usually nice for transactions
      // setTransactions(enrichedTxs.reverse()); 
      // Note: StorageService.getTransactions already sorts by date, 
      // but if you want visual reverse order (newest top), ensure it here.
      setTransactions(enrichedTxs);
      setProducts(prods);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load transaction data");
    }
  };

  const openNewTransaction = () => {
    setEditingTransaction(null);
    setReasonInput("");
    setIsDialogOpen(true);
  };

  const openEditTransaction = (tx: StockTransaction) => {
    setEditingTransaction(tx);
    setReasonInput(tx.reason || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (tx: StockTransaction) => {
    if (
      !confirm(
        "Are you sure? This will reverse the stock adjustment for this product."
      )
    )
      return;

    try {
      // 1. Revert Stock
      const product = products.find((p) => p.id === tx.productId);
      if (product) {
        // Subtracting the transaction quantity reverses the action.
        // If it was +10 (IN), we subtract 10.
        // If it was -5 (OUT), we subtract -5 (which adds 5).
        const revertedQuantity = product.quantity - tx.quantity;

        // ✅ ASYNC UPDATE
        await StorageService.updateProduct(product.id, {
          quantity: revertedQuantity,
        });
      }

      // 2. Delete Transaction from Storage
      // ✅ ASYNC DELETE
      await StorageService.deleteTransaction(tx.id);

      toast.success("Transaction deleted and stock reverted.");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete transaction");
    }
  };

  const handleTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = formData.get("productId") as string;
    const transactionType = formData.get("transactionType") as
      | "IN"
      | "OUT"
      | "ADJUSTMENT";
    const quantityInput = parseInt(formData.get("quantity") as string);
    const reason = formData.get("reason") as string;

    const product = products.find((p) => p.id === productId);
    if (!product) {
      toast.error("Product not found");
      return;
    }

    const user = StorageService.getCurrentUser();
    if (!user) {
      toast.error("User not logged in");
      return;
    }

    // Determine the signed quantity (negative for OUT)
    let signedQuantity = quantityInput;
    if (transactionType === "OUT") {
      signedQuantity = -quantityInput;
    }

    // Logic for Updating Stock
    let finalStockQuantity = product.quantity;

    try {
      if (editingTransaction) {
        // --- EDIT MODE ---
        // 1. Revert the OLD transaction first
        const oldProduct = products.find(
          (p) => p.id === editingTransaction.productId
        );
        if (oldProduct) {
          // This is a temporary calculation of what stock WOULD be if we removed the old tx
          const stockWithoutOldTx =
            oldProduct.quantity - editingTransaction.quantity;

          // 2. Apply NEW transaction
          if (oldProduct.id === productId) {
            // Same product, just update the base
            finalStockQuantity = stockWithoutOldTx;
          } else {
            // Product changed!
            // A. Revert the old product immediately
            await StorageService.updateProduct(oldProduct.id, {
              quantity: stockWithoutOldTx,
            });
            // B. Set base for new product
            finalStockQuantity = product.quantity;
          }
        }
      }

      // Apply the NEW transaction logic
      if (transactionType === "ADJUSTMENT") {
        // Calculate difference: Input - Base
        // If editing same product, Base is stockWithoutOldTx. If new, Base is product.quantity
        const baseStock =
          editingTransaction && editingTransaction.productId === productId
            ? finalStockQuantity
            : product.quantity;

        signedQuantity = quantityInput - baseStock;
        finalStockQuantity = quantityInput; // Direct set
      } else {
        // IN or OUT
        finalStockQuantity += signedQuantity;

        // Validation for OUT
        if (transactionType === "OUT" && finalStockQuantity < 0) {
          toast.error("Insufficient stock for this transaction");
          return;
        }
      }

      // Prepare Data
      const transactionData: StockTransaction = {
        id: editingTransaction ? editingTransaction.id : Date.now().toString(),
        productId,
        productName: product.name,
        userId: user.id,
        userName: user.fullName,
        transactionType,
        quantity: signedQuantity, // Store the change (+10 or -5)
        reason,
        transactionDate: editingTransaction
          ? editingTransaction.transactionDate
          : new Date().toISOString(),
      };

      // Save Transaction
      if (editingTransaction) {
        await StorageService.updateTransaction(
          transactionData.id,
          transactionData
        );
        toast.success("Transaction updated");
      } else {
        await StorageService.addTransaction(transactionData);
        toast.success(`Transaction recorded: ${transactionType}`);
      }

      // Update Product Stock
      await StorageService.updateProduct(productId, {
        quantity: finalStockQuantity,
      });

      await loadData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save transaction");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">Stock movement history</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNewTransaction}
              className="bg-gradient-red glow-red w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction
                  ? "Edit Transaction"
                  : "Record Stock Transaction"}
              </DialogTitle>
              <DialogDescription>
                {editingTransaction
                  ? "Modify details and adjust stock automatically"
                  : "Add, remove, or adjust inventory stock"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTransaction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Product *</Label>
                <Select
                  name="productId"
                  defaultValue={editingTransaction?.productId}
                  required
                >
                  <SelectTrigger className="bg-secondary border-primary/20">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Current: {product.quantity}{" "}
                        {product.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionType">Transaction Type *</Label>
                <Select
                  name="transactionType"
                  defaultValue={editingTransaction?.transactionType}
                  required
                >
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
                  defaultValue={
                    editingTransaction
                      ? Math.abs(editingTransaction.quantity)
                      : ""
                  }
                  required
                  className="bg-secondary border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="reason">Reason / Notes</Label>
                  <span
                    className={`text-xs ${
                      reasonInput.length >= 50
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {reasonInput.length}/50
                  </span>
                </div>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="e.g., Received from supplier"
                  className="bg-secondary border-primary/20 resize-none"
                  rows={3}
                  maxLength={50}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-red">
                  {editingTransaction
                    ? "Update Transaction"
                    : "Record Transaction"}
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
                  className="flex items-center gap-4 p-4 bg-secondary rounded-lg border border-border hover:border-primary/50 transition-colors group"
                >
                  <div
                    className={`p-3 rounded-lg ${
                      transaction.transactionType === "IN"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : transaction.transactionType === "OUT"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-muted/20 text-muted-foreground"
                    }`}
                  >
                    {transaction.transactionType === "IN" ? (
                      <ArrowDown className="h-5 w-5" />
                    ) : transaction.transactionType === "OUT" ? (
                      <ArrowUp className="h-5 w-5" />
                    ) : (
                      <Settings className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{transaction.productName}</p>
                      <Badge
                        className={`${
                          transaction.transactionType === "IN"
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                            : transaction.transactionType === "OUT"
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {transaction.transactionType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.transactionDate).toLocaleString()}
                      {transaction.reason && ` • ${transaction.reason}`}
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <p
                      className={`text-2xl font-bold font-mono ${
                        transaction.transactionType === "IN"
                          ? "text-emerald-500"
                          : transaction.transactionType === "OUT"
                          ? "text-red-500"
                          : "text-foreground"
                      }`}
                    >
                      {transaction.quantity >= 0 ? "+" : ""}
                      {transaction.quantity}
                    </p>

                    {/* Edit & Delete Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => openEditTransaction(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(transaction)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No transactions recorded yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;