<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Chat + Video Room</title>
  <style>
    :root{--bg:#0f1724;--card:#0b1220;--muted:#94a3b8;--accent:#38bdf8;--glass: rgba(255,255,255,0.03)}
    *{box-sizing:border-box}
    body{margin:0;font-family:Inter,system-ui,Segoe UI,Roboto,Arial;color:#e6eef6;background:linear-gradient(180deg,#061221 0%, #071428 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:18px}
    #chat-wrapper{width:1200px;max-width:100%;display:flex;gap:18px}
    #auth-container, #main{background:var(--card);border-radius:12px;padding:18px;box-shadow:0 6px 24px rgba(2,6,23,0.6);color:#e6eef6}
    #auth-container{width:340px}
    #main{flex:1;display:flex;gap:18px;min-height:640px}
    h2{margin:0 0 12px 0;font-weight:600}
    input[type=text], input[type=password]{width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:inherit;margin-bottom:8px}
    button{padding:8px 12px;border-radius:8px;border:none;background:var(--accent);color:#012033;cursor:pointer;font-weight:600}
    button.ghost{background:transparent;color:var(--muted);border:1px solid rgba(255,255,255,0.04)}
    .box{background:var(--glass);padding:10px;border-radius:10px;margin-top:8px}
    #left{flex:0 0 520px;display:flex;flex-direction:column;gap:10px}
    #right{flex:1;display:flex;flex-direction:column;gap:10px}
    #messages{flex:1;overflow:auto;padding:10px;border-radius:8px;background:linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.02))}
    .message{padding:6px 8px;border-radius:6px;margin-bottom:6px;background:rgba(255,255,255,0.02)}
    #message-input-area{display:flex;gap:8px}
    #messageInput{flex:1;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:inherit}
    #controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    #videos{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;align-content:start;padding:6px;overflow:auto}
    .participant{background:rgba(255,255,255,0.02);border-radius:10px;padding:6px;display:flex;flex-direction:column;gap:6px;align-items:center;min-height:150px}
    .participant video{width:100%;height:140px;border-radius:8px;background:black;object-fit:cover}
    .participant .name{font-size:13px;color:var(--muted);width:100%;text-align:left;padding-left:6px}
    #adminControls{min-height:100px}
    #userList{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
    #userList li{display:flex;justify-content:space-between;align-items:center;padding:6px;border-radius:8px;background:rgba(0,0,0,0.15)}
    .small-btn{padding:6px 8px;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.04);color:var(--muted);cursor:pointer}
    .warn{background:#fb923c;color:#052018}
    @media (max-width:1100px){#chat-wrapper{flex-direction:column}#left{flex:auto}}
  </style>
</head>
<body>
  <div id="chat-wrapper">
    <!-- AUTH -->
    <div id="auth-container">
      <h2>Join Room</h2>
      <input id="username" placeholder="Enter your name" type="text" />
      <input id="roomId" placeholder="Room name" value="main-room" type="text" />
      <div style="display:flex;gap:8px">
        <button id="joinBtn">Join Room</button>
        <button id="joinMutedBtn" class="ghost">Join (Muted)</button>
      </div>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.04);margin:12px 0">
      <input id="adminPass" placeholder="Admin password" type="password" />
      <div style="display:flex;gap:8px">
        <button id="adminLogin">Login as Admin</button>
        <button id="adminLoginMute" class="ghost">Login (Muted)</button>
      </div>
      <div style="margin-top:12px;color:var(--muted);font-size:13px">
        Tip: the admin password is a placeholder ("admin123") — change it on the server for production.
      </div>
    </div>

    <!-- MAIN UI -->
    <div id="main" style="display:none;">
      <div id="left">
        <h2>Chat Room</h2>
        <div id="messages" class="box" aria-live="polite"></div>

        <div id="message-input-area">
          <input id="messageInput" type="text" placeholder="Type a message..." autocomplete="off" />
          <button id="sendBtn">Send</button>
        </div>

        <div id="controls" class="box">
          <button id="startVideoBtn">🎥 Start Video</button>
          <button id="stopVideoBtn" style="display:none;" class="ghost">⛔ Stop Video</button>

          <button id="raiseHandBtn" class="small-btn">✋ Raise Hand</button>
          <button id="muteBtn" class="small-btn">🔇 Mute</button>
          <button id="videoBtn" class="small-btn">📷 Toggle Video</button>

          <label style="display:flex;align-items:center;gap:6px;margin-left:6px">
            <input id="videoToggle" type="checkbox" checked/> Video
          </label>
          <label style="display:flex;align-items:center;gap:6px">
            <input id="audioToggle" type="checkbox" checked/> Audio
          </label>
        </div>

        <!-- Admin controls -->
        <div id="adminControls" class="box" style="display:none;">
          <h3>Administrator</h3>
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <button id="adminDisableVideo" class="warn">Disable All Video</button>
            <button id="adminEnableAudio" class="small-btn">Enable All Audio</button>
            <button id="muteAllBtn" class="small-btn">Mute All</button>
          </div>
          <div style="font-size:13px;color:var(--muted);margin-bottom:6px">Participants</div>
          <ul id="userList"></ul>
        </div>
      </div>

      <div id="right">
        <h2>Participants</h2>
        <div id="videos" class="videos-grid box"></div>
      </div>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    /* ===========================
       Variables & Elements
    ============================ */
    const socket = io();
    const usernameInput = document.getElementById('username');
    const roomIdInput = document.getElementById('roomId');
    const joinBtn = document.getElementById('joinBtn');
    const joinMutedBtn = document.getElementById('joinMutedBtn');
    const adminPassInput = document.getElementById('adminPass');
    const adminLoginBtn = document.getElementById('adminLogin');
    const adminLoginMuteBtn = document.getElementById('adminLoginMute');
    const authContainer = document.getElementById('auth-container');
    const mainUI = document.getElementById('main');
    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const videosEl = document.getElementById('videos');
    const adminControls = document.getElementById('adminControls');
    const adminDisableVideo = document.getElementById('adminDisableVideo');
    const adminEnableAudio = document.getElementById('adminEnableAudio');
    const muteAllBtn = document.getElementById('muteAllBtn');
    const userList = document.getElementById('userList');

    const startVideoBtn = document.getElementById('startVideoBtn');
    const stopVideoBtn = document.getElementById('stopVideoBtn');
    const raiseHandBtn = document.getElementById('raiseHandBtn');
    const muteBtn = document.getElementById('muteBtn');
    const videoBtn = document.getElementById('videoBtn');
    const videoToggle = document.getElementById('videoToggle');
    const audioToggle = document.getElementById('audioToggle');

    let username = '';
    let roomId = '';
    let mySocketId = null;
    let isAdmin = false;
    let localStream = null;
    const pcs = {};              // RTCPeerConnection objects keyed by remote socket id
    const remoteVideoEls = {};   // DOM elements keyed by remote socket id
    // Basic STUN servers - extend on server if needed (TURN required for NAT)
    const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    /* ===========================
       Helper UI functions
    ============================ */
    function appendMessage(text, type='msg') {
      const div = document.createElement('div');
      div.className = 'message';
      if (type === 'system') div.style.opacity = 0.9;
      div.textContent = text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function setJoinedUI() {
      authContainer.style.display = 'none';
      mainUI.style.display = 'flex';
    }

    function addLocalVideoElement() {
      if (!mySocketId) return;
      let el = document.getElementById('local-' + mySocketId);
      if (!el) {
        el = document.createElement('div');
        el.className = 'participant';
        el.id = 'local-' + mySocketId;
        el.innerHTML = `<div class="name">You (${escapeHtml(username)})</div><video autoplay playsinline muted></video>`;
        videosEl.prepend(el);
      }
      el.querySelector('video').srcObject = localStream;
    }

    function createRemoteVideoEl(id, displayName = id) {
      if (remoteVideoEls[id]) return remoteVideoEls[id];
      const el = document.createElement('div');
      el.className = 'participant';
      el.id = 'remote-' + id;
      el.innerHTML = `
        <div class="name">${escapeHtml(displayName)} — ${id}</div>
        <video autoplay playsinline></video>
      `;
      videosEl.appendChild(el);
      remoteVideoEls[id] = el;
      return el;
    }

    function removeRemoteVideoEl(id) {
      if (remoteVideoEls[id]) {
        remoteVideoEls[id].remove();
        delete remoteVideoEls[id];
      }
      const uLi = document.querySelector(`#userList li[data-id="${id}"]`);
      if (uLi) uLi.remove();
    }

    function updateUserList(users) {
      // users: [{id, username}]
      userList.innerHTML = '';
      users.forEach(u => {
        const li = document.createElement('li');
        li.dataset.id = u.id;
        li.innerHTML = `<div style="font-size:14px">${escapeHtml(u.username || 'guest')}</div>`;
        // Admin controls per user
        if (isAdmin) {
          const controls = document.createElement('div');
          controls.style.display = 'flex';
          controls.style.gap = '6px';
          const muteBtn = document.createElement('button');
          muteBtn.className = 'small-btn';
          muteBtn.textContent = 'Mute';
          muteBtn.onclick = () => socket.emit('admin-action', { type: 'mute-user', target: u.id, roomId });
          const unmuteBtn = document.createElement('button');
          unmuteBtn.className = 'small-btn';
          unmuteBtn.textContent = 'Unmute';
          unmuteBtn.onclick = () => socket.emit('admin-action', { type: 'unmute-user', target: u.id, roomId });
          const disableVideoBtn = document.createElement('button');
          disableVideoBtn.className = 'small-btn';
          disableVideoBtn.textContent = 'Disable Video';
          disableVideoBtn.onclick = () => socket.emit('admin-action', { type: 'disable-video-user', target: u.id, roomId });
          controls.appendChild(muteBtn);
          controls.appendChild(unmuteBtn);
          controls.appendChild(disableVideoBtn);
          li.appendChild(controls);
        }
        userList.appendChild(li);
      });
    }

    function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, (c)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

    /* ===========================
       Join / Admin login
    ============================ */
    joinBtn.onclick = () => joinRoom({ muted: false, asAdmin: false });
    joinMutedBtn.onclick = () => joinRoom({ muted: true, asAdmin: false });

    adminLoginBtn.onclick = () => joinRoom({ muted: false, asAdmin: true });
    adminLoginMuteBtn.onclick = () => joinRoom({ muted: true, asAdmin: true });

    function joinRoom({ muted = false, asAdmin = false } = {}) {
      username = usernameInput.value.trim() || ('guest' + Math.floor(Math.random()*1000));
      roomId = roomIdInput.value.trim() || 'main-room';
      isAdmin = asAdmin;
      // Show UI right away
      setJoinedUI();
      appendMessage(`Joined room "${escapeHtml(roomId)}" as ${escapeHtml(username)}${isAdmin ? ' (admin)' : ''}.`, 'system');

      // If admin attempt: ask server for admin validation
      if (isAdmin) {
        socket.emit('admin-login', { roomId, password: adminPassInput.value || '' });
      }

      // store muted pref and send join - server should respond with 'all-users' or 'user-list'
      socket.emit('join-room', { roomId, username, muted });
      // fetch list etc will be handled by server events below
    }

    /* ===========================
       Chat logic
    ============================ */
    sendBtn.onclick = sendMessage;
    messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    function sendMessage() {
      const text = messageInput.value.trim();
      if (!text) return;
      socket.emit('chat message', { text, roomId, user: username });
      messageInput.value = '';
      appendMessage(`You: ${text}`);
    }

    socket.on('chat message', (msg) => {
      // msg: { user, text }
      if (!msg) return;
      appendMessage(`${msg.user}: ${msg.text}`);
    });

    socket.on('system message', (txt) => appendMessage(`* ${txt}`, 'system'));

    /* ===========================
       WebRTC media & buttons
    ============================ */
    startVideoBtn.onclick = startLocalMediaAndJoin;
    stopVideoBtn.onclick = stopAllMedia;

    videoToggle.onchange = () => { if (localStream && localStream.getVideoTracks()[0]) localStream.getVideoTracks()[0].enabled = videoToggle.checked; };
    audioToggle.onchange = () => { if (localStream && localStream.getAudioTracks()[0]) localStream.getAudioTracks()[0].enabled = audioToggle.checked; };

    muteBtn.onclick = () => {
      if (!localStream) return;
      const t = localStream.getAudioTracks()[0];
      if (!t) return;
      t.enabled = !t.enabled;
      muteBtn.textContent = t.enabled ? '🔇 Mute' : '🔊 Unmute';
    };

    videoBtn.onclick = () => {
      if (!localStream) return;
      const t = localStream.getVideoTracks()[0];
      if (!t) return;
      t.enabled = !t.enabled;
      videoBtn.textContent = t.enabled ? '📷 Toggle Video' : '🚫 Video Off';
    };

    raiseHandBtn.onclick = () => {
      socket.emit('raise-hand', { username, roomId, id: mySocketId });
      appendMessage(`You raised your hand ✋`, 'system');
    };

    async function startLocalMediaAndJoin() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        // show local elm (mySocketId may not be ready immediately; create placeholder)
        addLocalVideoElement();
        // let server know we have media; this helps other peers to create offer
        socket.emit('ready-for-call', { roomId, username });
        startVideoBtn.style.display = 'none';
        stopVideoBtn.style.display = 'inline-block';
      } catch (err) {
        console.error(err);
        alert('Camera/microphone access denied or unavailable.\n' + (err && err.message));
      }
    }

    function stopAllMedia() {
      // close peer connections
      Object.values(pcs).forEach(pc => { try { pc.close(); } catch(e){} });
      for (const id of Object.keys(remoteVideoEls)) removeRemoteVideoEl(id);
      Object.keys(pcs).forEach(k=>delete pcs[k]);
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        localStream = null;
      }
      const localEl = document.getElementById('local-' + mySocketId);
      if (localEl) localEl.remove();
      startVideoBtn.style.display = 'inline-block';
      stopVideoBtn.style.display = 'none';
    }

    /* ===========================
       Signaling & Peer management
    ============================ */
    socket.on('connect', () => {
      mySocketId = socket.id;
      console.log('Connected to signaling server. Socket id:', mySocketId);
    });

    // Receive the list of existing users in the room
    socket.on('all-users', async (ids) => {
      // ids: array of socket ids (strings)
      // Create offers to each (if we have localStream)
      for (const id of ids) {
        if (id === mySocketId) continue;
        await createPeerAndOffer(id);
      }
    });

    // Alternatively server might send detailed user list
    socket.on('user-list', (users) => {
      // users: [{id, username}]
      updateUserList(users);
      // update remote name labels if available
      users.forEach(u => {
        if (remoteVideoEls[u.id]) {
          remoteVideoEls[u.id].querySelector('.name').textContent = `${u.username} — ${u.id}`;
        } else {
          // create placeholder element (video will attach when stream arrives)
          createRemoteVideoEl(u.id, u.username);
        }
      });
    });

    socket.on('user-joined', async ({ id, username: joinedName }) => {
      appendMessage(`User joined: ${joinedName || id}`, 'system');
      // create placeholder card and create offer to the new user
      createRemoteVideoEl(id, joinedName);
      if (localStream) await createPeerAndOffer(id);
    });

    socket.on('user-left', (id) => {
      appendMessage(`User left: ${id}`, 'system');
      if (pcs[id]) try { pcs[id].close(); } catch(e){}
      delete pcs[id];
      removeRemoteVideoEl(id);
    });

    async function createPeerAndOffer(remoteId) {
      if (!localStream) {
        // if we don't have media yet, still create an offerless PC so we can receive if remote sends
        // but it's common to wait until localStream exists. We'll skip creating offer when no local stream.
        console.warn('No localStream when trying to create offer to', remoteId);
        return;
      }
      if (pcs[remoteId]) {
        console.warn('pc already exists for', remoteId);
        return;
      }

      const pc = new RTCPeerConnection(servers);
      pcs[remoteId] = pc;

      // add local tracks
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      // create remote video element
      createRemoteVideoEl(remoteId);

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('ice-candidate', { to: remoteId, candidate: e.candidate });
      };

      pc.ontrack = (e) => {
        // e.streams[0] is the MediaStream
        const el = createRemoteVideoEl(remoteId);
        const video = el.querySelector('video');
        video.srcObject = e.streams[0];
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { to: remoteId, sdp: offer });
    }

    socket.on('offer', async ({ from, sdp }) => {
      // received offer from a remote peer; create an answer
      if (pcs[from]) {
        console.warn('Answering but pc already exists. Closing old pc for', from);
        try { pcs[from].close(); } catch(e){}
        delete pcs[from];
      }

      const pc = new RTCPeerConnection(servers);
      pcs[from] = pc;
      createRemoteVideoEl(from);

      pc.onicecandidate = e => { if (e.candidate) socket.emit('ice-candidate', { to: from, candidate: e.candidate }); };

      pc.ontrack = e => {
        const el = createRemoteVideoEl(from);
        el.querySelector('video').srcObject = e.streams[0];
      };

      if (localStream) localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { to: from, sdp: answer });
    });

    socket.on('answer', async ({ from, sdp }) => {
      if (pcs[from]) {
        await pcs[from].setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      if (!candidate) return;
      try {
        if (pcs[from]) await pcs[from].addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Failed to add ICE candidate', err);
      }
    });

    /* ===========================
       Raise-hand + Admin actions
    ============================ */

    socket.on('raise-hand', (data) => {
      // { username, id }
      appendMessage(`✋ ${data.username || data.id} raised their hand.`, 'system');
    });

    // Admin action incoming: e.g. 'disable-video', 'mute-all', 'mute-user', 'unmute-user', 'disable-video-user'
    socket.on('admin-action', (action) => {
      // action: { type, target? }
      console.log('admin-action received', action);
      if (!action) return;
      if (action.type === 'disable-video' && localStream) {
        const v = localStream.getVideoTracks()[0]; if (v) v.enabled = false;
        videoToggle.checked = false;
      } else if (action.type === 'mute-all' && localStream) {
        const a = localStream.getAudioTracks()[0]; if (a) a.enabled = false;
        audioToggle.checked = false;
      } else if (action.type === 'enable-audio' && localStream) {
        const a = localStream.getAudioTracks()[0]; if (a) a.enabled = true;
        audioToggle.checked = true;
      } else if (action.type === 'mute-user' && action.target === mySocketId && localStream) {
        const a = localStream.getAudioTracks()[0]; if (a) a.enabled = false;
        appendMessage('You were muted by the admin.', 'system');
      } else if (action.type === 'unmute-user' && action.target === mySocketId && localStream) {
        const a = localStream.getAudioTracks()[0]; if (a) a.enabled = true;
        appendMessage('You were unmuted by the admin.', 'system');
      } else if (action.type === 'disable-video-user' && action.target === mySocketId && localStream) {
        const v = localStream.getVideoTracks()[0]; if (v) v.enabled = false;
        appendMessage('Your video was disabled by the admin.', 'system');
      }
    });

    // Admin UI triggers
    adminDisableVideo.onclick = () => socket.emit('admin-action', { type: 'disable-video', roomId });
    adminEnableAudio.onclick = () => socket.emit('admin-action', { type: 'enable-audio', roomId });
    muteAllBtn.onclick = () => socket.emit('admin-action', { type: 'mute-all', roomId });

    /* ===========================
       Misc / connection errors
    ============================ */
    socket.on('connect_error', (err) => {
      console.error('Connection error', err);
      appendMessage('Connection error to signaling server.', 'system');
    });

    // server can reply to admin-login with success/failure
    socket.on('admin-login-result', ({ success, message }) => {
      if (success) {
        isAdmin = true;
        adminControls.style.display = 'block';
        appendMessage('Admin login successful.', 'system');
      } else {
        isAdmin = false;
        adminControls.style.display = 'none';
        appendMessage('Admin login failed: ' + (message || 'invalid password'), 'system');
      }
    });

    // update my socket id UI when server sends confirmation
    socket.on('joined-success', ({ id, room, username: serverName }) => {
      mySocketId = id || mySocketId;
      appendMessage(`Server confirmed join to ${room} as ${serverName || username}`, 'system');
      // create a local placeholder element if we have media
      if (localStream) addLocalVideoElement();
    });

    /*
      === Notes for server implementers ===
      Expected events emitted from the client:
        - 'join-room' { roomId, username, muted } -> server should add socket to room and broadcast 'user-joined' and/or 'user-list'
        - 'ready-for-call' { roomId, username } -> indicates client has local media and is ready to be called
        - 'offer' { to, sdp }
        - 'answer' { to, sdp }
        - 'ice-candidate' { to, candidate }
        - 'chat message' { text, roomId, user }
        - 'raise-hand' { username, roomId, id }
        - 'admin-login' { roomId, password } -> server should validate and emit 'admin-login-result'
        - 'admin-action' { type, target?, roomId } -> server should broadcast action to appropriate sockets
      Server responses handled here (example names):
        - 'all-users' [id1, id2, ...]
        - 'user-list' [{id, username}, ...]
        - 'user-joined' { id, username }
        - 'user-left' id
        - 'offer' { from, sdp }
        - 'answer' { from, sdp }
        - 'ice-candidate' { from, candidate }
        - 'chat message' { user, text }
        - 'raise-hand' { username, id }
        - 'admin-action' { type, target? }  // broadcasted to clients
        - 'joined-success' { id, room, username }
        - 'admin-login-result' { success, message }
    */

  </script>
</body>
</html>
