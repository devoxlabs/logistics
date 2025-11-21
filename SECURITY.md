# Frontend Security Implementation Guide

## 🔒 Security Overview

This document outlines the comprehensive security measures implemented in the logistics application to protect against common web vulnerabilities including XSS (Cross-Site Scripting), SQL Injection, CSRF (Cross-Site Request Forgery), and other attack vectors.

---

## 🛡️ Security Layers

### 1. **HTTP Security Headers** (Middleware)

**Location:** `src/middleware.ts`

Automatically applied to all routes via Next.js middleware:

```typescript
// Security headers applied to every request
- Content-Security-Policy (CSP)
- X-Frame-Options: DENY (prevents clickjacking)
- X-Content-Type-Options: nosniff (prevents MIME sniffing)
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy (restricts camera, microphone, etc.)
- Strict-Transport-Security (enforces HTTPS)
```

**What it protects against:**
- ✅ Clickjacking attacks
- ✅ MIME type confusion
- ✅ XSS via browser vulnerabilities
- ✅ Unauthorized resource access
- ✅ Man-in-the-middle attacks (HTTPS enforcement)

---

### 2. **Input Sanitization** (Security Module)

**Location:** `src/lib/security.ts`

Comprehensive input sanitization functions:

#### Available Functions:

```typescript
// HTML Sanitization
sanitizeHTML(dirty: string): string
// Allows only safe HTML tags (b, i, em, strong, a, p, br)

// Text Sanitization (removes ALL HTML)
sanitizeText(input: string): string

// Email Sanitization
sanitizeEmail(email: string): string

// URL Sanitization (only http/https)
sanitizeURL(url: string): string

// Phone Sanitization
sanitizePhone(phone: string): string

// Alphanumeric Only
sanitizeAlphanumeric(input: string): string

// Numeric Only
sanitizeNumeric(input: string): string

// Comprehensive Form Input
sanitizeFormInput(input: string, type, maxLength): string
```

**What it protects against:**
- ✅ XSS attacks via user input
- ✅ HTML injection
- ✅ Script injection
- ✅ Malformed URLs
- ✅ Invalid email formats

---

### 3. **Injection Detection**

**Location:** `src/lib/security.ts`

Real-time detection of malicious patterns:

```typescript
// Detects SQL injection patterns
detectSQLInjection(input: string): boolean
// Checks for: SELECT, INSERT, UPDATE, DELETE, DROP, UNION, etc.

// Detects script injection
detectScriptInjection(input: string): boolean
// Checks for: <script>, javascript:, onclick=, eval(), etc.
```

**Patterns Detected:**
- SQL keywords (SELECT, INSERT, UPDATE, DELETE, DROP, etc.)
- SQL operators (OR, AND, UNION)
- SQL comments (-- , /* */)
- JavaScript protocols (javascript:)
- Event handlers (onclick, onload, etc.)
- Script tags (<script>, <iframe>, <object>)
- Dangerous functions (eval, expression)

**What it protects against:**
- ✅ SQL injection attempts
- ✅ Script injection via event handlers
- ✅ Iframe injection
- ✅ JavaScript protocol attacks

---

### 4. **Secure Input Components**

**Location:** `src/components/ui/SecureInput.tsx`

React components with built-in security:

```typescript
// Secure text input
<SecureInput
  value={value}
  onChange={setValue}
  inputType="text" // or "email", "url", "phone", "alphanumeric", "numeric"
  maxLength={1000}
  onValidationError={(error) => console.error(error)}
/>

// Secure textarea
<SecureTextArea
  value={value}
  onChange={setValue}
  maxLength={5000}
  onValidationError={(error) => console.error(error)}
/>
```

**Features:**
- Automatic sanitization on input
- Real-time injection detection
- Visual error feedback
- Type-specific validation
- Length enforcement

**What it protects against:**
- ✅ Real-time XSS prevention
- ✅ SQL injection in forms
- ✅ Buffer overflow (length limits)
- ✅ Invalid data types

---

### 5. **Enhanced Validation**

**Location:** `src/lib/validation.ts`

Integrated with security module for comprehensive validation:

