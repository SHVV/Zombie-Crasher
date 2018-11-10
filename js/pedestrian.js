//==============================================================================
// Pedestrian
//==============================================================================

//==============================================================================
// C-tor
function Pedestrian() {
  ControllableObject.call(this);
  // state
  this.velocity = new Vec2(0,0);
  this.speed = 0;
  this.path = 0.0;
  this.zombified = 0.0;
  this.tired = 0.0;
  //this.trans = new Trans2(this.pos, this.angle, null);

  // parameters
  this.tire_walk = -0.01;
  this.tire_stand = -0.1;
  this.tire_run = 0.2;
  this.walk_speed = 1.5;
  this.run_speed = 4.5;
  this.strafe_speed = 0.8;
  this.turn_speed = 2.0;

  this.anim_mixer = new AnimationMixer(pedestrian_idle);
  this.anim_mixer.m_idle_anim.pos = Math.random() * pedestrian_idle.length;
  this.walk_anim = this.anim_mixer.add_circle_animation(pedestrian_walk);
  this.run_anim = this.anim_mixer.add_circle_animation(pedestrian_run);
}

//==============================================================================
// Inherited from ControllableObject
Pedestrian.prototype = new ControllableObject();

//==============================================================================
// Inhereted from ControllableObject
Pedestrian.prototype.init = function(engine, pos, angle) {
  ControllableObject.prototype.init.call(this, engine, pos, angle);

  var b2Vec2 = Box2D.Common.Math.b2Vec2
    , b2BodyDef = Box2D.Dynamics.b2BodyDef
    , b2Body = Box2D.Dynamics.b2Body
    , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
    , b2Fixture = Box2D.Dynamics.b2Fixture
    , b2World = Box2D.Dynamics.b2World
    , b2MassData = Box2D.Collision.Shapes.b2MassData
    , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
    , b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
    , b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

  var fixDef = new b2FixtureDef;
  fixDef.density = 1.0;
  fixDef.friction = 0.1;
  fixDef.restitution = 0.1;

  var bodyDef = new b2BodyDef;
  bodyDef.userData = this;
  bodyDef.type = b2Body.b2_dynamicBody;
  fixDef.shape = new b2CircleShape(0.25);
  bodyDef.position.x = pos.x;
  bodyDef.position.y = pos.y;
  this.body = this.engine.world.CreateBody(bodyDef);
  this.body.CreateFixture(fixDef);
  var mass_data = new b2MassData();
  mass_data.mass = 50;
  mass_data.I = 15;
  this.body.SetMassData(mass_data);
  this.body.SetPositionAndAngle(pos, angle);
  this.killed = false;
  this.particles = null;
}

//==============================================================================
// Zombify pedestrian
Pedestrian.prototype.kill = function(a_norm, a_impulse) {
  this.killed = true;
  this.particles = new Particles(this.pos, Vec2.multiplyScalar(a_impulse / 50, a_norm));
  this.engine.m_audio.play(SOUND.death, { gain: 0.4 - Math.random() * 0.2, rate: 0.8 + Math.random() * 0.4 });
  this.lines = [];
  this.circles = [];
  for (var i = 0; i < 10; i++) {
    var p1 = this.pos.Copy();
    p1.x += Math.random() * 0.4 - 0.2;
    p1.y += Math.random() * 0.4 - 0.2;
    var p2 = Vec2.add(p1, Vec2.multiplyScalar(Math.random() * 2, Vec2.subtract(p1, this.pos)));
    p2.AddV(Vec2.multiplyScalar(a_impulse / 1000, a_norm));
    this.lines.push({ p1: p1, p2: p2, r: Math.random() * 0.2 + 0.02 });
    this.circles.push({ p: p1, r: Math.random() * 0.2 + 0.05 });
  }
}

//==============================================================================
// Zombify pedestrian
Pedestrian.prototype.zombify = function(a_val) {
  if (this.zombified < 1) {
    this.zombified += a_val;
    if (this.zombified >= 1) {
      // change parameters
      this.tire_walk = 0.0;
      this.tire_stand = -0.2;
      this.tire_run = 0.075;
      this.walk_speed = 1;
      this.run_speed = 2.0;
      this.anim_mixer = new AnimationMixer(zombie_idle);
      this.anim_mixer.m_idle_anim.pos = Math.random() * zombie_idle.length;
      this.walk_anim = this.anim_mixer.add_circle_animation(zombie_walk);
      this.run_anim = this.anim_mixer.add_circle_animation(zombie_run);
    }
  }
}

