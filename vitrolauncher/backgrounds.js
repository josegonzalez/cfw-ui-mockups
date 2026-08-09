/*
 * backgrounds.js - VitroLauncher animated backgrounds.
 *
 * Reproduces the four Love2D themes as representative animated frames:
 *   waves      - the wave.lua GLSL fragment shader, ported verbatim to WebGL
 *   particles  - PS5-style additive dust motes over a navy gradient (canvas 2D)
 *   clouds     - pixel-art drifting clouds over a cyan sky (low-res canvas, upscaled)
 *   simple     - flat Switch-style gray gradient (dark / light)
 *
 * Usage:
 *   VitroBg.init(container, width, height);
 *   VitroBg.set('waves', { accent:'#1a9fff', bg:'#0e141b', light:false });
 */
window.VitroBg = (function () {
  'use strict';

  var W = 640, H = 480;
  var glCanvas, gl, prog, uLoc, quad;
  var twoCanvas, ctx;
  var theme = 'waves';
  var accent = [0.10, 0.62, 1.0];
  var bg = [0.055, 0.078, 0.106];
  var light = false;
  var raf = null, startTs = null, time = 0;
  var dotSprite = null, motes = null, clouds = null, cloudLow = null, cloudCtx = null;

  function hexToRgb(hex) {
    if (typeof hex !== 'string') return null;
    var m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return null;
    return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
  }
  function css(rgb, a) {
    return 'rgba(' + Math.round(rgb[0] * 255) + ',' + Math.round(rgb[1] * 255) + ',' +
      Math.round(rgb[2] * 255) + ',' + (a == null ? 1 : a) + ')';
  }
  function mul(rgb, k) { return [rgb[0] * k, rgb[1] * k, rgb[2] * k]; }

  // ---- WebGL waves ----------------------------------------------------

  var VERT = 'attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0); }';
  var FRAG = [
    'precision highp float;',
    'uniform vec4 phases; uniform vec3 tint; uniform vec3 gradTop; uniform vec3 gradBottom;',
    'uniform float lightMode; uniform vec2 res;',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / res; uv.y = 1.0 - uv.y;',
    '  vec3 col = mix(gradTop, gradBottom, uv.y);',
    '  float y1 = 0.76 + 0.13*sin(uv.x*2.2 + phases.x) + 0.05*sin(uv.x*5.0 - phases.y);',
    '  float y2 = 0.92 + 0.12*sin(uv.x*2.8 - phases.z) + 0.06*sin(uv.x*4.1 + phases.w);',
    '  float f1 = smoothstep(y1-0.02, y1+0.05, uv.y);',
    '  float f2 = smoothstep(y2-0.02, y2+0.05, uv.y);',
    '  float g1 = exp(-abs(uv.y-y1)*55.0);',
    '  float g2 = exp(-abs(uv.y-y2)*55.0);',
    '  if(lightMode > 0.5){',
    '    col = mix(col, tint, f1*0.20);',
    '    col = mix(col, tint, f2*0.32);',
    '    col = mix(col, tint, (g1+g2)*0.45);',
    '  } else {',
    '    col += f1*(tint*0.45 + vec3(0.05));',
    '    col += f2*(tint*0.70 + vec3(0.10));',
    '    col += (g1+g2)*(tint*0.6 + vec3(0.4))*0.5;',
    '  }',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('[VitroBg] shader error:', gl.getShaderInfoLog(sh));
    }
    return sh;
  }
  function initGL() {
    gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
    if (!gl) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    uLoc = {
      phases: gl.getUniformLocation(prog, 'phases'),
      tint: gl.getUniformLocation(prog, 'tint'),
      gradTop: gl.getUniformLocation(prog, 'gradTop'),
      gradBottom: gl.getUniformLocation(prog, 'gradBottom'),
      lightMode: gl.getUniformLocation(prog, 'lightMode'),
      res: gl.getUniformLocation(prog, 'res')
    };
    return true;
  }
  function drawWaves() {
    var TWO_PI = Math.PI * 2;
    var top = light ? mul(bg, 1.04) : mul(bg, 0.20);
    var bot = light ? [bg[0] * 0.88, bg[1] * 0.88, bg[2] * 0.92] : mul(bg, 1.05);
    gl.viewport(0, 0, W, H);
    gl.uniform4f(uLoc.phases, (time * 0.45) % TWO_PI, (time * 0.26) % TWO_PI,
      (time * 0.36) % TWO_PI, (time * 0.31) % TWO_PI);
    gl.uniform3fv(uLoc.tint, accent);
    gl.uniform3fv(uLoc.gradTop, top);
    gl.uniform3fv(uLoc.gradBottom, bot);
    gl.uniform1f(uLoc.lightMode, light ? 1 : 0);
    gl.uniform2f(uLoc.res, W, H);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // ---- particles ------------------------------------------------------

  function makeDotSprite() {
    var s = 48, c = document.createElement('canvas');
    c.width = c.height = s;
    var g = c.getContext('2d');
    var rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, s, s);
    dotSprite = c;
  }
  function makeMotes() {
    motes = [];
    for (var i = 0; i < 70; i++) {
      var z = Math.pow(Math.random(), 1.4);
      motes.push({
        x: Math.random() * 1.2 - 0.1, y: Math.random() * 1.2 - 0.1, z: z,
        size: 1.5 + 20 * z * z, tw: 0.5 + Math.random() * 2.5, ph: Math.random() * 6.28,
        driftX: (Math.random() - 0.5) * 0.01, driftY: (Math.random() - 0.5) * 0.006
      });
    }
  }
  function drawParticles() {
    var lit = mul(bg, 1.15), md = mul(bg, 0.66), dk = mul(bg, 0.36);
    // diagonal gradient: dark bottom-left -> lit top-right
    var g = ctx.createLinearGradient(0, H, W, 0);
    g.addColorStop(0, css(dk)); g.addColorStop(0.55, css(md)); g.addColorStop(1, css(lit));
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // top-right glow
    var glow = ctx.createRadialGradient(W * 0.82, -H * 0.18, 0, W * 0.82, -H * 0.18, H * 1.3);
    glow.addColorStop(0, css(accent, 0.16)); glow.addColorStop(1, css(accent, 0));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    // motes (additive)
    ctx.globalCompositeOperation = 'lighter';
    var moteCol = [1 - (1 - accent[0]) * 0.25, 1 - (1 - accent[1]) * 0.25, 1 - (1 - accent[2]) * 0.25];
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      var px = ((m.x + m.driftX * time % 1 + 1) % 1.2 - 0.1) * W;
      var py = ((m.y + m.driftY * time % 1 + 1) % 1.2 - 0.1) * H;
      var twinkle = 0.72 + 0.28 * Math.sin(time * m.tw + m.ph);
      var a = Math.min(0.85, (0.10 + 0.5 * m.z) * twinkle);
      var sz = m.size;
      ctx.globalAlpha = a;
      ctx.drawImage(dotSprite, px - sz / 2, py - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // tint the pale-blue motes toward the mote color by overlaying — approximated by sprite whiteness
    void moteCol;
  }

  // ---- clouds ---------------------------------------------------------

  function hsl(h, s, l) {
    function f(n) {
      var k = (n + h * 12) % 12;
      return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    }
    return [f(0), f(8), f(4)];
  }
  function makeClouds() {
    var lowW = Math.round(W / 3), lowH = Math.round(H / 3);
    cloudLow = document.createElement('canvas');
    cloudLow.width = lowW; cloudLow.height = lowH;
    cloudCtx = cloudLow.getContext('2d');
    // cloud ramp derived from accent hue, shadow -> sunlit
    clouds = [];
    var defs = [
      { w: 150, h: 60, y: 0.30, speed: 0.008 }, { w: 100, h: 42, y: 0.52, speed: 0.006 },
      { w: 64, h: 26, y: 0.22, speed: 0.004 }, { w: 120, h: 50, y: 0.68, speed: 0.005 },
      { w: 80, h: 34, y: 0.42, speed: 0.007 }, { w: 100, h: 42, y: 0.80, speed: 0.003 }
    ];
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      clouds.push({ x: (i / defs.length) + Math.random() * 0.1, y: d.y, w: d.w / 3, h: d.h / 3, speed: d.speed });
    }
  }
  function accentHue() {
    var mx = Math.max(accent[0], accent[1], accent[2]), mn = Math.min(accent[0], accent[1], accent[2]);
    var d = mx - mn, h = 0;
    if (d === 0) h = 0.6;
    else if (mx === accent[0]) h = ((accent[1] - accent[2]) / d) % 6;
    else if (mx === accent[1]) h = (accent[2] - accent[0]) / d + 2;
    else h = (accent[0] - accent[1]) / d + 4;
    h /= 6; if (h < 0) h += 1;
    return h;
  }
  function drawClouds() {
    var lowW = cloudLow.width, lowH = cloudLow.height;
    // sky gradient (steel-blue -> pale cyan), fixed hues
    var sky = cloudCtx.createLinearGradient(0, 0, 0, lowH);
    sky.addColorStop(0, css(hsl(0.588, 0.43, 0.48)));
    sky.addColorStop(0.4, css(hsl(0.564, 0.487, 0.56)));
    sky.addColorStop(0.72, css(hsl(0.540, 0.543, 0.64)));
    sky.addColorStop(1, css(hsl(0.516, 0.60, 0.72)));
    cloudCtx.fillStyle = sky; cloudCtx.fillRect(0, 0, lowW, lowH);
    // clouds: cauliflower clusters, top-lit vertical ramp from accent hue
    var hue = accentHue();
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += c.speed * 0.016; if (c.x > 1.25) c.x -= 1.5;
      var cx = c.x * lowW, cy = c.y * lowH, cw = c.w, ch = c.h;
      var grad = cloudCtx.createLinearGradient(0, cy - ch, 0, cy + ch * 0.6);
      grad.addColorStop(0, css(hsl(hue, 0.594, 0.985)));
      grad.addColorStop(0.5, css(hsl(hue, 0.594, 0.87)));
      grad.addColorStop(1, css(hsl(hue, 0.594, 0.62)));
      cloudCtx.fillStyle = grad;
      var puffs = [[0, 0.15, 1], [-0.55, 0.25, 0.6], [0.55, 0.25, 0.6], [-0.28, -0.2, 0.7], [0.28, -0.2, 0.7], [0, -0.05, 0.85]];
      cloudCtx.beginPath();
      for (var p = 0; p < puffs.length; p++) {
        var q = puffs[p];
        cloudCtx.moveTo(cx + q[0] * cw + q[2] * ch, cy + q[1] * ch);
        cloudCtx.arc(cx + q[0] * cw, cy + q[1] * ch, q[2] * ch, 0, Math.PI * 2);
      }
      cloudCtx.fill();
      // flat-ish base
      cloudCtx.fillRect(cx - cw, cy - ch * 0.05, cw * 2, ch * 0.55);
    }
    // upscale with nearest-neighbor for the pixel-art look
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(cloudLow, 0, 0, lowW, lowH, 0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
  }

  // ---- simple ---------------------------------------------------------

  function drawSimple() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    if (light) { g.addColorStop(0, '#f4f4f6'); g.addColorStop(1, '#dddee2'); }
    else { g.addColorStop(0, '#333337'); g.addColorStop(1, '#202022'); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // ---- loop / api -----------------------------------------------------

  function useGL(on) {
    glCanvas.style.display = on ? 'block' : 'none';
    twoCanvas.style.display = on ? 'none' : 'block';
    twoCanvas.classList.toggle('pixelated', theme === 'clouds');
  }
  function frame(ts) {
    if (startTs == null) startTs = ts;
    time = (ts - startTs) / 1000;
    if (theme === 'waves') drawWaves();
    else if (theme === 'particles') drawParticles();
    else if (theme === 'clouds') drawClouds();
    else drawSimple();
    raf = requestAnimationFrame(frame);
  }

  function init(container, w, h) {
    W = w; H = h;
    glCanvas = document.createElement('canvas');
    glCanvas.className = 'vitro-bg'; glCanvas.width = W; glCanvas.height = H;
    twoCanvas = document.createElement('canvas');
    twoCanvas.className = 'vitro-bg'; twoCanvas.width = W; twoCanvas.height = H;
    container.insertBefore(twoCanvas, container.firstChild);
    container.insertBefore(glCanvas, container.firstChild);
    if (!initGL()) { glCanvas.style.display = 'none'; }
    ctx = twoCanvas.getContext('2d');
    makeDotSprite(); makeMotes(); makeClouds();
    useGL(theme === 'waves');
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function set(newTheme, colors) {
    theme = newTheme || 'waves';
    if (colors) {
      var a = hexToRgb(colors.accent); if (a) accent = a;
      var b = hexToRgb(colors.bg); if (b) bg = b;
      light = !!colors.light;
    }
    if (gl) useGL(theme === 'waves');
  }

  return { init: init, set: set };
})();
