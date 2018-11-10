//==============================================================================
// Arcade car
//==============================================================================

//==============================================================================
// C-tor Wheel
function CarWheel(a_car, a_pos, a_drive, a_steer) {
  ControllableObject.call(this);
  this.car = a_car;           // link to car
  this.pos = a_pos.Copy();    // position in car coordinates
  this.drive = a_drive;       // driving wheel
  this.steer = a_steer;       // steering wheel
  this.angle = 0;             // steering angle
  this.sliding = false;       // wheel is sliding
  this.blocked = false;       // wheel is blocked
  this.buget = 0;             // last friction buget
  this.old_force = new Vec2();// old force
  this.sliding_coef = 0.75;   // Sliding coefficient
  this.trail = new Array();   // Wheel trails
}

//==============================================================================
// Calculates wheel force
CarWheel.prototype.calc_force = function(a_force, a_brake, a_vel, dt) {
  // Perpendicular for position vector
  var pt = this.pos.Copy();
  pt.CrossFV(1);

  // Force accumulator
  var force;

  // Wheel is blocked if brake force is more then possible static friction
  this.blocked = Math.abs(a_brake) > this.buget;
  
  // ABS with main brakes
  if (this.blocked && !this.car.hand_brake && this.car.abs) {
    a_brake = this.buget;
    this.blocked = false;
  }

  if (this.blocked) { // wheel is blocked - anisotropic friction
    var vn = a_vel.Copy();
    vn.Normalize();
    var pv = Vec2.dot(pt, vn);

    // j - impulse to compensate summary velocity 
    var j = Vec2.multiplyScalar(1 / (1 / this.car.mass + pv * pv / this.car.inertia), a_vel);
    // force to compensate velocity divided by 2 (for front and rear wheels)
    force = Vec2.multiplyScalar(-1 / dt / 2, j);
  } else { // wheel is not blocked
    var m = new Mat22(this.angle);
    // wheel side vector
    var n = m.col1;
    var pn = Vec2.dot(pt, n);

    // Lateral impulse to compensate lateral velocity
    var j = -Vec2.dot(n, a_vel) / (1/this.car.mass + pn * pn / this.car.inertia);
    // Lateral force divided by 2 wheels
    force = Vec2.multiplyScalar(j / dt / 2, n);
    
    // Traction force for drive wheel
    if (this.drive) {
      // Clip traction to buget, if traction control is enabled
      if ((Math.abs(a_force) > this.buget) && this.car.tcs) {
        a_force = this.buget * Math2.Sign(a_force);
      }
      // Add traction
      force.AddV(Vec2.multiplyScalar(a_force, m.col2));
    }
  
    // Brakes
    if (Vec2.dot(a_vel, m.col2) > 0) {
      force.AddV(Vec2.multiplyScalar(-a_brake, m.col2));
    } else {
      force.AddV(Vec2.multiplyScalar(a_brake, m.col2));
    }
  }
  
  // Clip to friction circle
  var l = force.Length();
  this.sliding = l > this.buget;
  if (this.sliding) { // Sliding
    // Simple interpretation of Pacejka formula
    if (l > 3 * this.buget) {
      force.MulS(this.sliding_coef * this.buget / l);
    } else {
      force.MulS((1 - (1 - this.sliding_coef) * ((l - this.buget) / (2 * this.buget))) * this.buget / l);
    }
  }
  
  // Save force
  this.old_force.SetV(force);
  return force;
}