//==============================================================================
// Run AI
Pedestrian.prototype.handle = function(dt) {
  if (this.killed) {
    return;
  }
  var ps = this.engine.get_closest_pedestrians(this.pos, 40, false, this.zombified < 1);
  var dir = new Vec2(0, 0); //this.direction;
  var inv_dist = 0;
  /*var walk = 0;
  var run = 0;*/
  var count = 0;
  this.traction = 0;
  if (this.zombified >= 1) {
    // Handle as zombie
    for (var i in ps) {
      var p = ps[i];
      if (p.zombified < 1) {
        var pdir = Vec2.subtract(p.pos, this.pos);
        var l = pdir.Length();
        var pinv_dist = 1 / l;
        if (inv_dist < pinv_dist) {
          inv_dist = pinv_dist;
          dir = pdir;
        }
        if (l < 1) {
          if (this.anim_mixer.m_cur_anim == null) {
            this.anim_mixer.play_animation(zombie_attack);
          }
          p.zombify(dt * 0.1);
        }
        //dir.AddV(Vec2.multiplyScalar(pinv_dist, pdir));
        //inv_dist += pinv_dist;
        count++;
      }
    }
  } else {
    // Handle as human
    var dirs = [];
    var sections = 16;
    var temp_dir = new Vec2();
    for (var i = 0; i < sections; ++i) {
      temp_dir.x = Math.cos(i * 2 * Math.PI / sections) * 30;
      temp_dir.y = Math.sin(i * 2 * Math.PI / sections) * 30;
      pos = this.engine.ray_trace(this.pos, Vec2.add(this.pos, temp_dir));
      if (pos) {
        var pdir = Vec2.subtract(pos, this.pos);
        var l = pdir.Length();
        dirs[i] = 1 / l * 0.3;
      } else {
        dirs[i] = 0;
      }
    }

    /*var l = this.pos.Length();
    var section = Math.round(Math.atan2(this.pos.y, this.pos.x) * sections / (2 * Math.PI));
    if (section < 0) {
    section += sections;
    }
    dirs[section] = 1 / (75 - l);*/
    for (var i in ps) {
      var p = ps[i];
      if (p.zombified >= 1) {
        var pdir = Vec2.subtract(p.pos, this.pos);
        var section = Math.round(Math.atan2(pdir.y, pdir.x) * sections / (2 * Math.PI));
        if (section < 0) {
          section += sections;
        }
        var l = pdir.Length();
        var pinv_dist = 1 / l;
        dirs[section] = Math.max(pinv_dist, dirs[section]);
        //dir.AddV(Vec2.multiplyScalar(pinv_dist, pdir));
        //inv_dist += pinv_dist;
        /*if (inv_dist < pinv_dist) {
        inv_dist = pinv_dist;
        dir = pdir;
        }*/
        count++;
      }
    }
    do {
      var changed = false;
      for (var i = 0; i < sections; ++i) {
        var l = dirs[(i + 1) % sections] / 2;
        var r = dirs[(i - 1 + sections) % sections] / 2;
        var m = Math.max(l, r);
        if (dirs[i] < m) {
          changed = true;
          dirs[i] = m;
        }
      }
    } while (changed);

    var max_warning = 0;
    var min_warning = 100000;
    var section = 0;
    for (var i = 0; i < sections; ++i) {
      if (min_warning > dirs[i]) {
        min_warning = dirs[i];
        section = i;
      }
      max_warning = Math.max(max_warning, dirs[i]);
    }
    inv_dist = max_warning;
    if (Math.random() < inv_dist) {
      dir.x = Math.cos(section * 2 * Math.PI / sections);
      dir.y = Math.sin(section * 2 * Math.PI / sections);
    } else {
      dir = this.direction;
    }
    /*var l = this.pos.Length();
    if (l > 35) {
    var to_center = Vec2.multiplyScalar(-1, this.pos);
    l = (75 - l);
    var pinv_dist = 1 / l;
    //dir.AddV(Vec2.multiplyScalar(pinv_dist, to_center));
    if (inv_dist < pinv_dist) {
    inv_dist = pinv_dist;
    dir = to_center;
    }
    count++;
    }*/
  }
  if (count > 0) {
    //inv_dist /= count;
    var dist = 1 / inv_dist;
    if (this.zombified >= 1) {
      this.traction = 0;
      if (dist < 40) {
        this.traction = 1;
        this.direction = dir;
      }
    } else {
      this.direction = dir;
      this.traction = (dist < 40) ? 1 : 0;
    }
    //if (this.zombified < 1) {
    this.hand_brake = (dist < 10) ? true : false;
    //}
  }
  if (this.traction == 0) {
    if (Math.random() < 0.002) {
      // change direction
      do {
        this.direction.x = Math.random() * 5 - 2.5;
        this.direction.y = Math.random() * 5 - 2.5;
      } while (this.engine.ray_trace(this.pos, Vec2.add(this.pos, this.direction)));
    }
    if (this.tired == 0) {
      this.traction = 1;
      this.hand_brake = 0;
    }
  }
  /*var l = this.pos.Length();
  if (l > 75) {
  var to_center = Vec2.multiplyScalar(-1 / l, this.pos);
  l = (l - 75) * 0.001;
  var proj = Vec2.dot(to_center, this.direction);
  if (proj < 0) {
  this.direction = Vec2.subtract(this.direction, Vec2.multiplyScalar(proj + Math.random() * -2, to_center));
  }
  }*/
}