```typescript
// Validates and sanitizes text with injection detection
validateTextInput(input, fieldName, options)

// Email validation
validateEmail(email)

// Password strength validation
validatePassword(password)

// Name validation
validateName(name)
```

**What it protects against:**
- ✅ Weak passwords
- ✅ Invalid email formats
- ✅ Injection attacks in form fields
- ✅ Excessively long inputs

---

### 6. **CSRF Protection**

**Location:** `src/lib/security.ts` & `src/lib/validation.ts`

Token-based CSRF protection:

```typescript
// Generate secure token
const token = generateSecureToken();

// Store in session
storeCSRFToken(token);

// Validate on form submission
const isValid = validateCSRFToken(submittedToken);
```

**Implementation:**
1. Generate token on page load
2. Store in sessionStorage
3. Include in form submissions
4. Validate on backend

**What it protects against:**
- ✅ Cross-Site Request Forgery
- ✅ Unauthorized state changes
- ✅ Session hijacking

---

### 7. **Rate Limiting**

**Location:** `src/lib/security.ts` & `src/lib/validation.ts`

Client-side rate limiting to prevent abuse:

```typescript
import { rateLimiter } from '@/lib/security';

// Check if action is allowed
if (!rateLimiter.isAllowed('login', 5, 60000)) {
  // Too many attempts
  const resetTime = rateLimiter.getResetTime('login', 60000);
  console.log(`Try again in ${resetTime}ms`);
  return;
}

// Proceed with action
```

**Configuration:**
- Default: 5 attempts per 60 seconds
- Customizable per action
- Automatic cleanup of old attempts

**What it protects against:**
- ✅ Brute force attacks
- ✅ Spam submissions
- ✅ API abuse
- ✅ DoS attempts

---

### 8. **Object Sanitization**

**Location:** `src/lib/security.ts`

Recursive sanitization for complex objects:

```typescript
// Sanitize entire object before sending to backend
const sanitizedData = sanitizeObject(formData);

// Example:
const customerData = {
  name: "<script>alert('xss')</script>John",
  email: "john@example.com",
  consignees: [
    { name: "Consignee 1" }
  ]
};

const safe = sanitizeObject(customerData);
// All string values are sanitized recursively
```

**What it protects against:**
- ✅ XSS in nested objects
- ✅ Injection in array items
- ✅ Complex payload attacks

---

## 🔧 Usage Examples

### Example 1: Secure Form Input

```typescript
import { SecureInput } from '@/components/ui/SecureInput';
import { useState } from 'react';

function MyForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <form>
      <SecureInput
        value={name}
        onChange={setName}
        inputType="text"
        placeholder="Name"
        maxLength={100}
      />
      
      <SecureInput
        value={email}
        onChange={setEmail}
        inputType="email"
        placeholder="Email"
        maxLength={254}
      />
    </form>
  );
}
```

### Example 2: Manual Sanitization

```typescript
import { sanitizeFormInput, sanitizeObject } from '@/lib/security';

// Single field
const safeName = sanitizeFormInput(userInput, 'text', 100);

// Entire object
const safeData = sanitizeObject({
  name: userInput.name,
  email: userInput.email,
  address: userInput.address
});
```

### Example 3: Injection Detection

```typescript
import { detectScriptInjection, detectSQLInjection } from '@/lib/security';

function validateInput(input: string) {
  if (detectScriptInjection(input)) {
    throw new Error('Script injection detected');
  }
  
  if (detectSQLInjection(input)) {
    throw new Error('SQL injection detected');
  }
  
  return true;
}
```

### Example 4: Rate Limiting

```typescript
import { rateLimiter } from '@/lib/security';

async function handleLogin(email: string, password: string) {
  // Check rate limit (5 attempts per minute)
  if (!rateLimiter.isAllowed('login', 5, 60000)) {
    const resetTime = rateLimiter.getResetTime('login', 60000);
    throw new Error(`Too many attempts. Try again in ${Math.ceil(resetTime / 1000)} seconds`);
  }
  
  // Proceed with login
  await login(email, password);
  
  // Clear rate limit on successful login
  rateLimiter.clear('login');
}
```

---

## ⚠️ Important Notes

