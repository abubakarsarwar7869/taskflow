interface GradientOrbsProps {
    className?: string;
}

export function GradientOrbs({ className = '' }: GradientOrbsProps) {
    return (
        <>
            {/* Purple Orb */}
            <div
                className={`absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${className}`}
            />

            {/* Cyan Orb */}
            <div
                className={`absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${className}`}
                style={{ animationDelay: '2s' }}
            />

            {/* Violet Orb */}
            <div
                className={`absolute bottom-1/4 left-1/3 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${className}`}
                style={{ animationDelay: '4s' }}
            />
        </>
    );
}