//==============================================================================
// C-tor
function ArcadeCar() {
  // state
  this.steer_angle = 0.0;           // Steer angle
  this.velocity = new Vec2(0, 0);   // current velocity
  this.angular_vel = 0;             // Angular velocity
  this.prev_accel = new Vec2(0, 0); // Acceleration on previus step

  this.speed = 0.0;                 // Scalar speed
  this.trans = new Trans2(this.pos, this.angle, null);  // Transformation

  // flags
  this.abs = true;                  // ABS flag
  this.tcs = true;                  // Traction control system flag
  this.steer_control = true;        // steering control system flag

  // parameters
  this.mass = 1000;                 // Mass 1 ton
  this.inertia = this.mass / 12 * (2*2 + 4*4);  // Inertia momentum for box destribution
  

  this.friction = 1;                // wheels friction coeffecient
  this.buget = this.friction * Phys.g * this.mass;  // Summary friction buget
  this.braking_coef = 2;            // Braking coefficient
  this.front_braking = 0.3;         // Front braking coefficient
  this.c_sqr = 0.5;                 // Coefficient of Sqr part of air resistance
  this.c_lin = this.c_sqr * 30;     // Coefficient of linear part of resistance
  this.power = 150000;              // engine power W (134 H.P.)
  this.max_steer = Math.PI / 4;     // Max steering angle
  this.mass_height = 0.5;           // Height of mass center.

  this.back_wheels = 1.5;           // distance from rear wheels to object center
  this.front_wheels = 1.4;          // distance from front wheels to object center
  this.wheel_base = this.back_wheels + this.front_wheels;  // wheels base
  this.wheel_shift = 0.85;
  
  this.trails_len = 60 * 5;         // Trails length

  // Wheels
  this.wheels = new Array();
  this.wheels[0] = new Array(); // Front wheels
  this.wheels[0][0] = new CarWheel(this, new Vec2(-this.wheel_shift, this.front_wheels), false, true); // Left
  this.wheels[0][1] = new CarWheel(this, new Vec2(this.wheel_shift, this.front_wheels), false, true);  // Right
  this.wheels[1] = new Array(); // Rear wheels
  this.wheels[1][0] = new CarWheel(this, new Vec2(-this.wheel_shift, -this.back_wheels), true, false); // Left
  this.wheels[1][1] = new CarWheel(this, new Vec2(this.wheel_shift, -this.back_wheels), true, false);  // Right 
}

//==============================================================================
// Inhereted from ControllableObject
ArcadeCar.prototype = new ControllableObject();

//==============================================================================
// Inhereted from ControllableObject
ArcadeCar.prototype.init = function(engine, pos, angle) {
  ControllableObject.prototype.init.call(this, engine, pos, angle);
  
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
    
  var fixDef = new b2FixtureDef;
  fixDef.density = 1.0;
  fixDef.friction = 0.1;
  fixDef.restitution = 0.1;

  var bodyDef = new b2BodyDef;
  bodyDef.userData = this;
  bodyDef.type = b2Body.b2_dynamicBody;
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.	SetAsOrientedBox(0.9, 2.3, new b2Vec2(0, -.1), 0.0);//SetAsBox(0.9, 2);
  bodyDef.position.x = 0;
  bodyDef.position.y = 0;
  this.body = this.engine.world.CreateBody(bodyDef);
  this.body.CreateFixture(fixDef);
  var mass_data = new b2MassData();
  mass_data.mass = this.mass;
  mass_data.I = this.inertia;
  this.body.SetMassData(mass_data);
  this.body.SetPositionAndAngle(pos, angle);

}

//==============================================================================
// Set drive wheels
ArcadeCar.prototype.set_drive = function(a_front, a_rear) {
  this.wheels[0][0].drive = a_front;
  this.wheels[0][1].drive = a_front;

  this.wheels[1][0].drive = a_rear;
  this.wheels[1][1].drive = a_rear;
}

