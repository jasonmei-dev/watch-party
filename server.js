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
const botName = 'weWatch Bot';

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
  return roomID;
}

// SOCKET stuff
io.on('connection', (socket) => {
  // Join room
  socket.on('joinRoom', ({ room }) => {
    const users = rooms[room].users;
    const user = userJoin(users, socket.id);

    socket.join(room);

    socket.emit('currentUser', user);
    // CHAT EVENTS

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to weWatch!'));

    // Broadcasts message when a user connects
    socket.broadcast.to(room).emit('message', formatMessage(botName, `${user} has joined the room`));
    
    // Send users list to room
    io.to(room).emit('roomUsers', { users });
    
    console.log('rooms:', rooms);

    socket.on('chatMessage', msg => {
      io.to(room).emit('message', formatMessage(user, msg));
    });


    // VIDEO EVENTS

    // If currentVideo exists in room, send it to new user
    if (rooms[room].currentVideo) {
      const videoData = {
        videoId: rooms[room].currentVideo.videoId,
        state: rooms[room].currentVideo.state,
        currTime: rooms[room].currentVideo.currTime,
      }
      socket.emit('SYNC', videoData);
    }

    socket.on('VIDEO_LOAD', (data) => {
      console.log(data);
      rooms[room].currentVideo = new Video(data.videoId);
      
      socket.broadcast.to(room).emit('message', formatMessage(botName, `${user} loaded a video`));
      io.to(room).emit('VIDEO_LOAD', rooms[room].currentVideo.videoId);
    });
  
    socket.on('VIDEO_PLAY', (data) => {
      console.log(data);
      rooms[room].currentVideo.play();
  
      socket.broadcast.to(room).emit('message', formatMessage(botName, `${user} played the video`));
      socket.to(room).broadcast.emit('VIDEO_PLAY', rooms[room].currentVideo.state);
    });
  
    socket.on('VIDEO_PAUSE', (data) => {
      console.log(data);
      rooms[room].currentVideo.pause(data.currTime);
      
      socket.broadcast.to(room).emit('message', formatMessage(botName, `${user} paused the video`));
      socket.to(room).broadcast.emit('VIDEO_PAUSE', rooms[room].currentVideo.state);
    });
  
    socket.on('VIDEO_BUFFER', (data) => {
      console.log(data);
      rooms[room].currentVideo.buffer(data.currTime);
      
      socket.to(room).broadcast.emit('VIDEO_BUFFER', rooms[room].currentVideo.currTime);
    });

    // WEBRTC EVENTS
    socket.on('offer', offer => {
      console.log('Offer received from client');
      socket.to(room).emit('offer', offer);
    });

    socket.on('answer', answer => {
      console.log('Answer received from client');
      socket.to(room).emit('answer', answer);
    });

    socket.on('ice-candidate', candidate => {
      console.log('Candidate received from client');
      socket.to(room).emit('ice-candidate', candidate);
    });

    socket.on('start-call', data => {
      console.log('starting call');
      io.to(room).emit('start-call', data);
    });

    socket.on('hang-up', data => {
      console.log('hanging up all clients');
      io.to(room).emit('hang-up', data);
    });

    // User disconnects
    socket.on('disconnect', () => {
      // Broadcast when user leaves the room
      socket.broadcast.to(room).emit('message', formatMessage(botName, `${user} has left the room`));

      userLeave(users, socket.id);
  
      // Send updated users to room
      io.to(room).emit('roomUsers', { users });
      
      // Delete room if there are no users
      // if (Object.keys(rooms[room].users).length === 0) delete rooms[room];
      console.log('rooms', rooms);
    });
  });

});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});