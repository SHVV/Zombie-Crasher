//==============================================================================
// 2D Context extended with camera.
//==============================================================================

//==============================================================================
// C-tor
function ContextEx(a_ctx, a_width, a_height) {
  this.m_ctx = a_ctx;
  this.m_width = a_width;
  this.m_height = a_height;
  this.m_camera = {
    x: 0.0,     // Position in meters x
    y: 0.0,     // y
    z: 50.0*0.75,    // z
    FOV: 0.75    // view width / z ratio
  };
  this.m_zoom = 1;
  this.m_trans = new Trans2({x:0,y:0}, 0, null);
};

//==============================================================================
// Set current output transform
ContextEx.prototype.set_trans = function(t) {
  this.m_trans.SetT(t);
}

//==============================================================================
// Run context
ContextEx.prototype.run = function(dt) {
  this.m_zoom = this.m_width / (this.m_camera.z * this.m_camera.FOV);
}

//==============================================================================
// Convert world coordinates to screen
ContextEx.prototype.world2screen = function(wp) {
  var p = {x: wp.x - this.m_camera.x, y: wp.y - this.m_camera.y};
  p.x *= this.m_zoom;
  p.y *= -this.m_zoom;
  p.x += this.m_width * 0.5;
  p.y += this.m_height * 0.5;
  return p;
}

//==============================================================================
// Convert world coordinates to screen
ContextEx.prototype.world2screen_ex = function(wp, zoom) {
  var p = {x: wp.x - this.m_camera.x, y: wp.y - this.m_camera.y};
  p.x *= zoom;
  p.y *= -zoom;
  p.x += this.m_width * 0.5;
  p.y += this.m_height * 0.5;
  return p;
}

//==============================================================================
// Convert screen coordinates to world
ContextEx.prototype.screen2world = function(sp) {
  var p = {
    x: sp.x - this.m_width * 0.5, 
    y: sp.y - this.m_height * 0.5
  };
  p.x /= this.m_zoom;
  p.y /= -this.m_zoom;
  p.x += this.m_camera.x;
  p.y += this.m_camera.y;
  return p;
}

//==============================================================================
// Draw particles
ContextEx.prototype.draw_particles = function(a_particles, a_color) {
  this.m_ctx.beginPath();
  for (var i in a_particles.particles) {
    p = a_particles.particles[i];
    if (p.active) {
      var pos1 = this.world2screen(p.pos);
      var pos2 = this.world2screen(p.pos_old);
      this.m_ctx.moveTo(pos1.x + 0.5, pos1.y + 0.5);
      this.m_ctx.lineTo(pos2.x + 0.5, pos2.y + 0.5);
    }
  }
  if (a_color != null) {
    this.m_ctx.lineCap = 'round';
    this.m_ctx.lineWidth = 0.1 * this.m_zoom;
    this.m_ctx.strokeStyle = a_color;
    this.m_ctx.stroke();
    this.m_ctx.lineCap = 'butt';
  }
}

