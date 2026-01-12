import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Loader2, User, UserPlus, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { JoinBoardModal } from '@/components/board/JoinBoardModal';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { user, signIn, signUp, sendVerificationCode, signInWithGoogle, completeOAuthLogin } = useAuth();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [showJoinModal, setShowJoinModal] = useState(urlParams.get('invite') === 'true');
  const boardId = urlParams.get('boardId');

  useEffect(() => {
    // Handle Google OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    const inviteEmail = urlParams.get('email');
    const isInvite = urlParams.get('invite') === 'true';

    if (isInvite && inviteEmail) {
      const decodedEmail = decodeURIComponent(inviteEmail);
      setEmail(decodedEmail);
      setMode('signup'); // Auto-switch to signup for new invites
      toast.info(`Invitation to board: ${urlParams.get('boardName') || 'Invitation'}`);
    }

    if (error) {
      toast.error(error === 'google_auth_failed' ? 'Google authentication failed' : 'Authentication error');
      // Clean URL
      window.history.replaceState({}, document.title, '/auth');
    } else if (token) {
      // Store token and user info
      const email = urlParams.get('email');
      const name = urlParams.get('name');

      if (token && email && name) {
        completeOAuthLogin(token, {
          id: '', // Context will fetch real ID via /me if needed, or we rely on what we have
          email: decodeURIComponent(email),
          name: decodeURIComponent(name),
        });
        toast.success('Signed in with Google!');

        // Check if there are invite params to preserve
        let invite = urlParams.get('invite');
        let boardId = urlParams.get('boardId');
        let boardName = urlParams.get('boardName');
        let inviteEmail = urlParams.get('email');

        // Fallback to localStorage if missing from URL
        if (!invite || !boardId) {
          const storedContext = localStorage.getItem('taskflow_invite_context');
          if (storedContext) {
            try {
              const context = JSON.parse(storedContext);
              invite = context.invite;
              boardId = context.boardId;
              boardName = context.boardName;
              inviteEmail = context.email;
              localStorage.removeItem('taskflow_invite_context');
            } catch (e) {
              console.error('Failed to parse stored invite context:', e);
            }
          }
        } else {
          // Clear it if we found it in URL anyway
          localStorage.removeItem('taskflow_invite_context');
        }

        const params = new URLSearchParams();
        if (invite === 'true') params.set('invite', 'true');
        if (boardId) params.set('boardId', boardId);
        if (boardName) params.set('boardName', boardName);
        if (inviteEmail) params.set('email', inviteEmail);

        const search = params.toString();
        // Clean URL while navigating
        window.history.replaceState({}, document.title, '/auth');
        navigate(search ? `/dashboard?${search}` : '/dashboard');
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSuccess = () => {
    // Re-check URL and localStorage for invitation context
    const currentParams = new URLSearchParams(window.location.search);
    let invite = currentParams.get('invite') || urlParams.get('invite');
    let bId = currentParams.get('boardId') || urlParams.get('boardId') || boardId;
    let bName = currentParams.get('boardName') || urlParams.get('boardName');
    let emailP = currentParams.get('email') || urlParams.get('email');

    if (!invite || !bId) {
      const storedContext = localStorage.getItem('taskflow_invite_context');
      if (storedContext) {
        try {
          const context = JSON.parse(storedContext);
          invite = invite || context.invite;
          bId = bId || context.boardId;
          bName = bName || context.boardName;
          emailP = emailP || context.email;
          localStorage.removeItem('taskflow_invite_context');
        } catch (e) { }
      }
    }

    const params = new URLSearchParams();
    if (invite === 'true') params.set('invite', 'true');
    if (bId) params.set('boardId', bId);
    if (bName) params.set('boardName', bName);
    if (emailP) params.set('email', emailP);

    const search = params.toString();
    navigate(search ? `/dashboard?${search}` : '/dashboard');
  };

  useEffect(() => {
    if (user) {
      handleSuccess();
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Welcome back!');
        handleSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!email || !name) {
      toast.error('Please enter your name and email first');
      return;
    }

    setLoading(true);
    try {
      const { error } = await sendVerificationCode(email);
      if (error) {
        toast.error(error.message);
      } else {
        setIsVerifying(true);
        setResendTimer(120); // 2 minutes
        toast.success('Verification code sent to your email!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerifying) {
      handleSendCode();
      return;
    }

    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);

    try {
      if (!name || !email || !password) {
        toast.error('Please fill in all fields');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const boardId = urlParams.get('boardId');

      const { error } = await signUp(email, password, name, verificationCode, boardId || undefined);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created successfully!');
        handleSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.15),transparent_50%)]" />

        <div className="relative z-10 flex flex-col justify-center p-12">
          <Link to="/">
            <h1 className="text-5xl font-bold gradient-text mb-4">TaskFlow</h1>
          </Link>
          <p className="text-xl text-muted-foreground max-w-md">
            Smart task management for teams that move fast. Organize, collaborate, and deliver.
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <span className="text-muted-foreground">Intuitive drag-and-drop boards</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <span className="text-muted-foreground">Smart deadline reminders</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">3</span>
              </div>
              <span className="text-muted-foreground">Team collaboration made easy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Join Board Modal for Auth Page */}
          {showJoinModal && boardId && (
            <JoinBoardModal
              boardId={boardId}
              showAuthActions={true}
              onJoined={() => {
                // This shouldn't really happen here since user is unauthed
                // but handled just in case
                setShowJoinModal(false);
              }}
              onCancel={() => {
                setShowJoinModal(false);
              }}
            />
          )}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === 'login'
                ? 'Sign in to access TaskFlow'
                : 'Sign up to get started with TaskFlow'}
            </p>
          </div>

          <Tabs value={mode} onValueChange={(value) => setMode(value as 'login' | 'signup')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" onClick={() => {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('invite') === 'true') {
                  navigate(`/auth?${urlParams.toString()}`);
                }
              }}>Sign In</TabsTrigger>
              <TabsTrigger value="signup" onClick={() => {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('invite') === 'true') {
                  navigate(`/auth?${urlParams.toString()}`);
                }
              }}>Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={signInWithGoogle}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {isVerifying && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="verification-code">Verification Code</Label>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={handleSendCode}
                        disabled={loading || resendTimer > 0}
                        className="text-xs text-primary font-medium h-auto p-0"
                      >
                        {resendTimer > 0
                          ? `Resend in ${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}`
                          : 'Resend Code'}
                      </Button>
                    </div>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="verification-code"
                        type="text"
                        placeholder="6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="pl-10 tracking-[0.5em] font-mono font-bold"
                        required
                        maxLength={6}
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isVerifying ? (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Verify & Create Account
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Verification Code
                        </>
                      )}
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={signInWithGoogle}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
