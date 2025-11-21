'use client';

import React from 'react';

interface FeatureHeaderProps {
    title: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
}

export default function FeatureHeader({ title, icon, actions }: FeatureHeaderProps) {
    return (
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-3 md:px-4 py-3'>
            <div className='flex items-center gap-2 md:gap-3 min-w-0'>
                {icon && (
                    <div className='flex h-7 w-7 md:h-8 md:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                        {icon}
                    </div>
                )}
                <h1 className='text-sm md:text-base lg:text-lg font-bold text-slate-900 tracking-tight truncate'>
                    {title}
                </h1>
            </div>
            {actions && (
                <div className='flex items-center gap-1.5 md:gap-2 w-full md:w-auto'>
                    {actions}
                </div>
            )}
        </div>
    );
}
