const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static('public'));

let currentVideo;
let videoTimer;

class Video {
  constructor(id) {
    this.videoId = id,
    this.state = null,
    this.currTime = 0
  }
}

io.on('connection', (socket) => {
  console.log('a user connected');

  // if currentVideo exists on server, send it to client
  if (currentVideo) {
    socket.emit('sync', currentVideo);
  }

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('VIDEO_LOAD', (data) => {
    console.log(data);
    currentVideo = new Video(data.videoId);

    console.log(currentVideo);
    io.emit('VIDEO_LOAD', currentVideo);
  });

  socket.on('UPDATE_STATE', data => {
    // receive video data from client
    console.log(data);
    currentVideo.state = data.state;
    console.log(currentVideo);

  //   if (data.state === 1) {
  //     // socket.broadcast.emit('VIDEO_PLAY', data);
  //     io.emit('VIDEO_PLAY', data);
  //   } else if (data.state === 2) {
  //     // socket.broadcast.emit('VIDEO_PAUSE', data);
  //     io.emit('VIDEO_PAUSE', data);
  //   } else if (data.state === 3) {
  //     // socket.broadcast.emit('VIDEO_BUFFER', data);
  //     io.emit('VIDEO_BUFFER', data);
  //   }
  });

  socket.on('VIDEO_PLAY', (data) => {
    console.log(data);
    currentVideo.state = data.state;
    // currentVideo.currTime = data.currTime;

    if (videoTimer) {
      clearInterval(videoTimer);
      videoTimer = setInterval(() => currentVideo.currTime++, 1000);
    } else {
      videoTimer = setInterval(() => currentVideo.currTime++, 1000);
    }

    console.log(currentVideo);
    socket.broadcast.emit('VIDEO_PLAY', currentVideo);
    // io.emit('VIDEO_PLAY', data);
  });

  socket.on('VIDEO_PAUSE', (data) => {
    console.log(data);
    currentVideo.state = data.state;
    // currentVideo.currTime = data.currTime;
    clearInterval(videoTimer);

    console.log(currentVideo);
    socket.broadcast.emit('VIDEO_PAUSE', currentVideo);
    // io.emit('VIDEO_PAUSE', data);
  });

  socket.on('VIDEO_BUFFER', (data) => {
    console.log(data);
    // currentVideo.state = data.state;
    currentVideo.currTime = data.currTime;

    console.log(currentVideo);
    socket.broadcast.emit('VIDEO_BUFFER', currentVideo);
    // io.emit('VIDEO_BUFFER', data);
  });

  socket.on('VIDEO_STOP', (data) => {
    console.log(data);
    io.emit('VIDEO_STOP', data);
  });
});

http.listen(port, () => {
  console.log(`Listening on port:${port}`);
})