//==============================================================================
// Run object
ArcadeCar.prototype.run = function(dt) {
  if (dt < 0.001) return;
  // Force accumulator
  var force = new Vec2();
  // Torque accumulator
  var torque = 0;
  
  // Engine & brakes
  var driving_force = 0;
  var braking_force = 0;
  var braking = [0, 0];

  // velocity in local frame
  var local_vel = this.velocity.Copy();
  local_vel.MulTM(this.trans.m_r);
  var front_speed = local_vel.y;
  
  // Selecting between traction and braking
  if ((/*(this.traction > 0) ||*/ (front_speed * this.traction >= 0)) && !this.hand_brake) {
    var abs_speed = Math.abs(front_speed);
    // simple Gear box (variator)
    driving_force = (abs_speed > 1) ? this.power / abs_speed : this.power;
    driving_force *= this.traction;
  } else {
    if (this.hand_brake) {
      // hand brake is always maximum
      braking_force = 1 * this.buget * this.braking_coef;
    } else {
      braking_force = Math.abs(this.traction) * this.buget * this.braking_coef;
    } 
    // front/rear braking ballanse
    braking[0] = this.front_braking * braking_force;
    braking[1] = (1 - this.front_braking) * braking_force;
  }

  // Weight transfer
  var local_accel = this.prev_accel.Copy();
  local_accel.MulTM(this.trans.m_r);
  // First - between front and rear wheels
  var weights = new Array();
  weights[0] = this.mass / this.wheel_base * (this.back_wheels * Phys.g - this.mass_height * local_accel.y);
  weights[1] = this.mass / this.wheel_base * (this.front_wheels * Phys.g + this.mass_height * local_accel.y);
  var drive_wheels = 0;
  // Second - between left and right wheels
  for (var i = 0; i < this.wheels.length; ++i) {
    if (this.wheels[i][0].drive) ++drive_wheels;
    this.wheels[i][0].buget = (this.wheel_shift * weights[i] + this.mass_height * local_accel.x * this.mass) / (this.wheel_shift * 2);
    this.wheels[i][1].buget = (this.wheel_shift * weights[i] - this.mass_height * local_accel.x * this.mass) / (this.wheel_shift * 2);
  }
  // Divide driving force for all wheels
  driving_force /= drive_wheels * 2;  

  // Steering control
  var max_steer = this.max_steer;
  if (this.steer_control) {
    // Maximum steering angle from sliding angle for drifting control
    var sliding_ang = Math.abs(Math.atan2(local_vel.x, local_vel.y)) / 0.7;
    max_steer = sliding_ang;
    
    // Maximum steering angle from buget acceleration
    if ((this.speed > 0.0001) || (this.speed < -0.0001)) {
      var r = this.speed * this.speed / this.buget * this.mass;
      var steer = Math.atan(this.wheel_base / r);
      if (steer > max_steer) {
        max_steer = steer * 0.7;
      }
    } else {
      max_steer = this.max_steer;
    }
    if (max_steer > this.max_steer) {
      max_steer = this.max_steer;
    }
  } 
  // Steering
  this.steer_angle = this.steering * max_steer;

  // Wheels circle
  for (var i = 0; i < this.wheels.length; ++i) {
    for (var j = 0; j < this.wheels[i].length; ++j) {
      var wheel = this.wheels[i][j];
      if (wheel.buget < 0) {
        wheel.buget = 0;      
      }
      // Set steering angle for steering wheels
      if (wheel.steer) {
        wheel.angle = (wheel.pos.y > 0) ? this.steer_angle : -this.steer_angle;
      }
      // Calculate full wheel velocity
      wheel_vel = local_vel.Copy();
      wheel_vel.AddV(Vec2.crossScalar(this.angular_vel, wheel.pos));
      
      // Calculate force
      var wheel_force = wheel.calc_force(driving_force, braking[i] / 2, wheel_vel, dt);
      
      // Add force and torque to accumulators
      torque += Vec2.cross(wheel.pos, wheel_force);
      wheel_force.MulM(this.trans.m_r);
      force.AddV(wheel_force);
    }
  }
  
  // Isotropic Air resistance
  force.AddV(Vec2.multiplyScalar(-(this.velocity.Length() * this.c_sqr + this.c_lin), this.velocity));
  
  // Integrating
  this.body.ApplyForce(force, this.body.GetPosition());
  this.body.ApplyTorque(torque);
    
  force.MulS(1/this.mass);
  this.prev_accel.SetV(force);

//   this.velocity.SetV(this.body.GetLinearVelocity());
//   this.pos.SetV(this.body.GetPosition());
//   
//   this.angular_vel = this.body.GetAngularVelocity();
//   this.angle = this.body.GetAngle();
//   
//   // linear
//   force.MulS(1/this.mass);
//   this.prev_accel.SetV(force);
//   /*this.velocity.AddV(force.MulS(dt));
//   this.speed = this.velocity.Length();
//   Debug.write_line("<br/>Speed: " + Math.round(this.speed * 3.6) + "km/h")
//   this.pos.AddV(Vec2.multiplyScalar(dt, this.velocity));
// 
//   // angular
//   torque *= dt/this.inertia;
//   this.angular_vel += torque;
//   this.angle += this.angular_vel * dt;*/
//   
//   // update transformation
//   this.speed = this.velocity.Length();
//   Debug.write_line("<br/>Speed: " + Math.round(this.speed * 3.6) + "km/h")
//   this.trans = new Trans2(this.pos, this.angle, null);
//   
//   // Add wheel trails
//   for (var i = 0; i < this.wheels.length; ++i) {
//     for (var j = 0; j < this.wheels[i].length; ++j) {
//       var wheel = this.wheels[i][j];
//       var pos = this.trans.TransFromV(wheel.pos);
//       wheel.trail.push({p: pos, w: wheel.sliding ? wheel.buget : 0});
//       if (wheel.trail.length > 2 * this.trails_len) {
//         wheel.trail = wheel.trail.slice(this.trails_len, wheel.trail.length - 1);
//       }
//     }
//   }
}

