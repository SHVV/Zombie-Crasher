// Global variable for our core app
//var Atom = false;

var current_div = null;
var Game = null;
var gAudioEngine = null;
var gMuted = false;
var muted_store = null;

// Add listener for when the popup is first loaded
// Perform popup page initiation and configuration
// NOTE: DOMContentLoaded is the ideal event to listen for as it doesn't
// wait for external resources (like images) to be loaded
function load() {
	console.log('Popup page is loaded.');
	//Atom = new App();
  // attach click event to minimize button
  var minimize = document.getElementById('minimize');
  minimize.addEventListener('click', pokki.closePopup);

  // play btn  
  var play_btn = document.getElementById('play_btn');
  play_btn.addEventListener('click', select_level);

  // Re-play btn  
  var replay_btn = document.getElementById('replay_btn');
  replay_btn.addEventListener('click', replay_level);
  
  // Next btn  
  var next_btn = document.getElementById('next_btn');
  next_btn.addEventListener('click', next_level);

  // Menu btn  
  var menu_btn = document.getElementById('menu_btn');
  menu_btn.addEventListener('click', select_level);
  
  // Mute btn  
  var mute_btn = document.getElementById('mute_btn');
  mute_btn.addEventListener('click', on_mute);
  
  current_div = document.getElementById('form_main_menu');
  
  muted_store = new LocalStore('muted');
  gMuted = muted_store.get() ? true : false;
  var icon = document.getElementById('sound_disabled_icon');
  icon.style.display = gMuted ? 'block' : 'none';
  
  gAudioEngine = new AudioEngine(
    null,
    function() { // on_sounds_loaded_fn
      console.log("playing sounds");
      gAudioEngine.sound_singleton(SOUND.music).init({loop:true, gain:0.1});
      // audio      
      gAudioEngine.sound_singleton(SOUND.zombie_eats).init({gain:0.0, loop:true});
      gAudioEngine.sound_singleton(SOUND.wheel_slide).init({gain:0.0, loop:true});
      gAudioEngine.sound_singleton(SOUND.car_engine_loop).init({gain:0.0, loop:true});
      
      if (!gMuted && Game != null) {
        gAudioEngine.sound_singleton(SOUND.music).play();
        gAudioEngine.sound_singleton(SOUND.zombie_eats).play();
        gAudioEngine.sound_singleton(SOUND.wheel_slide).play();
        gAudioEngine.sound_singleton(SOUND.car_engine_loop).play();
      }
    }
  );
  if (gMuted) {
    gAudioEngine.pause_all();
  }
}
window.addEventListener('DOMContentLoaded', load, false);

// Stop current world
function stop_world() {
  if (Game != null) {
    Game.stop_all();
    Game.m_audio.pause_all();
    Game = null;
  }
}

function switch_div(a_new) {
  var new_div = document.getElementById(a_new);
  new_div.style.display = 'block';
  if (current_div != null && current_div != new_div) {
    current_div.style.display = 'none';
  }
  current_div = new_div;
}

