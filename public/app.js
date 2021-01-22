let player;

// SOCKET stuff
const socket = io(); // Establish socket connection

socket.on('VIDEO_LOAD', (data) => {
  player.cueVideoById(data.videoId);
});

socket.on('VIDEO_PLAY', (data) => {
  player.playVideo();
});

// Play button
const $play = document.querySelector('.js-play');
$play.addEventListener('click', function() {
  socket.emit('VIDEO_PLAY', {});
});

const $form = document.querySelector('form')
$form.addEventListener('submit', function(e) {
  e.preventDefault();
  const url = $form.elements.youtube_url.value;

  // make sure it is valid url
  if (isValidUrl(url)) {
    const id = getYouTubeId(url);

    socket.emit('VIDEO_LOAD', { videoId: id });
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
  });
}

/*
loadVideoById // don't use this
cueVideoById
player.playVideo()
stopVideo()
https://www.youtube.com/watch?v=4_Tm0SxIp6w&ab_channel=ScreenRant
*/

