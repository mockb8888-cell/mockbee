# Role-Based Access Control (RBAC) Architecture

This document outlines the architecture, database schema, authentication flow, and middleware strategy for managing access to the interview platform across three user roles: **Admin**, **Public Users**, and **Admin-Created Premium Users**.

## 1. System Architecture & Auth Flow

### 1.1 Authentication Methods
- **Email/Password (Public Users):** Standard registration with email verification. Username login is explicitly disabled.
- **Admin-Provided Credentials (Admin-Created Users):** Users receive an initial email with temporary credentials or a magic link to set their password.
- **Admin Secure Login:** Multi-factor authentication (MFA) recommended, using strict email/password.

### 1.2 Authentication Flow (JWT)
1. User submits login credentials to `/api/auth/login`.
2. Backend verifies credentials and user `status` (Active, Suspended).
3. Backend generates two tokens:
   - **Access Token:** Short-lived JWT (e.g., 15-30 mins) containing `user_id`, `role`, and `subscription_status`.
   - **Refresh Token:** Long-lived, stored securely (HttpOnly cookie) to request new access tokens.
4. For any protected route, the client sends the Access Token in the `Authorization: Bearer <token>` header.
5. The `RoleMiddleware` checks the user's role against the required permissions of the route.

---

## 2. Database Schema (MongoDB Strategy)

### 2.1 Users Collection
Stores core user information and links to roles and subscriptions.

```javascript
// collection: 'users'
{
  _id: ObjectId("..."),
  email: "user@example.com",
  passwordHash: "bcrypt_hash_...",
  role: "PUBLIC" | "PREMIUM" | "ADMIN",
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  createdBy: ObjectId("...") || null, // If created by admin, stores admin's ID
  createdAt: ISODate("2024-05-11T..."),
  updatedAt: ISODate("2024-05-11T...")
}
```

### 2.2 Subscriptions Collection
Manages payment and access windows for public users.

```javascript
// collection: 'subscriptions'
{
  _id: ObjectId("..."),
  userId: ObjectId("..."), // Links to Users
  planId: "PRO_MONTHLY",
  status: "ACTIVE" | "EXPIRED" | "CANCELLED",
  startDate: ISODate("2024-05-11T..."),
  endDate: ISODate("2024-06-11T..."), // Expiration date
  paymentId: "stripe_ch_...", // Or other gateway ID
  createdAt: ISODate("2024-05-11T...")
}
```

### 2.3 Access Logs / Sessions (Optional but Recommended)
Monitors activity and session limits.

```javascript
// collection: 'sessions'
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  lastLogin: ISODate("..."),
  ipAddress: "192.168...",
  device: "Chrome / Windows"
}
```

---

## 3. Access Control Logic (Middleware)

### 3.1 Role Hierarchy & Permissions

| Resource/Action | Public User (No Sub) | Public User (Active Sub) | Admin-Created (Premium) | Admin |
| :--- | :--- | :--- | :--- | :--- |
| **Login/Profile** | Yes | Yes | Yes | Yes |
| **Start Interview** | No | Yes | Yes | Yes |
| **View Past Results**| Limited / No | Yes | Yes | Yes |
| **Admin Dashboard** | No | No | No | Yes |
| **Manage Users** | No | No | No | Yes |

### 3.2 Middleware Implementation Strategy (Python/FastAPI Example)

```python
from fastapi import Depends, HTTPException, status

def get_current_user(token: str = Depends(oauth2_scheme)):
    # 1. Decode JWT
    # 2. Check if token expired
    # 3. Fetch user from DB
    # 4. Return user dict
    pass

def require_role(allowed_roles: list):
    def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return user
    return role_checker

def require_interview_access(user: dict = Depends(get_current_user)):
    # Admins and Premium users have instant access
    if user["role"] in ["ADMIN", "PREMIUM"]:
        return user
        
    # Public users need an active subscription
    if user["role"] == "PUBLIC":
        subscription = get_active_subscription(user["_id"])
        if not subscription or subscription["status"] != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Active subscription required for interview access."
            )
    return user
```

---

## 4. Specific Workflows

### 4.1 Admin Creating a Premium User
1. Admin navigates to the dashboard `POST /api/admin/users`.
2. Admin provides `email`, `temporary_password`, and selects `PREMIUM` role.
3. System creates the user with `createdBy = admin_id` and `role = PREMIUM`.
4. No subscription record is created (or a lifetime generic subscription is created to unify logic).
5. User is sent an email to log in and optionally force-reset their password.

### 4.2 Public User Subscription Expiration
1. A cron job or database TTL (Time-To-Live) index automatically flags `subscriptions` as `EXPIRED` when `endDate` passes.
2. The next time the user tries to access `/api/interviews/start`, the `require_interview_access` middleware will see the expired status and block access.
3. The frontend catches the `402 Payment Required` and redirects the user to the billing/pricing page.

## 5. Security Best Practices
*   **Password Hashing:** Always use `bcrypt` or `Argon2` for storing passwords.
*   **No Username Login:** Enforce email-only login at the validation layer.
*   **Token Expiration:** Keep JWT access tokens short (15 mins) to ensure role/subscription changes take effect quickly when refresh tokens are used.
*   **Rate Limiting:** Protect login routes and interview initiation endpoints to prevent brute-force attacks and resource abuse.
