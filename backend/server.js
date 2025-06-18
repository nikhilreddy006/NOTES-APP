const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();
const app = express();

app.use(express.json());

// Clerk middleware
function verifyClerkToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error("No Authorization header provided.");
    return res.sendStatus(401);
  }

  const token = authHeader.split(" ")[1];
  const clerkPublicKey = process.env.CLERK_JWT_PUBLIC_KEY;

  console.log("Clerk Public Key loaded:", !!clerkPublicKey); // Should be true
  console.log("First 30 chars of Public Key:", clerkPublicKey ? clerkPublicKey.slice(0, 30) : "N/A");
  console.log("Token received (first 30 chars):", token ? token.slice(0, 30) : "N/A");

  try {
    const payload = jwt.verify(token, clerkPublicKey, { algorithms: ["RS256"] });
    req.user = payload;
    console.log("JWT Verified successfully. User ID:", payload.sub); // Success log
    next();
  } catch (err) {
    console.error("JWT verification error:", err.message); // THIS IS CRUCIAL
    console.error("Full JWT verification error object:", err); // More details
    res.status(401).json({ message: "Unauthorized", error: err.message });
  }
}

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notesapp';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Note Schema
const noteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // Clerk user ID
  title: { type: String, required: true },
  content: { type: String, default: '' },
  pinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Note = mongoose.model('Note', noteSchema);

// API Routes
// Get all notes for the authenticated user
app.get('/api/notes', verifyClerkToken, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.sub }).sort({ pinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific note for the authenticated user
app.get('/api/notes/:id', verifyClerkToken, async (req, res) => {
  try {
    const note = await Note.findOne({ id: req.params.id, userId: req.user.sub });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new note for the authenticated user
app.post('/api/notes', verifyClerkToken, async (req, res) => {
  try {
    const { id, title, content, pinned } = req.body;
    const note = new Note({
      id: id || require('uuid').v4(),
      userId: req.user.sub,
      title: title || 'Untitled Note',
      content: content || '',
      pinned: pinned || false,
    });
    
    console.log("Attempting to save new note:", note);
    await note.save();
    console.log("Note saved successfully:", note.id);
    
    io.emit('noteCreated', note);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note (database save failed):', error.message);
    console.error('Full error object for note creation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a note for the authenticated user
app.put('/api/notes/:id', verifyClerkToken, async (req, res) => {
  try {
    const { title, content, pinned } = req.body;
    const note = await Note.findOneAndUpdate(
      { id: req.params.id, userId: req.user.sub },
      { title, content, pinned, updatedAt: new Date() },
      { new: true }
    );
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    io.emit('noteUpdated', note);
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a note for the authenticated user
app.delete('/api/notes/:id', verifyClerkToken, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ id: req.params.id, userId: req.user.sub });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    io.emit('noteDeleted', { id: req.params.id });
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle real-time note updates
  socket.on('noteUpdate', async (data) => {
    try {
      const { id, title, content, pinned } = data;
      const note = await Note.findOneAndUpdate(
        { id },
        { 
          title, 
          content, 
          pinned,
          updatedAt: new Date() 
        },
        { new: true }
      );
      
      if (note) {
        // Broadcast to all other clients (excluding sender)
        socket.broadcast.emit('noteUpdated', note);
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  });
  
  // Handle joining a note room for collaborative editing
  socket.on('joinNote', (noteId) => {
    socket.join(`note-${noteId}`);
    console.log(`User ${socket.id} joined note room: ${noteId}`);
  });
  
  // Handle leaving a note room
  socket.on('leaveNote', (noteId) => {
    socket.leave(`note-${noteId}`);
    console.log(`User ${socket.id} left note room: ${noteId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

