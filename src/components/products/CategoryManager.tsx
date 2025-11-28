import { useState, useEffect } from "react";
import { StorageService } from "@/lib/storage";
import { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Assuming you have table components, otherwise use divs
import { Plus, Trash2, Edit2, Save, X, Check } from "lucide-react";
import { toast } from "sonner";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Callback to refresh parent data
}

const CategoryManager = ({
  isOpen,
  onClose,
  onUpdate,
}: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = () => {
    setCategories(StorageService.getCategories());
  };

  const handleAdd = () => {
    if (!newCategoryName.trim()) return;

    if (
      categories.some(
        (c) => c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      )
    ) {
      toast.error("Category name already exists");
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      description: "User added category",
    };

    StorageService.addCategory(newCategory);
    setNewCategoryName("");
    loadCategories();
    onUpdate();
    toast.success("Category added");
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setDeleteConfirmId(null);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;

    const isDuplicate = categories.some(
      (c) =>
        c.id !== editingId &&
        c.name.toLowerCase() === editName.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast.error("Category name already exists");
      return;
    }

    if (editingId) {
      StorageService.updateCategory(editingId, { name: editName.trim() });
      setEditingId(null);
      loadCategories();
      onUpdate();
      toast.success("Category updated");
    }
  };

  const handleDelete = (id: string) => {
    StorageService.deleteCategory(id);
    setDeleteConfirmId(null);
    loadCategories();
    onUpdate();
    toast.success("Category deleted");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-card border-primary/20 max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Add, edit, or remove product categories.
          </DialogDescription>
        </DialogHeader>

        {/* Add New Section */}
        <div className="flex gap-2 py-4">
          <div className="flex-1">
            <Label htmlFor="new-cat" className="sr-only">
              New Category
            </Label>
            <Input
              id="new-cat"
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="bg-secondary border-primary/20"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <Button onClick={handleAdd} className="bg-gradient-red">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* List Section */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              {editingId === category.id ? (
                // Edit Mode
                <div className="flex items-center gap-2 w-full">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 bg-background"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-500"
                    onClick={saveEdit}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                // View Mode
                <>
                  <span className="font-medium">{category.name}</span>
                  <div className="flex items-center gap-1">
                    {deleteConfirmId === category.id ? (
                      <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                        <span className="text-xs text-destructive font-bold">
                          Ram bayot
                        </span>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => startEdit(category)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirmId(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManager;