### React's Built-in XSS Protection

React automatically escapes values in JSX:

```typescript
// ✅ SAFE - React escapes automatically
<div>{userInput}</div>

// ⚠️ DANGEROUS - Bypasses React's protection
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SAFE - Use sanitizeHTML first
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userInput) }} />
```

### Backend Validation is Essential

**Frontend security is NOT enough!**

All security measures implemented here are **client-side only**. They provide:
- User experience improvements
- Basic attack prevention
- Input validation feedback

**You MUST also implement:**
- Server-side validation
- Database parameterized queries
- Backend rate limiting
- Server-side CSRF validation
- Authentication/authorization checks

### SQL Injection Prevention

**Frontend detection is a UX feature, not security!**

Real SQL injection prevention requires:
1. **Parameterized queries** (Firebase Firestore is NoSQL, already safe)
2. **ORM/ODM** (Firestore SDK handles this)
3. **Input validation on backend**
4. **Principle of least privilege** (database permissions)

Since this app uses Firebase Firestore (NoSQL), it's inherently protected from SQL injection. The frontend detection helps catch suspicious patterns early.

---

## 🚀 Best Practices

### 1. Always Sanitize User Input

```typescript
// ❌ BAD
const customer = await createCustomer(formData);

// ✅ GOOD
const sanitized = sanitizeObject(formData);
const customer = await createCustomer(sanitized);
```

### 2. Use Secure Components

```typescript
// ❌ BAD
<input value={name} onChange={e => setName(e.target.value)} />

// ✅ GOOD
<SecureInput value={name} onChange={setName} inputType="text" />
```

### 3. Validate on Both Sides

```typescript
// Frontend
const result = validateTextInput(input, 'Name', { required: true });
if (!result.valid) {
  showError(result.error);
  return;
}

// Backend (in API route or Cloud Function)
if (!isValidName(input)) {
  return res.status(400).json({ error: 'Invalid name' });
}
```

### 4. Implement Rate Limiting

```typescript
// On sensitive operations
if (!rateLimiter.isAllowed('password-reset', 3, 300000)) {
  // Only 3 attempts per 5 minutes
  return;
}
```

### 5. Use HTTPS in Production

```typescript
// In production environment
if (process.env.NODE_ENV === 'production' && !request.secure) {
  return redirect('https://' + request.hostname + request.url);
}
```

---

## 📋 Security Checklist

Before deploying to production:

- [ ] All user inputs use `SecureInput` or manual sanitization
- [ ] CSRF tokens implemented on state-changing operations
- [ ] Rate limiting applied to auth endpoints
- [ ] HTTPS enforced in production
- [ ] Security headers configured in middleware
- [ ] Backend validation mirrors frontend validation
- [ ] Database uses parameterized queries (or NoSQL like Firestore)
- [ ] Sensitive data encrypted at rest
- [ ] Authentication tokens stored securely (httpOnly cookies)
- [ ] Regular security audits scheduled
- [ ] Dependencies updated regularly (`npm audit`)
- [ ] Error messages don't leak sensitive information
- [ ] File uploads validated and scanned
- [ ] API endpoints have proper authorization

---

## 🔍 Testing Security

### Manual Testing

```typescript
// Test XSS
const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  'javascript:alert("xss")',
  '<iframe src="javascript:alert(\'xss\')">',
];

xssPayloads.forEach(payload => {
  const result = detectScriptInjection(payload);
  console.assert(result === true, 'Should detect XSS');
});

// Test SQL Injection
const sqlPayloads = [
  "' OR '1'='1",
  '; DROP TABLE users--',
  'UNION SELECT * FROM passwords',
];

sqlPayloads.forEach(payload => {
  const result = detectSQLInjection(payload);
  console.assert(result === true, 'Should detect SQL injection');
});
```

### Automated Testing

```bash
# Install security testing tools
npm install -D @testing-library/react vitest

# Run security tests
npm run test:security
```

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

## 🆘 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [your-security-email]
3. Include detailed reproduction steps
4. Allow reasonable time for patching before disclosure

---

**Last Updated:** 2025-11-22  
**Security Version:** 1.0.0
