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

module.exports = Video;