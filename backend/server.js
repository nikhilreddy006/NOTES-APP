const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
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
  title: { type: String, required: true },
  content: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Note = mongoose.model('Note', noteSchema);

// API Routes
// Get all notes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find().sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific note
app.get('/api/notes/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ id: req.params.id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new note
app.post('/api/notes', async (req, res) => {
  try {
    const { id, title, content } = req.body;
    const note = new Note({
      id: id || require('uuid').v4(),
      title: title || 'Untitled Note',
      content: content || ''
    });
    await note.save();
    
    // Emit to all connected clients
    io.emit('noteCreated', note);
    
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a note
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findOneAndUpdate(
      { id: req.params.id },
      { 
        title, 
        content, 
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Emit to all connected clients
    io.emit('noteUpdated', note);
    
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ id: req.params.id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Emit to all connected clients
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
      const { id, title, content } = data;
      const note = await Note.findOneAndUpdate(
        { id },
        { 
          title, 
          content, 
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

