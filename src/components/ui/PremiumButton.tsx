"use client";

import { motion } from 'framer-motion';
import React from 'react';

interface PremiumButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
    children,
    onClick,
    className = "",
    disabled = false
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            disabled={disabled}
            className={`relative overflow-hidden px-8 py-3 bg-gradient-to-r from-accent to-accent-light text-primary font-bold rounded-xl shadow-lg shadow-accent/20 group disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] group-hover:left-[200%] transition-all duration-1000 ease-out" />
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>
        </motion.button>
    );
};
