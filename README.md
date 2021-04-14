# WeWatch

WeWatch is a web application that allows the user to watch YouTube videos in-sync with others. You can create and join rooms, chat with others, and have a video call while streaming YouTube videos together. Built using Node.js, Express, Socket.io, and WebRTC.

Live Heroku app can be found here: https://wewatch-app.herokuapp.com/

## Features

- Uses [Express](https://expressjs.com) as the application server
- Video Synchronization and chat is achieved through real time communication between client and server using [Socket.io](https://socket.io/)
- Peer-to-peer webcam streaming using [WebRTC](https://webrtc.org/)
- Uses [Youtube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) to embed videos and control playback
