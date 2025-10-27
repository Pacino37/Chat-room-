const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Optional root route for Render health check
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle username setup
  socket.on('set username', (username) => {
    socket.username = username || 'Anonymous';
    socket.broadcast.emit('system message', `${socket.username} joined the chat`);
    console.log(`${socket.username} joined`);
  });

  // Handle chat messages
  socket.on('chat message', (msg) => {
    const message = {
      user: socket.username || 'Anonymous',
      text: msg
    };
    io.emit('chat message', message);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.username) {
      socket.broadcast.emit('system message', `${socket.username} left the chat`);
      console.log(`${socket.username} left`);
    }
  });
});

// ✅ Use Render’s dynamic port or fallback to 3000 locally
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
