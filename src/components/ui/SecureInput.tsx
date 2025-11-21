'use client';

import React, { useState, useCallback } from 'react';
import { sanitizeFormInput, detectScriptInjection, detectSQLInjection } from '@/lib/security';

interface SecureInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    inputType?: 'text' | 'email' | 'url' | 'phone' | 'alphanumeric' | 'numeric';
    maxLength?: number;
    onValidationError?: (error: string) => void;
    className?: string;
}

export function SecureInput({
    value,
    onChange,
    inputType = 'text',
    maxLength = 1000,
    onValidationError,
    className = '',
    ...props
}: SecureInputProps) {
    const [error, setError] = useState<string | null>(null);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value;

            try {
                if (detectScriptInjection(rawValue)) {
                    const errorMsg = 'Invalid input: Script detected';
                    setError(errorMsg);
                    onValidationError?.(errorMsg);
                    return;
                }

                if (detectSQLInjection(rawValue)) {
                    const errorMsg = 'Invalid input: SQL pattern detected';
                    setError(errorMsg);
                    onValidationError?.(errorMsg);
                    return;
                }

                const sanitized = sanitizeFormInput(rawValue, inputType, maxLength);
                setError(null);
                onChange(sanitized);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Invalid input';
                setError(errorMsg);
                onValidationError?.(errorMsg);
            }
        },
        [inputType, maxLength, onChange, onValidationError]
    );

    return (
        <div className="w-full">
            <input
                {...props}
                value={value}
                onChange={handleChange}
                className={`${className} ${error ? 'border-red-500' : ''}`}
                maxLength={maxLength}
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}

interface SecureTextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
    onValidationError?: (error: string) => void;
    className?: string;
}

export function SecureTextArea({
    value,
    onChange,
    maxLength = 5000,
    onValidationError,
    className = '',
    ...props
}: SecureTextAreaProps) {
    const [error, setError] = useState<string | null>(null);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const rawValue = e.target.value;

            try {
                if (detectScriptInjection(rawValue)) {
                    const errorMsg = 'Invalid input: Script detected';
                    setError(errorMsg);
                    onValidationError?.(errorMsg);
                    return;
                }

                if (detectSQLInjection(rawValue)) {
                    const errorMsg = 'Invalid input: SQL pattern detected';
                    setError(errorMsg);
                    onValidationError?.(errorMsg);
                    return;
                }

                const sanitized = sanitizeFormInput(rawValue, 'text', maxLength);
                setError(null);
                onChange(sanitized);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Invalid input';
                setError(errorMsg);
                onValidationError?.(errorMsg);
            }
        },
        [maxLength, onChange, onValidationError]
    );

    return (
        <div className="w-full">
            <textarea
                {...props}
                value={value}
                onChange={handleChange}
                className={`${className} ${error ? 'border-red-500' : ''}`}
                maxLength={maxLength}
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}
