const chatForm = document.querySelector('#chat-form');
const chatMessages = document.querySelector('.chat-messages');
const chatBtn = document.querySelector('.chat-btn');
const streamBtn = document.querySelector('.stream-btn');
const usersBtn = document.querySelector('.users-btn');
const userList = document.querySelector('#users');
const room = window.location.pathname.substring(1);

const chatContainer = document.querySelector('.chat-container');
const streamContainer = document.querySelector('.stream-container');
const usersContainer = document.querySelector('.users-container');

const usernameInput = document.querySelector('.username-input');

let player;
let serverPlay = false;
let serverPause = false;
let serverBuffer = false;
let serverVideo;

chatBtn.addEventListener('click', (e)=> {
  console.log('chat button clicked!')
  chatContainer.style.display = "flex";
  streamContainer.classList.add('hidden');
  usersContainer.classList.add('hidden');

  chatBtn.classList.add('active')
  streamBtn.classList.remove('active');
  usersBtn.classList.remove('active')
})

streamBtn.addEventListener('click', (e)=> {
  console.log('stream button clicked!')
  chatContainer.style.display = "none";
  streamContainer.classList.remove('hidden');
  usersContainer.classList.add('hidden');

  streamBtn.classList.add('active');
  chatBtn.classList.remove('active')
  usersBtn.classList.remove('active')
})

usersBtn.addEventListener('click', (e)=> {
  console.log('users button clicked!')
  usersContainer.classList.remove('hidden');
  chatContainer.style.display = "none";
  streamContainer.classList.add('hidden');
  
  usersBtn.classList.add('active')
  streamBtn.classList.remove('active');
  chatBtn.classList.remove('active')
})

// SOCKET stuff
const socket = io(); // Establish socket connection

// Join room
socket.emit('joinRoom', { room });

// Display username
socket.on('currentUser', user => {
  usernameInput.setAttribute("value", user);
});

// Receive room users list from server
socket.on('roomUsers', ({ users }) => {
  outputUserList(users);
});

// Message from server
socket.on('message', message => {
  outputMessage(message);

  chatMessages.scrollTop = chatMessages.scrollHeight;
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
const $searchBar = document.querySelector('.search-form')
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
    playerVars: {
      // 'mute': 1 // mute in dev mode
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

// WebRTC
let pc; // peer connection
let localStream;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const videoGrid = document.getElementById('video-grid');

const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const muteButton = document.getElementById('muteButton');

callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);
muteButton.addEventListener('click', toggleMute);

const mediaConstraints = {
  video: true,
  audio: true
}

const pcConfig = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};

function callAction() {
  createPeerConnection();
  
  // get local media stream
  navigator.mediaDevices.getUserMedia(mediaConstraints)
  .then(mediaStream => {
    localStream = mediaStream;
    localVideo.srcObject = mediaStream;
    // add audio and video tracks to peer connection
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  })

  socket.emit('start-call', { event: 'start-call' });
}

function toggleMute() {
  // console.log('clicked mute');
  if (remoteVideo.muted) {
    remoteVideo.muted = false;
    muteButton.innerHTML = 'Mute';
  } else {
    remoteVideo.muted = true;
    muteButton.innerHTML = 'Unmute';
  }
}

socket.on('start-call', data => {
  callButton.disabled = true;
  hangupButton.disabled = false;
  muteButton.disabled = false;
})

function hangupAction() {
  socket.emit('hang-up', {event: 'hang-up'});
}

socket.on('hang-up', data => {
  callButton.disabled = false;
  hangupButton.disabled = true;
  muteButton.disabled = true;
  remoteVideo.muted = false;
  muteButton.innerHTML = 'Mute';
  closeVideoCall();
});

function closeVideoCall() {
  if (pc) {
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.onnegotiationneeded = null;

    if(remoteVideo.srcObject) {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
    }

    if (localVideo.srcObject) {
      localVideo.srcObject.getTracks().forEach(track => track.stop());
    }

    pc.close();
    pc = null;
  }
}

function createPeerConnection() {
  pc = new RTCPeerConnection(pcConfig);
  pc.ontrack = handleTrackEvent;
  pc.onicecandidate = handleICECandidateEvent;
  pc.onnegotiationneeded = handleNegotiationNeededEvent;
}

function handleNegotiationNeededEvent() {
  pc.createOffer().then(description => {
    pc.setLocalDescription(description);
    // console.log('OFFER sent', description);
    socket.emit('offer', description);
  })
}

function handleICECandidateEvent(event) {
  if (event.candidate) {
    const candidate = {
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    }
    // console.log('ICE CANDIDATE SENT');
    socket.emit('ice-candidate', candidate);
  }
}

function handleTrackEvent(event) {
  remoteVideo.srcObject = event.streams[0];
}

// Recieving offer
socket.on('offer', offer => {
  // console.log('OFFER RECEIVED', offer)
  createPeerConnection();

  pc.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
    return navigator.mediaDevices.getUserMedia(mediaConstraints);
  }).then(mediaStream => {
    localStream = mediaStream;
    localVideo.srcObject = mediaStream;
    // add audio and video tracks to peer connection
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  }).then(() => {
    return pc.createAnswer();
  }).then(description => {
    pc.setLocalDescription(description);
    // console.log('ANSWER SENT', description);
    socket.emit('answer', description);
  }).catch(console.log);
})

// Receiving answer
socket.on('answer', answer => {
  // console.log('ANSWER RECEIVED', answer);
  pc.setRemoteDescription(new RTCSessionDescription(answer));
})

// Receving ice candidate
socket.on('ice-candidate', event => {
  // console.log('ICE CANDIDATE RECEIVED');
  const iceCandidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate
  });
  pc.addIceCandidate(iceCandidate);
})

