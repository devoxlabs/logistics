import { useEffect, useState, ReactNode } from 'react';

type DetailDialogProps = {
    title: string;
    onClose: () => void;
    children: ReactNode;
    widthClass?: string;
};

export default function DetailDialog({ title, onClose, children, widthClass = 'max-w-3xl' }: DetailDialogProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const frame = requestAnimationFrame(() => setMounted(true));
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            cancelAnimationFrame(frame);
            document.body.style.overflow = originalOverflow;
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-start justify-center px-4 py-10 overflow-y-auto ${
                mounted ? 'bg-black/50' : 'bg-black/0'
            } transition-colors duration-300`}
        >
            <div
                className={`w-full ${widthClass} rounded-2xl bg-white shadow-2xl border border-slate-200 max-h-full overflow-hidden flex flex-col transform transition-all duration-300 ${
                    mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                }`}
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="group inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 cursor-pointer"
                        aria-label="Close details"
                    >
                        <svg
                            className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
            </div>
        </div>
    );
}
