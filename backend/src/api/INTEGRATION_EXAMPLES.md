# Rate Limiting & Input Sanitization Integration Guide

This guide shows how to integrate the new security middleware into your existing API endpoints.

## Quick Start

### 1. Update Create Appointment Endpoint

**Before:**
```typescript
middleware: [errorHandlerMiddleware, clerkAuthMiddleware]
```

**After:**
```typescript
import { RateLimiters } from './rate-limit.middleware.js'
import { SanitizationPresets } from './sanitization.middleware.js'

middleware: [
  errorHandlerMiddleware,
  clerkAuthMiddleware,
  RateLimiters.moderate,        // 30 requests/minute per user
  SanitizationPresets.medicalNotes  // Sanitize notes/reason fields
]
```

---

## Recommended Configuration by Endpoint

### **Appointment Endpoints**

#### Create Appointment
```typescript
// create-appointment.step.ts
middleware: [
  errorHandlerMiddleware,
  clerkAuthMiddleware,
  RateLimiters.moderate,          // Prevent spam bookings
  SanitizationPresets.medicalNotes // Clean user input
]
```

#### List Appointments (User)
```typescript
// list-appointments.step.ts
middleware: [
  errorHandlerMiddleware,
  clerkAuthMiddleware,
  RateLimiters.lenient  // 100 requests/minute for reads
]
```

#### Cancel Appointment
```typescript
// cancel-appointment.step.ts
middleware: [
  errorHandlerMiddleware,
  clerkAuthMiddleware,
  RateLimiters.moderate,  // Prevent abuse
]
```

---

### **User Endpoints**

#### Update User Profile
```typescript
// update-user.step.ts
import { sanitizationMiddleware } from './sanitization.middleware.js'

middleware: [
  errorHandlerMiddleware,
  clerkAuthMiddleware,
  RateLimiters.moderate,
  sanitizationMiddleware({
    stripHTML: true,
    fieldsToStrip: ['firstName', 'lastName'],  // Names should be plain text
    maxLength: 100
  })
]
```

---

### **Doctor Endpoints**

#### List Doctors (Public)
```typescript
// list-doctors.step.ts
middleware: [
  errorHandlerMiddleware,
  RateLimiters.perIP  // Rate limit by IP for unauthenticated users
]
```

#### Create Doctor (Admin)
```typescript
// create-doctor.step.ts
import { sanitizationMiddleware } from './sanitization.middleware.js'

middleware: [
  errorHandlerMiddleware,
  clerkAuthMiddleware,
  adminAuthMiddleware,
  RateLimiters.strict,  // 5 requests per 15 min for admin operations
  sanitizationMiddleware({
    stripHTML: true,
    fieldsToStrip: ['name', 'email', 'phone', 'bio'],
    maxLength: 2000
  })
]
```

---

### **Admin Endpoints**

#### Admin Stats & List All Appointments
```typescript
// admin/stats.step.ts
// list-all-appointments.step.ts
middleware: [
  errorHandlerMiddleware,
  clerkAuthMiddleware,
  adminAuthMiddleware,
  RateLimiters.moderate
]
```

---

## Custom Rate Limiting

### Example: Stricter limits for specific operations

```typescript
import { createRateLimiter } from './rate-limit.middleware.js'

// Custom rate limiter for password reset (if you add this feature)
const passwordResetLimiter = createRateLimiter({
  maxRequests: 3,
  windowSeconds: 3600,  // 3 attempts per hour
  errorMessage: 'Too many password reset attempts. Please try again in 1 hour.'
})

// Custom rate limiter per email (not per user)
const emailBasedLimiter = createRateLimiter({
  maxRequests: 10,
  windowSeconds: 300,  // 5 minutes
  keyExtractor: (req) => {
    const email = req.body?.email || 'unknown'
    return `email:${email}`
  }
})
```

---

## Custom Sanitization

### Example: Field-specific sanitization

```typescript
import { sanitizationMiddleware, FieldSanitizers } from './sanitization.middleware.js'

// For updating doctor bio with more control
const bioSanitizer = sanitizationMiddleware({
  stripHTML: true,
  removeSQL: false,
  maxLength: 5000,
  fieldsToStrip: ['bio', 'speciality']
})

// Or manual sanitization in handler
export const handler: any = async (req, ctx) => {
  const { email, phone } = req.body

  // Manually sanitize specific fields
  const sanitizedEmail = FieldSanitizers.email(email)
  const sanitizedPhone = FieldSanitizers.phone(phone)

  // ... rest of logic
}
```

---

## Testing Rate Limiting

