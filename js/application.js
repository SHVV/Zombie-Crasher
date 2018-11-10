//==============================================================================
// Game application class
//==============================================================================

//==============================================================================
// C-tor
function Application(a_ctx, a_level, a_audio_engine) {
  var this_app = this;

  this.old_zombies = 0;
  this.old_humans = 0;
  this.old_score = -1;
  this.m_audio = a_audio_engine;
  /*new AudioEngine(
    this_app,
    function() { // on_sounds_loaded_fn
      console.log("playing sounds");
      this_app.m_audio.sound_singleton(SOUND.music).init({loop:true, gain:0.1});
      this_app.m_audio.sound_singleton(SOUND.music).play();
      // audio      

      this_app.m_audio.sound_singleton(SOUND.zombie_eats).init({gain:0.0, loop:true});
      this_app.m_audio.sound_singleton(SOUND.zombie_eats).play();

      this_app.m_audio.sound_singleton(SOUND.wheel_slide).init({gain:0.0, loop:true});
      this_app.m_audio.sound_singleton(SOUND.wheel_slide).play();

      this_app.m_audio.sound_singleton(SOUND.car_engine_loop).init({gain:0.1, loop:true});
      this_app.m_audio.sound_singleton(SOUND.car_engine_loop).play();
    }
  );*/


  //var unloaded = new LocalStore('unloaded');
  //this.m_paused = true;
  
  // Kick off what needs to be done whenever the popup is about to be shown
  this.onPopupShowing = function() {    
  
  };
  
  // Kick off what needs to be done when the popup is shown
  this.onPopupShown = function() {
    this.m_paused = false;
    //this.m_audio.resume_all();
    //unloaded.get();
    //unloaded.remove();
  };
  
  // Kick off what needs to be done when the popup is hidden
  this.onPopupHidden = function() {
    this.m_paused = true;
    //this.m_audio.pause_all();
  };
  
  // Use this to store anything needed to restore state when the user opens the Pokki again
  this.onPopupUnload = function() {
    //unloaded.set(true);
  };

  this.level = a_level;
  
  var b2Vec2 = Box2D.Common.Math.b2Vec2
    ,	b2BodyDef = Box2D.Dynamics.b2BodyDef
    ,	b2Body = Box2D.Dynamics.b2Body
    ,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
    ,	b2Fixture = Box2D.Dynamics.b2Fixture
    ,	b2World = Box2D.Dynamics.b2World
    ,	b2MassData = Box2D.Collision.Shapes.b2MassData
    ,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
    ,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
    ,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
  
  this.world = new b2World(new b2Vec2(0, 0), false);
  var fixDef = new b2FixtureDef;
  fixDef.density = 1.0;
  fixDef.friction = 0.1;
  fixDef.restitution = 0.1;
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(5, 5);
  
  //create houses
  var bodyDef = new b2BodyDef;
  bodyDef.type = b2Body.b2_staticBody;
  var bodyDef = new b2BodyDef;
  
  this.pedestrians = [];
  this.humans = 0;

  var level = levels[this.level];
  this.cell_size = 10;
  this.cell_shift = 5;
  for (var i = 0; i < level.length; i++) {
    var row = level[i];
    for (var j = 0; j < row.length; j++) {
      var cell = row[j];
      if (cell > 0) {
        if (cell < 10) {
          bodyDef.position.x = this.g2c(j);
          bodyDef.position.y = this.g2c(i);
          this.world.CreateBody(bodyDef).CreateFixture(fixDef);
        } else if (cell == 10) {
          this.car = new ArcadeCar();
          this.car.init(this, { x: this.g2c(j), y: this.g2c(i) }, 0);
          this.pre_init(a_ctx);
        } else if (cell < 30) {
          for (k = 0; k < (cell % 10); k++) {
            p = new Pedestrian();
            p.init(this, {x:Math.random()*this.cell_size-this.cell_size * 0.5 + this.g2c(j), 
                          y:Math.random()*this.cell_size-this.cell_size * 0.5 + this.g2c(i)}, Math.random()*2*Math.PI);
            if (cell < 20) {
              this.humans++;
            }
            p.zombify((cell > 20) ? 1 : 0);
            this.pedestrians.push(p);
          }
        }
      }
    }
  }

  this.particles = new Particles(this.car.pos, this.car.velocity);

  this.score = 0;
  this.score_neg = 0;
  //var _self = this;
  var listener = new Box2D.Dynamics.b2ContactListener;
  /*if (callbacks.BeginContact) listener.BeginContact = function(contact) {
      callbacks.BeginContact(contact.GetFixtureA().GetBody().GetUserData(),
                             contact.GetFixtureB().GetBody().GetUserData());
  }
  if (callbacks.EndContact) listener.EndContact = function(contact) {
      callbacks.EndContact(contact.GetFixtureA().GetBody().GetUserData(),
                           contact.GetFixtureB().GetBody().GetUserData());
  }*/
  /*if (callbacks.PostSolve) */listener.PostSolve = function(contact, impulse) {
    var _self = Game;
    var ga1 = contact.GetFixtureA().GetBody().GetUserData();
    var ga2 = contact.GetFixtureB().GetBody().GetUserData();
    var vec = contact.GetFixtureA().GetBody().GetWorldVector(contact.GetManifold().m_localPlaneNormal);
    if (Pedestrian.prototype.isPrototypeOf(ga1) && ga2 == null) {
      ga1.direction.x = Math.random() - 0.5;
      ga1.direction.y = Math.random() - 0.5;
    }
    if (Pedestrian.prototype.isPrototypeOf(ga2) && ga1 == null) {
      ga2.direction.x = Math.random() - 0.5;
      ga2.direction.y = Math.random() - 0.5;
    }
    if (impulse.normalImpulses[0] > 300) {
      if (ArcadeCar.prototype.isPrototypeOf(ga1) && Pedestrian.prototype.isPrototypeOf(ga2)) {
        //_self.car.trans.m_r.col2
        ga2.kill(vec, impulse.normalImpulses[0]);
        if (ga2.zombified >= 1) {
          if (Math.abs(Vec2.dot(contact.GetManifold().m_localPlaneNormal, new Vec2(0, 1))) < 0.7) {
            _self.score += 2;
          } else {
            _self.score += 1;
          }
        } else {
          _self.score_neg += 5;
        }
      }
      if (ArcadeCar.prototype.isPrototypeOf(ga2) && Pedestrian.prototype.isPrototypeOf(ga1)) {
        ga1.kill(vec, -impulse.normalImpulses[0]);
        if (ga1.zombified >= 1) {
          if (Math.abs(Vec2.dot(contact.GetManifold().m_localPlaneNormal, new Vec2(0, 1))) < 0.7) {
            _self.score += 2;
          } else {
            _self.score += 1;
          }
        } else {
          _self.score_neg += 5;
        }
      }
      _self = null;
    }
    //callbacks.PostSolve(contact.GetFixtureA().GetBody().GetUserData(),
    //                    contact.GetFixtureB().GetBody().GetUserData(),
    //                    impulse.normalImpulses[0]);
  }
  this.world.SetContactListener(listener);
  this.ended = false;
  
  /*for (var i = 0; i < 100; i++) {
    p = new Pedestrian();
    p.init(this, {x:Math.random()*100-50, y:Math.random()*100-50}, Math.random()*2*Math.PI);
    p.zombify((Math.random() > 0.3) ? 1 : 0);
    this.pedestrians.push(p);
  }*/
}