//==============================================================================
// Draw polyline
ContextEx.prototype.draw_box = function(a_pos, a_ext, a_height, a_stroke, a_fill) {
  this.m_ctx.beginPath();
  /*var p = this.m_trans.TransFromV(a_points[0]);
  var sp = this.world2screen(p);
  this.m_ctx.moveTo(sp.x + 0.5, sp.y + 0.5);
  for (var i = 1; i < a_points.length; ++i) {
  p = this.m_trans.TransFromV(a_points[i]);
  sp = this.world2screen(p);
  this.m_ctx.lineTo(sp.x + 0.5, sp.y + 0.5);
  }*/
  var zoom2 = this.m_width / ((this.m_camera.z - a_height) * this.m_camera.FOV);
  var pos1 = this.world2screen(a_pos);
  var pos2 = this.world2screen_ex(a_pos, zoom2);
  var ext1 = Vec2.multiplyScalar(this.m_zoom, a_ext);
  var ext2 = Vec2.multiplyScalar(zoom2, a_ext);
  if (a_stroke != null) {
    this.m_ctx.lineWidth = 1;
    this.m_ctx.strokeStyle = a_stroke;
  }

  // Draw sides
  // lower side
  if (pos1.y + ext1.y < this.m_height * 0.5) {
    this.m_ctx.beginPath();
    this.m_ctx.moveTo(pos1.x + ext1.x + 0.5, pos1.y + ext1.y + 0.5);
    this.m_ctx.lineTo(pos1.x - ext1.x + 0.5, pos1.y + ext1.y + 0.5);
    this.m_ctx.lineTo(pos2.x - ext2.x + 0.5, pos2.y + ext2.y + 0.5);
    this.m_ctx.lineTo(pos2.x + ext2.x + 0.5, pos2.y + ext2.y + 0.5);
    this.m_ctx.lineTo(pos1.x + ext1.x + 0.5, pos1.y + ext1.y + 0.5);
    this.m_ctx.fillStyle = "#A0A0A0";
    this.m_ctx.fill();
    if (a_stroke != null) {
      this.m_ctx.stroke();
    }
  }

  // upper side
  if (pos1.y - ext1.y > this.m_height * 0.5) {
    //this.m_ctx.beginPath();
    this.m_ctx.moveTo(pos1.x + ext1.x + 0.5, pos1.y - ext1.y + 0.5);
    this.m_ctx.lineTo(pos1.x - ext1.x + 0.5, pos1.y - ext1.y + 0.5);
    this.m_ctx.lineTo(pos2.x - ext2.x + 0.5, pos2.y - ext2.y + 0.5);
    this.m_ctx.lineTo(pos2.x + ext2.x + 0.5, pos2.y - ext2.y + 0.5);
    this.m_ctx.lineTo(pos1.x + ext1.x + 0.5, pos1.y - ext1.y + 0.5);
    this.m_ctx.fillStyle = "#F4F4F4";
    this.m_ctx.fill();
    if (a_stroke != null) {
      this.m_ctx.stroke();
    }
  }

  // right side  
  if (pos1.x + ext1.x < this.m_width * 0.5) {
    this.m_ctx.beginPath();
    this.m_ctx.moveTo(pos1.x + ext1.x + 0.5, pos1.y + ext1.y + 0.5);
    this.m_ctx.lineTo(pos1.x + ext1.x + 0.5, pos1.y - ext1.y + 0.5);
    this.m_ctx.lineTo(pos2.x + ext2.x + 0.5, pos2.y - ext2.y + 0.5);
    this.m_ctx.lineTo(pos2.x + ext2.x + 0.5, pos2.y + ext2.y + 0.5);
    this.m_ctx.lineTo(pos1.x + ext1.x + 0.5, pos1.y + ext1.y + 0.5);
    this.m_ctx.fillStyle = "#A4A4A4";
    this.m_ctx.fill();
    if (a_stroke != null) {
      this.m_ctx.stroke();
    }
  }

  // left side  
  if (pos1.x - ext1.x > this.m_width * 0.5) {
    this.m_ctx.beginPath();
    this.m_ctx.moveTo(pos1.x - ext1.x + 0.5, pos1.y + ext1.y + 0.5);
    this.m_ctx.lineTo(pos1.x - ext1.x + 0.5, pos1.y - ext1.y + 0.5);
    this.m_ctx.lineTo(pos2.x - ext2.x + 0.5, pos2.y - ext2.y + 0.5);
    this.m_ctx.lineTo(pos2.x - ext2.x + 0.5, pos2.y + ext2.y + 0.5);
    this.m_ctx.lineTo(pos1.x - ext1.x + 0.5, pos1.y + ext1.y + 0.5);
    this.m_ctx.fillStyle = "#F0F0F0";
    this.m_ctx.fill();
    if (a_stroke != null) {
      this.m_ctx.stroke();
    }
  }

  // top side
  this.m_ctx.beginPath();
  this.m_ctx.moveTo(pos2.x - ext2.x + 0.5, pos2.y + ext2.y + 0.5);
  this.m_ctx.lineTo(pos2.x - ext2.x + 0.5, pos2.y - ext2.y + 0.5);
  this.m_ctx.lineTo(pos2.x + ext2.x + 0.5, pos2.y - ext2.y + 0.5);
  this.m_ctx.lineTo(pos2.x + ext2.x + 0.5, pos2.y + ext2.y + 0.5);
  this.m_ctx.lineTo(pos2.x - ext2.x + 0.5, pos2.y + ext2.y + 0.5);

  if (a_fill != null) {
    this.m_ctx.fillStyle = a_fill;
    this.m_ctx.fill();
  }

  if (a_stroke != null) {
    this.m_ctx.lineWidth = 1;
    this.m_ctx.strokeStyle = a_stroke;
    this.m_ctx.stroke();
  }
}

