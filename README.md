# Notes App - Markdown & Real-time Sync

A full-stack Notes application built with the MERN stack (MongoDB, Express, React, Node.js) featuring a rich Markdown editor and real-time synchronization using Socket.IO.

## 🚀 Features

### Core Features
- **Rich Markdown Editor**: Full-featured markdown editor with live preview
- **Real-time Synchronization**: Changes sync instantly across multiple tabs/windows using Socket.IO
- **CRUD Operations**: Create, read, update, and delete notes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Search Functionality**: Search through notes by title and content
- **Auto-save**: Notes are automatically saved as you type

### Technical Features
- **MERN Stack**: MongoDB, Express.js, React, Node.js
- **Socket.IO**: Real-time bidirectional communication
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **RESTful API**: Clean API design for note operations
- **Database Persistence**: MongoDB for reliable data storage

## 🛠️ Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: MongoDB object modeling
- **Socket.IO**: Real-time communication
- **CORS**: Cross-origin resource sharing

### Frontend
- **React**: UI library
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: UI component library
- **Lucide React**: Icon library
- **@uiw/react-md-editor**: Markdown editor component
- **Axios**: HTTP client
- **Socket.IO Client**: Real-time client

## 📁 Project Structure

```
notes-app/
├── backend/
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   ├── .env              # Environment variables
│   └── node_modules/     # Backend dependencies
└── frontend/
    └── notes-frontend/
        ├── src/
        │   ├── App.jsx           # Main React component
        │   ├── App.css           # Styles
        │   ├── main.jsx          # Entry point
        │   └── components/       # UI components
        ├── index.html            # HTML template
        ├── package.json          # Frontend dependencies
        └── node_modules/         # Frontend dependencies
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or pnpm package manager

### 1. Clone and Setup

```bash
# Clone github repo 
git clone https://github.com/nikhilreddy006/NOTES-APP.git

# Navigate to the project directory
cd notes-app
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the backend server
npm run dev
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend/notes-frontend

# Install dependencies
pnpm install

# Start the development server
pnpm run dev --host
```

The frontend will start on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173` to start using the Notes App.

## 🎯 Usage Guide

### Creating Notes
1. Click the "+" button in the sidebar or "Create Your First Note" button
2. A new note will be created with default content
3. Edit the title in the header input field
4. Use the markdown editor to write your content

### Editing Notes
- **Title**: Click on the title field and type to change the note title
- **Content**: Use the rich markdown editor with toolbar buttons for formatting
- **Auto-save**: Changes are automatically saved after 1 second of inactivity

### Real-time Sync
- Open multiple tabs/windows of the application
- Changes made in one tab will instantly appear in other tabs
- The green indicator shows Socket.IO connection status

### Search
- Use the search box in the sidebar to find notes by title or content
- Search is case-insensitive and searches both title and content

### Deleting Notes
- Click the trash icon next to any note in the sidebar to delete it
- Deletion is permanent and syncs across all tabs

## 🔧 Configuration

### Environment Variables (Backend)
Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/notesapp
NODE_ENV=development
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get all notes |
| GET | `/api/notes/:id` | Get specific note |
| POST | `/api/notes` | Create new note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |

### Socket.IO Events

| Event | Description |
|-------|-------------|
| `noteCreated` | Broadcast when a new note is created |
| `noteUpdated` | Broadcast when a note is updated |
| `noteDeleted` | Broadcast when a note is deleted |
| `noteUpdate` | Client sends real-time updates |
| `joinNote` | Join a note room for collaboration |
| `leaveNote` | Leave a note room |

## 🚀 Production Deployment

### Backend Deployment
1. Set up MongoDB Atlas or a production MongoDB instance
2. Update the `MONGODB_URI` in your environment variables
3. Deploy to a service like Heroku, DigitalOcean, or AWS
4. Ensure the server listens on `0.0.0.0` for external access

### Frontend Deployment
1. Build the production version:
   ```bash
   pnpm run build
   ```
2. Deploy the `dist` folder to a static hosting service
3. Update API URLs to point to your production backend

## 🧪 Testing

The application has been thoroughly tested with:
- ✅ Note creation and editing
- ✅ Real-time synchronization
- ✅ Multiple notes management
- ✅ Search functionality
- ✅ Responsive design
- ✅ MongoDB operations
- ✅ Socket.IO connectivity

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Dark/Light Mode**: Automatic theme detection
- **Responsive Layout**: Works on all screen sizes
- **Intuitive Navigation**: Easy-to-use sidebar and editor
- **Visual Feedback**: Connection status indicators
- **Rich Markdown**: Support for all markdown features

## 🔮 Future Enhancements

Potential features for future development:
- User authentication and authorization
- Note sharing and collaboration
- File attachments and images
- Note categories and tags
- Export to PDF/HTML
- Offline support with sync
- Version history and backups

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

---


