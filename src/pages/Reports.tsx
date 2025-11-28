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
import {
  FileDown,
  Calendar,
  BarChart3,
  ArrowDown,
  ArrowUp,
  Settings,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const Reports = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

  // Chart Filters
  const [chartRange, setChartRange] = useState("7"); // '7' or '30' days
  const [chartMetric, setChartMetric] = useState("count"); // 'count' or 'volume'

  useEffect(() => {
    setProducts(StorageService.getProducts());
    setTransactions(StorageService.getTransactions());
  }, []);

  // --- Chart Data Logic ---
  const getChartData = () => {
    const days = parseInt(chartRange);
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toDateString(); // e.g. "Mon Jan 01 2024"

      const label = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      // Filter transactions for this specific day
      const dayTxs = transactions.filter(
        (t) => new Date(t.transactionDate).toDateString() === dateKey
      );

      // Breakdown by type
      const inTxs = dayTxs.filter((t) => t.transactionType === "IN");
      const outTxs = dayTxs.filter((t) => t.transactionType === "OUT");
      const adjTxs = dayTxs.filter((t) => t.transactionType === "ADJUSTMENT");

      let valIn = 0,
        valOut = 0,
        valAdj = 0;

      if (chartMetric === "count") {
        valIn = inTxs.length;
        valOut = outTxs.length;
        valAdj = adjTxs.length;
      } else {
        // Volume: sum of absolute quantity changes
        valIn = inTxs.reduce((sum, t) => sum + Math.abs(t.quantity), 0);
        valOut = outTxs.reduce((sum, t) => sum + Math.abs(t.quantity), 0);
        valAdj = adjTxs.reduce((sum, t) => sum + Math.abs(t.quantity), 0);
      }

      const total = valIn + valOut + valAdj;

      data.push({ label, fullDate: dateKey, valIn, valOut, valAdj, total });
    }
    return data;
  };

  const chartData = getChartData();
  const maxChartValue = Math.max(...chartData.map((d) => d.total), 1); // Scale based on total stack height

  // --- Report Generation Functions ---
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

        {/* ✅ UPDATED: Transaction Summary with Breakdown */}
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold">{transactions.length}</span>
              <span className="text-sm text-muted-foreground">Total</span>
            </div>

            {/* Mini Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex flex-col items-center p-1 bg-secondary rounded border border-border">
                <span className="text-emerald-500 font-bold">
                  {
                    transactions.filter((t) => t.transactionType === "IN")
                      .length
                  }
                </span>
                <span className="text-muted-foreground">In</span>
              </div>
              <div className="flex flex-col items-center p-1 bg-secondary rounded border border-border">
                <span className="text-primary font-bold">
                  {
                    transactions.filter((t) => t.transactionType === "OUT")
                      .length
                  }
                </span>
                <span className="text-muted-foreground">Out</span>
              </div>
              <div className="flex flex-col items-center p-1 bg-secondary rounded border border-border">
                <span className="text-amber-500 font-bold">
                  {
                    transactions.filter(
                      (t) => t.transactionType === "ADJUSTMENT"
                    ).length
                  }
                </span>
                <span className="text-muted-foreground">Adj</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ UPDATED: Analytics Chart Section (Stacked Bar) */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Analytics Overview</CardTitle>
                <CardDescription>
                  Visualizing stock movements over time
                </CardDescription>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select value={chartMetric} onValueChange={setChartMetric}>
                <SelectTrigger className="w-[140px] bg-secondary border-primary/20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Transactions</SelectItem>
                  <SelectItem value="volume">Stock Volume</SelectItem>
                </SelectContent>
              </Select>

              <Select value={chartRange} onValueChange={setChartRange}>
                <SelectTrigger className="w-[130px] bg-secondary border-primary/20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex justify-end gap-4 text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-600"></div>Stock
              In
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary"></div>Stock Out
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              Adjustments
            </div>
          </div>

          <div className="h-64 w-full flex items-end justify-between gap-1 md:gap-2 pt-4 pb-2">
            {chartData.map((data, index) => {
              // Calculate Stack Heights as percentages of the MAX total value found in chart range
              // We use maxChartValue for scaling the whole bar container relative to chart height
              const totalPercent = Math.max(
                (data.total / maxChartValue) * 100,
                1
              );

              // Inner segments are proportional to the day's total
              const inPercent =
                data.total > 0 ? (data.valIn / data.total) * 100 : 0;
              const outPercent =
                data.total > 0 ? (data.valOut / data.total) * 100 : 0;
              const adjPercent =
                data.total > 0 ? (data.valAdj / data.total) * 100 : 0;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-32">
                    <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-md py-2 px-3 border border-border">
                      <p className="font-semibold mb-1 border-b border-border/50 pb-1">
                        {data.fullDate}
                      </p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <span className="text-emerald-500">In:</span>{" "}
                        <span className="font-mono text-right">
                          {data.valIn}
                        </span>
                        <span className="text-primary">Out:</span>{" "}
                        <span className="font-mono text-right">
                          {data.valOut}
                        </span>
                        <span className="text-amber-500">Adj:</span>{" "}
                        <span className="font-mono text-right">
                          {data.valAdj}
                        </span>
                        <span className="font-bold border-t border-border/50 pt-1">
                          Total:
                        </span>{" "}
                        <span className="font-bold font-mono border-t border-border/50 pt-1 text-right">
                          {data.total}
                        </span>
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                  </div>

                  {/* Stacked Bar Container */}
                  <div
                    className="w-full max-w-[30px] flex flex-col-reverse rounded-t-sm overflow-hidden bg-secondary/30 relative"
                    style={{ height: `${totalPercent}%` }}
                  >
                    {/* Segments (using flex-col-reverse so IN is bottom, OUT is mid, ADJ is top) */}
                    {inPercent > 0 && (
                      <div
                        className="w-full bg-emerald-600 transition-all hover:brightness-110"
                        style={{ height: `${inPercent}%` }}
                      ></div>
                    )}
                    {outPercent > 0 && (
                      <div
                        className="w-full bg-primary transition-all hover:brightness-110"
                        style={{ height: `${outPercent}%` }}
                      ></div>
                    )}
                    {adjPercent > 0 && (
                      <div
                        className="w-full bg-amber-500 transition-all hover:brightness-110"
                        style={{ height: `${adjPercent}%` }}
                      ></div>
                    )}
                  </div>

                  {/* X-Axis Label */}
                  <span className="text-[10px] text-muted-foreground mt-2 rotate-0 md:rotate-0 truncate w-full text-center">
                    {data.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                <p className="text-xl md:text-2xl font-bold break-all">
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
