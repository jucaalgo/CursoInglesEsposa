import React from 'react';
import { cn } from './Button'; // Reusing cn utility

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
}

const Card: React.FC<CardProps> = ({ className, title, description, children, ...props }) => {
    return (
        <div
            className={cn(
                "bg-gray-800/50 border border-gray-700 rounded-xl shadow-sm text-gray-100 overflow-hidden backdrop-blur-sm",
                className
            )}
            {...props}
        >
            {(title || description) && (
                <div className="p-6 pb-2">
                    {title && <h3 className="text-xl font-semibold leading-none tracking-tight">{title}</h3>}
                    {description && <p className="text-sm text-gray-400 mt-2">{description}</p>}
                </div>
            )}
            <div className="p-6 pt-2">{children}</div>
        </div>
    );
};

export default Card;
