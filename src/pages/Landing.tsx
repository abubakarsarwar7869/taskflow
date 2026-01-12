import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Kanban, Bell, Users, Calendar, Zap, Moon, Sun, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { GradientOrbs } from '@/components/effects/GradientOrbs';
import { FloatingElements } from '@/components/effects/FloatingElements';
import { AnimatedLogo } from '@/components/layout/AnimatedLogo';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Flow Demo State
  const [demoTasks, setDemoTasks] = useState([
    { id: '1', title: 'Design landing page', col: 0, priority: 'High' },
    { id: '2', title: 'Write copy', col: 0, priority: 'Medium' },
    { id: '3', title: 'Choose fonts', col: 0, priority: 'Low' },
    { id: '4', title: 'Build demo component', col: 1, priority: 'High' },
    { id: '5', title: 'Setup Vite', col: 2, priority: 'Low' },
    { id: '6', title: 'Install Tailwind', col: 2, priority: 'Medium' },
  ]);

  // Animation State
  const [animatingTask, setAnimatingTask] = useState<{ id: string, fromCol: number, toCol: number } | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 20, y: 50 });
  const [cardPos, setCardPos] = useState({ x: 20, y: 35 });
  const boardRef = useRef<HTMLDivElement>(null);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Smoother Demo Animation Loop
  useEffect(() => {
    const runAnimation = () => {
      // 1. Pick a random task to move
      const taskIndex = Math.floor(Math.random() * demoTasks.length);
      const task = demoTasks[taskIndex];
      const fromCol = task.col;
      const possibleCols = [0, 1, 2].filter(c => c !== fromCol);
      const toCol = possibleCols[Math.floor(Math.random() * possibleCols.length)];

      // 2. Move cursor to the card "pick up" point
      const pickupX = 20 + fromCol * 33;
      const pickupY = 40;
      setCursorPos({ x: pickupX, y: pickupY });

      setTimeout(() => {
        // 3. Start animation - set both card and cursor to pickup position
        setCardPos({ x: pickupX, y: 35 });
        setAnimatingTask({ id: task.id, fromCol, toCol });

        // Small delay to ensure the card appears at pickup position
        setTimeout(() => {
          // 4. Move cursor and task together to destination
          const dropX = 20 + toCol * 33;
          const dropY = 35;
          setCursorPos({ x: dropX, y: dropY });
          setCardPos({ x: dropX, y: dropY });

          setTimeout(() => {
            // 5. "Land" the card: Update state and clean up animation
            setDemoTasks(prev =>
              prev.map(t => t.id === task.id ? { ...t, col: toCol } : t
              )
            );
            setAnimatingTask(null);
            setCursorPos({ x: dropX + 5, y: 60 }); // Return to idle nearby
          }, 1400); // Duration of flight + small buffer
        }, 50); // Small delay to ensure smooth start
      }, 700); // Wait for cursor to "grab"
    };

    const interval = setInterval(runAnimation, 5000);
    return () => clearInterval(interval);
  }, [demoTasks]);

  const toggleTheme = () => setIsDark(!isDark);

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const columns = [
    { name: 'To Do', color: 'bg-blue-500' },
    { name: 'In Progress', color: 'bg-primary' },
    { name: 'Done', color: 'bg-green-500' }
  ];

  const features = [
    {
      icon: Kanban,
      title: 'Drag & Drop Boards',
      description: 'Organize tasks with intuitive kanban boards. Move cards between columns with ease.',
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Never miss a deadline. Get notified before tasks are due.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Invite team members, assign tasks, and work together seamlessly.',
    },
    {
      icon: Calendar,
      title: 'Calendar View',
      description: 'See all your tasks on a calendar. Plan your week at a glance.',
    },
  ];

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 overflow-hidden">
      {/* Ambient background for the rest of the page */}
      <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden bg-background">
        {/* Mesh Grid */}
        <div className="mesh-grid mesh-grid-prominent opacity-30" />

        {/* High-end Professional Gradient Highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[100%] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_70%)]" />

        {/* Subtle Structured Dots */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Header - Transparent and Absolute */}
      <header className="absolute top-0 left-0 w-full border-b border-border/50 backdrop-blur-xl bg-background/10 z-[60]">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="scale-75 sm:scale-90 md:scale-100 origin-left">
            <AnimatedLogo size="md" showTagline={true} variant="white" />
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-white hover:bg-white/10"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <Link to="/dashboard">
                <Button className="rounded-full px-6 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-none">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="ghost" className="rounded-full text-white hover:bg-white/10">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button className="rounded-full px-6 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-none">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner - Responsive and Flow-safe */}
      <section className="relative min-h-[90vh] md:min-h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col items-center justify-center pt-24 pb-12">
        {/* Animated Canvas Background */}
        <ParticleBackground />

        {/* Gradient Orbs */}
        <GradientOrbs />

        {/* Main Content */}
        <div className="relative z-10 container mx-auto px-6 flex flex-col items-center justify-center text-center">
          {/* Floating Elements - Behind Text */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <FloatingElements />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm mb-8 animate-fade-in">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-purple-300 tracking-wide uppercase">Pro Productivity</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 animate-fade-in-up leading-[1.1]">
            <div className="text-white mb-2">Automate your tasks.</div>
            <div className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent italic">
              Accelerate your flow.
            </div>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mt-4 mb-12 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            The next-generation productivity platform designed for high-performance
            teams. Beautiful, fast, and remarkably intuitive.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in-up w-full sm:w-auto" style={{ animationDelay: '0.4s' }}>
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto group px-8 py-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-full font-semibold text-lg hover:from-purple-700 hover:to-purple-600 transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/50">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto group px-8 py-6 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold text-lg hover:bg-white/20 border border-white/10"
              onClick={scrollToDemo}
            >
              <Zap className="mr-2 w-5 h-5 fill-white" />
              Watch Demo
            </Button>
          </div>

        </div>
      </section>

      {/* Workflow Demo Section - Smoothed Animation */}
      <section id="demo-section" className="py-12 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
              Real-time <span className="gradient-text">visual productivity</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Buttery-smooth task transitions across your entire workspace.
            </p>
          </div>

          <div
            ref={boardRef}
            className="relative max-w-5xl mx-auto p-4 md:p-8 rounded-[40px] border border-border/50 bg-card/30 backdrop-blur-3xl shadow-3xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {columns.map((col, i) => {
                const columnTasks = demoTasks.filter(t => t.col === i);
                return (
                  <div key={col.name} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", col.color)} />
                        <span className="font-bold text-sm tracking-widest uppercase opacity-60">{col.name}</span>
                      </div>
                      <span className="text-xs bg-muted/50 backdrop-blur-sm border border-border/50 px-3 py-1 rounded-full font-mono tabular-nums font-bold text-primary transition-all duration-300">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3 min-h-[350px] p-2 rounded-3xl border border-border/10 bg-background/20 backdrop-blur-sm relative">
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "p-4 rounded-2xl bg-card border border-border/50 shadow-sm transition-all duration-500",
                            animatingTask?.id === task.id ? "opacity-0 scale-95" : "opacity-100"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-semibold">{task.title}</span>
                            <div className="w-6 h-6 rounded-lg bg-muted/50 flex items-center justify-center">
                              <Zap
                                className={cn("h-3 w-3",
                                  task.priority === 'High' ? "text-primary fill-primary" : "text-muted-foreground"
                                )}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            <div
                              className={cn(
                                "h-1 px-2 rounded-full",
                                task.priority === 'High' ? "bg-primary/30 w-12" : "bg-muted w-8"
                              )}
                            />
                            <span className="text-[10px] uppercase font-bold opacity-30 tracking-widest">{task.priority}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* THE "FLYING CARD" OVERLAY */}
            {animatingTask && (
              <div
                className="absolute z-40 transition-all [transition-duration:1400ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  top: `${cardPos.y}%`,
                  left: `${cardPos.x}%`,
                  width: '280px',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="p-4 rounded-2xl bg-card border-2 border-primary shadow-glow-primary scale-105 rotate-2">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-bold">{demoTasks.find(t => t.id === animatingTask.id)?.title}</span>
                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Zap className="h-3 w-3 text-primary fill-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="h-1 bg-primary/40 w-12 rounded-full" />
                    <span className="text-[10px] uppercase font-black text-primary tracking-widest">DRAGGING</span>
                  </div>
                </div>
              </div>
            )}

            {/* Virtual Ghost Cursor - Synced with Card */}
            <div
              className="absolute z-50 pointer-events-none transition-all [transition-duration:1400ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                top: `${cursorPos.y}%`,
                left: `${cursorPos.x}%`,
                transform: animatingTask ? 'translate(-50%, -50%) scale(1.1)' : 'translate(-50%, -50%)'
              }}
            >
              <svg viewBox="0 0 32 32" className="w-10 h-10 drop-shadow-3xl text-primary" fill="currentColor">
                <path d="M7 2l18 11.5-7 1.5 6 9.5-3.5 2-6-10.5-7.5 7v-21z" />
              </svg>
              {animatingTask && (
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-primary rounded-full animate-ping opacity-75" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features - Tightened Spacing */}
      <section className="py-16 relative overflow-hidden" id="features">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8">
                Stay organized with <br />
                <span className="gradient-text">cutting-edge tools</span>
              </h2>
              <div className="space-y-6">
                {features.map((f, i) => (
                  <div key={f.title} className="flex gap-6 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-glow-primary">
                      <f.icon className="h-7 w-7 transition-transform group-hover:scale-110" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{f.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-[60px] bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-border/30 relative overflow-hidden group shadow-2xl">
                <img
                  src="/stay-organized.jpg"
                  alt="Organization Illustration"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Compact */}
      <section className="py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="relative p-12 md:p-16 rounded-[40px] bg-foreground text-background overflow-hidden group shadow-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                Stop managing tasks.<br />
                Start achieving <span className="text-primary italic">results.</span>
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <Link to="/auth">
                  <Button size="lg" className="bg-background text-foreground hover:bg-background/90 text-xl px-12 h-16 rounded-full font-bold shadow-2xl">
                    Launch App Now
                  </Button>
                </Link>
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-foreground bg-muted overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 69}`} alt="User" />
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full border-4 border-foreground bg-primary flex items-center justify-center text-[10px] font-black text-white">
                    +2.4k
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-16 pb-12 bg-card/10 border-t border-border/30 overflow-hidden relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[200px] bg-primary/5 blur-[120px] rounded-[100%] pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16 text-center md:text-left">
            <div className="col-span-2 lg:col-span-2 flex flex-col items-center md:items-start">
              <AnimatedLogo size="lg" showTagline={true} className="mb-6" />
              <p className="text-muted-foreground/80 max-w-sm mb-6 text-base leading-relaxed">
                TaskFlow is a comprehensive productivity ecosystem built for teams that move fast.
                We combine intuitive design with powerful automation to help you focus on what
                actually matters—shipping great work.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-widest text-xs opacity-50 mb-1">Product</h4>
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">Features</Link>
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">Community</Link>
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">Enterprise</Link>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-widest text-xs opacity-50 mb-1">Company</h4>
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">About Us</Link>
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">Careers</Link>
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact</Link>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-widest text-xs opacity-50 mb-1">Socials</h4>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-2xl bg-card border border-border/30 hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1">
                  <Github className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-2xl bg-card border border-border/30 hover:bg-blue-400 hover:text-white transition-all transform hover:-translate-y-1">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-2xl bg-card border border-border/30 hover:bg-blue-600 hover:text-white transition-all transform hover:-translate-y-1">
                  <Linkedin className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <span className="text-xs text-muted-foreground tracking-widest font-bold">© 2026 TASKFLOW STUDIO</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-black italic tracking-widest text-primary/40">
              BUILDING THE FUTURE OF WORK
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}