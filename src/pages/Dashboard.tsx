import { useEffect, useState } from "react";
import { StorageService } from "@/lib/storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, AlertTriangle, DollarSign, Activity } from "lucide-react";
import { DashboardStats, Product, StockTransaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { BadgeDollarSign } from "lucide-react";
import { PesoIcon } from "@/pages/PesoIcon";

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    recentTransactions: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    StockTransaction[]
  >([]);

  useEffect(() => {
    const products = StorageService.getProducts();
    const transactions = StorageService.getTransactions();

    const lowStock = products.filter(
      (p) => p.quantity <= p.reorderLevel && p.status === "Active"
    );
    const totalValue = products.reduce(
      (sum, p) => sum + p.quantity * p.unitCost,
      0
    );
    const recent = transactions.slice(-5).reverse();

    setStats({
      totalProducts: products.filter((p) => p.status === "Active").length,
      lowStockItems: lowStock.length,
      totalValue,
      recentTransactions: transactions.length,
    });
    setLowStockProducts(lowStock);
    setRecentTransactions(recent);
  }, []);

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Active items in inventory",
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockItems,
      icon: AlertTriangle,
      description: "Items need reordering",
      alert: stats.lowStockItems > 0,
    },
    {
      title: "Inventory Value",
      value: `₱${stats.totalValue.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: PesoIcon,
      description: "Total stock value",
    },
    {
      title: "Transactions",
      value: stats.recentTransactions,
      icon: Activity,
      description: "All time transactions",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of Downtown Lounge inventory system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className={`border-primary/20 ${
              stat.alert ? "shadow-glow-red" : "hover:shadow-card"
            } transition-all`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon
                className={`h-5 w-5 ${
                  stat.alert ? "text-destructive" : "text-primary"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/50 shadow-glow-red">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>
              Items that need immediate reordering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                >
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product.sku} | Category: {product.categoryName}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="font-mono">
                      {product.quantity} {product.unit}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reorder at: {product.reorderLevel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest stock movements in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {transaction.productName || "Unknown Product"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.transactionDate).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      transaction.transactionType === "IN"
                        ? "default"
                        : transaction.transactionType === "OUT"
                        ? "secondary"
                        : "outline"
                    }
                    className="font-mono"
                  >
                    {transaction.transactionType}{" "}
                    {Math.abs(transaction.quantity)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
