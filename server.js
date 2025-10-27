const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {}; // { roomId: { users:[{id,username}], adminId } }
const ADMIN_PASS = 'admin123'; // Change for production!

io.on('connection', (socket) => {
  console.log('New socket connected', socket.id);

  socket.on('join-room', ({ roomId, username, muted }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = { users: [], adminId: null };
    rooms[roomId].users.push({ id: socket.id, username });

    io.to(roomId).emit('user-list', rooms[roomId].users);
    socket.emit('joined-success', { id: socket.id, room: roomId, username });
    socket.to(roomId).emit('user-joined', { id: socket.id, username });
  });

  socket.on('admin-login', ({ roomId, password }) => {
    if (password === ADMIN_PASS) {
      rooms[roomId] = rooms[roomId] || { users: [], adminId: null };
      rooms[roomId].adminId = socket.id;
      io.to(socket.id).emit('admin-login-result', { success: true });
    } else {
      io.to(socket.id).emit('admin-login-result', { success: false, message: 'Wrong password' });
    }
  });

  socket.on('chat message', (msg) => {
    io.to(msg.roomId).emit('chat message', msg);
  });

  // ============ WebRTC signaling ============
  socket.on('ready-for-call', ({ roomId }) => {
    const otherUsers = rooms[roomId]?.users.filter(u => u.id !== socket.id) || [];
    socket.emit('all-users', otherUsers.map(u => u.id));
  });

  socket.on('offer', ({ to, sdp }) => io.to(to).emit('offer', { from: socket.id, sdp }));
  socket.on('answer', ({ to, sdp }) => io.to(to).emit('answer', { from: socket.id, sdp }));
  socket.on('ice-candidate', ({ to, candidate }) => io.to(to).emit('ice-candidate', { from: socket.id, candidate }));

  // Raise hand
  socket.on('raise-hand', (data) => {
    io.to(data.roomId).emit('raise-hand', data);
  });

  // ============ Admin actions ============
  socket.on('admin-action', (action) => {
    const room = rooms[action.roomId];
    if (!room) return;
    if (socket.id !== room.adminId) return; // only admin can send

    if (action.target) {
      io.to(action.target).emit('admin-action', action);
    } else {
      io.to(action.roomId).emit('admin-action', action);
    }
  });

  socket.on('disconnect', () => {
    for (const [roomId, room] of Object.entries(rooms)) {
      const idx = room.users.findIndex(u => u.id === socket.id);
      if (idx !== -1) {
        room.users.splice(idx, 1);
        io.to(roomId).emit('user-list', room.users);
        io.to(roomId).emit('user-left', socket.id);
        if (room.adminId === socket.id) room.adminId = null;
      }
    }
  });
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
