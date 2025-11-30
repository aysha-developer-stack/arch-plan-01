# Admin Authentication Setup Guide

This guide will help you set up and test the admin authentication flow for the DataMuse application.

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB (running locally or accessible)

## Setup Instructions

### 1. Install Dependencies

Run the following commands to install all required dependencies:

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/datamuse

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1h

# CORS (frontend URL)
CORS_ORIGIN=http://localhost:3000
```

### 3. Start the Development Servers

#### Start the backend server:
```bash
cd server
npm run dev
```

#### Start the frontend development server (in a new terminal):
```bash
cd client
npm run dev
```

## Testing the Admin Authentication

### 1. Create an Admin User

You'll need to create an admin user in your MongoDB database. You can use MongoDB Compass or run this script:

```javascript
// create-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./server/src/models/Admin');
const config = require('./server/src/config');

async function createAdmin() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    
    const admin = new Admin({
      email: 'admin@example.com',
      password: 'admin123' // Will be hashed by the pre-save hook
    });
    
    await admin.save();
    console.log('Admin user created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
```

Run the script:
```bash
node create-admin.js
```

### 2. Test the Authentication Flow

1. Open your browser and navigate to: `http://localhost:3000/admin/login`
2. Log in with the admin credentials you created
3. You should be redirected to the admin dashboard
4. Test the logout functionality

### 3. Run Automated Tests

You can run the automated test script to verify the API endpoints:

```bash
node test-auth.js
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the `CORS_ORIGIN` in your `.env` file matches your frontend URL
2. **Database Connection**: Make sure MongoDB is running and the connection string is correct
3. **JWT Errors**: Verify the `JWT_SECRET` is set and consistent
4. **Cookie Issues**: Ensure cookies are being set with the correct domain and secure settings

## Security Notes

- Always use strong, unique passwords for admin accounts
- Never commit sensitive information to version control
- Use environment variables for all sensitive configuration
- In production, always use HTTPS and secure cookies
- Regularly rotate your JWT secret key
