//==============================================================================
// Common utilities
//==============================================================================

//==============================================================================
// Key codes

var key_code = {
  BACKSPACE: 8,
  TAB:       9,
  RETURN:   13,
  SHIFT:    16,
  CTRL:     17,
  ALT:      18,
  ESC:      27,
  SPACE:    32,
  LEFT:     37,
  UP:       38,
  RIGHT:    39,
  DOWN:     40,
  DELETE:   46,
  HOME:     36,
  END:      35,
  PAGEUP:   33,
  PAGEDOWN: 34,
  INSERT:   45,
  '0': 48,
  '1': 49,
  '2': 50,
  '3': 51,
  '4': 52,
  '5': 53,
  '6': 54,
  '7': 55,
  '8': 56,
  '9': 57,
  'A': 65,
  'B': 66,
  'C': 67,
  'D': 68,
  'E': 69,
  'F': 70,
  'G': 71,
  'H': 72,
  'I': 73,
  'J': 74,
  'K': 75,
  'L': 76,
  'M': 77,
  'N': 78,
  'O': 79,
  'P': 80,
  'Q': 81,
  'R': 82,
  'S': 83,
  'T': 84,
  'U': 85,
  'V': 86,
  'W': 87,
  'X': 88,
  'Y': 89,
  'Z': 90,
  'NUMPAD_0': 96,
  'NUMPAD_1': 97,
  'NUMPAD_2': 98,
  'NUMPAD_3': 99,
  'NUMPAD_4': 100,
  'NUMPAD_5': 101,
  'NUMPAD_6': 102,
  'NUMPAD_7': 103,
  'NUMPAD_8': 104,
  'NUMPAD_9': 105,
  'MULTIPLY': 106,
  'ADD': 107,
  'SUBSTRACT': 109,
  'DECIMAL': 110,
  'DIVIDE': 111,
  'F1': 112,
  'F2': 113,
  'F3': 114,
  'F4': 115,
  'F5': 116,
  'F6': 117,
  'F7': 118,
  'F8': 119,
  'F9': 120,
  'F10': 121,
  'F11': 122,
  'F12': 123
};

//==============================================================================
// Some Physics constants
var Phys = {
  g:  9.8 * 4
}

function getPageSize()
{
  var xScroll, yScroll;
   
  if (window.innerHeight && window.scrollMaxY)
  {
  xScroll = document.body.scrollWidth;
  yScroll = window.innerHeight + window.scrollMaxY;
  }
  else if (document.body.scrollHeight > document.body.offsetHeight)
  // all but Explorer Mac
  {
  xScroll = document.body.scrollWidth;
  yScroll = document.body.scrollHeight;
  }
  else
  // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
  {
  xScroll = document.body.offsetWidth;
  yScroll = document.body.offsetHeight;
  }
   
  var windowWidth, windowHeight;
   
  if (self.innerHeight)
  // all except Explorer
  {
  windowWidth = self.innerWidth;
  windowHeight = self.innerHeight;
  }
  else if (document.documentElement && document.documentElement.clientHeight)
  // Explorer 6 Strict Mode
  {
  windowWidth = document.documentElement.clientWidth;
  windowHeight = document.documentElement.clientHeight;
  }
  else if (document.body)
  // other Explorers
  {
  windowWidth = document.body.clientWidth;
  windowHeight = document.body.clientHeight;
  }
   
  // for small pages with total height less then height of the viewport
  if (yScroll < windowHeight)
  pageHeight = windowHeight;
  else
  pageHeight = yScroll;
   
  // for small pages with total width less then width of the viewport
  if (xScroll < windowWidth)
  pageWidth = windowWidth;
  else
  pageWidth = xScroll;
   
  arrayPageSize = new Array(pageWidth,pageHeight,windowWidth,windowHeight)
  return arrayPageSize;
}

// turn popup on/off
function turn_popup(element, on) {
  if(on){
    var win_sizes = getPageSize();
    document.getElementById('overlay').style.display = 'block';
    document.getElementById(element).style.display = 'block';
  	var pop_width = parseInt(document.getElementById(element).style.width);
  	var pop_height = parseInt(document.getElementById(element).style.height);
  	document.getElementById(element).style.left = (win_sizes[0] - pop_width) / 2 + "px";
  	document.getElementById(element).style.top = (win_sizes[3] - pop_height) / 2 + "px";
  } else {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById(element).style.display = 'none';
  }
}

//==============================================================================
// Output debug string only one per frame
//------------------------------------------------------------------------------
//   str - string to output
//------------------------------------------------------------------------------
var Debug = {
  enable: false,
  output: function(str) {
    if (this.enable) {
      document.getElementById('debug').innerHTML = str;
    }
  },
  write_line: function(str) {
    if (this.enable) {
      document.getElementById('debug').innerHTML += str + "<br/>";
    }
  },
  clear: function() {
    this.output("");
  }
}
