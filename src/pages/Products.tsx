import { useEffect, useState } from "react";
import { StorageService} from "@/lib/storage";
import { ProductHistory } from "@/types/index";
import { Product, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Layers,
  History,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  ArrowRight,
  Folder,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import CategoryManager from "@/components/products/CategoryManager";

const Products = () => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<"products" | "history">("products");
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [historyData, setHistoryData] = useState<ProductHistory[]>([]);

  // Category Navigation State
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  // Pagination State
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog & Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<ProductHistory | null>(null);

  // --- DATA LOADING (Async preserved) ---
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      // We assume getProductHistory exists on StorageService. 
      // If it hasn't been added to storage.ts yet, this part might need adjustment.
      const [prods, cats, hist] = await Promise.all([
        StorageService.getProducts(),
        StorageService.getCategories(),
        // Safe check in case getProductHistory isn't async or implemented yet
        StorageService.getProductHistory ? StorageService.getProductHistory() : Promise.resolve([])
      ]);
      
      setProducts(prods);
      setCategories(cats);
      setHistoryData(hist);
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredProducts = products.filter((product) => {
    if (selectedCategory && product.categoryId !== selectedCategory.id) {
      return false;
    }

    const term = selectedCategory ? searchTerm : globalSearchTerm;

    const matchesSearch =
      product.name.toLowerCase().includes(term.toLowerCase()) ||
      product.sku.toLowerCase().includes(term.toLowerCase());

    return matchesSearch;
  });

  const filteredCategories = categories.filter((category) => {
    if (!selectedCategory) {
      return category.name
        .toLowerCase()
        .includes(globalSearchTerm.toLowerCase());
    }
    return true;
  });

  // History Pagination Logic
  const totalHistoryPages = Math.ceil(historyData.length / itemsPerPage);
  const startHistoryIndex = (historyPage - 1) * itemsPerPage;
  const currentHistoryItems = historyData.slice(
    startHistoryIndex,
    startHistoryIndex + itemsPerPage
  );

  // --- HANDLERS (Async preserved) ---
  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoryId = formData.get("categoryId") as string;
    const category = categories.find((c) => c.id === categoryId);

    // Extended data structure from new code
    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      categoryId,
      categoryName: category?.name,
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      unit: formData.get("unit") as string,
      unitCost: parseFloat(formData.get("unitCost") as string),
      sellingPrice: parseFloat(formData.get("sellingPrice") as string),
      quantity: parseInt(formData.get("quantity") as string),
      reorderLevel: parseInt(formData.get("reorderLevel") as string),
      expiryDate: (formData.get("expiryDate") as string) || undefined,
      location: formData.get("location") as string,
      status: formData.get("status") as "Active" | "Inactive",
      supplier: formData.get("supplier") as string,
    };

    try {
      if (editingProduct) {
        await StorageService.updateProduct(editingProduct.id, productData);
        toast.success("Product updated successfully");
      } else {
        await StorageService.addProduct(productData);
        toast.success("Product added successfully");
      }

      await loadData(); // Reload to update UI and History
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast.error("Failed to save product");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await StorageService.deleteProduct(id);
        toast.success("Product deleted");
        await loadData();
      } catch (error) {
        toast.error("Failed to delete product");
        console.error(error);
      }
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">
            Manage inventory items & history
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex bg-secondary p-1 rounded-lg border border-primary/20">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "products"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Products
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

          {/* Action Buttons (Only on Product Tab) */}
          {activeTab === "products" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCategoryManagerOpen(true)}
                className="border-primary/20 hover:bg-secondary hover:text-primary transition-colors"
              >
                <Layers className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Category</span>
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={openAddDialog}
                    className="bg-gradient-red glow-red"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Product</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProduct
                        ? "Update product information"
                        : "Enter details for new product"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={editingProduct?.name}
                          required
                          className="bg-secondary border-primary/20"
                        />
                      </div>
                      {/* SKU */}
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          name="sku"
                          defaultValue={editingProduct?.sku}
                          required
                          className="bg-secondary border-primary/20"
                        />
                      </div>
                      {/* Category */}
                      <div className="space-y-2">
                        <Label htmlFor="categoryId">Category *</Label>
                        <Select
                          name="categoryId"
                          defaultValue={
                            editingProduct?.categoryId ||
                            (selectedCategory ? selectedCategory.id : "")
                          }
                          required
                        >
                          <SelectTrigger className="bg-secondary border-primary/20">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Unit */}
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit *</Label>
                        <Input
                          id="unit"
                          name="unit"
                          defaultValue={editingProduct?.unit}
                          placeholder="e.g., Bottle, Case, Pack"
                          required
                          className="bg-secondary border-primary/20"
                        />
                      </div>
                      {/* Unit Cost */}
                      <div className="space-y-2">
                        <Label htmlFor="unitCost">Unit Cost (₱) *</Label>
                        <Input
                          id="unitCost"
                          name="unitCost"
                          type="number"
                          step="0.01"
                          defaultValue={editingProduct?.unitCost}
                          required
                          className="bg-secondary border-primary/20"
                        />
                      </div>
                      {/* Selling Price */}
                      <div className="space-y-2">
                        <Label htmlFor="sellingPrice">
                          Selling Price (₱) *
                        </Label>
                        <Input
                          id="sellingPrice"
                          name="sellingPrice"
                          type="number"
                          step="0.01"
                          defaultValue={editingProduct?.sellingPrice}
                          required
                          className="bg-secondary border-primary/20"
                        />
                      </div>
                      {/* Quantity */}
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          defaultValue={editingProduct?.quantity || 0}
                          required
                          className="bg-secondary border-primary/20"
                        />
                      </div>
                      {/* Reorder Level */}
                      <div className="space-y-2">
                        <Label htmlFor="reorderLevel">Reorder Level *</Label>
                        <Input
                          id="reorderLevel"
                          name="reorderLevel"
                          type="number"
                          defaultValue={editingProduct?.reorderLevel}
                          required
                          className="bg-secondary border-primary/20"
                        />
                      </div>
                      {/* Location */}
                      <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          name="location"
                          defaultValue={editingProduct?.location}
                          placeholder="e.g., Bar, Warehouse"
                          required
                          className="bg-secondary border-primary/20"
                        />
                      </div>
                      {/* Status */}
                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select
                          name="status"
                          defaultValue={editingProduct?.status || "Active"}
                          required
                        >
                          <SelectTrigger className="bg-secondary border-primary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Expiry Date */}
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          name="expiryDate"
                          type="date"
                          defaultValue={editingProduct?.expiryDate}
                          className="bg-secondary border-primary/20"
                        />
                      </div>
                      {/* Supplier */}
                      <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          name="supplier"
                          defaultValue={editingProduct?.supplier}
                          className="bg-secondary border-primary/20"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 bg-gradient-red">
                        {editingProduct ? "Update Product" : "Add Product"}
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
          )}
        </div>
      </div>

      {activeTab === "products" && (
        <div className="space-y-6 animate-in fade-in">
          {!selectedCategory ? (
            <>
              {/* Global Search */}
              <div className="relative w-full md:w-1/2 mx-auto mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products or categories..."
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary border-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Global Search Results */}
                {globalSearchTerm &&
                  filteredProducts.length > 0 &&
                  filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className={`border-primary/20 hover:shadow-card transition-all flex flex-col h-full ${
                        product.quantity <= product.reorderLevel
                          ? "shadow-glow-red"
                          : ""
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-lg break-words">
                                {product.name}
                              </CardTitle>
                              <CardDescription className="text-xs break-all">
                                SKU: {product.sku}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant={
                              product.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                            className="shrink-0"
                          >
                            {product.status}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 flex-1">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Category</p>
                            <p className="font-medium truncate">
                              {product.categoryName}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Location</p>
                            <p className="font-medium truncate">
                              {product.location}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p
                              className={`font-mono font-bold ${
                                product.quantity <= product.reorderLevel
                                  ? "text-destructive"
                                  : "text-primary"
                              }`}
                            >
                              {product.quantity} {product.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Unit Cost</p>
                            <p className="font-medium">
                              ₱{product.unitCost.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {product.quantity <= product.reorderLevel && (
                          <Badge
                            variant="destructive"
                            className="w-full justify-center"
                          >
                            Low Stock - Reorder at {product.reorderLevel}
                          </Badge>
                        )}
                      </CardContent>

                      <div className="p-6 pt-0 mt-auto">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                {/* Categories Folders */}
                {filteredCategories.map((category) => {
                  const count = products.filter(
                    (p) => p.categoryId === category.id
                  ).length;
                  return (
                    <div
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category);
                        setSearchTerm("");
                        setGlobalSearchTerm("");
                      }}
                      className="group relative flex flex-col p-6 rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden hover:border-red-600/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-red-900/10"
                    >
                      {/* Red Header Strip */}
                      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-red-600 to-red-900 opacity-80 group-hover:opacity-100 transition-opacity" />

                      {/* Header: Name & Icon */}
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-xl text-white uppercase tracking-wider truncate pr-2">
                          {category.name}
                        </h3>
                        <div className="p-2 rounded-lg bg-[#111] text-white/20 group-hover:text-red-600 transition-colors">
                          <Folder className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Count Section */}
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-white tracking-tight block">
                          {count}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                          Products Available
                        </span>
                      </div>

                      {/* Description Footer */}
                      <div className="pt-4 border-t border-white/5 mt-auto">
                        <p className="text-xs text-gray-600 uppercase tracking-wide truncate">
                          {category.description || "User Added Category"}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {filteredCategories.length === 0 && !globalSearchTerm && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Layers className="mx-auto h-12 w-12 opacity-20 mb-3" />
                    <p>
                      No categories found. Click "Add Category" to get started.
                    </p>
                  </div>
                )}
                {filteredCategories.length === 0 &&
                  filteredProducts.length === 0 &&
                  globalSearchTerm && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <Search className="mx-auto h-12 w-12 opacity-20 mb-3" />
                      <p>
                        No products or categories found matching "
                        {globalSearchTerm}".
                      </p>
                    </div>
                  )}
              </div>
            </>
          ) : (
            // Inner Category View
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCategory(null)}
                    className="hover:bg-secondary"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      {selectedCategory.name}
                      <Badge
                        variant="secondary"
                        className="text-sm font-normal"
                      >
                        {filteredProducts.length} Items
                      </Badge>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Category Overview
                    </p>
                  </div>
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search in ${selectedCategory.name}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-secondary border-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className={`border-primary/20 hover:shadow-card transition-all flex flex-col h-full ${
                      product.quantity <= product.reorderLevel
                        ? "shadow-glow-red"
                        : ""
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-lg break-words">
                              {product.name}
                            </CardTitle>
                            <CardDescription className="text-xs break-all">
                              SKU: {product.sku}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={
                            product.status === "Active"
                              ? "default"
                              : "secondary"
                          }
                          className="shrink-0"
                        >
                          {product.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 flex-1">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Category</p>
                          <p className="font-medium truncate">
                            {product.categoryName}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium truncate">
                            {product.location}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p
                            className={`font-mono font-bold ${
                              product.quantity <= product.reorderLevel
                                ? "text-destructive"
                                : "text-primary"
                            }`}
                          >
                            {product.quantity} {product.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Unit Cost</p>
                          <p className="font-medium">
                            ₱{product.unitCost.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {product.quantity <= product.reorderLevel && (
                        <Badge
                          variant="destructive"
                          className="w-full justify-center"
                        >
                          Low Stock - Reorder at {product.reorderLevel}
                        </Badge>
                      )}
                    </CardContent>

                    <div className="p-6 pt-0 mt-auto">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <Card className="border-primary/20">
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No products found in this category
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB CONTENT */}
      {activeTab === "history" && (
        <Card className="border-primary/20 animate-in fade-in slide-in-from-bottom-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Change History</CardTitle>
            </div>
            <CardDescription>
              Records of additions, edits, and deletions for products and
              categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyData.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-secondary/30 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                      <tr className="text-left">
                        <th className="p-3 font-medium">Type</th>
                        <th className="p-3 font-medium">Action</th>
                        <th className="p-3 font-medium">Name</th>
                        <th className="p-3 font-medium">Details</th>
                        <th className="p-3 font-medium">User</th>
                        <th className="p-3 font-medium text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {currentHistoryItems.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="p-3">
                            <Badge variant="outline" className="font-normal">
                              {log.type}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                log.action === "ADDED"
                                  ? "bg-green-500/10 text-green-500"
                                  : log.action === "DELETED"
                                  ? "bg-red-500/10 text-red-500"
                                  : "bg-blue-500/10 text-blue-500"
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{log.name}</td>

                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => setViewingHistoryItem(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>

                          <td className="p-3 text-muted-foreground">
                            {log.user}
                          </td>
                          <td className="p-3 text-right text-muted-foreground whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalHistoryPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                      Showing {startHistoryIndex + 1}-
                      {Math.min(
                        startHistoryIndex + itemsPerPage,
                        historyData.length
                      )}{" "}
                      of {historyData.length} records
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setHistoryPage((p) => Math.max(1, p - 1))
                        }
                        disabled={historyPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 cursor-default hover:bg-transparent"
                        >
                          {historyPage} / {totalHistoryPages}
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setHistoryPage((p) =>
                            Math.min(totalHistoryPages, p + 1)
                          )
                        }
                        disabled={historyPage === totalHistoryPages}
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
                <p>No history records found yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History Details Modal */}
      <Dialog
        open={!!viewingHistoryItem}
        onOpenChange={(open) => !open && setViewingHistoryItem(null)}
      >
        <DialogContent className="max-w-3xl bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>History Details</DialogTitle>
            <DialogDescription>
              {viewingHistoryItem?.action} {viewingHistoryItem?.type}:{" "}
              <span className="font-medium text-foreground">
                {viewingHistoryItem?.name}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {viewingHistoryItem?.action === "EDITED" &&
            viewingHistoryItem.previousData &&
            viewingHistoryItem.newData ? (
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">Field</th>
                      <th className="p-3 text-left w-1/3">Previous Value</th>
                      <th className="p-3 text-center w-8"></th>
                      <th className="p-3 text-left w-1/3">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.keys(viewingHistoryItem.newData).map((key) => {
                      const oldVal = viewingHistoryItem.previousData[key];
                      const newVal = viewingHistoryItem.newData[key];
                      if (JSON.stringify(oldVal) === JSON.stringify(newVal))
                        return null;
                      if (["id", "categoryId"].includes(key)) return null;

                      return (
                        <tr key={key} className="hover:bg-muted/30">
                          <td className="p-3 font-medium capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </td>
                          <td className="p-3 text-muted-foreground break-all">
                            {String(oldVal || "-")}
                          </td>
                          <td className="p-3 text-center text-muted-foreground">
                            <ArrowRight size={14} />
                          </td>
                          <td className="p-3 font-medium text-primary break-all">
                            {String(newVal || "-")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-4">
                {viewingHistoryItem?.action === "EDITED" && (
                  <p className="text-sm text-muted-foreground italic mb-2">
                    Detailed comparison not available for this record.
                  </p>
                )}

                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="p-3 text-left">Field</th>
                        <th className="p-3 text-left">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {viewingHistoryItem &&
                      (viewingHistoryItem.newData ||
                        viewingHistoryItem.previousData) ? (
                        Object.entries(
                          viewingHistoryItem.newData ||
                            viewingHistoryItem.previousData
                        ).map(([key, value]) => {
                          if (["id", "categoryId"].includes(key)) return null;
                          return (
                            <tr key={key} className="hover:bg-muted/30">
                              <td className="p-3 font-medium capitalize w-1/3">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </td>
                              <td className="p-3 text-muted-foreground break-all">
                                {String(value || "-")}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={2}
                            className="p-4 text-center text-muted-foreground"
                          >
                            {viewingHistoryItem?.details ||
                              "No details available"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setViewingHistoryItem(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onUpdate={loadData}
      />
    </div>
  );
};

export default Products;