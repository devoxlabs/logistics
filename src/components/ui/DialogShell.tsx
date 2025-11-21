import React, { useState, useEffect } from 'react';

export function DialogShell(props: {
    title: string;
    search: string;
    setSearch: (v: string) => void;
    onClose: () => void;
    children: React.ReactNode;
}) {
    const { title, search, setSearch, onClose, children } = props;
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setIsMounted(true));
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);
    return (
        <div className={`fixed inset-0 z-40 flex items-start justify-center bg-black/0 transition-opacity duration-300 px-4 py-10 ${isMounted ? 'bg-black/40' : ''}`}>
            <div className={`w-full max-w-4xl rounded-xl bg-white shadow-lg border border-slate-200 max-h-full overflow-hidden flex flex-col transform transition-all duration-300 ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'>
                    <h2 className='text-sm md:text-base font-semibold text-slate-900'>{title}</h2>
                    <button
                        type='button'
                        onClick={onClose}
                        className='group inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground/60 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:rotate-90 focus:outline-none focus:ring-2 focus:ring-destructive/20 cursor-pointer'
                        aria-label='Close'
                    >
                        <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </button>
                </div>
                <div className='px-4 py-3 border-b border-slate-100'>
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder='Search by any field (name, city, commodity, consignee, etc.)'
                        className='w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary'
                    />
                </div>
                <div className='flex-1 overflow-auto px-4 py-3'>{children}</div>
            </div>
        </div>
    );
}