//==============================================================================
// Draw lines
ContextEx.prototype.draw_lines = function(a_lines, a_stroke) {
  this.m_ctx.lineCap = 'round';
  this.m_ctx.strokeStyle = a_stroke;
  for (var i = 0; i < a_lines.length; ++i) {
    this.m_ctx.beginPath();
    sp1 = this.world2screen(a_lines[i].p1);
    sp2 = this.world2screen(a_lines[i].p2);
    this.m_ctx.moveTo(sp1.x + 0.5, sp1.y + 0.5);
    this.m_ctx.lineTo(sp2.x + 0.5, sp2.y + 0.5);
    if (a_stroke != null) {
      this.m_ctx.lineWidth = a_lines[i].r * this.m_zoom;
      this.m_ctx.stroke();
    }
  }
  this.m_ctx.lineWidth = 1;
  this.m_ctx.lineCap = 'butt';
}

//==============================================================================
// Draw circles
ContextEx.prototype.draw_circles = function(a_circles, a_stroke, a_fill) {
  this.m_ctx.beginPath();
  for (var i = 0; i < a_circles.length; ++i) {
    sp = this.world2screen(a_circles[i].p);
    this.m_ctx.arc(sp.x + 0.5, sp.y + 0.5, a_circles[i].r * this.m_zoom, 0, 2 * Math.PI, false);
  }
  if (a_stroke != null) {
    this.m_ctx.strokeStyle = a_stroke;
    this.m_ctx.stroke();
  }
  if (a_fill != null) {
    this.m_ctx.fillStyle = a_fill;
    this.m_ctx.fill();
  }
}

//==============================================================================
// Draw polyline
ContextEx.prototype.draw_poly = function(a_points, a_stroke, a_fill) {
  this.m_ctx.beginPath();
  var p = this.m_trans.TransFromV(a_points[0]);
  var sp = this.world2screen(p);
  this.m_ctx.moveTo(sp.x + 0.5, sp.y + 0.5);
  for (var i = 1; i < a_points.length; ++i) {
    p = this.m_trans.TransFromV(a_points[i]);
    sp = this.world2screen(p);
    this.m_ctx.lineTo(sp.x + 0.5, sp.y + 0.5);
  }
  if (a_stroke != null) {
    this.m_ctx.strokeStyle = a_stroke;
    this.m_ctx.stroke();
  }
  if (a_fill != null) {
    this.m_ctx.fillStyle = a_fill;
    this.m_ctx.fill();
  }
}

//==============================================================================
// Draw skeleton
ContextEx.prototype.draw_skeleton = function(a_skeleton, a_pose, a_stroke, a_fill) {
  this.m_ctx.beginPath();
  var p1;
  var p2;
  var sp1;
  var sp2;
  for (p in a_skeleton) {
    var parent = a_skeleton[p];
    if (parent >= 0) {
      p1 = this.m_trans.TransFromV({x:a_pose[p][0],y:a_pose[p][1]});
      p2 = this.m_trans.TransFromV({x:a_pose[parent][0],y:a_pose[parent][1]});
      this.m_zoom = this.m_width / ((this.m_camera.z - a_pose[p][2]) * this.m_camera.FOV);
      sp1 = this.world2screen(p1);
      this.m_zoom = this.m_width / ((this.m_camera.z - a_pose[parent][2]) * this.m_camera.FOV);
      sp2 = this.world2screen(p2);
      this.m_ctx.moveTo(sp1.x + 0.5, sp1.y + 0.5);
      this.m_ctx.lineTo(sp2.x + 0.5, sp2.y + 0.5);
    }
  }
  this.m_zoom = this.m_width / (this.m_camera.z * this.m_camera.FOV);
  
  this.m_ctx.arc(sp1.x + 0.5, sp1.y + 0.5, 0.15* this.m_zoom, 0, 2 * Math.PI, false);

  if (a_stroke != null) {
    this.m_ctx.lineCap = 'round';
    this.m_ctx.lineWidth = 0.15 * this.m_zoom;
    this.m_ctx.strokeStyle = a_stroke;
    this.m_ctx.stroke();
    this.m_ctx.lineCap = 'butt';
  }
  if (a_fill != null) {
    this.m_ctx.fillStyle = a_fill;
    this.m_ctx.fill();
  }
}

