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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StorageService } from "@/lib/storage";
import { toast } from "sonner";
import { Lock, User, Mail } from "lucide-react";

const Login = () => {
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- FORGOT PASSWORD STATES ---
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await StorageService.login(identifier, password);

      if (user) {
        toast.success("Welcome to DTL Inventory System");
        navigate("/dashboard");
      } else {
        toast.error("Invalid username/email or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setResetLoading(true);
    try {
      await StorageService.sendPasswordReset(resetEmail);
      toast.success("Password reset link sent! Check your email.");
      setIsResetOpen(false); 
      setResetEmail(""); 
    } catch (error: any) {
      console.error("Reset error:", error);
      if (error.code === 'auth/user-not-found') {
        toast.error("No account found with this email.");
      } else {
        toast.error("Failed to send reset link. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
      <div className="w-full max-w-md">
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
              
               {/* Email/Username Input */}
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="identifier"
                    type="text" 
                    placeholder="Enter email or username" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)} 
                    className="pl-10 bg-secondary border-primary/20 focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
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

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-red hover:opacity-90 transition-all glow-red"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              {/* forgot password*/}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  className="text-sm text-primary hover:text-red-400 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* pop up for forot password */}
        <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
          <DialogContent className="bg-card border-primary/20 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a link to reset your password.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleForgotPassword} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="name@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10 bg-secondary border-primary/20 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsResetOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-red hover:opacity-90"
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default Login;