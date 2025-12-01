import { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserCircle, Lock, Mail } from 'lucide-react';

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setUser(StorageService.getCurrentUser());
  }, []);

  // --- 1. Update Profile Handler ---
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (user) {
      const updates: Partial<User> = {
        username: formData.get('username') as string, 
        FullName: formData.get('FullName') as string, 
      };

      try {
        await StorageService.updateUser(user.id, updates);
        setUser({ ...user, ...updates } as User);
        toast.success('Profile updated successfully');
      } catch (error) {
        console.error("Failed to update profile:", error);
        toast.error('Failed to update profile');
      }
    }
  };

  // --- 3. Send Reset Email Handler ---
  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    try {
      await StorageService.sendPasswordReset(user.email);
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error: any) {
      toast.error("Failed to send email: " + error.message);
    }
  };
  
  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircle className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                defaultValue={user.username}
                required
                className="bg-secondary border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="FullName"
                name="FullName"
                defaultValue={user.FullName} 
                required
                className="bg-secondary border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type = "String"
                defaultValue={user.email}
                disabled
                className="bg-secondary border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                name="role"
                value={user.role}
                disabled
                className="bg-muted border-primary/20"
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-red">
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Reset password through email Button */}
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSendResetEmail}
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" /> Send Password Reset Link
          </Button>

        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.2.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Login</span>
            <span className="font-medium">{new Date().toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium text-primary">Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;