### Test with curl:
```bash
# Test rate limiting - make 35 requests rapidly
for i in {1..35}; do
  curl -X POST http://localhost:4001/api/appointments \
    -H "x-clerk-user-id: test-user-123" \
    -H "Content-Type: application/json" \
    -d '{"doctorId":"doc1","date":"2026-02-01","time":"10:00"}'
  echo "\nRequest $i"
done

# Should see 429 errors after 30 requests (moderate limit)
```

---

## Testing Sanitization

### Test XSS prevention:
```bash
# Try to inject HTML/script
curl -X POST http://localhost:4001/api/appointments \
  -H "x-clerk-user-id: test-user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "doc1",
    "date": "2026-02-01",
    "time": "10:00",
    "reason": "<script>alert(\"XSS\")</script>Normal reason"
  }'

# The reason field will be sanitized to:
# "&lt;script&gt;alert(\"XSS\")&lt;/script&gt;Normal reason"
# or stripped to: "Normal reason" (if using stripHTML: true)
```

---

## Monitoring

### Check logs for rate limiting events:
```bash
# Look for these log messages:
# - "Rate limit exceeded" - User hit the limit
# - "Rate limit initialized" - First request in window
# - "Rate limit window reset" - Window expired, counter reset
```

### Check logs for sanitization events:
```bash
# Look for:
# - "Request body sanitized" - Input was modified for security
# - "Sanitization error" - Invalid input detected
```

---

## Response Headers

Rate limiting adds these headers to responses:

```
X-RateLimit-Limit: 30          # Max requests allowed
X-RateLimit-Remaining: 27      # Requests remaining
X-RateLimit-Reset: 2026-01-03T10:30:00Z  # When counter resets
Retry-After: 45                # (Only on 429) Seconds until retry
```

---

## Important Notes

### Order of Middleware Matters!

**Correct order:**
```typescript
middleware: [
  errorHandlerMiddleware,    // 1. Catch all errors
  clerkAuthMiddleware,       // 2. Authenticate user
  adminAuthMiddleware,       // 3. Check admin (if needed)
  rateLimiter,              // 4. Check rate limits
  sanitizationMiddleware,   // 5. Clean input
]
```

**Why this order?**
1. Error handler wraps everything to catch errors
2. Auth runs first to identify the user (needed for rate limiting)
3. Admin check (if applicable)
4. Rate limiting prevents abuse before processing
5. Sanitization cleans input before validation

### What NOT to do:

❌ **Don't put rate limiting before auth:**
```typescript
// BAD - rate limiter won't know who the user is
middleware: [errorHandlerMiddleware, rateLimiter, clerkAuthMiddleware]
```

❌ **Don't put sanitization after Zod validation:**
```typescript
// BAD - validation might fail on unsanitized input
// Sanitization should happen BEFORE bodySchema.parse()
```

---

## Complete Example: Update create-appointment.step.ts

Here's what a fully secured endpoint looks like:

```typescript
import { ApiRouteConfig } from 'motia'
import { z } from 'zod'
import { clerkAuthMiddleware, errorHandlerMiddleware, prisma } from './_shared.step.js'
import { RateLimiters } from './rate-limit.middleware.js'
import { SanitizationPresets } from './sanitization.middleware.js'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'CreateAppointment',
  description: 'Book a new appointment',
  path: '/api/appointments',
  method: 'POST',
  emits: ['appointment.created'],
  flows: ['appointment-management'],
  middleware: [
    errorHandlerMiddleware,           // Catch errors
    clerkAuthMiddleware,              // Authenticate
    RateLimiters.moderate,            // 30 req/min
    SanitizationPresets.medicalNotes  // Clean input
  ],
  bodySchema,
  responseSchema: { /* ... */ },
}

// Handler stays the same!
export const handler: any = async (req, ctx) => {
  // Input is already authenticated, rate-limited, and sanitized
  // by the time it reaches here
  // ...
}
```

---

## Next Steps

1. ✅ Add rate limiting to all create/update endpoints
2. ✅ Add sanitization to all endpoints accepting user input
3. ✅ Test with malicious input to verify protection
4. ✅ Monitor logs for abuse patterns
5. ⚠️ Consider adjusting limits based on production traffic patterns

---

## Questions?

- **"Will this slow down my API?"** - Minimal impact (~1-2ms per request). Redis lookups are very fast.
- **"What if Redis is down?"** - Rate limiter gracefully fails open (allows requests but logs error).
- **"Can I disable for development?"** - Yes, use environment variable check in middleware.
- **"What about existing appointments with HTML?"** - Only new input is sanitized. Consider a migration script for old data.
