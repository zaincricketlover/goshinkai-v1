import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    id,
    icon,
    ...props
}) => {
    const inputId = id || props.name;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    {...props}
                    id={inputId}
                    className={cn(
                        "w-full bg-surface-elevated border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all",
                        icon && "pl-10",
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        </div>
    );
};
