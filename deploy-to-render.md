# 🚀 ArchPlan Render Deployment Guide

## Quick Deploy Checklist

### 1. Go to Render.com
- Visit: https://render.com
- Click "Get Started for Free" or "Sign In"
- Connect your GitHub account

### 2. Create New Web Service
- Click "New +" button (top right)
- Select "Web Service"
- Choose "Connect a repository"
- Find and select your ArchPlan repository

### 3. Configure Service Settings

**Basic Info:**
```
Name: archplan
Region: Oregon (US West) or closest to you
Branch: main
Runtime: Node
```

**Build & Deploy:**
```
Build Command: npm install && npm run build
Start Command: npm start
```

### 4. Environment Variables
Click "Advanced" and add these environment variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb://archplan:Archplan1234%24@ac-wetjcv6-shard-00-00.jsicxbh.mongodb.net:27017,ac-wetjcv6-shard-00-01.jsicxbh.mongodb.net:27017,ac-wetjcv6-shard-00-02.jsicxbh.mongodb.net:27017/Archplan?replicaSet=atlas-eacbt0-shard-0&ssl=true&authSource=admin
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=7d
SESSION_SECRET=your_session_secret_key_here_change_this_in_production
```

**Important:** After deployment, update CORS_ORIGIN to your Render URL:
```
CORS_ORIGIN=https://your-app-name.onrender.com
```

### 5. Deploy
- Click "Create Web Service"
- Wait 3-5 minutes for build to complete
- Your app will be live at: `https://your-app-name.onrender.com`

## Troubleshooting

### If Build Fails:
1. Check build logs in Render dashboard
2. Ensure all dependencies are in package.json
3. Verify Node.js version compatibility

### If App Doesn't Start:
1. Check if PORT environment variable is set to 10000
2. Verify start command is `npm start`
3. Check server logs for errors

### If Database Connection Fails:
1. Verify MONGODB_URI is correct
2. Check MongoDB Atlas network access settings
3. Ensure database user has proper permissions

## Post-Deployment Steps

1. **Update CORS_ORIGIN** environment variable with your Render URL
2. **Test file upload functionality**
3. **Verify admin login works**
4. **Check MongoDB connection**

## Free Tier Limits
- 750 hours/month (enough for most projects)
- Apps sleep after 15 minutes of inactivity
- Cold start time: ~10-30 seconds

Your app is now ready for Render deployment! 🎉