Application.prototype = new BaseApplication();

Application.prototype.g2c = function(ind) {
  return this.cell_size * ind + this.cell_shift;
}

Application.prototype.c2g = function(coord){
  return Math.round((coord - this.cell_shift) / this.cell_size);
}

//==============================================================================
// Init function (after document load) for overloading
Application.prototype.init = function() {
  turn_popup('end_level_dlg', false);
  /*var _self = this;
  document.getElementById('chABS').onchange = function() {
    if (_self.car.abs !== undefined) _self.car.abs = this.checked;
  }
  document.getElementById('chTCS').onchange = function() {
    if (_self.car.tcs !== undefined) _self.car.tcs = this.checked;
  }
  document.getElementById('chSTEER').onchange = function() {
    if (_self.car.steer_control !== undefined) _self.car.steer_control = this.checked;
  }
  document.getElementById('selDRIVE').onchange = function() {
    if (_self.car.set_drive !== undefined) {
      switch (this.value) {
        case 'RWD': _self.car.set_drive(false, true); break;
        case 'FWD': _self.car.set_drive(true, false); break;
        case 'AWD': _self.car.set_drive(true, true); break;
      }
    }
  }*/
}

function drive_val(d_val, cur_val, dt) {
  if (Math.abs(d_val - cur_val) < dt) {
    return d_val;
  }
  d_val = ((d_val - cur_val) > 0 ? 1 : -1) * dt;
  cur_val += d_val;
  return Math2.Clamp(cur_val, -1, 1);
}

