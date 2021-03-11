const chatForm = document.querySelector('#chat-form');
const chatMessages = document.querySelector('.chat-messages');
const userList = document.querySelector('#users');
const room = window.location.pathname.substring(1);

let player;
let serverPlay = false;
let serverPause = false;
let serverBuffer = false;
let serverVideo;

// SOCKET stuff
const socket = io(); // Establish socket connection

// Join room
socket.emit('joinRoom', { room });

// Receive room users list from server
socket.on('roomUsers', ({ users }) => {
  outputUserList(users);
});

// Message from server
socket.on('message', message => {
  console.log(message);
  outputMessage(message);
});

socket.on('SYNC', data => {
  serverVideo = data;
});

socket.on('VIDEO_LOAD', (data) => {
  player.cueVideoById(data);
});

socket.on('VIDEO_PLAY', (data) => {
  player.playVideo();
  serverPlay = true;
});

socket.on('VIDEO_PAUSE', (data) => {
  player.pauseVideo(); 
  serverPause = true;
});

socket.on('VIDEO_BUFFER', (data) => {
  player.seekTo(data);
  serverBuffer = true;
  serverPlay = true;
});

// SEARCH BAR
const $searchBar = document.querySelector('.search')
$searchBar.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = $searchBar.elements.youtube_url.value;

  // Make sure it is valid url
  if (isValidUrl(url)) {
    const id = getYouTubeId(url);
    socket.emit('VIDEO_LOAD', { event: "load", videoId: id });

    $searchBar.elements.youtube_url.value = "";
  } else {
    // throw error
  }

});

function isValidUrl(url) {
  return true; // TODO
}

function getYouTubeId(url) {
  const queryString = url.split('?')[1];
  const urlParams = new URLSearchParams(queryString);
  const youtubeId = "v"
  const myParam = urlParams.get(youtubeId);
  return myParam;
}

function getVideoData() {
  let videoData = {
    videoId: player.getVideoData().video_id,
    state: player.getPlayerState(),
    currTime: player.getCurrentTime()
  }

  return videoData;
}

// YOUTUBE PLAYER
// Load IFrame Player API code
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";

let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Create <iframe> and YouTube player after API code loads
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    // height: '390', // default
    // width: '640', // default
    // height: '468', // x1.2
    // width: '768', // x1.2
    height: '487.5', // x1.25
    width: '800', // x1.25
    // height: '585', // x1.5
    // width: '960', // x1.5
    playerVars: {
      // 'mute': 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

function onPlayerReady() {
  // pass in room data when player is ready
  if (serverVideo) {
    if (serverVideo.state === "pause") {
      player.cueVideoById(serverVideo.videoId, serverVideo.currTime);
    } else {
      player.loadVideoById(serverVideo.videoId, serverVideo.currTime);
      serverPlay = true;
    }
    serverBuffer = true;
  }
}

function onPlayerStateChange(event) {
  if (event.data === 1) { // PLAY
    if (!serverPlay) socket.emit('VIDEO_PLAY', { event: 'play' });
    serverPlay = false;

  } else if (event.data === 2) { // PAUSE
    if (!serverPause) {
      let currTime = player.getCurrentTime();
      socket.emit('VIDEO_PAUSE', { event: "pause", currTime }); 
    }
    serverPause = false;

  } else if (event.data === 3) { // BUFFERING
    let currTime = player.getCurrentTime();
    
    if (!serverBuffer) {
      socket.emit('VIDEO_BUFFER', { event: "buffer", currTime });
    }

    serverBuffer = false;
  }
}

// Chat stuff
// Message submit
chatForm.addEventListener('submit', e => {
  e.preventDefault();

  const msg = e.target.elements.msg.value;

  socket.emit('chatMessage', msg);

  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
  <p class="text">
    ${message.text}
  </p>`;

  chatMessages.appendChild(div);
}

// Output user list to DOM
function outputUserList(users) {
  const usersArr = [];

  for (const userID in users) {
    usersArr.push(users[userID]);
  }

  userList.innerHTML = `
    ${usersArr.map(user => `<li>${user}</li>`).join('')}
  `;
}