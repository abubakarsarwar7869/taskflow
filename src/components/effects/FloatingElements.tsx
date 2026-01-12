interface FloatingElementsProps {
    className?: string;
}

export function FloatingElements({ className = '' }: FloatingElementsProps) {
    return (
        <>
            {/* Square Element */}
            <div className={`absolute top-1/4 left-10 animate-float ${className}`}>
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/30 to-transparent rounded-2xl backdrop-blur-sm border border-purple-500/20 transform rotate-12" />
            </div>

            {/* Circle Element */}
            <div
                className={`absolute bottom-1/4 right-10 animate-float ${className}`}
                style={{ animationDelay: '1s' }}
            >
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/30 to-transparent rounded-full backdrop-blur-sm border border-cyan-500/20" />
            </div>

            {/* Small Square Element */}
            <div
                className={`absolute top-1/2 left-1/4 animate-float ${className}`}
                style={{ animationDelay: '2s' }}
            >
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500/30 to-transparent rounded-xl backdrop-blur-sm border border-violet-500/20 transform -rotate-12" />
            </div>
        </>
    );
}
