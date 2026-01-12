import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface AnimatedLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    onClick?: () => void;
    showTagline?: boolean;
    variant?: 'default' | 'white';
}

export function AnimatedLogo({
    className,
    size = 'md',
    onClick,
    showTagline = false,
    variant = 'default'
}: AnimatedLogoProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const sizes = {
        sm: 'h-6 w-6 text-lg',
        md: 'h-8 w-8 text-2xl',
        lg: 'h-12 w-12 text-4xl',
        xl: 'h-20 w-20 text-6xl',
    };

    const currentSizeClass = sizes[size] ? sizes[size].split(' ') : ['h-8', 'w-8', 'text-2xl'];

    return (
        <div
            className={cn("flex items-center gap-3 group cursor-pointer select-none", className)}
            onClick={onClick}
        >
            <div className={cn("relative flex items-center justify-center", currentSizeClass[0], currentSizeClass[1])}>
                <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full fill-none overflow-visible"
                >
                    {/* Outer Glow Ring */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        className="stroke-primary/5 stroke-[1px] animate-[spin_10s_linear_infinite]"
                        strokeDasharray="10 20"
                    />

                    {/* Primary Flowing Wave */}
                    <path
                        d="M20,50 C20,20 80,20 80,50 C80,80 20,80 20,50"
                        className="stroke-primary stroke-[6px] transition-all duration-700 group-hover:stroke-accent"
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: '188',
                            strokeDashoffset: '188',
                            animation: 'flow 3s ease-in-out infinite',
                        }}
                    />

                    {/* Advanced Inner Flow */}
                    <path
                        d="M35,50 C35,35 65,35 65,50 C65,65 35,65 35,50"
                        className="stroke-accent stroke-[3px] opacity-40 transition-all duration-700 group-hover:stroke-primary group-hover:opacity-100"
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: '100',
                            strokeDashoffset: '100',
                            animation: 'flow-reverse 2s linear infinite',
                            animationDelay: '0.5s'
                        }}
                    />

                    {/* Core Geometric Element */}
                    <g className="transition-transform duration-500 group-hover:scale-110">
                        <rect
                            x="44"
                            y="44"
                            width="12"
                            height="12"
                            rx="3"
                            className="fill-primary animate-pulse group-hover:fill-accent"
                        />
                        <rect
                            x="44"
                            y="44"
                            width="12"
                            height="12"
                            rx="3"
                            className="fill-none stroke-accent/50 stroke-[1px] animate-[ping_3s_ease-in-out_infinite]"
                        />
                    </g>
                </svg>

                {/* Ambient Particles */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-primary rounded-full blur-[1px] animate-float opacity-0 group-hover:opacity-60 transition-opacity"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.8}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-col">
                <span className={cn(
                    "font-black tracking-tighter transition-all duration-1000 transform",
                    isMounted ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
                    currentSizeClass[2]
                )}>
                    <span className={cn(
                        "italic",
                        variant === 'white' ? "text-white" : "text-foreground"
                    )}>Task</span>
                    <span className="gradient-text bg-[length:200%_auto] animate-shimmer">Flow</span>
                </span>
                {showTagline && (
                    <span className={cn(
                        "text-[10px] uppercase tracking-[0.2em] font-medium -mt-1 ml-1 opacity-60",
                        variant === 'white' ? "text-white/70" : "text-muted-foreground"
                    )}>
                        Work Smarter
                    </span>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes flow {
          0% { stroke-dashoffset: 376; filter: drop-shadow(0 0 2px var(--primary)); }
          50% { stroke-dashoffset: 188; filter: drop-shadow(0 0 8px var(--primary)); }
          100% { stroke-dashoffset: 0; filter: drop-shadow(0 0 2px var(--primary)); }
        }
        @keyframes flow-reverse {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 200; }
        }
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
        .group:hover path {
          animation-duration: 1s !important;
        }
      `}} />
        </div>
    );
}
