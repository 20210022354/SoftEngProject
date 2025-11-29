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
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Folder,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const CategoryManager = ({
  isOpen,
  onClose,
  onUpdate,
}: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  // Add State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // ✅ ASYNC DATA LOADING
  const loadCategories = async () => {
    try {
      const data = await StorageService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const handleAdd = async () => {
    if (!newCategoryName.trim()) return;

    if (newCategoryDesc.length > 30) {
      toast.error("Description must be 30 characters or less");
      return;
    }

    if (
      categories.some(
        (c) => c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      )
    ) {
      toast.error("Category name already exists");
      return;
    }

    setLoading(true);
    try {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim() || undefined,
      };

      await StorageService.addCategory(newCategory);
      
      setNewCategoryName("");
      setNewCategoryDesc("");
      await loadCategories();
      onUpdate();
      toast.success("Category added");
    } catch (error) {
      toast.error("Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDesc(category.description || "");
    setDeleteConfirmId(null);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;

    if (editDesc.length > 30) {
      toast.error("Description must be 30 characters or less");
      return;
    }

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
      try {
        await StorageService.updateCategory(editingId, {
          name: editName.trim(),
          description: editDesc.trim() || undefined,
        });
        
        setEditingId(null);
        await loadCategories();
        onUpdate();
        toast.success("Category updated");
      } catch (error) {
        toast.error("Failed to update category");
      }
    }
  };

  const handleDelete = async (id: string) => {
    // ✅ Optimistic Update: Remove visually immediately
    const originalCategories = [...categories];
    setCategories(categories.filter(c => c.id !== id));
    setDeleteConfirmId(null);

    try {
      await StorageService.deleteCategory(id);
      // Wait a moment before reloading real data to ensure DB consistency
      // await loadCategories(); // Optional: Skip re-fetch to keep UI snappy
      onUpdate(); // Notify parent to update products list
      toast.success("Category deleted");
    } catch (error) {
      // Revert if failed
      setCategories(originalCategories);
      toast.error("Failed to delete category");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-[#0a0a0a] border-white/10 max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl text-white">
        {/* Header Area */}
        <div className="px-8 py-6 border-b border-white/10 bg-[#0a0a0a]">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                Categories
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
                Manage your product categories and inventory structure.
              </DialogDescription>
            </div>

            {/* Quick Stats or Info */}
            <div className="text-right hidden sm:block">
              <span className="text-3xl font-bold text-white block">
                {categories.length}
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">
                Total Categories
              </span>
            </div>
          </div>
        </div>

        {/* Add New Section - Dark Theme */}
        <div className="px-8 py-6 bg-[#111111] border-b border-white/10">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <Label
                htmlFor="new-cat"
                className="text-xs font-bold uppercase tracking-wider text-gray-500"
              >
                Category Name
              </Label>
              <Input
                id="new-cat"
                placeholder="E.g., BEERS"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="bg-[#0a0a0a] border-white/10 focus-visible:ring-red-600 focus-visible:border-red-600 h-11 text-white placeholder:text-gray-600"
              />
            </div>
            <div className="flex-1 w-full space-y-2 relative">
              <div className="flex justify-between">
                <Label
                  htmlFor="new-desc"
                  className="text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Description
                </Label>
                <span
                  className={`text-[10px] ${
                    newCategoryDesc.length > 30
                      ? "text-red-500"
                      : "text-gray-600"
                  }`}
                >
                  {newCategoryDesc.length}/30
                </span>
              </div>
              <Input
                id="new-desc"
                placeholder="Short description..."
                value={newCategoryDesc}
                maxLength={30}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                className="bg-[#0a0a0a] border-white/10 focus-visible:ring-red-600 focus-visible:border-red-600 h-11 text-white placeholder:text-gray-600 text-sm"
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white h-11 px-6 font-medium tracking-wide shadow-lg shadow-red-900/20 w-full sm:w-auto"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Plus className="h-4 w-4 mr-2" /> Add</>}
            </Button>
          </div>
        </div>

        {/* List Section - Grid Layout */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#050505]">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600 opacity-60">
              <Folder className="h-16 w-16 mb-4 stroke-1 opacity-20" />
              <p className="text-lg font-medium">No categories found</p>
              <p className="text-sm">Add a new category above to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                return (
                  <div
                    key={category.id}
                    className={`group relative flex flex-col p-6 rounded-xl border transition-all duration-300 min-h-[160px]
                        ${
                          editingId === category.id
                            ? "border-red-600/50 bg-[#0a0a0a] ring-1 ring-red-600/20"
                            : "border-white/5 bg-[#0a0a0a] hover:border-white/20 hover:bg-[#111111]"
                        }`}
                  >
                    {/* Top Row: Name & Icon */}
                    <div className="flex justify-between items-start mb-4">
                      {editingId === category.id ? (
                        <div className="w-full mr-2">
                          <Label className="text-[10px] text-red-500 font-bold uppercase mb-1 block">
                            Edit Name
                          </Label>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 bg-[#1a1a1a] border-white/10 text-white text-sm font-bold uppercase tracking-wide"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <h3 className="font-bold text-lg text-white uppercase tracking-wider truncate pr-2">
                          {category.name}
                        </h3>
                      )}

                      {/* Folder Icon / Actions */}
                      <div className="shrink-0 text-white/20 group-hover:text-red-600 transition-colors">
                        {editingId !== category.id && (
                          <Folder className="h-6 w-6" />
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Count */}
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-4xl font-bold text-white tracking-tight mb-1">
                        -
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        Products Available
                      </span>
                    </div>

                    {/* Bottom Row: Description & Actions */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-end">
                      <div className="flex-1 min-w-0 mr-4">
                        {editingId === category.id ? (
                          <div className="relative">
                            <Input
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              maxLength={30}
                              className="h-7 bg-[#1a1a1a] border-white/10 text-xs text-gray-300 pr-8"
                              placeholder="Edit Description"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-600">
                              {editDesc.length}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600 uppercase tracking-wide truncate">
                            {category.description || "USER ADDED CATEGORY"}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {editingId === category.id ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                              onClick={saveEdit}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-gray-500 hover:bg-white/10 hover:text-white"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : deleteConfirmId === category.id ? (
                          <div className="flex items-center gap-2 bg-red-900/20 px-2 py-1 rounded border border-red-900/50 animate-in fade-in">
                            <span className="text-[10px] text-red-500 font-bold uppercase">
                              Confirm?
                            </span>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="text-red-500 hover:text-white"
                              type="button"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-gray-500 hover:text-white"
                              type="button"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(category)}
                              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                              type="button"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(category.id)}
                              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                              type="button"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManager;