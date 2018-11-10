//==============================================================================
// 2.5D Particles
//==============================================================================

//==============================================================================
// C-tor
function Particles(a_pos, a_vel) {
  this.particles = [];
  for (var i = 0; i < 50; i++) {
    var p = { active: true };
    p.time = 0.2 + Math.random() * 0.5;
    p.pos = Vec2.add(a_pos, new Vec2(Math.random() * 0.3 - 0.15, Math.random() * 0.3 - 0.15));
    p.pos_old = p.pos.Copy();
    p.vel = Vec2.add(a_vel, new Vec2(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5));
    this.particles.push(p);
  }
}

Particles.prototype.run = function(dt) {
  var active = false;
  for (var i in this.particles) {
    p = this.particles[i];
    if (p.active) {
      p.time -= dt;
      p.pos_old = p.pos.Copy();
      p.pos.AddV(Vec2.multiplyScalar(dt, p.vel));
      if (p.time < 0) {
        p.active = false;
      } else {
        active = true;
      }
    }
  }
  return active;
}