//==============================================================================
// Post phys transforms
ArcadeCar.prototype.post_phys = function(dt) {
  this.velocity.SetV(this.body.GetLinearVelocity());
  this.pos.SetV(this.body.GetPosition());

  this.angular_vel = this.body.GetAngularVelocity();
  this.angle = this.body.GetAngle();
    
  // update transformation
  this.speed = this.velocity.Length();
  Debug.write_line("<br/>Speed: " + Math.round(this.speed * 3.6) + "km/h")
  this.trans = new Trans2(this.pos, this.angle, null);

  var sliding = 0;

  // Add wheel trails
  for (var i = 0; i < this.wheels.length; ++i) {
    for (var j = 0; j < this.wheels[i].length; ++j) {
      var wheel = this.wheels[i][j];
      if (wheel.sliding) sliding += wheel.buget / 10000;
      var pos = this.trans.TransFromV(wheel.pos);
      wheel.trail.push({p: pos, w: wheel.sliding ? wheel.buget : 0});
      if (wheel.trail.length > 2 * this.trails_len) {
        wheel.trail = wheel.trail.slice(this.trails_len, wheel.trail.length - 1);
      }
    }
  }

  // audio tune
  // engine
  var max_speed = 50;
  var s = this.engine.m_audio.sound_singleton(SOUND.car_engine_loop); // 
  if (s) s.tune({gain:0.2 + 0.2*this.speed/max_speed, rate:1.0 + 4.0*this.speed/max_speed});
  // sliding
  var s2 = this.engine.m_audio.sound_singleton(SOUND.wheel_slide);
  if (s2) {
    s2.tune({gain:sliding*0.05});
  }
}

//==============================================================================
// Draw object's shadow
ArcadeCar.prototype.draw_shadow = function(dt) {
  var car_shape = [{ x: -.9, y: -2.4 }, { x: .9, y: -2.4 }, { x: .9, y: 2.1 }, { x: 0, y: 2.2 }, { x: -.9, y: 2.1 }, { x: -.9, y: -2.4}];

  // Shadow
  this.engine.m_ctx_ex.set_trans(this.trans);
  this.engine.m_ctx_ex.m_trans.pos = Vec2.add(this.engine.m_ctx_ex.m_trans.pos, { x: .3, y: -.3 });
  this.engine.m_ctx_ex.draw_poly(car_shape, null, 'rgba(0,0,0,0.3)');
}

