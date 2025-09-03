# User Approval System

This document describes the implementation of the user approval system for the ArchPlan application.

## Overview

The user approval system implements a three-state user management workflow:
- **Pending**: New users who have registered but await admin approval
- **Approved**: Users who have been approved and can access the application
- **Rejected**: Users who have been rejected with a reason

## Backend Implementation

### Database Schema Updates

The user schema has been extended with new fields:

```typescript
interface IUser extends Document {
  // ... existing fields
  password?: string; // Added for user authentication
  status: 'pending' | 'approved' | 'rejected'; // Approval status
  rejectionReason?: string; // Rejection reason
  comparePassword(candidatePassword: string): Promise<boolean>; // Password comparison
}
```

### Authentication Routes

#### User Registration (`POST /api/auth/register`)
- Creates new user with `status: 'pending'`
- Validates email uniqueness
- Hashes password using bcrypt
- Returns success message indicating approval is required

#### User Login (`POST /api/auth/login`)
- Validates user credentials
- Checks user status:
  - **Pending**: Returns 403 with "pending approval" message
  - **Rejected**: Returns 403 with rejection reason
  - **Approved**: Generates JWT token and allows login

#### User Logout (`POST /api/auth/logout`)
- Clears authentication cookies
- Invalidates user session

#### Get Current User (`GET /api/auth/me`)
- Validates JWT token
- Returns current user information

### Admin Routes

#### Get Pending Users (`GET /api/admin/pending-users`)
- Returns list of users with `status: 'pending'`
- Requires admin authentication

#### Get All Users (`GET /api/admin/users`)
- Returns paginated list of users
- Supports filtering by status
- Requires admin authentication

#### Approve User (`POST /api/admin/approve-user/:userId`)
- Changes user status to `'approved'`
- Clears any rejection reason
- Requires admin authentication

#### Reject User (`POST /api/admin/reject-user/:userId`)
- Changes user status to `'rejected'`
- Requires rejection reason in request body
- Requires admin authentication

#### User Statistics (`GET /api/admin/user-stats`)
- Returns counts of users by status
- Requires admin authentication

## Frontend Implementation

### Authentication Components

#### SignupForm
- Handles user registration
- Shows success message about approval requirement
- Validates form data (password confirmation, email format, etc.)

#### LoginForm
- Handles user authentication
- Shows appropriate messages for different user states:
  - **Pending**: "Your account is pending approval"
  - **Rejected**: Shows rejection reason
  - **Approved**: Proceeds with login

#### AuthPage
- Combines login and signup forms
- Toggle between login and signup modes

### Admin Dashboard

#### AdminUserApproval Component
- Lists all users with their status
- Provides approve/reject actions for pending users
- Shows user statistics
- Filters users by status
- Modal dialog for rejection reasons

### Route Protection

#### Public Routes
- `/auth` - Authentication page (login/signup)
- `/` - Landing page
- Protected routes (`/app`, `/search`) redirect to `/auth` if not authenticated

#### Admin Routes
- `/admin/*` - Admin dashboard (separate from user authentication)
- Requires admin authentication

## User Flow

### 1. User Registration
```
User fills signup form → POST /api/auth/register → User created with status: 'pending' → Success message shown
```

### 2. Admin Approval Process
```
Admin logs into admin dashboard → Views pending users → Approves/rejects users → User status updated
```

### 3. User Login
```
User attempts login → System checks status:
├─ Pending → Shows "awaiting approval" message
├─ Rejected → Shows rejection reason
└─ Approved → Generates JWT → User logged in
```

### 4. Protected Access
```
Approved user accesses protected routes → JWT validated → User can use application
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 12
- **JWT Authentication**: Secure token-based authentication for approved users
- **HTTP-Only Cookies**: JWT tokens stored in secure, HTTP-only cookies
- **Admin Separation**: Admin authentication is completely separate from user authentication
- **Status Validation**: All login attempts validate user approval status

## Testing

Run the test script to verify the system:

```bash
node test-user-approval.js
```

This will test:
- User creation with pending status
- Password hashing and validation
- User approval workflow
- User rejection with reason
- Status-based queries
- User statistics

## Environment Variables

Ensure these environment variables are set:

```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
COOKIE_HTTP_ONLY=true
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
MONGODB_URI=your-mongodb-connection-string
```

## API Endpoints Summary

### User Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Admin Management
- `GET /api/admin/pending-users` - Get pending users
- `GET /api/admin/users` - Get all users (with pagination)
- `POST /api/admin/approve-user/:userId` - Approve user
- `POST /api/admin/reject-user/:userId` - Reject user
- `GET /api/admin/user-stats` - Get user statistics

## Error Handling

The system provides clear error messages for different scenarios:

- **Duplicate Email**: "User with this email already exists"
- **Invalid Credentials**: "Invalid credentials"
- **Pending Approval**: "Your account is pending approval"
- **Account Rejected**: "Your account has been rejected: [reason]"
- **Missing Rejection Reason**: "Rejection reason is required"

## Future Enhancements

Potential improvements to consider:
- Email notifications for approval/rejection
- Bulk user approval/rejection
- User profile management
- Password reset functionality
- Account reactivation for rejected users
- Audit logging for admin actions
