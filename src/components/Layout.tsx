import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StorageService } from "@/lib/storage";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Product } from "@/types";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(StorageService.getCurrentUser());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Low Stock Notification State
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);

  useEffect(() => {
    // ✅ Fix: Wrap database calls in an async function
    const initLayout = async () => {
      const currentUser = StorageService.getCurrentUser();
      if (!currentUser) {
        navigate("/");
        return;
      } 
      setUser(currentUser);
      setIsMobileMenuOpen(false);

      // ✅ Fix: Await the products call
      try {
        const products = await StorageService.getProducts();
        const lowStock = products.filter(
          (p) => p.quantity <= p.reorderLevel && p.status === "Active"
        );
        setLowStockItems(lowStock);
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };

    initLayout();
  }, [navigate, location]); 

  // ✅ Fix: Logout should be async
  const handleLogout = async () => {
    await StorageService.logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Package, label: "Products", path: "/products" },
    { icon: ArrowLeftRight, label: "Transactions", path: "/transactions" },
    { icon: BarChart3, label: "Reports", path: "/reports" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background relative">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border 
          transition-transform duration-300 ease-in-out flex flex-col
          md:translate-x-0 
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-6 border-b border-sidebar-border flex flex-col items-center relative">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute right-4 top-4 md:hidden text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>

          <img
            src="/dtl1.png"
            alt="DTL Logo"
            className="w-20 h-13 object-contain mb-1"
          />
          <p className="text-xs text-muted-foreground text-center">
            Inventory System
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-all"
              activeClassName="bg-sidebar-accent text-primary font-medium border-l-4 border-primary"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.fullName}
            </p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-primary/20 hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main
        className={`
          flex-1 min-h-screen flex flex-col transition-all duration-300
          md:ml-64 
          ml-0 
        `}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center">
            {/* Hamburger: Mobile Only */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mr-4 md:hidden hover:bg-accent"
            >
              <Menu className="h-6 w-6" />
            </Button>

            <h1 className="text-lg font-semibold capitalize md:hidden">
              {location.pathname.replace("/", "") || "Dashboard"}
            </h1>
          </div>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {lowStockItems.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse ring-2 ring-background" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-0 border-primary/20 bg-card"
              align="end"
            >
              <div className="p-4 border-b border-border bg-muted/20">
                <h4 className="font-semibold leading-none">Notifications</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {lowStockItems.length} items need attention
                </p>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {lowStockItems.length > 0 ? (
                  <div className="divide-y divide-border">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={() => navigate("/products")}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <span className="text-xs font-bold text-red-500">
                            Low Stock
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} {item.unit} remaining (Reorder at{" "}
                          {item.reorderLevel})
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">All stock levels are healthy.</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
};

export default Layout;