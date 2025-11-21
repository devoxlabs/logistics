import React from 'react';

export function BackButton(props: { onClick: () => void }) {
    return (
        <button
            type='button'
            onClick={props.onClick}
            className='group mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-all duration-200 hover:bg-muted hover:shadow hover:-translate-x-0.5 cursor-pointer'
        >
            <svg className='h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
            </svg>
            Back to search
        </button>
    );
}
