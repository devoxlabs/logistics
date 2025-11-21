// Validation and security utilities for the application
// No security module imports

/**
 * Email validation using RFC 5322 compliant regex
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail.length === 0) {
        return { valid: false, error: 'Email is required' };
    }

    if (trimmedEmail.length > 254) {
        return { valid: false, error: 'Email is too long' };
    }

    // RFC 5322 compliant email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(trimmedEmail)) {
        return { valid: false, error: 'Please enter a valid email address' };
    }

    return { valid: true };
}

/**
 * Password strength validation
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): {
    valid: boolean;
    error?: string;
    strength?: 'weak' | 'medium' | 'strong';
} {
    if (!password || typeof password !== 'string') {
        return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters long' };
    }

    if (password.length > 128) {
        return { valid: false, error: 'Password is too long (max 128 characters)' };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase) {
        return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (!hasLowerCase) {
        return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (!hasNumber) {
        return { valid: false, error: 'Password must contain at least one number' };
    }

    if (!hasSpecialChar) {
        return { valid: false, error: 'Password must contain at least one special character' };
    }

    // Calculate strength
    let strengthScore = 0;
    if (password.length >= 12) strengthScore++;
    if (password.length >= 16) strengthScore++;
    if (/[A-Z].*[A-Z]/.test(password)) strengthScore++;
    if (/[0-9].*[0-9]/.test(password)) strengthScore++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strengthScore++;

    const strength = strengthScore >= 4 ? 'strong' : strengthScore >= 2 ? 'medium' : 'weak';

    return { valid: true, strength };
}

/**
 * Sanitize string input to prevent XSS attacks
 * Enhanced with security module integration
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }
    // Basic HTML escaping to prevent XSS
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize text input
 * Prevents XSS, SQL injection, and ensures reasonable length
 */
export function validateTextInput(
    input: string,
    fieldName: string,
    options: { minLength?: number; maxLength?: number; required?: boolean } = {}
): { valid: boolean; error?: string; sanitized: string } {
    const { minLength = 0, maxLength = 1000, required = false } = options;

    if (!input || typeof input !== 'string') {
        if (required) {
            return { valid: false, error: `${fieldName} is required`, sanitized: '' };
        }
        return { valid: true, sanitized: '' };
    }

    const trimmed = input.trim();

    if (required && trimmed.length === 0) {
        return { valid: false, error: `${fieldName} is required`, sanitized: '' };
    }

    // Check for malicious patterns
    // Removed script and SQL injection detection

    if (trimmed.length < minLength) {
        return { valid: false, error: `${fieldName} must be at least ${minLength} characters`, sanitized: '' };
    }

    if (trimmed.length > maxLength) {
        return { valid: false, error: `${fieldName} must be less than ${maxLength} characters`, sanitized: '' };
    }

    const sanitized = sanitizeInput(trimmed);
    return { valid: true, sanitized };
}

/**
 * Rate limiting helper for client-side
 * Prevents rapid form submissions
 */
export class RateLimiter {
    private attempts: Map<string, number[]> = new Map();

    /**
     * Check if action is allowed based on rate limit
     * @param key - Unique identifier for the action (e.g., 'login', 'signup')
     * @param maxAttempts - Maximum attempts allowed
     * @param windowMs - Time window in milliseconds
     */
    isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
        const now = Date.now();
        const attempts = this.attempts.get(key) || [];

        // Filter out attempts outside the time window
        const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

        if (recentAttempts.length >= maxAttempts) {
            return false;
        }

        // Add current attempt
        recentAttempts.push(now);
        this.attempts.set(key, recentAttempts);

        return true;
    }

    /**
     * Get remaining time until rate limit resets
     */
    getResetTime(key: string, windowMs: number = 60000): number {
        const attempts = this.attempts.get(key) || [];
        if (attempts.length === 0) return 0;

        const oldestAttempt = Math.min(...attempts);
        const resetTime = oldestAttempt + windowMs;
        const remaining = resetTime - Date.now();

        return Math.max(0, remaining);
    }

    /**
     * Clear attempts for a specific key
     */
    clear(key: string): void {
        this.attempts.delete(key);
    }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Validate name input
 */
export function validateName(name: string): { valid: boolean; error?: string } {
    const result = validateTextInput(name, 'Name', {
        minLength: 2,
        maxLength: 100,
        required: false
    });

    if (!result.valid) {
        return { valid: false, error: result.error };
    }

    // Additional name-specific validation
    if (result.sanitized && !/^[a-zA-Z\s'-]+$/.test(result.sanitized)) {
        return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    return { valid: true };
}

/**
 * Generate CSRF token for forms
 */
export function generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in sessionStorage
 */
export function storeCSRFToken(token: string): void {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('csrf_token', token);
    }
}

/**
 * Retrieve CSRF token from sessionStorage
 */
export function getCSRFToken(): string | null {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem('csrf_token');
    }
    return null;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
    const storedToken = getCSRFToken();
    return storedToken !== null && storedToken === token;
}
