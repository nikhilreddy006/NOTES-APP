import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Plus, FileText, Trash2, Search, GripVertical } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import axios from 'axios';
import io from 'socket.io-client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserButton, useAuth } from '@clerk/clerk-react';
import './App.css';

const API_BASE_URL = 'https://notes-app-backend-41ic.onrender.com';

function SortableNoteCard({ note, selectedNote, onSelect, onDelete }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <>
      <div ref={setNodeRef} style={style}>
        <Card
          className={`mb-1 cursor-pointer transition-colors hover:bg-accent ${
            selectedNote?.id === note.id ? 'bg-accent' : ''
          }`}
          onClick={() => onSelect(note)}
        >
          <CardHeader className="pb-1 px-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div {...attributes} {...listeners} className="cursor-grab">
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                </div>
                <CardTitle className="text-xs truncate flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  {note.title}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="h-5 w-5 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-3">
            <p className="text-xs text-muted-foreground truncate">
              {note.content.replace(/[#*`]/g, '').substring(0, 40)}...
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {new Date(note.updatedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{note.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(note.id);
                setShowDeleteDialog(false);
              }}
              className="bg-black text-white hover:bg-black/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function App() {
  const { getToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    // Listen for real-time note updates
    newSocket.on('noteCreated', (note) => {
      setNotes(prev => [note, ...prev]);
    });

    newSocket.on('noteUpdated', (updatedNote) => {
      setNotes(prev => prev.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      
      // Update selected note if it's the one being updated
      if (selectedNote && selectedNote.id === updatedNote.id) {
        setSelectedNote(updatedNote);
      }
    });

    newSocket.on('noteDeleted', ({ id }) => {
      setNotes(prev => prev.filter(note => note.id !== id));
      
      // Clear selected note if it was deleted
      if (selectedNote && selectedNote.id === id) {
        setSelectedNote(null);
      }
    });

    return () => newSocket.close();
  }, [selectedNote]);

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched notes:', response.data);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const createNote = async () => {
    try {
      const token = await getToken();
      const newNote = {
        title: 'Untitled Note',
        content: '# New Note\n\nStart writing your markdown content here...'
      };
      
      const response = await axios.post(`${API_BASE_URL}/notes`, newNote, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedNote(response.data);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const updateNote = async (noteId, updates) => {
    try {
      const token = await getToken();
      await axios.put(`${API_BASE_URL}/notes/${noteId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Emit real-time update via Socket.IO
      if (socket) {
        socket.emit('noteUpdate', { id: noteId, ...updates });
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE_URL}/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleNoteSelect = (note) => {
    setSelectedNote(note);
    
    // Join the note room for real-time collaboration
    if (socket) {
      socket.emit('joinNote', note.id);
    }
  };

  const handleContentChange = (value) => {
    if (selectedNote) {
      const updatedNote = { ...selectedNote, content: value };
      setSelectedNote(updatedNote);
      
      // Debounced update to avoid too many API calls
      clearTimeout(window.updateTimeout);
      window.updateTimeout = setTimeout(() => {
        updateNote(selectedNote.id, { 
          title: selectedNote.title, 
          content: value 
        });
      }, 1000);
    }
  };

  const handleTitleChange = (newTitle) => {
    if (selectedNote) {
      const updatedNote = { ...selectedNote, title: newTitle };
      setSelectedNote(updatedNote);
      updateNote(selectedNote.id, { 
        title: newTitle, 
        content: selectedNote.content 
      });
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setNotes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Notes App</h1>
        <UserButton afterSignOutUrl="/" />
      </header>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Notes App</h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <Button onClick={createNote} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="p-2">
              {/* Temporarily removed DndContext and SortableContext for debugging */}
              {
                filteredNotes.map((note) => (
                  <SortableNoteCard
                    key={note.id}
                    note={note}
                    selectedNote={selectedNote}
                    onSelect={handleNoteSelect}
                    onDelete={deleteNote}
                  />
                ))
              }
              
              {filteredNotes.length === 0 && (
                <div className="text-center text-muted-foreground mt-8">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notes found</p>
                  <p className="text-xs">Create your first note to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedNote ? (
            <>
              {/* Note Header */}
              <div className="p-4 border-b border-border bg-card">
                <Input
                  value={selectedNote.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-lg font-semibold border-none bg-transparent p-0 focus-visible:ring-0"
                  placeholder="Note title..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {new Date(selectedNote.updatedAt).toLocaleString()}
                </p>
              </div>
              
              {/* Markdown Editor */}
              <div className="flex-1 p-4">
                <MDEditor
                  value={selectedNote.content}
                  onChange={handleContentChange}
                  height={`calc(100vh - 180px)`}
                  preview="edit"
                  hideToolbar={false}
                  data-color-mode="light"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Welcome to Notes App</h2>
                <p className="mb-4">Select a note from the sidebar or create a new one to get started</p>
                <Button onClick={createNote}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
