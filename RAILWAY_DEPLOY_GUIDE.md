# 🚀 ArchPlan Railway Deployment Guide

## Why Railway is Perfect for Your App
✅ **No payment info required** for free tier  
✅ **500 hours/month free** (plenty for your app)  
✅ **Native Node.js support**  
✅ **Automatic builds from GitHub**  
✅ **Environment variables made easy**  
✅ **File uploads work perfectly**  

## Super Simple 5-Minute Deployment

### Step 1: Go to Railway
1. Visit: **https://railway.app**
2. Click **"Login"** (top right)
3. Choose **"Continue with GitHub"**
4. Authorize Railway to access your repositories

### Step 2: Deploy Your App
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and click your **"ArchPlan"** repository
4. Click **"Deploy Now"**

### Step 3: Configure Environment Variables
1. After deployment starts, click on your **service/app**
2. Go to **"Variables"** tab
3. Click **"New Variable"** and add these one by one:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://archplan:Archplan1234%24@ac-wetjcv6-shard-00-00.jsicxbh.mongodb.net:27017,ac-wetjcv6-shard-00-01.jsicxbh.mongodb.net:27017,ac-wetjcv6-shard-00-02.jsicxbh.mongodb.net:27017/Archplan?replicaSet=atlas-eacbt0-shard-0&ssl=true&authSource=admin
JWT_SECRET=railway_archplan_jwt_secret_2024_production
JWT_EXPIRES_IN=7d
SESSION_SECRET=railway_archplan_session_secret_2024_production
```

### Step 4: Get Your App URL
1. Go to **"Settings"** tab
2. Find **"Domains"** section
3. Click **"Generate Domain"**
4. Your app will be available at: `https://your-app-name.up.railway.app`

### Step 5: Update CORS (After Deployment)
1. Add one more environment variable:
```
CORS_ORIGIN=https://your-app-name.up.railway.app
```
2. Replace `your-app-name` with your actual Railway domain

## What Railway Does Automatically
- ✅ Detects your Node.js app
- ✅ Runs `npm install`
- ✅ Runs `npm run build`
- ✅ Starts with `npm start`
- ✅ Provides HTTPS domain
- ✅ Auto-deploys on GitHub pushes

## Expected Timeline
- **Account setup**: 1 minute
- **Repository connection**: 1 minute  
- **Initial deployment**: 3-5 minutes
- **Environment variables**: 2 minutes
- **Total**: ~7 minutes

## Free Tier Limits
- **500 hours/month** (enough for most projects)
- **512 MB RAM**
- **1 GB disk space**
- **No credit card required**

## After Deployment
1. ✅ Test your app at the Railway URL
2. ✅ Try file uploads
3. ✅ Test admin login
4. ✅ Verify database connection

Your ArchPlan app will work exactly like it does locally! 🎉

## Troubleshooting
- **Build fails**: Check the build logs in Railway dashboard
- **App won't start**: Verify environment variables are set
- **Database issues**: Check MongoDB connection string
- **File uploads**: Should work automatically with Railway's file system

Railway is perfect for your Node.js/Express app! 🚀
