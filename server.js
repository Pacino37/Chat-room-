const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const roomState = {
  // keep track of participants in the single "room"
  participants: new Set()
};

io.on('connection', (socket) => {
  console.log('Connected', socket.id);

  socket.on('set username', (username) => {
    socket.username = username || 'guest';
    socket.emit('system message', `Welcome ${socket.username}`);
    socket.broadcast.emit('system message', `${socket.username} has joined the site`);
  });

  socket.on('chat message', (text) => {
    io.emit('chat message', { user: socket.username || socket.id, text });
  });

  // Video room join: add to participants and notify others
  socket.on('join-room', () => {
    roomState.participants.add(socket.id);
    // let the new client know all existing sockets (so it can create offers/answers properly)
    const others = Array.from(roomState.participants).filter(id => id !== socket.id);
    socket.emit('all-users', others);

    // notify others to create offers to the new client
    socket.broadcast.emit('user-joined', socket.id);
  });

  // Signaling: offers/answers/ice
  socket.on('offer', (data) => {
    const { to, sdp } = data;
    if (to && io.sockets.sockets.get(to)) {
      io.to(to).emit('offer', { from: socket.id, sdp });
    }
  });
  socket.on('answer', (data) => {
    const { to, sdp } = data;
    if (to && io.sockets.sockets.get(to)) {
      io.to(to).emit('answer', { from: socket.id, sdp });
    }
  });
  socket.on('ice-candidate', (data) => {
    const { to, candidate } = data;
    if (to && io.sockets.sockets.get(to)) {
      io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    }
  });

  // Admin action broadcast
  socket.on('admin-action', (action) => {
    // Optionally check socket.username === 'admin' before broadcasting
    if (socket.username && socket.username.toLowerCase() === 'admin') {
      io.emit('admin-action', action);
    } else {
      socket.emit('system message', 'You are not authorized as administrator.');
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected', socket.id);
    roomState.participants.delete(socket.id);
    socket.broadcast.emit('user-left', socket.id);
    if (socket.username) socket.broadcast.emit('system message', `${socket.username} left`);
  });
});

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
