import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

type InputType = 'text' | 'email' | 'url' | 'phone' | 'alphanumeric' | 'numeric';

export function sanitizeHTML(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'target'],
        ALLOW_DATA_ATTR: false,
    });
}

export function sanitizeText(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

export function sanitizeEmail(email: string): string {
    const trimmed = email.trim().toLowerCase();
    if (!validator.isEmail(trimmed)) {
        throw new Error('Invalid email format');
    }
    return validator.normalizeEmail(trimmed) || trimmed;
}

export function sanitizeURL(url: string): string {
    const trimmed = url.trim();
    if (
        !validator.isURL(trimmed, {
            protocols: ['http', 'https'],
            require_protocol: true,
        })
    ) {
        throw new Error('Invalid URL format');
    }
    return trimmed;
}

export function sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
}

export function sanitizeAlphanumeric(input: string): string {
    return input.replace(/[^a-zA-Z0-9-_]/g, '');
}

export function sanitizeNumeric(input: string): string {
    return input.replace(/[^0-9.]/g, '');
}

const SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\*|;|'|"|\\)/g,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
    /(UNION.*SELECT)/gi,
];

export function detectSQLInjection(input: string): boolean {
    return SQL_PATTERNS.some((pattern) => pattern.test(input));
}

const SCRIPT_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi,
];

export function detectScriptInjection(input: string): boolean {
    return SCRIPT_PATTERNS.some((pattern) => pattern.test(input));
}

export function sanitizeFormInput(input: string, type: InputType = 'text', maxLength = 1000): string {
    if (detectScriptInjection(input)) {
        throw new Error('Invalid input: Script injection detected');
    }
    if (detectSQLInjection(input)) {
        throw new Error('Invalid input: SQL injection pattern detected');
    }
    if (input.length > maxLength) {
        throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }

    switch (type) {
        case 'email':
            return sanitizeEmail(input);
        case 'url':
            return sanitizeURL(input);
        case 'phone':
            return sanitizePhone(input);
        case 'alphanumeric':
            return sanitizeAlphanumeric(input);
        case 'numeric':
            return sanitizeNumeric(input);
        case 'text':
        default:
            return sanitizeText(input);
    }
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized = { ...obj };

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key as keyof T] = sanitizeText(value) as T[keyof T];
        } else if (Array.isArray(value)) {
            sanitized[key as keyof T] = value.map((item) =>
                typeof item === 'string' ? sanitizeText(item) : item
            ) as T[keyof T];
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key as keyof T] = sanitizeObject(value as Record<string, unknown>) as T[keyof T];
        }
    }

    return sanitized;
}

export function generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
    return Boolean(token && storedToken && token === storedToken);
}

export function getCSPDirectives(): string {
    const directives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://firebasestorage.googleapis.com https://*.googleapis.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ];
    return directives.join('; ');
}
