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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(StorageService.getCurrentUser());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const currentUser = StorageService.getCurrentUser();
    if (!currentUser) {
      navigate("/");
    } else {
      setUser(currentUser);
    }
    // Close mobile menu automatically when route changes
    setIsMobileMenuOpen(false);
  }, [navigate, location]);

  const handleLogout = () => {
    StorageService.logout();
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
      {/* ✅ Mobile Backdrop (Dark overlay when sidebar is open on mobile only) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ✅ Sidebar Navigation */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border 
          transition-transform duration-300 ease-in-out flex flex-col
          md:translate-x-0 /* Always visible on PC */
          ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } /* Slide in/out on Mobile */
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-sidebar-border flex flex-col items-center relative">
          {/* Mobile Close Button */}
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

        {/* Navigation Items */}
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

        {/* User Info + Logout */}
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

      {/* ✅ Main Content Wrapper */}
      <main
        className={`
          flex-1 min-h-screen flex flex-col transition-all duration-300
          md:ml-64 /* Push content right on PC to fit sidebar */
          ml-0 /* Full width on Mobile */
        `}
      >
        {/* Top Header Bar - Hidden on Desktop (md:hidden) */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur border-b border-border flex items-center px-4 md:px-8 md:hidden">
          {/* ✅ Hamburger: Visible ONLY on Mobile (md:hidden) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mr-4 md:hidden hover:bg-accent"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <h1 className="text-lg font-semibold capitalize">
            {location.pathname.replace("/", "") || "Dashboard"}
          </h1>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