//==============================================================================
// Process keys        
Application.prototype.process_keys = function(dt) {
  if (!this.ended) {
    this.car.hand_brake = false;
    
    var d_val = 0;
    if (this.m_keys[key_code.UP] || this.m_keys[key_code.W]) {
      d_val = 1;
    }
    if (this.m_keys[key_code.DOWN] || this.m_keys[key_code.S]) {
      d_val -= 1;
    }
    this.car.traction = drive_val(d_val, this.car.traction, dt * 2);  
  
    d_val = 0;
    if (this.m_keys[key_code.LEFT]) {
      d_val = 1;
    }
    if (this.m_keys[key_code.RIGHT]) {
      d_val -= 1;
    }
    this.car.steering = drive_val(d_val, this.car.steering, dt * 3);
  
    if (this.m_keys[key_code.SPACE]) {
      this.car.hand_brake = true;
    }
    
    d_val = 0;
    if (this.m_keys[key_code.A]) {
      d_val = -1;
    }
    if (this.m_keys[key_code.D]) {
      d_val += 1;
    }
    this.car.strafe = drive_val(d_val, this.car.strafe, dt * 4);
    
    var target = this.m_ctx_ex.screen2world(this.m_mouse);
    this.car.direction = Vec2.subtract(target, this.car.pos);
   
    var new_car = null;
    if (this.m_keys[key_code['1']]) {
      new_car = new ArcadeCar();
      new_car.abs = document.getElementById('chABS').checked;
      new_car.tcs = document.getElementById('chTCS').checked;
      new_car.steer_control = document.getElementById('chSTEER').checked;
      switch (document.getElementById('selDRIVE').value) {
        case 'RWD': new_car.set_drive(false, true); break;
        case 'FWD': new_car.set_drive(true, false); break;
        case 'AWD': new_car.set_drive(true, true); break;
      }
    }
    if (this.m_keys[key_code['2']]) {
      new_car = new SimpleCar();
    }
    if (this.m_keys[key_code['3']]) {
      new_car = new Hover();
    }
    if (this.m_keys[key_code['4']]) {
      new_car = new Mechmind();
    }
    if (this.m_keys[key_code['5']]) {
      new_car = new Pedestrian();
    }
    if (new_car != null) {
      new_car.init(this, this.car.pos, this.car.angle);
      this.car = new_car;
    }
  } else {
    this.car.hand_brake = true;
  }  
  for(var i in this.pedestrians) {
    this.pedestrians[i].handle(dt);
  } 
}


function damping(val, speed, dt) {
  return val * Math.exp(-speed * dt);
}

function damping_v(val, speed, dt) {
  return new Vec2(damping(val.x, speed, dt), damping(val.y, speed, dt));
}

