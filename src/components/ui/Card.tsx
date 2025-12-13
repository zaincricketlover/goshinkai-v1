import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
    action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    title,
    description,
    action,
    ...props
}) => {
    return (
        <motion.div
            className={cn("glass rounded-2xl overflow-hidden", className)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            {...props}
        >
            {(title || description || action) && (
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-start">
                    <div>
                        {title && <h3 className="text-lg font-bold leading-6 text-white">{title}</h3>}
                        {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="px-6 py-4">
                {children}
            </div>
        </motion.div>
    );
};