//==============================================================================
// Run object
Pedestrian.prototype.run = function(dt) {
  if (this.killed) {
    if (this.body != null) {
      this.engine.world.DestroyBody(this.body);
      this.body = null;
    }
    return;
  }
  //this.direction;
  this.angle = Math.atan2(this.direction.y, this.direction.x);
  this.trans = new Trans2(this.pos, this.angle, null);
  
  var front = new Vec2(1, 0);
  front.MulM(this.trans.m_r);
  var left = new Vec2(0, -1);
  left.MulM(this.trans.m_r);
  
  this.velocity = new Vec2(0,0);
  this.velocity.AddV(Vec2.multiplyScalar(this.strafe * this.strafe_speed, left));

  var speed = 0;
  var tire_speed = this.tire_stand;
  this.walk_anim.weight = 0;
  this.run_anim.weight = 0;

  if (this.traction > 0 && this.hand_brake && this.tired < (1 - dt)){
    // Run
    this.run_anim.weight = this.traction;
    speed = this.run_speed;
    tire_speed = this.tire_run;
  } else if (this.traction > 0) {
    // Walk
    this.walk_anim.weight = this.traction;
    speed = this.walk_speed;
    tire_speed = this.tire_walk;
  }
  
  this.tired += tire_speed * dt;
  this.tired = Math2.Clamp(this.tired, 0, 1);
  //this.walk_anim.weight = (this.traction > 0 && !this.hand_brake) ? this.traction : 0;
  //this.run_anim.weight = (this.traction > 0 && this.hand_brake) ? this.traction : 0;
  
  //var speed = this.hand_brake ? this.run_speed : this.walk_speed; 
  this.velocity.AddV(Vec2.multiplyScalar(this.traction * speed, front));
  
  this.speed = this.velocity.Length();
  this.body.SetAngle(this.angle);
  this.body.SetLinearVelocity(this.velocity)
  //this.pos.AddV(Vec2.multiplyScalar(dt, this.velocity));
}

//==============================================================================
// Post phys transforms
Pedestrian.prototype.post_phys = function(dt) {
  //this.velocity.SetV(this.body.GetLinearVelocity());
  //this.speed = this.velocity.Length();
  if (this.killed) {
    return;
  }
  this.pos.SetV(this.body.GetPosition());
  
  //this.angular_vel = this.body.GetAngularVelocity();
  //this.angle = this.body.GetAngle();
}

//==============================================================================
// Draw object's shadow
Pedestrian.prototype.draw_shadow = function(dt) {
  this.engine.m_ctx_ex.set_trans(this.trans);

  if (this.killed) {
    zombie_blood = "#508C33";
    this.engine.m_ctx_ex.draw_lines(this.lines, this.zombified >= 1 ? zombie_blood : 'red');
    this.engine.m_ctx_ex.draw_circles(this.circles, null, this.zombified >= 1 ? zombie_blood : 'red');
    /*this.engine.m_ctx_ex.draw_circle({ x: 0, y: 0 }, 0.3, null, this.zombified >= 1 ? zombie_blood : 'red');
    this.engine.m_ctx_ex.draw_circle({ x: 0.15, y: 0.25 }, 0.2, null, this.zombified >= 1 ? zombie_blood : 'red');
    this.engine.m_ctx_ex.draw_circle({ x: -0.25, y: 0.15 }, 0.1, null, this.zombified >= 1 ? zombie_blood : 'red');
    this.engine.m_ctx_ex.draw_circle({ x: -0.2, y: -0.1 }, 0.23, null, this.zombified >= 1 ? zombie_blood : 'red');
    this.engine.m_ctx_ex.draw_circle({ x: 0.2, y: -0.15 }, 0.12, null, this.zombified >= 1 ? zombie_blood : 'red');*/
  } else {
    //  Run mixer in draw
    this.anim_mixer.run(dt);
    this.engine.m_ctx_ex.draw_skeleton_shadow(pedestrian_skel, this.anim_mixer.m_pose, 'rgba(0,0,0,0.3)', null);
  }
  //this.engine.m_ctx_ex.draw_skeleton(pedestrian_skel, this.anim_mixer.m_pose, (this.zombified >= 1) ? 'green' : '#FACE8D', null);
}

//==============================================================================
// Draw object
Pedestrian.prototype.draw = function(dt) {
  this.engine.m_ctx_ex.set_trans(this.trans);

  //  Run mixed in draw
  //this.anim_mixer.run(dt);

  //this.engine.m_ctx_ex.draw_skeleton_shadow(pedestrian_skel, this.anim_mixer.m_pose, 'rgba(0,0,0,0.3)', null);
  if (!this.killed) {
    this.engine.m_ctx_ex.draw_skeleton(pedestrian_skel, this.anim_mixer.m_pose, (this.zombified >= 1) ? 'green' : 'black'/*'#FACE8D'*/,null);
  }
  
  if ((this.particles != null) && this.particles.run(dt)) {
    this.engine.m_ctx_ex.draw_particles(this.particles, this.zombified >= 1 ? 'green' : 'red');
  }
}
