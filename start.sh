#!/bin/bash

# Notes App Quick Start Script
echo "🚀 Starting Notes App..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "📦 Starting MongoDB..."
    sudo systemctl start mongod
    sleep 2
fi

# Start backend server in background
echo "🔧 Starting backend server..."
cd backend
PORT=5001 npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server..."
cd frontend/notes-frontend
pnpm run dev --host &
FRONTEND_PID=$!
cd ../..

echo "✅ Notes App is starting up!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:5001"
echo "🔍 MongoDB: mongodb://localhost:27017/notesapp"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait

