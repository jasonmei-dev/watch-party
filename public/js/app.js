let player;
let serverPlay = false;
let serverPause = false;
let serverBuffer = false;
let serverVideo;

const room = window.location.pathname.substring(1);

// SOCKET stuff
const socket = io(); // Establish socket connection

// Join room
socket.emit('joinRoom', { room });

socket.on('SYNC', data => {
  console.log(data);
  serverVideo = data;
});

socket.on('VIDEO_LOAD', (data) => {
  console.log(data);
  player.cueVideoById(data);
});

socket.on('VIDEO_PLAY', (data) => {
  console.log('RECEIVING PLAY from SERVER...')
  console.log(data);
  player.playVideo();

  console.log('serverPlay set to TRUE');
  serverPlay = true;
  console.log('-------------------')
});

socket.on('VIDEO_PAUSE', (data) => {
  console.log('RECEIVING PAUSE from SERVER...'); 
  console.log(data);
  player.pauseVideo(); 

  console.log('serverPause set to TRUE');
  serverPause = true;
  console.log('-------------------')
});

socket.on('VIDEO_BUFFER', (data) => {
  console.log('RECEIVING BUFFER from SERVER...');
  console.log(data);
  player.seekTo(data);

  console.log('serverBuffer set to TRUE');
  serverBuffer = true;
  console.log('serverPlay set to TRUE');
  serverPlay = true;
  console.log('-------------------')
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
  console.log('Youtube player is ready');
  // pass in room data when player is ready
  if (serverVideo) {
    console.log('Loading serverVideo...')
    console.log(serverVideo);
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
  console.log(event.data)

  if (event.data === 1) { // PLAY
    if (!serverPlay) {
      console.log('EMITTING PLAY event from CLIENT');
      socket.emit('VIDEO_PLAY', { event: 'play' });
    }

    console.log('serverPlay set to FALSE');
    serverPlay = false;
    console.log('-------------------')

  } else if (event.data === 2) { // PAUSE
    if (!serverPause) {
      let currTime = player.getCurrentTime();
      console.log('EMITTING PAUSE event from CLIENT');
      socket.emit('VIDEO_PAUSE', { event: "pause", currTime }); 
    }
  
    console.log('serverPause set to FALSE');
    serverPause = false;
    console.log('-------------------')

  } else if (event.data === 3) { // BUFFERING
    let currTime = player.getCurrentTime();
    
    if (!serverBuffer) {
      console.log('EMITTING BUFFER event from CLIENT... Time: ' + currTime);
      socket.emit('VIDEO_BUFFER', { event: "buffer", currTime });
    }

    console.log('serverBuffer set to FALSE');
    serverBuffer = false;
    console.log('-------------------');
  }
}

/*
Player States:
-1 (unstarted)
0 (ended)
1 (playing)
2 (paused)
3 (buffering)
5 (video cued)

Player Events:
onReady
onStateChange
on PlaybackQualityChange
onPlaybackRateChange
onError
onApiChange
*/
