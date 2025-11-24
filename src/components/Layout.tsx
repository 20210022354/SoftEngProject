import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StorageService } from "@/lib/storage";
import { LayoutDashboard, Package, ArrowLeftRight, LogOut } from "lucide-react";
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

  useEffect(() => {
    const currentUser = StorageService.getCurrentUser();
    if (!currentUser) {
      navigate("/");
    } else {
      setUser(currentUser);
    }
  }, [navigate, location]);

  const handleLogout = () => {
    // We need to make this async for Firebase Auth
    StorageService.logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Package, label: "Products", path: "/products" },
    { icon: ArrowLeftRight, label: "Transactions", path: "/transactions" },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border fixed h-full flex flex-col">
        {/* ✅ Logo Section */}
        <div className="p-6 border-b border-sidebar-border flex flex-col items-center">
          <img
            src="/dtl1.png"
            alt="DTL Logo"
            className="w-20 h-13 object-contain mb-1"
          />
          <p className="text-xs text-muted-foreground text-center">
            Inventory System
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
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
            <p className="text-sm font-medium text-foreground">
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

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;