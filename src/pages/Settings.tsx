import { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserCircle, Lock } from 'lucide-react';

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(StorageService.getCurrentUser());
  }, []);

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (user) {
      const updatedUser = {
        ...user,
        fullName: formData.get('fullName') as string,
        email: formData.get('email') as string,
      };

      StorageService.setCurrentUser(updatedUser);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    }
  };

  const handleChangePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (currentPassword !== '123') {
      toast.error('Current password is incorrect');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 3) {
      toast.error('Password must be at least 3 characters');
      return;
    }

    toast.success('Password changed successfully (demo mode)');
    (e.target as HTMLFormElement).reset();
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
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={user.fullName}
                required
                className="bg-secondary border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
                className="bg-secondary border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={user.username}
                disabled
                className="bg-muted border-primary/20"
              />
              <p className="text-xs text-muted-foreground">Username cannot be changed</p>
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
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="bg-secondary border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="bg-secondary border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="bg-secondary border-primary/20"
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-red">
              Change Password
            </Button>
          </form>
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
            <span className="font-medium">1.0.0</span>
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
