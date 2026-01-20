import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import MainContent from '@/components/layout/MainContent';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, User, Bell, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { signOut, session } = useClerk();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;

    setIsDeleting(true);
    try {
      // Get the Supabase token from Clerk
      const token = await session?.getToken({ template: 'supabase' });

      const { error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) throw error;

      toast.success('Account deleted successfully');

      // Sign out and redirect
      localStorage.clear();
      await signOut();
      navigate('/');

    } catch (err) {
      console.error('Error deleting account:', err);
      toast.error('Failed to delete account. Please try again.');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!user) return null;

  return (
    <AppLayout>
      <MainContent>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-8">Settings</h1>

          {/* Appearance */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              Appearance
            </h2>
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User size={20} />
              Account
            </h2>
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div>
                <Label>Company Name</Label>
                <Input defaultValue={user.companyName} className="mt-2" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user.email} disabled className="mt-2" />
              </div>
              <div>
                <Label>Account Type</Label>
                <div className="mt-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-sm">
                  {user.role === 'restaurant' ? '🍽️ Restaurant' : '📦 Supplier'}
                  <span className="text-xs ml-2">(Cannot be changed)</span>
                </div>
              </div>
              <Button>Save Changes</Button>
            </div>
          </section>

          {/* Notifications */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell size={20} />
              Notifications
            </h2>
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show notifications in the app</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section>
            <h2 className="text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              Danger Zone
            </h2>
            <div className="bg-destructive-muted rounded-xl border border-destructive/20 p-6">
              <p className="text-sm text-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>

              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="py-4">
                    <Label className="mb-2 block">
                      Type <span className="font-bold">DELETE</span> to confirm
                    </Label>
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full"
                    />
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                      setDeleteConfirmation('');
                      setIsDeleting(false);
                    }}>Cancel</AlertDialogCancel>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Account'
                      )}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>
        </div>
      </MainContent>
    </AppLayout>
  );
}
