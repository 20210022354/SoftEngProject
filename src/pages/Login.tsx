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
  // --- STATE ---
  // gi change from user to email since we now use firebase for log in authentication
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- HANDLER ---
  // correct async version
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    //request to firebase
    const user = await StorageService.login(email, password);

    if (user) {
      toast.success("Welcome to DTL Inventory System");
      navigate("/products");
    }
    setLoading(false);
  };
  
  // --- RENDER ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
      <div className="w-full max-w-md">
        {/* Logo section */}
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
            <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* === USERNAME/EMAIL INPUT === */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email" 
                    placeholder="Enter email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} 
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

              {/* === SUBMIT BUTTON === */}
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