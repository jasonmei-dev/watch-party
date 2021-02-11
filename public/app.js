let player;
let youtubePlayer;
let serverEvent = false;

// SOCKET stuff
const socket = io(); // Establish socket connection

socket.on('VIDEO_LOAD', (data) => {
  console.log(data);
  player.cueVideoById(data.videoId);
});

socket.on('VIDEO_PLAY', (data) => {
  console.log(data);
  player.playVideo();
  serverEvent = true;
});

socket.on('VIDEO_PAUSE', (data) => {
  console.log(data);
  player.pauseVideo(); // triggers player state change from 1 -> 2
  serverEvent = true;
});

socket.on('VIDEO_SCRUB', (data) => {
  console.log(data);
  player.seekTo(data.scrubTime);
  serverEvent = true;
  // scrubVideo(data.scrubTime);
});

socket.on('VIDEO_STOP', (data) => {
  console.log(data);
  player.stopVideo();
});

// // Play button
// const $play = document.querySelector('.js-play');
// $play.addEventListener('click', () => {
//   socket.emit('VIDEO_PLAY', { event: "play" });
// });

// // Pause button
// const $pause = document.querySelector('.js-pause');
// $pause.addEventListener('click', () => {
//   socket.emit('VIDEO_PAUSE', { event: "pause" } );
// });

// // Stop button
// const $stop = document.querySelector('.js-stop');
// $stop.addEventListener('click', () => {
//   socket.emit('VIDEO_STOP', {});
// });

// Search Bar
const $form = document.querySelector('form')
$form.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = $form.elements.youtube_url.value;

  // make sure it is valid url
  if (isValidUrl(url)) {
    const id = getYouTubeId(url);
    socket.emit('VIDEO_LOAD', { videoId: id });
    $form.elements.youtube_url.value = "";
  } else {
    // throw error
  }

});

function isValidUrl(url) {
  return true; // TODO: use regex?
}

function getYouTubeId(url) {
  const queryString = url.split('?')[1];
  const urlParams = new URLSearchParams(queryString);
  const youtubeId = "v"
  const myParam = urlParams.get(youtubeId);
  return myParam;
}

// Load IFrame Player API code
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";

let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Create <iframe> and YouTube player after API code loads
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    playerVars: {
      'mute': 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

function onPlayerReady() {
  console.log('Youtube player is ready');
}

function onPlayerStateChange(event) {
  console.log(event.data)

  if (event.data === 1) { // PLAY
    if (!serverEvent) {
      socket.emit('VIDEO_PLAY', { event: "play" });
    }

    serverEvent = false;

  } else if (event.data === 2) { // PAUSE
    if (!serverEvent) {
      socket.emit('VIDEO_PAUSE', { event: "pause" }); 
    }
    
    serverEvent = false;

  } else if (event.data === 3) { // BUFFERING
    let time = player.getCurrentTime();
    console.log('Buffering...' + time);
    // socket.emit('VIDEO_SCRUB', { event: "scrub", scrubTime: time });
    
    if (!serverEvent) {
      socket.emit('VIDEO_SCRUB', { event: "scrub", scrubTime: time });
    }

    serverEvent = false;
  }
}

function scrubVideo(time) {
  player.seekTo(time);
  player.playVideo();
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
/*

/*
loadVideoById // don't use this
cueVideoById
player.playVideo()
stopVideo()
https://www.youtube.com/watch?v=4_Tm0SxIp6w&ab_channel=ScreenRant
player.seekTo(seconds:Number, allowSeekAhead:Boolean)
player.getCurrentTime()
*/