//==============================================================================
// Draw object
ArcadeCar.prototype.draw = function(dt) {
  var wheel_shape = [{x:-.12,y:-.3}, {x:.12,y:-.3}, {x:.12,y:.3}, {x:-.12,y:.3},{x:-.12,y:-.3}];

  // Shadow
  /*this.engine.m_ctx_ex.set_trans(this.trans);
  this.engine.m_ctx_ex.m_trans.pos = Vec2.add(this.engine.m_ctx_ex.m_trans.pos, {x:.3, y:-.3});
  this.engine.m_ctx_ex.draw_poly(car_shape, null, 'rgba(0,0,0,0.3)');*/
                          
  // Wheels
  for (var i = 0; i < this.wheels.length; ++i) {
    for (var j = 0; j < this.wheels[i].length; ++j) {
      var wheel = this.wheels[i][j];

      this.engine.m_ctx_ex.set_trans(new Trans2({x:0, y:0}, 0));
      this.engine.m_ctx_ex.m_ctx.lineWidth = 0.24 * this.engine.m_ctx_ex.m_zoom;
      this.engine.m_ctx_ex.m_ctx.lineJoin = 'bevel';
      var len = wheel.trail.length;
      var started = false;
      var part = new Array();
      for (var k = len - 1; (k > 0) && (k > (len - this.trails_len)); --k) {
        var point = wheel.trail[k];
        if (point.w > 1000) {
          started = true;
          part.push(point.p);
        } else {
          if (started) {
            started = false;
            this.engine.m_ctx_ex.draw_poly(part, 'rgba(0,0,0,0.5)', null);
            part = new Array();
          } 
        }
      }
      if (started) {
        this.engine.m_ctx_ex.draw_poly(part, 'rgba(0,0,0,0.5)', null);
      } 
      this.engine.m_ctx_ex.m_ctx.lineWidth = 1;

      this.engine.m_ctx_ex.set_trans(this.trans);
      var force = Vec2.multiplyScalar(1 / 4000, wheel.old_force);
      //this.engine.m_ctx_ex.draw_poly([wheel.pos, Vec2.add(wheel.pos, force)], '#808080', null);
      
      var wheel_trans = new Trans2(wheel.pos, wheel.angle);
      this.engine.m_ctx_ex.set_trans(this.trans.TransFromT(wheel_trans));
      //this.engine.m_ctx_ex.draw_circle({x:0,y:0}, wheel.buget / 4000, '#808080', wheel.blocked ? 'rgba(0,0,0,0.2)' : null);
      this.engine.m_ctx_ex.draw_poly(wheel_shape, null, '#404040');
    }
  }

  var s = -.4;
  var w = -.3;
  // Car
  var car_shape1 = [{x:-.9,y:0}, {x:.9,y:0}, {x:.9,y:1}, {x:.8,y:2}, {x:0,y:2.1}, {x:-.8,y:2}, {x:-.9,y:1}, {x:-.9,y:0}];
  var car_shape2 = [{x:-.5,y:1.0}, {x:-.3,y:2.1}, {x:.3,y:2.1}, {x:0.5,y:1.0}, {x:-.5,y:1.0}];
  var car_shape3 = [{x:-.8,y:-1.7+s}, {x:-.9,y:-1.8+s}, {x:-.9,y:-2+s}, {x:0.9,y:-2+s}, {x:.9,y:-1.8+s}, {x:.8,y:-1.7+s}, {x:-.8,y:-1.7+s}];
  var car_shape4 = [{x:-.8,y:0}, {x:-.8,y:-1.9+s}, {x:0.8,y:-1.9+s}, {x:0.8,y:0}, {x:-.8,y:0}];
  /*var car_shape2 = [{x:0,y:1.2}, {x:-.8,y:1}, {x:-.8,y:0}, {x:.8,y:0}, {x:.8,y:1}, {x:0,y:1.2}, {x:0, y:2}];
  var car_shape3 = [{x:-.7,y:0}, {x:-.7,y:-1.9}, {x:.7,y:-1.9}, {x:.7,y:0}];
  var car_shape4 = [{x:0,y:.7}, {x:-.7,y:0.6}, {x:-.7,y:0}, {x:.7,y:0}, {x:.7,y:.6}, {x:0,y:.7}];*/

  var stroke = '#808080';
  var fill = 'white';
  var ctx = this.engine.m_ctx_ex;
  ctx.set_trans(this.trans);
  ctx.draw_poly([{x:-.9,y:1.9}, {x:-.9,y:2.1}, {x:-.3,y:2.2}, {x:.3,y:2.2}, {x:.9,y:2.1}, {x:.9,y:1.9}, {x:-.9,y:1.9}], stroke, fill);
  ctx.draw_poly(car_shape1, stroke, fill);
  ctx.draw_poly(car_shape2, stroke, fill);
  ctx.draw_poly(car_shape3, stroke, fill);
  ctx.draw_poly([{x:-.8,y:-.7+w}, {x:-.8,y:-1.65+w}, {x:-.9,y:-1.55+w}, {x:-.9,y:-0.8+w}, {x:-.8,y:-.7+w}], stroke, fill);
  ctx.draw_poly([{x:.8,y:-.7+w}, {x:.8,y:-1.65+w}, {x:.9,y:-1.55+w}, {x:.9,y:-0.8+w}, {x:.8,y:-.7+w}], stroke, fill);
  ctx.draw_poly(car_shape4, stroke, fill);
  ctx.draw_poly([{x:-.8,y:0}, {x:-.8,y:1}, {x:-.3,y:1.1}, {x:0.3,y:1.1}, {x:.8,y:1}, {x:.8,y:0}, {x:-.8,y:0}], stroke, fill);
  ctx.draw_poly([{x:-.7,y:0}, {x:-.7,y:-1.8+s}, {x:0.7,y:-1.8+s}, {x:0.7,y:0}], stroke);
  ctx.draw_poly([{x:-.6,y:0}, {x:-.6,y:.7}, {x:0,y:.8}, {x:0.6,y:0.7}, {x:.6,y:0}], stroke);
  ctx.draw_poly([{x:-.6,y:.7}, {x:-0.8,y:1}], stroke);
  ctx.draw_poly([{x:.6,y:.7}, {x:.8,y:1}], stroke);
  ctx.draw_poly([{x:-.3,y:.1}, {x:-.3,y:.5}], stroke);
  ctx.draw_poly([{x:.3,y:.1}, {x:.3,y:.5}], stroke);
  ctx.draw_poly([{x:0,y:.1}, {x:0,y:.5}], stroke);
  
  w = -.2;
  ctx.draw_poly([{x:w,y:-.1}, {x:w+.1,y:-.1}, {x:w+.1,y:-1.6+s}, {x:w,y:-1.6+s}, {x:w,y:-.1}], stroke);
  w = -.5;
  ctx.draw_poly([{x:w,y:-.1}, {x:w+.1,y:-.1}, {x:w+.1,y:-1.6+s}, {x:w,y:-1.6+s}, {x:w,y:-.1}], stroke);
  w = .1;
  ctx.draw_poly([{x:w,y:-.1}, {x:w+.1,y:-.1}, {x:w+.1,y:-1.6+s}, {x:w,y:-1.6+s}, {x:w,y:-.1}], stroke);
  w = .4;
  ctx.draw_poly([{x:w,y:-.1}, {x:w+.1,y:-.1}, {x:w+.1,y:-1.6+s}, {x:w,y:-1.6+s}, {x:w,y:-.1}], stroke);
  /*this.engine.m_ctx_ex.draw_poly(car_shape2, '#808080', null);
  this.engine.m_ctx_ex.draw_poly(car_shape3, '#808080', null);
  this.engine.m_ctx_ex.draw_poly(car_shape4, '#808080', null);*/
  ctx = null;
}
