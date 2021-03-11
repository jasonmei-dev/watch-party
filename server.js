const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { v4: uuidv4 } = require('uuid'); 
const Video = require('./utilities/Video');
const formatMessage = require('./utilities/messages');
const { userJoin, userLeave } = require('./utilities/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const PORT = process.env.PORT || 3000;

const rooms = {};

app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public/index.html'));
});

app.post('/room', (req, res) => {
  const room = createNewRoom();
  res.redirect(`/${room}`)
});

app.post('/join', (req, res) => {
  if (rooms[req.body.room]) {
    res.redirect(`/${req.body.room}`)
  } else {
    res.redirect('/');
  }
});

app.get('/:room', (req, res) => {
  if (rooms[req.params.room]) {
    res.sendFile(path.resolve(__dirname, 'public/room.html'));
  } else {
    res.redirect('/');
  }
});

app.use(express.static('public'));


// Create new room
function createNewRoom() {
  const roomID = uuidv4();
  rooms[roomID] = { currentVideo: null, users: {} }
  console.log(rooms);
  return roomID;
}

// SOCKET stuff
io.on('connection', (socket) => {
  // Join room
  socket.on('joinRoom', ({ room }) => {
    console.log("A user joined the room")
    const users = rooms[room].users;
    
    socket.join(room);

    userJoin(users, socket.id);
    
    console.log('rooms:', rooms);


    // Send users list to room
    io.to(room).emit('roomUsers', { users });

    // If currentVideo exists in room, send it to new client
    if (rooms[room].currentVideo) {
      const videoData = {
        videoId: rooms[room].currentVideo.videoId,
        state: rooms[room].currentVideo.state,
        currTime: rooms[room].currentVideo.currTime,
      }
      socket.emit('SYNC', videoData);
    }
    
    // Video Events
    socket.on('VIDEO_LOAD', (data) => {
      console.log(data);
      rooms[room].currentVideo = new Video(data.videoId);
  
      io.to(room).emit('VIDEO_LOAD', rooms[room].currentVideo.videoId);
    });
  
    socket.on('VIDEO_PLAY', (data) => {
      console.log(data);
      rooms[room].currentVideo.play();
  
      socket.to(room).broadcast.emit('VIDEO_PLAY', rooms[room].currentVideo.state);
    });
  
    socket.on('VIDEO_PAUSE', (data) => {
      console.log(data);
      rooms[room].currentVideo.pause(data.currTime);
  
      socket.to(room).broadcast.emit('VIDEO_PAUSE', rooms[room].currentVideo.state);
    });
  
    socket.on('VIDEO_BUFFER', (data) => {
      console.log(data);
      rooms[room].currentVideo.buffer(data.currTime);
  
      socket.to(room).broadcast.emit('VIDEO_BUFFER', rooms[room].currentVideo.currTime);
    });

    // Chat message
    socket.on('chatMessage', msg => {
      const username = users[socket.id];

      io.to(room).emit('message', formatMessage(username, msg));
    });
  
    socket.on('disconnect', () => {
      console.log('A user left the room');

      userLeave(users, socket.id);
  
      // Send updated users to room
      io.to(room).emit('roomUsers', { users });
      
      // Delete room if there are no users
      // if (rooms[room].users.length === 0) delete rooms[room];
      console.log('rooms', rooms);
    });
  });

});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});