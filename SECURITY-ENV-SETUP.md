# Secure Environment Variable Setup Guide

## 🔒 Security Alert Resolution

This guide helps you securely set up your environment variables after the GitGuardian security alert has been resolved.

## ✅ What We've Fixed

1. **Removed exposed secrets** from the repository
2. **Updated .gitignore** to prevent future .env file commits
3. **Replaced sensitive data** with placeholder values
4. **Committed security fixes** to GitHub

## 🔧 Setting Up Your Local Environment

### Step 1: Restore Your Environment Variables

You need to update your local `server/.env` file with your actual credentials:

```bash
# Navigate to server directory
cd server

# Edit the .env file
notepad .env
```

### Step 2: Replace Placeholder Values

Replace these placeholder values in `server/.env` with your actual credentials:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://archplan1:Data1234@cluster1.jsicxbh.mongodb.net/Archplan?retryWrites=true&w=majority&appName=Cluster1

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration
EMAIL_USER=archplan.vivid@gmail.com
EMAIL_PASSWORD=obst taqz lagh xfbu
```

### Step 3: Verify .env is Ignored

Confirm your .env file won't be committed:

```bash
git status
# Your .env file should NOT appear in the list
```

## 🛡️ Security Best Practices

### For Development
- ✅ Keep `.env` files local only
- ✅ Use `.env.example` for sharing structure
- ✅ Never commit actual credentials
- ✅ Use different credentials for dev/prod

### For Production Deployment
- 🔒 Use platform environment variables (Railway, Vercel, etc.)
- 🔒 Rotate secrets regularly
- 🔒 Use strong, unique passwords
- 🔒 Enable 2FA on all accounts

## 📋 Environment Variables Checklist

- [ ] MongoDB URI updated with your credentials
- [ ] JWT Secret set to a strong value
- [ ] Email credentials configured
- [ ] .env file not showing in `git status`
- [ ] Application running correctly

## 🚨 If You See This Alert Again

1. **Don't panic** - follow this guide
2. **Never commit .env files** - they're now in .gitignore
3. **Rotate compromised credentials** if they were exposed
4. **Check deployment platforms** for environment variable settings

## 📞 Need Help?

If you encounter issues:
1. Check that your .env file has the correct format
2. Verify your MongoDB connection string is valid
3. Ensure your email app password is correct
4. Test your application locally before deploying

---

**Remember**: Your actual passwords and secrets are safe - we only removed them from git history to prevent unauthorized access.