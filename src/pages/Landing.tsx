import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Kanban, Bell, Users, Calendar, Zap } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.1),transparent_50%)]" />
      </div>

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/">
          <h1 className="text-2xl font-bold gradient-text cursor-pointer" >
            TaskFlow
          </h1>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button>
                  Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        {/* Hero Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-8">
            <Zap className="h-4 w-4" />
            Smart Task Management
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground max-w-4xl mx-auto leading-tight">
            Organize your work,{' '}
            <span className="gradient-text">achieve more</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
            A powerful yet simple task management system for individuals and teams.
            Drag, drop, collaborate, and deliver on time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8">
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Free to start
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Demo Preview with Dummy Tasks */}
      <section className="py-16 relative overflow-hidden">
        {/* Section Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            <div className="relative p-8 md:p-12">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {[
                  { title: 'To Do', tasks: ['Design new logo', 'Update website', 'Review PRs', 'Plan sprint'] },
                  { title: 'In Progress', tasks: ['Build dashboard', 'Fix bugs'] },
                  { title: 'Done', tasks: ['Setup project', 'Create components', 'Add authentication'] }
                ].map((column, i) => (
                  <div key={column.title} className="flex-shrink-0 w-72 glass rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      {column.title}
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {column.tasks.length}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {column.tasks.map((task, j) => (
                        <div key={j} className="bg-background/50 rounded-lg p-3 border border-border/30 hover:border-primary/30 transition-colors">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-foreground mb-1">{task}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                <span className="text-xs text-muted-foreground">High Priority</span>
                              </div>
                            </div>
                            {/* Task Icon */}
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="relative h-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-muted/50" />
        <svg className="absolute bottom-0 w-full h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0 C300,120 600,0 900,60 C1050,90 1125,60 1200,90 L1200,120 L0,120 Z" fill="currentColor" className="text-muted/30" />
        </svg>
      </div>

      {/* Features */}
      <section className="py-24 relative" id="features">
        {/* Section Background */}
        <div className="absolute inset-0 bg-muted/10" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Everything you need to{' '}
              <span className="gradient-text">stay organized</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              TaskFlow comes packed with features designed to help you and your team
              manage work efficiently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass rounded-xl p-6 glass-hover group"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="relative h-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
        <svg className="absolute top-0 w-full h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,120 C300,0 600,120 900,60 C1050,30 1125,60 1200,30 L1200,0 L0,0 Z" fill="currentColor" className="text-muted/30" />
        </svg>
      </div>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        {/* Section Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5" />
        
        {/* Animated background elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white/10,transparent_50%)]" />
            
            <div className="relative z-10 py-16 px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to boost your productivity?
              </h2>
              <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
                Join thousands of teams already using TaskFlow to manage their work.
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider before Footer */}
      <div className="relative h-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-muted/30" />
        <svg className="absolute top-0 w-full h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0 C300,120 600,0 900,60 C1050,90 1125,60 1200,90 L1200,120 L0,120 Z" fill="currentColor" className="text-muted/20" />
        </svg>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-2xl font-bold gradient-text">TaskFlow</div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TaskFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
