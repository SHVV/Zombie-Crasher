//==============================================================================
// Animation mixer
//==============================================================================

//  Anim
//    length - in seconds
//    frames - array of poses

//==============================================================================
// C-tor
AnimationMixer = function(a_idle) {
  this.m_phase = 0;   // time phase for sync animations (run/walk).
  this.m_pose = [];
  this.m_idle_anim = {anim:a_idle, circle:true, pos:0, weight:1, norm:0};
  this.m_sync_anims = [];
  this.m_cur_anim = null;
}

AnimationMixer.prototype.add_circle_animation = function(a_anim) {
  var anim_instance = {anim:a_anim, circle:true, pos:0, weight:0, norm:0};
  this.m_sync_anims.push(anim_instance);
  return anim_instance;
}

AnimationMixer.prototype.play_animation = function(a_anim) {
  this.m_cur_anim = {anim:a_anim, circle:false, pos:0, weight:1, norm:0};
  return this.m_cur_anim;
}

AnimationMixer.prototype._run_animation = function(a_anim_inst, dt) {
  a_anim_inst.pos += dt;
  if (a_anim_inst.pos > a_anim_inst.anim.length) {
    if (a_anim_inst.circle) {
      a_anim_inst.pos -= a_anim_inst.anim.length
    } else {
      //animation finished
      return false;
    }
  }
  return true;
}

AnimationMixer.prototype.run = function(dt) {
  if (this.m_cur_anim != null) {
    if (!this._run_animation(this.m_cur_anim, dt)) {
      this.m_cur_anim = null;
    } else {
      this.m_pose = this._get_pose(this.m_cur_anim);
      return;
    } 
  }
  
  // sync circle
  var sync_circle_w = 0;
  var sync_length = 0;
  for (i in this.m_sync_anims) {
    var anim = this.m_sync_anims[i];
    sync_circle_w += anim.weight;
    sync_length += anim.anim.length * anim.weight;
  }
  var sync_pose = null;
  var sync_w = 0;
  if (sync_circle_w > 0) {
    sync_length /= sync_circle_w;
    this.m_phase += dt / sync_length;
    if (this.m_phase >= 1) {
      this.m_phase -= 1;
    }
    
    for (i in this.m_sync_anims) {
      var anim = this.m_sync_anims[i];
      anim.pos = anim.anim.length * this.m_phase;
      
      if (anim.weight > 0.0) {
        sync_pose = this._get_pose(anim);
        sync_w = anim.weight;
        if (anim.weight == 1) {
          this.m_pose = sync_pose;
          return;
        }
      }
    } 
  }
  
  this._run_animation(this.m_idle_anim, dt);
  var idle_pose = this._get_pose(this.m_idle_anim);
  if (sync_pose != null) {
    this.m_pose = this._mix_poses(idle_pose, sync_pose, sync_w);
  } else {
    this.m_pose = idle_pose;
  }
}

AnimationMixer.prototype._get_pose = function(a_anim_inst) {
  var rel_pos = a_anim_inst.pos / a_anim_inst.anim.length;
  var l = a_anim_inst.anim.frames.length - 1;
  if (a_anim_inst.circle) {l += 1}
  var ind_pos = rel_pos * l;
  var frame1 = Math.floor(ind_pos);
  var frame2 = frame1 + 1;
  if (frame2 >= a_anim_inst.anim.frames.length) {
    frame2 = a_anim_inst.circle ? 0 : frame1;
  }
  var a = ind_pos - frame1;
  return this._mix_poses(a_anim_inst.anim.frames[frame1], a_anim_inst.anim.frames[frame2], a);
}

AnimationMixer.prototype._mix_poses = function(a_pose1, a_pose2, a) {
  var pose = [];
  for (p in a_pose1) {
    pose[p] = [];
    for (c in a_pose1[p]) {
      pose[p][c] = a_pose1[p][c] * (1 - a) + a_pose2[p][c] * a;
    }
  }
  return pose;
}

AnimationMixer.prototype._add_pose = function(a_pose1, a_pose2, a) {
  //var pose = [];
  for (p in a_pose1) {
    for (c in a_pose1[p]) {
      a_pose1[p][c] += a_pose2[p][c] * a;
    }
  }
  return pose;
}
