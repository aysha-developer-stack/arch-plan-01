@echo off
echo Installing client dependencies...
cd client
call npm install @radix-ui/themes @radix-ui/react-slot @radix-ui/react-icons
cd ..

echo Installing server dependencies...
cd server
call npm install cors @types/cors @types/cookie-parser @types/jsonwebtoken
cd ..

echo All dependencies installed successfully!
pause
