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
import { FileDown, Calendar } from "lucide-react";
import { toast } from "sonner";

const Reports = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, txs] = await Promise.all([
          StorageService.getProducts(),
          StorageService.getTransactions()
        ]);
        setProducts(prods);
        setTransactions(txs);
      } catch (error) {
        toast.error("Failed to load report data");
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const generateInventoryReport = () => {
    const report = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.categoryName,
      Quantity: p.quantity,
      Unit: p.unit,
      "Unit Cost": p.unitCost,
      "Selling Price": p.sellingPrice,
      "Total Value": (p.quantity * p.unitCost).toFixed(2),
      "Reorder Level": p.reorderLevel,
      Location: p.location,
      Status: p.status,
    }));

    downloadCSV(report, "inventory_report");
  };

  const generateLowStockReport = () => {
    const lowStock = products.filter(
      (p) => p.quantity <= p.reorderLevel && p.status === "Active"
    );
    const report = lowStock.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.categoryName,
      "Current Quantity": p.quantity,
      "Reorder Level": p.reorderLevel,
      "Units Below Reorder": p.reorderLevel - p.quantity,
      Location: p.location,
      Supplier: p.supplier || "N/A",
    }));

    downloadCSV(report, "low_stock_report");
  };

  const generateTransactionReport = () => {
    const report = transactions.map((tx) => ({
      Date: new Date(tx.transactionDate).toLocaleString(),
      Product: tx.productName,
      Type: tx.transactionType,
      Quantity: tx.quantity,
      User: tx.userName,
      Reason: tx.reason || "N/A",
    }));

    downloadCSV(report, "transaction_report");
  };

  const generateValuationReport = () => {
    const report = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.categoryName,
      Quantity: p.quantity,
      "Unit Cost": p.unitCost.toFixed(2),
      "Stock Value": (p.quantity * p.unitCost).toFixed(2),
      "Potential Revenue": (p.quantity * p.sellingPrice).toFixed(2),
      "Potential Profit": (p.quantity * (p.sellingPrice - p.unitCost)).toFixed(
        2
      ),
    }));

    const totalValue = products.reduce(
      (sum, p) => sum + p.quantity * p.unitCost,
      0
    );
    const totalRevenue = products.reduce(
      (sum, p) => sum + p.quantity * p.sellingPrice,
      0
    );
    const totalProfit = totalRevenue - totalValue;

    report.push({
      SKU: "TOTAL",
      Name: "",
      Category: "",
      Quantity: 0 as any,
      "Unit Cost": "",
      "Stock Value": totalValue.toFixed(2),
      "Potential Revenue": totalRevenue.toFixed(2),
      "Potential Profit": totalProfit.toFixed(2),
    });

    downloadCSV(report, "valuation_report");
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => row[header]).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success("Report downloaded successfully");
  };

  const reports = [
    {
      title: "Complete Inventory Report",
      description: "Full list of all products with stock levels and valuations",
      action: generateInventoryReport,
      icon: FileDown,
    },
    {
      title: "Low Stock Alert Report",
      description: "Products that need reordering based on reorder levels",
      action: generateLowStockReport,
      icon: FileDown,
    },
    {
      title: "Transaction History Report",
      description: "Complete log of all stock movements and adjustments",
      action: generateTransactionReport,
      icon: FileDown,
    },
    {
      title: "Inventory Valuation Report",
      description: "Stock value, potential revenue, and profit analysis",
      action: generateValuationReport,
      icon: FileDown,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Generate and export inventory reports
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {products.filter((p) => p.status === "Active").length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Active items</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ₱
              {products
                .reduce((sum, p) => sum + p.quantity * p.unitCost, 0)
                .toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Current inventory value
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{transactions.length}</p>
            <p className="text-sm text-muted-foreground mt-1">
              All time movements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, index) => (
          <Card
            key={index}
            className="border-primary/20 hover:shadow-card transition-all"
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <report.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {report.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={report.action}
                className="w-full bg-gradient-red glow-red"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* End of Day Report */}
      <Card className="border-primary/20 shadow-glow-red">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>End of Day Report</CardTitle>
              <CardDescription>
                Complete daily snapshot of inventory status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold">
                  {products.filter((p) => p.status === "Active").length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-destructive">
                  {products.filter((p) => p.quantity <= p.reorderLevel).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Today's Transactions
                </p>
                <p className="text-2xl font-bold">
                  {
                    transactions.filter(
                      (tx) =>
                        new Date(tx.transactionDate).toDateString() ===
                        new Date().toDateString()
                    ).length
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-lg md:text-2xl font-bold break-all">
                  ₱
                  {products
                    .reduce((sum, p) => sum + p.quantity * p.unitCost, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                generateInventoryReport();
                generateLowStockReport();
                toast.success("End of Day reports generated");
              }}
              className="w-full bg-gradient-red glow-red"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Generate End of Day Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;