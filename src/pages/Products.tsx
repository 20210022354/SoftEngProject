import { useEffect, useState } from "react";
import { StorageService } from "@/lib/storage";
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
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
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

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
  loadData();
}, []);

const loadData = async () => { 
  const products = await StorageService.getProducts(); 
  const categories = await StorageService.getCategories(); 
  setProducts(products);
  setCategories(categories);
};

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || product.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoryId = formData.get("categoryId") as string;
    const category = categories.find((c) => c.id === categoryId);

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

    if (editingProduct) {
      StorageService.updateProduct(editingProduct.id, productData);
      toast.success("Product updated successfully");
    } else {
      StorageService.addProduct(productData);
      toast.success("Product added successfully");
    }

    loadData();
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      StorageService.deleteProduct(id);
      toast.success("Product deleted");
      loadData();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">Manage inventory items</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openAddDialog}
              className="bg-gradient-red glow-red"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
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
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select
                    name="categoryId"
                    defaultValue={editingProduct?.categoryId}
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
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Selling Price (₱) *</Label>
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

      {/* Filters */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-primary/20"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48 bg-secondary border-primary/20">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className={`border-primary/20 hover:shadow-card transition-all ${
              product.quantity <= product.reorderLevel ? "shadow-glow-red" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="text-xs">
                      SKU: {product.sku}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant={
                    product.status === "Active" ? "default" : "secondary"
                  }
                >
                  {product.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{product.categoryName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{product.location}</p>
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
                  <p className="font-medium">₱{product.unitCost.toFixed(2)}</p>
                </div>
              </div>

              {product.quantity <= product.reorderLevel && (
                <Badge variant="destructive" className="w-full justify-center">
                  Low Stock - Reorder at {product.reorderLevel}
                </Badge>
              )}

              <div className="flex gap-2 pt-2">
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
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="border-primary/20">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No products found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Products;
