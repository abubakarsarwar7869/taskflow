import { useState, useEffect, useRef } from 'react';
import { Settings, Bell, User, LogOut, Save, Upload, X, Play, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/audio';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserSettings {
  notification_enabled: boolean;
  sound_enabled: boolean;
  sound_effect: string;
  reminder_hours: number;
  theme: string;
  custom_sound_data?: string;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, signOut, deleteAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<UserSettings>({
    notification_enabled: true,
    sound_enabled: true,
    sound_effect: 'bell-933',
    reminder_hours: 24,
    theme: 'dark',
    custom_sound_data: undefined,
  });

  useEffect(() => {
    if (open && user) {
      fetchUserData();
    }
  }, [open, user]);

  const fetchUserData = () => {
    if (!user) return;

    try {
      // Load profile from localStorage
      const savedFullName = localStorage.getItem(`profile_fullName_${user.id}`);
      if (savedFullName) {
        setFullName(savedFullName);
      }

      // Load avatar from localStorage
      const savedAvatar = localStorage.getItem(`profile_avatar_${user.id}`);
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      }

      // Load current theme from localStorage (not user-specific)
      const currentTheme = localStorage.getItem('theme') || 'dark';
      const isDark = currentTheme === 'dark';

      // Load settings from localStorage
      const savedSettings = localStorage.getItem(`user_settings_${user.id}`);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        let soundEffect = parsed.sound_effect ?? 'bell-933';
        // Migrate legacy sound keys
        if (soundEffect === 'bell-1') soundEffect = 'bell-933';

        setSettings({
          notification_enabled: parsed.notification_enabled ?? true,
          sound_enabled: parsed.sound_enabled ?? true,
          sound_effect: soundEffect,
          reminder_hours: parsed.reminder_hours ?? 24,
          theme: currentTheme, // Use current theme from localStorage
          custom_sound_data: parsed.custom_sound_data
        });
      } else {
        setSettings({
          notification_enabled: true,
          sound_enabled: true,
          sound_effect: 'bell-933',
          reminder_hours: 24,
          theme: currentTheme, // Use current theme from localStorage
          custom_sound_data: undefined
        });
      }

      // Don't apply theme here - it's already applied by Header component
      // Just ensure the settings reflect the current state
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    // Remove existing theme classes
    root.classList.remove('dark', 'light');

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.add('light');
      }
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.add('light');
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      if (user) {
        localStorage.setItem(`profile_avatar_${user.id}`, result);
        // Update user in context
        updateUserInContext({ avatar: result });
        toast.success('Avatar updated');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarUrl('');
    if (user) {
      localStorage.removeItem(`profile_avatar_${user.id}`);
      updateUserInContext({ avatar: null });
      toast.success('Avatar removed');
    }
  };

  const updateUserInContext = (updates: { name?: string; avatar?: string | null }) => {
    if (!user) return;
    const storedUser = localStorage.getItem('taskflow_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const updatedUser = {
          ...userData,
          name: updates.name ?? userData.name,
          avatar: updates.avatar !== undefined ? updates.avatar : userData.avatar,
        };
        localStorage.setItem('taskflow_user', JSON.stringify(updatedUser));
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
      } catch (error) {
        console.error('Error updating user:', error);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) throw new Error('No authentication token');

      // Save to database via API
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: fullName,
          avatar: avatarUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();

      // Also save to localStorage for immediate UI updates
      localStorage.setItem(`profile_fullName_${user.id}`, fullName);
      if (avatarUrl) {
        localStorage.setItem(`profile_avatar_${user.id}`, avatarUrl);
      }

      // Update user in context
      updateUserInContext({ name: fullName, avatar: avatarUrl });

      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Audio size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setSettings(prev => ({ ...prev, custom_sound_data: result }));
      toast.success('Custom sound uploaded');
    };
    reader.readAsDataURL(file);
  };

  const removeCustomSound = () => {
    setSettings(prev => ({ ...prev, custom_sound_data: undefined }));
    toast.success('Custom sound removed');
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Save settings to localStorage
      localStorage.setItem(`user_settings_${user.id}`, JSON.stringify(settings));
      // Apply theme immediately
      applyTheme(settings.theme);
      toast.success('Settings saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };


  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure you want to delete your account? This will permanently remove all your boards and tasks. This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account deleted successfully');
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (fullName && fullName.trim()) {
      return fullName
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const playSoundSample = (effect: string) => {
    playNotificationSound(effect);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="flex-1 overflow-y-auto mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Avatar Section */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl} alt={fullName || user?.email} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </Button>
                    {avatarUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeAvatar}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              {/* Save Button */}
              <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>

              {/* Sign Out */}
              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full mb-4"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>

                {/* Danger Zone */}
                <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20 mt-4">
                  <h4 className="text-sm font-bold text-destructive flex items-center gap-2 mb-2 uppercase tracking-wider">
                    Danger Zone
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. All your data will be permanently removed.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    className="w-full"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete My Account
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="flex-1 overflow-y-auto mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about upcoming deadlines
                  </p>
                </div>
                <Switch
                  checked={settings.notification_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notification_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notification Sound</Label>
                  <p className="text-sm text-muted-foreground">
                    Play a sound when a notification arrives
                  </p>
                </div>
                <Switch
                  checked={settings.sound_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, sound_enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Sound Effect</Label>
                <div className="flex gap-2">
                  <Select
                    value={settings.sound_effect}
                    onValueChange={(value) =>
                      setSettings({ ...settings, sound_effect: value })
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="bell-933">Standard Bell</SelectItem>
                      <SelectItem value="achievement">Achievement Bell</SelectItem>
                      <SelectItem value="cooking-ding">Cooking Ding</SelectItem>
                      <SelectItem value="cowbell">Cowbell</SelectItem>
                      <SelectItem value="happy-bells">Happy Bells</SelectItem>
                      <SelectItem value="service-bell">Service Bell</SelectItem>
                      <SelectItem value="typewriter-bell">Typewriter Bell</SelectItem>
                      <SelectItem value="uplifting-bells">Uplifting Bells</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => playSoundSample(settings.sound_effect)}
                    title="Play Sample"
                    disabled={!!settings.custom_sound_data}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Custom Notification Sound</Label>
                    <p className="text-sm text-muted-foreground">
                      Upload your own notification sound
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="sound-upload"
                      className="hidden"
                      accept="audio/*"
                      onChange={handleSoundUpload}
                    />
                    {settings.custom_sound_data ? (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => playNotificationSound('custom', settings.custom_sound_data)}
                          title="Play Custom Sound"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={removeCustomSound}
                          className="text-destructive hover:text-destructive"
                          title="Remove Custom Sound"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('sound-upload')?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reminder Time</Label>
                <Select
                  value={settings.reminder_hours.toString()}
                  onValueChange={(value) =>
                    setSettings({ ...settings, reminder_hours: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="1">1 hour before</SelectItem>
                    <SelectItem value="6">6 hours before</SelectItem>
                    <SelectItem value="12">12 hours before</SelectItem>
                    <SelectItem value="24">24 hours before</SelectItem>
                    <SelectItem value="48">48 hours before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
