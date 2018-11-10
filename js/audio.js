//
//
// usage example: audio.play(0)
//
//
//
//

SOUND = {
  car_engine_loop : 0,
  death : 1,
  music : 2,
  zombie_eats : 3,
  wheel_slide : 4
}

var SOUND_FILES = [
  "audio/car_engine_loop3.ogg", // SOUND.car_engine_loop //  car main sound
  "audio/death.ogg",
  "audio/background.ogg",
  "audio/zombie_eats.ogg",
  "audio/wheel_slide.ogg"
];

// BufferLoader
/////////////////////////////////////////////////////////////////////////////

function BufferLoader(audio_engine, context, urlList, callback) {
  this.audio_engine = audio_engine;
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer sync
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";
  request.send();

  var loader = this;

  // this.context.decodeAudioData(
  //   request.response,
  //   function(buffer) {
  //     console.log('buffer decoded');
  //     if (!buffer) {
  //       console.log('error decoding file data: ' + url);
  //       return;
  //     }
  //     loader.bufferList[index] = buffer;
  //     if (++loader.loadCount == loader.urlList.length)
  //       loader.onload(loader.bufferList);
  //   },
  //   function() {
  //     console.log('error decoding sound buffer!!! ');
  //   }
  // );

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        console.log('buffer decoded');
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}

// AudioEngine
///////////////////////////////////////////////////////////////////////////////

function AudioEngine(world, on_load_sounds_fn)
{
  if (typeof AudioContext == "function") {
  	this.context = new AudioContext();
  } else if (typeof webkitAudioContext == "function") {
  	this.context = new webkitAudioContext();
  }
  this.world = world;
  this.paused = false;
  this.buffers = [];
  this.loaded = false;
  this.on_load_sounds = on_load_sounds_fn;
  this.singletons = {};

  var buffer_loader = new BufferLoader(
    this,
    this.context,
    SOUND_FILES,
    this.on_finished_loading
  );

  buffer_loader.load();

}

AudioEngine.prototype.on_finished_loading = function(a_buffer_list)
{
  this.audio_engine.buffers = a_buffer_list;
  this.audio_engine.loaded = true;
  console.log("buffers are loaded");
  this.audio_engine.on_load_sounds();
}

AudioEngine.prototype.play = function(buffer_idx, setup)
{
  if (!this.loaded || this.paused) return;
  //console.log("audio.play("+buffer_idx+")");
  var gain_node = this.context.createGainNode();
  var source = this.context.createBufferSource();
  source.buffer = this.buffers[buffer_idx]; 

  // Connect source to a gain node
  source.connect(gain_node);
  // Connect gain node to destination
  gain_node.connect(this.context.destination);

  if (null != setup) {
    if (setup.loop != null) {
      source.loop = setup.loop;
    }
    if (setup.rate != null) {      
      source.playbackRate = setup.rate;
    }
    if (setup.gain != null) {      
      gain_node.gain.value = setup.gain;
    }
  }
  source.noteOn(0);
}

AudioEngine.prototype.sound_singleton = function(buffer_idx, initial_setup)
{  
  if (!this.loaded) return null;
  if (!(buffer_idx in this.singletons)) {
    console.log("new singleton!");
    var singleton = new SoundSingleton(this, this.buffers[buffer_idx]);
    this.singletons[buffer_idx] = singleton;
  }
  return this.singletons[buffer_idx];
}

AudioEngine.prototype.pause_all = function()
{
  console.log("audio engine pause_all()");
  if (this.paused) return;
  for (var sidx in this.singletons) {
    var singleton = this.singletons[sidx];  
    singleton.pause();
  }
  this.paused = true;
}

AudioEngine.prototype.resume_all = function()
{
  console.log("audio engine resume_all()");
  if (!this.paused) return;
  this.paused = false;
  for (var sidx in this.singletons) {
    var singleton = this.singletons[sidx];
    console.log("resuming " + sidx);
    singleton.resume();
  }
}


// SoundSingleton
/////////////////////////////////////////////////////////////////////

SoundState = {
  NOT_READY: 0,
  READY: 1,
  PLAYING: 2,
  PAUSED: 3
}

function SoundSingleton(engine, buffer)
{
  //this.paused = false;
  //this.ready = false;
  //this.playing = false;
  this.state = SoundState.NOT_READY;
  this.engine = engine;
  this.buffer = buffer;
  // just for case
  this.gain_node = null;
  this.initial_setup = null;
  this.last_tune_setup = null;
}

SoundSingleton.prototype.init = function(initial_setup)
{
  this.initial_setup = initial_setup;
  this.state = SoundState.READY;
}

SoundSingleton.prototype.init_impl = function()
{
  this.gain_node = this.engine.context.createGainNode();
  this.source = this.engine.context.createBufferSource();
  this.source.buffer = this.buffer;
  // Connect source to a gain node
  this.source.connect(this.gain_node);
  // Connect gain node to destination
  this.gain_node.connect(this.engine.context.destination);

  if (null != this.initial_setup) {
    if (this.initial_setup.loop != null) {
      this.source.loop = this.initial_setup.loop;
    }
    if (this.initial_setup.rate != null) {      
      this.source.playbackRate = this.initial_setup.rate;
    }
    if (this.initial_setup.gain != null) {
      this.gain_node.gain.value = this.initial_setup.gain;
    }
  }  
}

SoundSingleton.prototype.tune = function(setup)
{  
  this.last_tune_setup = setup;
  if (this.state != SoundState.PLAYING) return;
  if (setup.rate != null) {      
    this.source.playbackRate = setup.rate;
  }
  if (setup.gain != null) {
    this.gain_node.gain.value = setup.gain * setup.gain;
  }  
}

SoundSingleton.prototype.play = function()
{
  console.log("singleton play begin");
  if (this.state != SoundState.READY && this.state != SoundState.PAUSED ) return;  
  this.init_impl();
  this.source.noteOn(0);
  this.state = SoundState.PLAYING;
  console.log("singleton play end");
}

SoundSingleton.prototype.stop = function()
{  
  console.log("singleton stop begin");
  if (this.state != SoundState.PLAYING && this.state != SoundState.PAUSED) return;
  this.source.noteOff(0);  
  this.state = SoundState.READY;
  console.log("singleton stop end");
}

SoundSingleton.prototype.pause = function()
{
  this.stop();
}

SoundSingleton.prototype.resume = function()
{  
  this.play();
}

