import { AppLayout } from '@/components/layout/AppLayout';
import MainContent from '@/components/layout/MainContent';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, User, Bell, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
              <Button variant="destructive">Delete Account</Button>
            </div>
          </section>
        </div>
      </MainContent>
    </AppLayout>
  );
}
