const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/random', (req, res) => {
  let rand = Math.random();
  res.json({
    data: rand
  })
})
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

// app.get('/style.css', (req, res) => {
//   res.sendFile(__dirname + '/style.css');
// })


io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('chat message', msg => {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });

});

http.listen(port, () => {
  console.log(`Listening on port:${port}`);
})