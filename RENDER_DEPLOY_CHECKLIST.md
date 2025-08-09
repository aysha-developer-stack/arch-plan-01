# ✅ Render Deployment Checklist

## Pre-Deployment (Already Done ✅)
- [x] Removed all Vercel files
- [x] Created render.yaml configuration
- [x] Committed and pushed to GitHub
- [x] Package.json has correct build/start scripts

## Render Dashboard Setup (Do This Now)

### 1. Create Account & Service
1. Go to: **https://render.com**
2. Sign up/login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your **ArchPlan repository**

### 2. Service Configuration
```
Name: archplan
Region: Oregon (US West)
Branch: main
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

### 3. Environment Variables (Copy-Paste Ready)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb://archplan:Archplan1234%24@ac-wetjcv6-shard-00-00.jsicxbh.mongodb.net:27017,ac-wetjcv6-shard-00-01.jsicxbh.mongodb.net:27017,ac-wetjcv6-shard-00-02.jsicxbh.mongodb.net:27017/Archplan?replicaSet=atlas-eacbt0-shard-0&ssl=true&authSource=admin
JWT_SECRET=archplan_jwt_secret_2024_production_key_change_this
JWT_EXPIRES_IN=7d
SESSION_SECRET=archplan_session_secret_2024_production_change_this
CORS_ORIGIN=*
```

### 4. Deploy
- Click **"Create Web Service"**
- Wait 3-5 minutes for build
- Your app will be at: `https://archplan.onrender.com`

## Post-Deployment
1. Update CORS_ORIGIN to your actual Render URL
2. Test file uploads
3. Verify admin login
4. Check database connection

## Expected Timeline
- Account setup: 2 minutes
- Service configuration: 3 minutes
- Build & deploy: 5 minutes
- **Total: ~10 minutes**

Your app is ready for Render! 🚀