//==============================================================================
// Run objects
Application.prototype.run = function(dt) {
  this.car.run(dt);  

  var zombies = 0;
  var humans = 0;

  var max_dist_eat_sound_works = 20;
  var closest_zombie_eats_dist = max_dist_eat_sound_works+1;

  for (var i in this.pedestrians) {
    var p = this.pedestrians[i];
    p.run(dt);
    if (!p.killed) {
      if (p.zombified >= 1) {  
        zombies++;
        if (p.anim_mixer.m_cur_anim != null) {          
          // yes, zombie eats a flesh!!!
          var dist = Vec2.distance(p.pos, this.car.pos);
          if (dist < max_dist_eat_sound_works) {
            if (dist < closest_zombie_eats_dist) {
              closest_zombie_eats_dist = dist;
            }
          }
        }
      } else {
        humans++;
      }
    }
  }


  var sound_zombie_eats = this.m_audio.sound_singleton(SOUND.zombie_eats);
  if (sound_zombie_eats) {
    if (closest_zombie_eats_dist < max_dist_eat_sound_works) {     
      sound_zombie_eats.tune({gain: 0.4*(max_dist_eat_sound_works-closest_zombie_eats_dist)/max_dist_eat_sound_works});
    } else {
      sound_zombie_eats.tune({gain: 0.0});  
    }
  }



  var score = humans * this.score - this.score_neg;
  if (this.old_zombies != zombies) document.getElementById('zombie_counter').innerHTML = zombies;
  if (this.old_humans != humans) document.getElementById('humans_counter').innerHTML = humans;
  if (this.old_score != score) document.getElementById('score').innerHTML = score;
  
  this.old_zombies = zombies;
  this.old_humans = humans;
  this.old_score = score;

  Debug.write_line("<br/>Zombies: " + zombies + ", Humans: " + humans);
  Debug.write_line("Score: " + humans * this.score - this.score_neg);
  if (!this.ended && (humans == 0 || zombies == 0)) {
    this.ended = true;
    //var score = (humans * this.score - this.score_neg);

    var store_res = new LocalStore("level"+this.level);
    var old_res = store_res.get();

    stars_html = document.getElementById('level_stars');
    var new_rec = "";
    if (old_res == null || old_res.score < score) {
      new_rec = "<br/>New record!";
    }
    if (humans == 0) {
      document.getElementById('level_result').innerHTML = "You lose" + new_rec;
      document.getElementById('next_btn').style.display = "none";
    } else if (this.level == levels.length - 1){
      if (old_res != null && old_res.stars > 0) {
        document.getElementById('level_result').innerHTML = "You win!" + new_rec;
      } else {
        document.getElementById('level_result').innerHTML = "You win the game!<br/>Try to improve results.";
      }
      document.getElementById('next_btn').style.display = "none";
    } else {      
      document.getElementById('level_result').innerHTML = "You win!" + new_rec;
      document.getElementById('next_btn').style.display = "block";
    }
    document.getElementById('result_score').innerHTML = "Score: " + score;
    document.getElementById('result_saved').innerHTML = "People saved: " + humans + "/" + this.humans;
    var res = {score:score,saved:humans,humans:this.humans,stars:0};
    if (this.humans == humans) {
      res.stars = 3;
      stars_html.innerHTML = "Excellent!!!";
    } else if (this.humans / 2 < humans) {
      res.stars = 2;
      stars_html.innerHTML = "Good!";      
    } else if (humans > 0) {
      res.stars = 1;
      stars_html.innerHTML = "Poor";
    } else {
      stars_html.innerHTML = "Bad";
    }
    if (old_res == null || old_res.stars < res.stars || old_res.score < res.score) {
      store_res.set(res);
    }
     
    turn_popup('end_level_dlg', true);
  }
  if (zombies == 0) {
    Debug.write_line("Level cleared!");
  }
  if (humans == 0) {
    Debug.write_line("You lose!");
  }

  this.world.Step(dt, 10, 10);
  this.car.post_phys(dt);
  for (var i in this.pedestrians) {
    this.pedestrians[i].post_phys(dt);
  }
  this.world.ClearForces();


  var accel = 5;
  var new_pos = new Vec2();
  if (this.car.velocity !== undefined) {
    new_pos.SetV(this.car.velocity);
    new_pos.MulS(this.car.speed * 0.025);
  }
  new_pos.AddV(this.car.pos);

  var shift = new_pos.Copy();
  shift.x -= this.m_ctx_ex.m_camera.x;
  shift.y -= this.m_ctx_ex.m_camera.y;
  shift = damping_v(shift, accel, dt);

  this.m_ctx_ex.m_camera.x = new_pos.x - shift.x;
  this.m_ctx_ex.m_camera.y = new_pos.y - shift.y;

  var z_new = (50 + this.car.speed * this.car.speed * 0.17 * 20 / Phys.g) * 0.85;
  var z_shift = z_new - this.m_ctx_ex.m_camera.z;
  z_shift = damping(z_shift, accel, dt);
  this.m_ctx_ex.m_camera.z = z_new - z_shift;

  /*this.m_ctx_ex.m_camera.x = this.car.pos.x;
  this.m_ctx_ex.m_camera.y = this.car.pos.y;
  this.m_ctx_ex.m_camera.z = 50 + this.car.speed * this.car.speed * 0.20;*/
}

