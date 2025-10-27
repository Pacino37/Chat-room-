// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve static client files from "public"
app.use(express.static('public'));

// admin password read from .env
const ADMIN_PASS = process.env.ADMIN_PASS || '';

/**
 * Helper: list users in a room with their socket ids and usernames
 * returns array of { id, username, isAdmin }
 */
function getRoomUsers(room) {
  const roomSet = io.sockets.adapter.rooms.get(room);
  if (!roomSet) return [];
  const arr = [];
  for (const id of roomSet) {
    const s = io.sockets.sockets.get(id);
    if (!s) continue;
    arr.push({ id, username: s.username || 'guest', isAdmin: !!s.isAdmin });
  }
  return arr;
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // store username and room on the socket when client sets them
  socket.on('set username', (payload) => {
    // payload expected: { username, roomId } from client
    let username = 'guest' + Math.floor(Math.random() * 1000);
    let roomId = 'main-room';
    if (typeof payload === 'object' && payload !== null) {
      if (payload.username) username = payload.username;
      if (payload.roomId) roomId = payload.roomId;
    } else if (typeof payload === 'string') {
      username = payload;
    }

    socket.username = username;
    socket.room = roomId;

    console.log(`socket ${socket.id} set username=${username} room=${roomId}`);
    // don't auto-join here — client will call join-room when ready for video
  });

  // client informs server that it's ready to join signaling in a specific room
  socket.on('join-room', (roomId) => {
    // prefer socket.room if provided earlier
    const room = roomId || socket.room || 'main-room';
    socket.join(room);
    socket.room = room;

    // send list of existing user ids in room to the new connection
    // (client expects 'all-users' as an array of ids)
    const users = getRoomUsers(room).map(u => u.id).filter(id => id !== socket.id);
    socket.emit('all-users', users);

    // notify others a user-joined (so they can create offers to the new user)
    socket.to(room).emit('user-joined', socket.id);

    // broadcast updated room user list for UI (id, username, isAdmin)
    io.in(room).emit('room-users', getRoomUsers(room));

    // optional system message
    io.in(room).emit('system message', `${socket.username || 'A user'} joined the room.`);
  });

  // signaling: offer from A -> server forwards to B
  socket.on('offer', ({ to, sdp }) => {
    if (!to) return;
    io.to(to).emit('offer', { from: socket.id, sdp });
  });

  // signaling: answer from B -> forward to A
  socket.on('answer', ({ to, sdp }) => {
    if (!to) return;
    io.to(to).emit('answer', { from: socket.id, sdp });
  });

  // forwarding ICE candidates
  socket.on('ice-candidate', ({ to, candidate }) => {
    if (!to) return;
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // chat messages scoped to room
  socket.on('chat message', (data) => {
    // data expected: { text, roomId? }
    const room = (data && data.roomId) || socket.room || 'main-room';
    const text = (data && data.text) || data || '';
    const payload = { user: socket.username || 'guest', text };
    io.in(room).emit('chat message', payload);
  });

  // raise hand
  socket.on('raise-hand', (data) => {
    const room = (data && data.roomId) || socket.room || 'main-room';
    const username = (data && data.username) || socket.username || 'guest';
    io.in(room).emit('raise-hand', { username, id: socket.id });
  });

  // admin login: client emits 'admin-login' optionally with a room
  socket.on('admin-login', (room) => {
    if (ADMIN_PASS === '') {
      socket.emit('system message', 'Admin not configured on server.');
      return;
    }
    // client should have first sent password via separate event or we use setUsername payload?
    // For security we expect client to call admin-login only if server previously authenticated that socket:
    // But we'll allow password check through payload if provided as string:
    // (client in earlier UI called socket.emit('admin-login', room) without password; we instead rely on a separate event below)
    // To support the .env approach we expose a separate event 'admin-auth' that accepts the password:
    socket.emit('system message', 'Please authenticate with admin-auth (send password).');
  });

  // admin-auth: client sends password to become admin on this socket
  socket.on('admin-auth', (payload) => {
    // payload may be { password, roomId }
    const password = payload && payload.password ? payload.password : payload;
    const room = payload && payload.roomId ? payload.roomId : socket.room;
    if (password === ADMIN_PASS) {
      socket.isAdmin = true;
      if (room) socket.join(room);
      socket.emit('system message', 'Admin authentication successful.');
      // notify room users list update
      if (room) io.in(room).emit('room-users', getRoomUsers(room));
    } else {
      socket.emit('system message', 'Invalid admin password.');
    }
  });

  // admin actions: only allowed if socket.isAdmin is true
  socket.on('admin-action', (action) => {
    // action expected: { type: 'disable-video'|'enable-audio'|'mute-all', roomId? , targetId? }
    if (!socket.isAdmin) {
      socket.emit('system message', 'Not authorized: admin only.');
      return;
    }
    const room = action.roomId || socket.room;
    if (!room) return;

    // broadcast admin action to room (clients should handle UI changes)
    io.in(room).emit('admin-action', action);

    // optional system message
    io.in(room).emit('system message', `Admin performed action: ${action.type}`);
  });

  // client disconnect
  socket.on('disconnect', (reason) => {
    const room = socket.room;
    console.log(`socket disconnected ${socket.id} (${reason})`);
    if (room) {
      socket.to(room).emit('user-left', socket.id);
      // update user list
      io.in(room).emit('room-users', getRoomUsers(room));
      io.in(room).emit('system message', `${socket.username || 'A user'} left the room.`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
