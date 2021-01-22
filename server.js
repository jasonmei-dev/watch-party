const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('VIDEO_LOAD', data => {
    console.log('data: ' + JSON.stringify(data));
    io.emit('VIDEO_LOAD', data);
  });

  socket.on('VIDEO_PLAY', data => {
    console.log('data: ' + JSON.stringify(data));
    io.emit('VIDEO_PLAY', data);
  });
});

http.listen(port, () => {
  console.log(`Listening on port:${port}`);
})