// Go to screen "select level"
function select_level() {
  stop_world();
  var levels_table = document.getElementById('form_levels');
  var text = "<div style='position:absolute;left:0px;width:100%;height:100%;top:16px;'><div style='text-align:center;font-size:40px;'>Select level</div>";
  var row_len = 4;
  var dx = 150;
  var dy = 200;
  var last_passed = -1;
  for (var i = 0; i < levels.length; i++) {
    var store_res = new LocalStore("level"+i);
    var res = store_res.get();
    var inner_text = "<p class='level_num'>" + (i+1) + "</p>";
    if (res != null) {
      if (res.stars > 0) {
        last_passed = i;
      }
      inner_text = inner_text + res.score + "<br/>";
      inner_text = inner_text + res.saved + "/" + res.humans + "<br/>";
      switch (res.stars) {
        case 0: inner_text = inner_text + "Bad<br/>"; break;
        case 1: inner_text = inner_text + "Pure<br/>"; break;
        case 2: inner_text = inner_text + "Good<br/>"; break;
        case 3: inner_text = inner_text + "Excellent<br/>"; break;
      }
    }
    var tag = "";
    var st = " style='left:"+((i%row_len)*dx + 180)+"px;top:"+(Math.floor(i/row_len) * dy + 170)+"px' ";
    if (i <= last_passed + 1) {
      tag = "<a href='#' class='level_selector ls_active'" + st + "onclick='play_level("+i+");'>"+inner_text+"</a>";
    } else {
      tag = "<div class='level_selector ls_inactive'"+st+">" + inner_text + "</div>";
    }
    text += tag;
  }
  levels_table.innerHTML = text + "<a style='position:absolute;left:16px;bottom:36px;width:150px' id=\"main_menu_btn\" class=\"btn_class\" onclick='main_menu();' href=\"#\">&lt; Main menu</a></div><div style='position:absolute;width:150px;height:150px;bottom:-30px;right:-40px;'><object type=\"image/svg+xml\" data=\"img/splash.svg\" width=\"150\" height=\"150\"></div>";
  
  switch_div('form_levels');
}

// replay current level
function replay_level() {
  if (Game != null) {
    play_level(Game.level);
  }
}

// play next level
function next_level() {
  if (Game != null) {
    play_level(Game.level + 1);
  }
}

// play level
function play_level(a_level) {
  stop_world();
  Game = new Application('canvas', a_level, gAudioEngine);
  Game.init_int();
  switch_div('form_game');
  if (!gMuted) {
    gAudioEngine.resume_all();
    gAudioEngine.sound_singleton(SOUND.music).play();
    gAudioEngine.sound_singleton(SOUND.zombie_eats).init({gain:0.0, loop:true});
    gAudioEngine.sound_singleton(SOUND.zombie_eats).play();

    gAudioEngine.sound_singleton(SOUND.wheel_slide).init({gain:0.0, loop:true});
    gAudioEngine.sound_singleton(SOUND.wheel_slide).play();

    gAudioEngine.sound_singleton(SOUND.car_engine_loop).init({gain:0.0, loop:true});
    gAudioEngine.sound_singleton(SOUND.car_engine_loop).play();
  }
}

// Go to main menu
function main_menu() {
  stop_world();
  switch_div('form_main_menu');
}

// Mute
function on_mute() {
  var icon = document.getElementById('sound_disabled_icon');
  gMuted = !gMuted;
  if (!gMuted) {
    icon.style.display = 'none';
    if (gAudioEngine != null && (Game != null)) {
      gAudioEngine.resume_all();
    }
  } else {
    icon.style.display = 'block';
    if (gAudioEngine != null) {
      gAudioEngine.pause_all();
    }
  }
	muted_store.set(gMuted);
}

// Add listener for when the page is unloaded by the platform 
// This occurs due to inactivity or memory usage
// You have 4 seconds from this event to save/store any data
function unload() {
    console.log('Popup page is being unloaded.');
	// Time to save any state
  if (Game != null) {
		Game.onPopupUnload();
	}
}
pokki.addEventListener('popup_unload', unload);

// Add listener for when the popup window is showing
function showing() {
  console.log('Popup window is almost visible.');    
  if (Game != null) {
  	Game.onPopupShowing();
  }
}
pokki.addEventListener('popup_showing', showing);

// Add listener for when the popup window is shown
function shown() {
  console.log('Popup window is visible.');
  if (Game != null) {
  	Game.onPopupShown();
  }
  if ((gAudioEngine != null) && !gMuted && (Game != null)) {
    gAudioEngine.resume_all();
  }
}
pokki.addEventListener('popup_shown', shown);

// Add listener for when the pop-up window is hidden
function hidden() {
  console.log('Popup window was hidden.');
  if (Game != null) {
  	Game.onPopupHidden();      
  }
  if (gAudioEngine != null) {
    gAudioEngine.pause_all();
  }
}
pokki.addEventListener('popup_hidden', hidden);