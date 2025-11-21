// Placeholder component for features to be implemented
// This provides a professional "coming soon" UI

interface PlaceholderFeatureProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export default function PlaceholderFeature({
    title,
    description,
    icon,
}: PlaceholderFeatureProps) {
    return (
        <div className="h-full min-h-[60vh] md:min-h-full rounded-xl border border-slate-200 bg-white flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h1 className="text-sm md:text-base font-semibold text-slate-900">{title}</h1>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                {icon && <div className="mb-4 text-slate-300">{icon}</div>}
                <h2 className="text-lg font-semibold text-slate-700 mb-2">{title}</h2>
                <p className="text-sm text-slate-500 text-center max-w-md mb-6">{description}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm">
                    <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    <span>Feature in development</span>
                </div>
            </div>
        </div>
    );
}
