const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { v4: uuidv4 } = require('uuid'); 
const Video = require('./utilities/Video');
const formatMessage = require('./utilities/messages');

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

// User leaves room
function userLeave(users, id) {
  // const index = users.findIndex(userID => userID === id);
  // if (index !== -1) users.splice(index, 1);
  delete users[id];
}

// Generate random name
function getRandomName() {
  const adjs = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter", "patient", "twilight", "dawn", "crimson", "wispy", "weathered", "blue", "billowing", "broken", "cold", "damp", "falling", "frosty", "green", "long", "late", "lingering", "bold", "little", "morning", "muddy", "old", "red", "rough", "still", "small", "sparkling", "throbbing", "shy", "wandering", "withered", "wild", "black", "young", "holy", "solitary", "fragrant", "aged", "snowy", "proud", "floral", "restless", "divine", "polished", "ancient", "purple", "lively", "nameless"];

  const nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter", "forest", "hill", "cloud", "meadow", "sun", "glade", "bird", "brook", "butterfly", "bush", "dew", "dust", "field", "fire", "flower", "firefly", "feather", "grass", "haze", "mountain", "night", "pond", "darkness", "snowflake", "silence", "sound", "sky", "shape", "surf", "thunder", "violet", "water", "wildflower", "wave", "water", "resonance", "sun", "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper", "frog", "smoke", "star"];

  return adjs[Math.floor(Math.random() * adjs.length)] + "_" + nouns[Math.floor(Math.random() * nouns.length)];
}

// SOCKET stuff
io.on('connection', (socket) => {

  // Join room
  socket.on('joinRoom', ({ room }) => {
    console.log("A user joined the room")
    socket.join(room);
    // rooms[room].users.push(socket.id);
    rooms[room].users[socket.id] = getRandomName();
    console.log(rooms)

    // if currentVideo exists in room, send it to new client
    if (rooms[room].currentVideo) {
      const videoData = {
        videoId: rooms[room].currentVideo.videoId,
        state: rooms[room].currentVideo.state,
        currTime: rooms[room].currentVideo.currTime,
      }
      socket.emit('SYNC', videoData);
    }

    // Chat message
    socket.on('chatMessage', msg => {
      io.to(room).emit('message', formatMessage(rooms[room].users[socket.id], msg));
    });

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

    socket.on('disconnect', () => {
      console.log('A user left the room');
      userLeave(rooms[room].users, socket.id);
      
      // Delete room if there are no users
      // if (rooms[room].users.length === 0) delete rooms[room];
      console.log('rooms', rooms);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
