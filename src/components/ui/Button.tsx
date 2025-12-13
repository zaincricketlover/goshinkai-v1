import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1C] disabled:opacity-50 disabled:pointer-events-none active:scale-95';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg shadow-blue-900/20',
        secondary: 'bg-surface-elevated text-white hover:bg-gray-700 focus:ring-gray-500 border border-white/10',
        outline: 'border border-white/20 bg-transparent hover:bg-white/5 text-white focus:ring-blue-500',
        ghost: 'bg-transparent hover:bg-white/5 text-gray-300 hover:text-white focus:ring-gray-500',
        gold: 'bg-gradient-to-r from-[#E5D4A1] via-[#C9A962] to-[#9A7B3A] text-[#0A0F1C] hover:brightness-110 focus:ring-[#C9A962] shadow-lg shadow-[#C9A962]/20 font-bold',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-12 px-6 text-base',
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {children}
        </button>
    );
};
