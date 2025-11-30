@echo off
set MONGODB_URI=mongodb://archplan:Archplan1234%%24@ac-wetjcv6-shard-00-00.jsicxbh.mongodb.net:27017,ac-wetjcv6-shard-00-01.jsicxbh.mongodb.net:27017,ac-wetjcv6-shard-00-02.jsicxbh.mongodb.net:27017/Archplan?replicaSet=atlas-eacbt0-shard-0&ssl=true&authSource=admin
set JWT_SECRET=railway_archplan_jwt_secret_2024_production_key
set JWT_EXPIRES_IN=7d
set SESSION_SECRET=railway_archplan_session_secret_2024_production_key
set CORS_ORIGIN=http://localhost:5173
cd server
npm run dev
