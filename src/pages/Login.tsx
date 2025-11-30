import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StorageService } from "@/lib/storage";
import { toast } from "sonner";
import { Lock, User } from "lucide-react";

const Login = () => {
  // Use a generic name for the state since it can be email OR username
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ SIMPLIFIED: Just pass the input directly.
      // The StorageService.login function now handles the "Email vs Username" check internally.
      const user = await StorageService.login(identifier, password);

      if (user) {
        toast.success("Welcome to DTL Inventory System");
        navigate("/dashboard");
      } else {
        // This handles incorrect password OR incorrect username
        toast.error("Invalid username/email or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/dtl.png"
            alt="DTL Logo"
            className="w-28 h-28 object-contain mb-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Inventory Management System
          </p>
        </div>

        <Card className="border-primary/20 shadow-glow-red">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* === IDENTIFIER INPUT (Email or Username) === */}
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="identifier"
                    type="text" // ✅ Must be 'text' to allow usernames (no @ required)
                    placeholder="Enter email or username" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)} 
                    className="pl-10 bg-secondary border-primary/20 focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* === PASSWORD INPUT === */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-secondary border-primary/20 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-red hover:opacity-90 transition-all glow-red"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;