//==============================================================================
// Ray trace
Application.prototype.ray_trace = function(a_point, a_point2) {
  res = false;
  //  this.world.RayCast(function(fixture, point, normal, fraction) {
  //    if (fixture.GetBody().GetUserData() == null) {
  //      res = point;
  //      return 0;
  //    }
  //    return fraction;
  //  }, a_point, a_point2);

  var dir = Vec2.subtract(a_point2, a_point);
  var dx_dir = Math2.Sign(dir.x);
  var dy_dir = Math2.Sign(dir.y);

  var _self = this;
  check_wall = function(x, y) {
    level = levels[_self.level];
    if (level[y] == undefined) {
      return true;
    }
    if ((x < 0) || (y < 0) || (y >= level.length) || (x >= level[y].length)) {
      return true;
    } else {
      return level[y][x] > 0 && level[y][x] < 10;
    }
  }

  var dxy_dir = 0;
  var found_p = new Vec2(0, 0);
  if (dir.x != 0) {
    // Going by X, Y-slave
    var x1 = Math.ceil(a_point.x / this.cell_size);
    var ddx = 0;
    if (dx_dir < 0) {
      x1 -= 1;
      ddx = -1;
    }
    var x2 = Math.ceil(a_point2.x / this.cell_size);
    if (dx_dir < 0) {
      x2 -= 1;
      ddx = -1;
    }
    var dxy_ind = dir.y / dir.x;
    var y = a_point.y + (x1 * this.cell_size - a_point.x) * dxy_ind;

    for (var x = x1; x != x2; x += dx_dir) {
      if (check_wall(x + ddx, Math.floor(y / this.cell_size))) {
        found_p.y = y;
        found_p.x = x * this.cell_size;
        break;
      }
      y += dxy_ind * this.cell_size * dx_dir;
    }
  }
  if (dir.y != 0) {
    // Going by Y, X-slave
    var y1 = Math.ceil(a_point.y / this.cell_size);
    var ddy = 0;
    if (dy_dir < 0) {
      y1 -= 1;
      ddy = -1;
    }
    var y2 = Math.ceil(a_point2.y / this.cell_size);
    if (dy_dir < 0) {
      y2 -= 1;
      ddy = -1;
    }
    var dxy_ind = dir.x / dir.y;
    var x = a_point.x + (y1 * this.cell_size - a_point.y) * dxy_ind;

    for (var y = y1; y != y2; y += dy_dir) {
      if (check_wall(Math.floor(x / this.cell_size), y + ddy)) {
        if (found_p.y == 0 || Math.abs(found_p.y - a_point.y) > Math.abs(y * this.cell_size - a_point.y)) {
          found_p.y = y * this.cell_size;
          found_p.x = x;
        }
        break;
      }
      x += dxy_ind * this.cell_size * dy_dir;
    }
  }
  
  _self = null;
  if (found_p.y != 0 || found_p.x != 0) {
    return found_p;
  }
  return res;
}

//==============================================================================
// Returns array with closest pedestrians in a_radius
Application.prototype.get_closest_pedestrians = function(a_point, a_radius, a_all, a_zombified) {
  var res = [];
  for (var i in this.pedestrians) {
    var p = this.pedestrians[i];
    if ((a_all || !p.killed) && (a_zombified == null || a_zombified == (p.zombified >= 1))) {
      var dir = Vec2.subtract(a_point, p.pos);
      if (dir.Length() < a_radius) {
        if (a_all || !this.ray_trace(a_point, p.pos)) {
          res.push(p);
        }
      }
    }
  }
  return res;
}