//==============================================================================
// Draw skeleton
ContextEx.prototype.draw_skeleton_shadow = function(a_skeleton, a_pose, a_stroke, a_fill) {
  this.m_ctx.beginPath();
  var p1;
  var p2;
  var sp1;
  var sp2;
  for (p in a_skeleton) {
    var parent = a_skeleton[p];
    if (parent >= 0) {
      var pos1 = a_pose[p];
      var pos2 = a_pose[parent];
      if ((pos1 == undefined) || (pos2 == undefined)) {
        pos1 = 0;
      }
      
      p1 = this.m_trans.TransFromV({x:pos1[0],y:pos1[1]});
      p1.x += pos1[2]*0.5;
      p1.y -= pos1[2]*0.5;
      p2 = this.m_trans.TransFromV({x:pos2[0],y:pos2[1]});
      p2.x += pos2[2]*0.5;
      p2.y -= pos2[2]*0.5;
      sp1 = this.world2screen(p1);
      sp2 = this.world2screen(p2);
      this.m_ctx.moveTo(sp1.x + 0.5, sp1.y + 0.5);
      this.m_ctx.lineTo(sp2.x + 0.5, sp2.y + 0.5);
    }
  }
  
  this.m_ctx.arc(sp1.x + 0.5, sp1.y + 0.5, 0.15* this.m_zoom, 0, 2 * Math.PI, false);

  if (a_stroke != null) {
    this.m_ctx.lineCap = 'round';
    this.m_ctx.lineWidth = 0.15 * this.m_zoom;
    this.m_ctx.strokeStyle = a_stroke;
    this.m_ctx.stroke();
    this.m_ctx.lineCap = 'butt';
  }
  if (a_fill != null) {
    this.m_ctx.fillStyle = a_fill;
    this.m_ctx.fill();
  }
}

//==============================================================================
// Draw polyline
ContextEx.prototype.draw_circle = function(a_point, a_r, a_stroke, a_fill) {
  this.m_ctx.beginPath();
  var p = this.m_trans.TransFromV(a_point);
  var sp = this.world2screen(p);
  this.m_ctx.arc(sp.x + 0.5, sp.y + 0.5, a_r * this.m_zoom, 0, 2 * Math.PI, false);
  if (a_stroke != null) {
    this.m_ctx.strokeStyle = a_stroke;
    this.m_ctx.stroke();
  }
  if (a_fill != null) {
    this.m_ctx.fillStyle = a_fill;
    this.m_ctx.fill();
  }
}

//==============================================================================
// Draw grid
ContextEx.prototype.draw_grid = function() {
  this.m_ctx.fillStyle = "#FFFFFF";
  //this.m_ctx.clearRect(0, 0, this.m_width, this.m_height);
  this.m_ctx.fillRect(0, 0, this.m_width, this.m_height);
  
  var p0 = {x: 0, y: 0};
  p0 = this.screen2world(p0);
  var p1 = {x: this.m_width, y: this.m_height};
  p1 = this.screen2world(p1);
  this.m_ctx.lineWidth = 1;

  // Grid color dependend on index.
  grid_color = function(a) {
    /*if (a == 0) {
      return '#000000';    
    }
    if (a % 1000 == 0) {
      return '#606060';    
    }
    if (a % 100 == 0) {
      return '#909090';    
    } */
    if (a % 10 == 0) {
      return '#C0C0C0';    
    }
    return '#F0F0F0';
  }

  var dp = 10;//(this.m_zoom < 15) ? 5 : 1;
  // Draw vertical lines
  for (var x = Math.round(p0.x / dp) * dp; x < p1.x; x += dp) {
    var p = this.world2screen({x: x, y: 0});
    this.m_ctx.beginPath();
    this.m_ctx.strokeStyle = grid_color(x);
    this.m_ctx.moveTo(p.x + 0.5, 0);
    this.m_ctx.lineTo(p.x + 0.5, this.m_height);
    this.m_ctx.stroke();
  }

  // Draw horizontal lines
  for (var y = Math.round(p1.y / dp) * dp; y < p0.y; y += dp) {
    var p = this.world2screen({x: 0, y: y});
    this.m_ctx.beginPath();
    this.m_ctx.strokeStyle = grid_color(y);
    this.m_ctx.moveTo(0, p.y + 0.5);
    this.m_ctx.lineTo(this.m_width, p.y + 0.5);
    this.m_ctx.stroke();
  }

  /*var p = this.world2screen({x: 0, y: 0});
  this.m_ctx.beginPath();
  this.m_ctx.lineWidth = 1;
  this.m_ctx.strokeStyle = '#000000';
  this.m_ctx.arc(p.x + 0.5, p.y + 0.5, 0.5 * this.m_zoom, 0, 2 * Math.PI, false);
  this.m_ctx.stroke();*/  
}
