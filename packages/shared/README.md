# @chemist/shared

Shared schemas and type definitions for the Chemist application.

## Overview

This package contains shared Zod validation schemas and their inferred TypeScript types that are used across both the `@chemist/core` (backend) and `@chemist/class-app` (frontend) packages. All types are automatically generated from schemas using Zod's type inference, ensuring consistency between validation and type definitions.

## Schemas & Types

### Auth Schemas & Types

**Schemas:**
- `loginSchema` - For login validation (both server-side and client-side)
- `registerSchema` - For registration validation (server-side)
- `registerFormSchema` - For registration form validation (client-side, includes password confirmation)
- `sendOTPSchema` - For sending OTP (re-exported from registerFormSchema, includes phone, password, confirmPassword)
- `otpInputSchema` - For OTP input validation (client-side)
- `userSchema` - Complete user data structure
- `createUserInputSchema` - Input for creating new users
- `authUserSchema` - Simplified user data for authentication
- `sessionSchema` - User session data structure

**Inferred Types:**
- `LoginInput`, `RegisterInput`, `RegisterFormData`, `OTPFormData`
- `User`, `CreateUserInput`, `AuthUser`, `Session`

### OTP Schemas & Types

**Schemas:**
- `sendOTPSchema` - For sending OTP validation
- `otpSchema` - OTP data structure
- `createOTPInputSchema` - Input for creating OTP
- `verifyOTPInputSchema` - Input for verifying OTP

**Inferred Types:**
- `SendOTPInput`, `OTP`, `CreateOTPInput`, `VerifyOTPInput`

### WhatsApp Schemas & Types

**Schemas:**
- `sendMessageDataSchema` - Data structure for sending WhatsApp messages

**Inferred Types:**
- `SendMessageData`

## Usage

### In Core Package (Backend)

```typescript
import { loginSchema, registerSchema, CreateUserInput, User } from "@chemist/shared";

// Use in Hono routes
.post("/login", zValidator("json", loginSchema), async (c) => {
  const { phone, password } = c.req.valid("json");
  // ...
})

// Use entities in repositories and use cases
async createUser(userData: CreateUserInput): Promise<User> {
  // ...
}
```

### In Class App (Frontend)

```typescript
import { registerFormSchema, otpFormSchema, AuthUser } from "@chemist/shared";

// Use in React Hook Form
const form = useForm<RegisterFormData>({
  resolver: zodResolver(registerFormSchema),
  defaultValues: {
    phone: "",
    password: "",
    confirmPassword: "",
  },
});

// Use entities in state management
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}
```

## Benefits

1. **Schema-First Approach**: All types are automatically inferred from Zod schemas
2. **Consistency**: Same validation rules and types across frontend and backend
3. **DRY Principle**: No duplication of validation logic or type definitions
4. **Type Safety**: Automatic type inference ensures schemas and types are always in sync
5. **Maintainability**: Single source of truth for both validation and type definitions
6. **Runtime Validation**: Schemas can be used for both compile-time types and runtime validation
