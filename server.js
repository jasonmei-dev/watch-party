const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 3000;

// Set static folder
app.use(express.static('public'));

class Video {
  constructor(id) {
    this.videoId = id,
    this.state = 'pause',
    this.currTime = 0,
    this.intervalId = null
  }

  play() {
    this.state = 'play';
    this.intervalId = setInterval(() => this.currTime++, 1000);
  }

  pause(time) {
    this.state = 'pause';
    this.currTime = time;
    clearInterval(this.intervalId);
  }

  buffer(time) {
    this.currTime = time;
  }
}

let currentVideo;

// SOCKET
io.on('connection', (socket) => {
  console.log('a user connected');

  // create and join new room
  // socket.on('create room', )

  // // join existing room
  // socket.on('join room', roomName => {
  //   socket.join(roomName);
  // })

  // if currentVideo exists on server, send it to client
  if (currentVideo) {
    let videoData = {
      videoId: currentVideo.videoId,
      state: currentVideo.state,
      currTime: currentVideo.currTime,
    }
    socket.emit('sync', videoData);
  }

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('VIDEO_LOAD', (data) => {
    console.log(data);
    currentVideo = new Video(data.videoId);

    console.log(currentVideo);
    io.emit('VIDEO_LOAD', currentVideo.videoId);
  });

  socket.on('VIDEO_PLAY', (data) => {
    console.log(data);
    currentVideo.play();

    console.log(currentVideo);
    socket.broadcast.emit('VIDEO_PLAY', currentVideo.state);
    // io.emit('VIDEO_PLAY', data);
  });

  socket.on('VIDEO_PAUSE', (data) => {
    console.log(data);
    currentVideo.pause(data.currTime);

    console.log(currentVideo);
    socket.broadcast.emit('VIDEO_PAUSE', currentVideo.state);
    // io.emit('VIDEO_PAUSE', data);
  });

  socket.on('VIDEO_BUFFER', (data) => {
    console.log(data);
    currentVideo.buffer(data.currTime);

    console.log(currentVideo);
    socket.broadcast.emit('VIDEO_BUFFER', currentVideo.currTime);
    // io.emit('VIDEO_BUFFER', data);
  });

  socket.on('VIDEO_STOP', (data) => {
    console.log(data);
    io.emit('VIDEO_STOP', data);
  });

});

server.listen(port, () => {
  console.log(`Listening on port:${port}`);
})
