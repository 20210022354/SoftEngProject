import { useEffect, useState } from "react";
// Ensure ReportHistory is imported from storage
import { StorageService, ReportHistory } from "@/lib/storage";
import { Product, StockTransaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileDown,
  Calendar,
  BarChart3,
  History,
  Search,
  Eye,
  CheckCircle2,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
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
  const [activeTab, setActiveTab] = useState<"reports" | "history">("reports");
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

  // History States
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportHistory | null>(
    null
  );

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Chart Filters
  const [chartRange, setChartRange] = useState("7");
  const [chartMetric, setChartMetric] = useState("count");

  // ✅ UPDATED: Async Data Loading
  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedProducts = await StorageService.getProducts();
        const fetchedTransactions = await StorageService.getTransactions();
        setProducts(fetchedProducts);
        setTransactions(fetchedTransactions);
        await loadHistory();
      } catch (error) {
        console.error("Error loading report data:", error);
        toast.error("Failed to load report data");
      }
    };
    loadData();
  }, []);

  // ✅ UPDATED: Async History Loading
  const loadHistory = async () => {
    try {
      const history = await StorageService.getReportHistory();
      setReportHistory(history);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [historySearch, historyDateFilter]);

  // --- Chart Data Logic ---
  const getChartData = () => {
    const days = parseInt(chartRange);
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toDateString();
      const label = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      const dayTxs = transactions.filter(
        (t) => new Date(t.transactionDate).toDateString() === dateKey
      );

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
  const maxChartValue = Math.max(...chartData.map((d) => d.total), 1);

  // --- Report Generation Functions ---
  
  // ✅ UPDATED: Async Save and Download
  const saveAndDownload = async (data: any[], title: string) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const user = StorageService.getCurrentUser();
      
      const historyItem: ReportHistory = {
        id: Date.now().toString(),
        title,
        generatedDate: new Date().toISOString(),
        generatedBy: user?.fullName || "Unknown User",
        recordCount: data.length,
        status: "Completed",
        data: data,
      };

      // 1. Save to Database First
      await StorageService.addReportHistory(historyItem);
      
      // 2. Refresh the History List
      await loadHistory();

      // 3. Generate CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map((row) => headers.map((header) => row[header]).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Report generated and saved to history");
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Failed to save report history");
    }
  };

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
    saveAndDownload(report, "Inventory Report");
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
    saveAndDownload(report, "Low Stock Report");
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
    saveAndDownload(report, "Transaction History Report");
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
    saveAndDownload(report, "Inventory Valuation Report");
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

  // Filter History Logic
  const filteredHistory = reportHistory.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.generatedBy.toLowerCase().includes(historySearch.toLowerCase());

    let matchesDate = true;
    if (historyDateFilter) {
      const itemDate = new Date(item.generatedDate).toISOString().split("T")[0];
      matchesDate = itemDate === historyDateFilter;
    }

    return matchesSearch && matchesDate;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentHistoryItems = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate, export, and review inventory reports
          </p>
        </div>
        <div className="flex bg-secondary p-1 rounded-lg border border-primary/20">
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "reports"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Generate Reports
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History size={16} />
            History
          </button>
        </div>
      </div>

      {activeTab === "reports" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {products.filter((p) => p.status === "Active").length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Active items
                </p>
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
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">
                    {transactions.length}
                  </span>
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
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

          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">
                      Analytics Overview
                    </CardTitle>
                    <CardDescription>
                      Visualizing stock movements over time
                    </CardDescription>
                  </div>
                </div>

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
              <div className="flex justify-end gap-4 text-xs text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                  Stock In
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>Stock
                  Out
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  Adjustments
                </div>
              </div>

              <div className="h-64 w-full flex items-end justify-between gap-1 md:gap-2 pt-4 pb-2">
                {chartData.map((data, index) => {
                  const totalPercent = Math.max(
                    (data.total / maxChartValue) * 100,
                    1
                  );
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
                        <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                      </div>

                      <div
                        className="w-full max-w-[30px] flex flex-col-reverse rounded-t-sm overflow-hidden bg-secondary/30 relative"
                        style={{ height: `${totalPercent}%` }}
                      >
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

                      <span className="text-[10px] text-muted-foreground mt-2 rotate-0 md:rotate-0 truncate w-full text-center">
                        {data.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

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
                    <p className="text-sm text-muted-foreground">
                      Active Products
                    </p>
                    <p className="text-2xl font-bold">
                      {products.filter((p) => p.status === "Active").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Low Stock Items
                    </p>
                    <p className="text-2xl font-bold text-destructive">
                      {
                        products.filter((p) => p.quantity <= p.reorderLevel)
                          .length
                      }
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
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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
      )}

      {activeTab === "history" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Generated Reports
                </CardTitle>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search history..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="pl-10 bg-secondary border-primary/20"
                    />
                  </div>
                  <div className="relative w-full md:w-40">
                    <Input
                      type="date"
                      value={historyDateFilter}
                      onChange={(e) => setHistoryDateFilter(e.target.value)}
                      className="bg-secondary border-primary/20"
                    />
                    {historyDateFilter && (
                      <button
                        onClick={() => setHistoryDateFilter("")}
                        className="absolute right-8 top-2.5 text-muted-foreground hover:text-destructive"
                        title="Clear Date"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredHistory.length > 0 ? (
                <div className="rounded-md border border-border bg-secondary/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr className="text-left">
                          <th className="p-4 font-medium">Report Title</th>
                          <th className="p-4 font-medium">Generated Date</th>
                          <th className="p-4 font-medium">Generated By</th>
                          <th className="p-4 font-medium text-center">
                            Records
                          </th>
                          <th className="p-4 font-medium text-center">
                            Status
                          </th>
                          <th className="p-4 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {currentHistoryItems.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <td className="p-4 font-medium">{item.title}</td>
                            <td className="p-4">
                              {new Date(item.generatedDate).toLocaleString()}
                            </td>
                            <td className="p-4">{item.generatedBy}</td>
                            <td className="p-4 text-center">
                              {item.recordCount}
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                                <CheckCircle2 size={12} />
                                {item.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setSelectedReport(item)}
                              >
                                <Eye
                                  size={16}
                                  className="text-muted-foreground hover:text-primary"
                                />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Showing {startIndex + 1}-
                        {Math.min(
                          startIndex + itemsPerPage,
                          filteredHistory.length
                        )}{" "}
                        of {filteredHistory.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex gap-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "ghost"
                              }
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="mx-auto h-12 w-12 opacity-20 mb-3" />
                  <p>No report history found matching criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-card border-primary/20">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedReport?.title}
            </DialogTitle>
            <DialogDescription className="flex gap-4 pt-1">
              <span>
                {new Date(selectedReport?.generatedDate || "").toLocaleString()}
              </span>
              <span>•</span>
              <span>{selectedReport?.recordCount} Records</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto -mx-6 px-6">
            {selectedReport && selectedReport.data.length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-secondary border-b border-border z-10">
                  <tr>
                    {Object.keys(selectedReport.data[0]).map((key) => (
                      <th
                        key={key}
                        className="p-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedReport.data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      {Object.values(row).map((val: any, i) => (
                        <td
                          key={i}
                          className="p-3 text-foreground whitespace-nowrap"
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No data available for preview
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Close
            </Button>
            <Button
              className="bg-gradient-red"
              onClick={() => {
                if (selectedReport) {
                  const headers = Object.keys(selectedReport.data[0]);
                  const csvContent = [
                    headers.join(","),
                    ...selectedReport.data.map((row) =>
                      headers.map((header) => row[header]).join(",")
                    ),
                  ].join("\n");

                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${selectedReport.title}_REPRINT.csv`;
                  link.click();
                  window.URL.revokeObjectURL(url);
                  toast.success("Report re-downloaded");
                }
              }}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