//==============================================================================
// Draw
Application.prototype.draw = function(dt) {
  this.m_ctx_ex.draw_grid();

  this.car.draw_shadow(dt);

  var view_r = this.m_ctx_ex.m_camera.z / 2;
  var ps = this.get_closest_pedestrians(this.m_ctx_ex.m_camera, view_r, true);
  for (var i in ps) {
    ps[i].draw_shadow(dt);
  }

  this.car.draw(dt);
  /*var p2 = Vec2.add(this.car.pos, Vec2.multiplyScalar(20, this.car.trans.m_r.col2));
  var p3 = this.ray_trace(this.car.pos, p2);
  var line = [this.car.pos, p2];
  this.m_ctx_ex.set_trans(new Trans2());
  this.m_ctx_ex.draw_poly(line, 'blue', null);
  this.m_ctx_ex.draw_circle(this.car.pos, 0.2, null, 'red');
  this.m_ctx_ex.draw_circle(p3, 0.2, null, 'red');*/
  for (var i in ps) {
    ps[i].draw(dt);
  }

  var level = levels[this.level];
  var c_i = this.c2g(this.m_ctx_ex.m_camera.y);
  c_i = Math2.Clamp(c_i, 0, level.length - 1);
  var c_j = this.c2g(this.m_ctx_ex.m_camera.x);
  c_j = Math2.Clamp(c_j, 0, level[0].length - 1);

  var max_i = this.c2g(this.m_ctx_ex.m_camera.y + view_r);
  max_i = Math2.Clamp(max_i, 0, level.length - 1);
  var max_j = this.c2g(this.m_ctx_ex.m_camera.x + view_r);
  max_j = Math2.Clamp(max_j, 0, level[0].length - 1);


  var min_i = this.c2g(this.m_ctx_ex.m_camera.y - view_r);
  min_i = Math2.Clamp(min_i, 0, level.length - 1);
  var min_j = this.c2g(this.m_ctx_ex.m_camera.x - view_r);
  min_j = Math2.Clamp(min_j, 0, level[0].length - 1);

  for (var i = min_i; i < c_i; i++) {
    var row = level[i];
    for (var j = min_j; j < c_j; j++) {
      var cell = row[j];
      if (cell > 0 && cell < 10) {
        this.m_ctx_ex.draw_box({ x: this.g2c(j), y: this.g2c(i) }, { x: 5, y: 5 }, 4 * cell, 'black', 'white');
      }
    }
  }
  for (var i = min_i; i < c_i; i++) {
    var row = level[i];
    for (var j = max_j/*row.length - 1*/; j >= c_j; j--) {
      var cell = row[j];
      if (cell > 0 && cell < 10) {
        this.m_ctx_ex.draw_box({ x: this.g2c(j), y: this.g2c(i) }, { x: 5, y: 5 }, 4 * cell, 'black', 'white');
      }
    }
  }
  for (var i = max_i/*level.length - 1*/; i >= c_i; i--) {
    var row = level[i];
    for (var j = min_j; j < c_j; j++) {
      var cell = row[j];
      if (cell > 0 && cell < 10) {
        this.m_ctx_ex.draw_box({ x: this.g2c(j), y: this.g2c(i) }, { x: 5, y: 5 }, 4 * cell, 'black', 'white');
      }
    }
  }
  for (var i = max_i/*level.length - 1*/; i >= c_i; i--) {
    var row = level[i];
    for (var j = max_j/*row.length - 1*/; j >= c_j; j--) {
      var cell = row[j];
      if (cell > 0 && cell < 10) {
        this.m_ctx_ex.draw_box({ x: this.g2c(j), y: this.g2c(i) }, { x: 5, y: 5 }, 4 * cell, 'black', 'white');
      }
    }
  }
  //this.m_ctx_ex.draw_box({x:15,y:15},{x:5,y:5},20,'black','white');

  /*this.m_ctx_ex.m_ctx.beginPath();
  this.m_ctx_ex.m_ctx.moveTo(this.m_mouse.x-5, this.m_mouse.y);
  this.m_ctx_ex.m_ctx.lineTo(this.m_mouse.x+5, this.m_mouse.y);
  this.m_ctx_ex.m_ctx.moveTo(this.m_mouse.x, this.m_mouse.y-5);
  this.m_ctx_ex.m_ctx.lineTo(this.m_mouse.x, this.m_mouse.y+5);
  
  this.m_ctx.strokeStyle = '#808080';
  this.m_ctx.stroke();*/
}

// Entry point
//var Game = new Application('canvas', 0);