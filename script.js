var canvas;
var canvascx;
var fingers = 0;
var hitnote = -1;
var hittimer = 0;
var hithandlers = [];
var ballstats = {
    x: 0.5,
    y: 0,
    progress: 0,
    xvel: 0,
    xaccel: 0,
    bouncespeed: 1
};

var basicspeed = 0.01;

var numtouches = 0;

var gibDevice;

/* Coordinate system:
 *
 * All position coordinates are for object centers
 * All position coordinates are between 0 and 1
 * X: 0 = screen left, 1 = screen right
 * Y: 0 = bottom, 1 = top
 *
 * All widths and heights are a ratio, object size / ball diameter
 */

var coordsystem = {};

window.onload = function () {
    canvas = document.querySelector('canvas');
    document.body.style.margin = 0;
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    canvascx = canvas.getContext('2d');

    coordsystem = {
        x: function (x) {return x * canvas.width},
        y: function (y) {return canvas.height * 0.9 - y * canvas.height * 0.8},
        wid: function (wid) {return wid * canvas.width * 0.05},
        hei: function (hei) {return hei * canvas.width * 0.05},
        xtowid: function (x) {return x * 20},
        unx: function (x) {return x / canvas.width},
        uny: function (y) {return (0.9 * canvas.height - y) / 0.8}
    };

    requestAnimationFrame(drawAll);
    setInterval(frameHandler, 1000/60);
    window.addEventListener('deviceorientation', function(event) {
        ballstats.xaccel = event.gamma/20;
    });
    var carriertouch = null;
    var carrierstart = 0;
    document.body.addEventListener('touchstart', function (event) {
        event.preventDefault();
        if (coordsystem.uny(event.changedTouches[0].clientY) < 0) {
            carriertouch = event.changedTouches[0].identifier;
            carrierstart = coordsystem.xtowid(coordsystem.unx(event.changedTouches[0].clientX));
        }
        fingers = event.targetTouches.length - (carriertouch === null ? 0 : 1);
    });
    document.body.addEventListener('touchmove', function (event) {
        if (carriertouch !== null) {
            for (var i = 0; i < event.changedTouches.length; i++) {
                if (event.changedTouches[i].identifier === carriertouch) {
                    var cs = coordsystem.xtowid(coordsystem.unx(event.changedTouches[i].clientX));
                    offset -= cs - carrierstart;
                    carrierstart = cs;
                    break;
                }
            }
        }
        event.preventDefault();
    });
    document.body.addEventListener('touchend', function (event) {
        event.preventDefault();
        if (carriertouch !== null) {
            for (var i = 0; i < event.changedTouches.length; i++) {
                if (event.changedTouches[i].identifier === carriertouch) {
                    carriertouch = null;
                    break;
                }
            }
        }
        fingers = event.targetTouches.length - (carriertouch === null ? 0 : 1);
    });
    document.body.addEventListener('mousedown', function (event) {
        event.preventDefault();
        if (coordsystem.uny(event.clientY) < 0) {
            carriertouch = true;
            carrierstart = coordsystem.xtowid(coordsystem.unx(event.clientX));
        } else {
            fingers = 1;
        }
    });
    document.body.addEventListener('mousemove', function (event) {
        if (carriertouch) {
            var cs = coordsystem.xtowid(coordsystem.unx(event.clientX));
            offset -= cs - carrierstart;
            carrierstart = cs;
        }
    });
    document.body.addEventListener('mouseup', function (event) {
        event.preventDefault();
        carriertouch = null;
        fingers = 0;
    });
    var dirs = {left: false, right: false};
    function parseDirs() {
        if ((dirs.left && dirs.right) || (!dirs.left && !dirs.right)) {
            ballstats.xaccel = 0;
        } else if (dirs.left) {
            ballstats.xaccel = -0.8;
        } else if (dirs.right) {
            ballstats.xaccel = 0.8;
        }
    }
    document.body.addEventListener('keydown', function (event) {
        if (event.keyCode == 37) dirs.left = true;
        if (event.keyCode == 39) dirs.right = true;
        parseDirs();
    });
    document.body.addEventListener('keyup', function (event) {
        if (event.keyCode == 37) dirs.left = false;
        if (event.keyCode == 39) dirs.right = false;
        parseDirs();
    });

    Gibberish.init();
    Gibberish.Time.export();
    Gibberish.Binops.export();

    gibDevice = new Gibberish.KarplusStrong({ damping:.4 }).connect();
};

function addHitHandler(func, hitbox) {
    hithandlers.push({hitbox: hitbox, func: func});
}

function drawAll() {
    canvascx.clearRect(0,0,canvas.width, canvas.height);
    canvascx.beginPath();
    canvascx.arc(
            coordsystem.x(ballstats.x),
            coordsystem.y(ballstats.y),
            coordsystem.wid(0.5),
            2 * Math.PI,
            false);
    canvascx.fillStyle = 'red';
    canvascx.fill();
    canvascx.font = '30px sans-serif';
    canvascx.fillStyle = 'black';
    //canvascx.fillText(a, 100, 100);
    
    startnote = notefrompos(0);
    for (var i = 0; i < 25; i++) {
        drawNote(i + startnote);
    }
    if (hittimer > 0) hittimer--;
    requestAnimationFrame(drawAll);
}

function drawNote(note) {
    var startpos = coordsystem.wid(posfromnote(note));
    var width = coordsystem.wid(isinkey(note) ? 2 : 1);
    var y = coordsystem.y(0);
    if (hittimer > 0 && note == hitnote) y += 3;
    var height = coordsystem.hei(1);
    var text = notename(note);
    if (iswhitekey(note)) {
        canvascx.strokeStyle = 'black';
        canvascx.strokeRect(startpos, y, width, height);
        canvascx.fillStyle = 'black';
        canvascx.fillText(text, startpos + width / 2, y + height / 2); // todo: maybe calculate text width and center it?
    } else {
        canvascx.fillStyle = 'black';
        canvascx.fillRect(startpos, y, width, height);
        canvascx.fillStyle = 'white';
        canvascx.fillText(text, startpos + width / 2, y + height / 2); // todo: maybe calculate text width and center it?
    }
}

function frameHandler() {
    ballstats.xvel += ballstats.xaccel / 60;
    if (ballstats.xvel > 1) ballstats.xvel = 1;
    if (ballstats.xvel < -1) ballstats.xvel = -1;
    ballstats.x += ballstats.xvel / 60;
    if (ballstats.x < 0) {
        ballstats.x *= -1;
        ballstats.xvel *= -0.8;
    } else if (ballstats.x > 1) {
        ballstats.x = 2 - ballstats.x;
        ballstats.xvel *= -0.8;
    }
    ballstats.progress += basicspeed * ballstats.bouncespeed;
    if (ballstats.progress >= 1) {
        ballstats.progress %= 1;
        bounceHandler();
    }
    ballstats.y = (ballstats.progress - ballstats.progress * ballstats.progress) * 4;
}

var mute = false;

function bounceHandler() {
    ballstats.bouncespeed = Math.pow(2, fingers);
    if (!mute) {
        hitnote = notefrompos(coordsystem.xtowid(ballstats.x));
        hittimer = 15;
        gibDevice.note(noteToFreq(notefrompos(coordsystem.xtowid(ballstats.x))));
    }
}

function noteToFreq(stepsabovea) {
    return Math.pow(2, stepsabovea/12) * 220;
}

var key = 3; // C natural by default
var flatkey = false;
var offset = 0; // zero sits the start of A3 at the left of the screen, nineteen sits the start of A4 at the left of the screen

function notefrompos(xpos) {
    xpos += offset;
    var octave = Math.floor(xpos/19);
    var spot = Math.floor(xpos % 19);
    if (spot < 0) spot += 19;
    var note, pspot;
    for (note = -1, pspot = 0; spot >= pspot; note++) {
        pspot += isinkey(note + 1) ? 2 : 1;
    }
    return note + octave * 12;
}

function posfromnote(note) {
    var pos = -offset;
    pos += 19 * Math.floor(note / 12);  //octave
    nnote = note % 12;
    if (nnote < 0) nnote += 12;
    for (var i = 0; i < nnote; i++) {
        pos += isinkey(i) ? 2 : 1;
    }
    return pos;
}

function isinkey(note) {
    note -= key;
    note %= 12;
    if (note < 0) note += 12;
    return (note == 0 || note == 2 || note == 4 || note == 5 || note == 7 || note == 9 || note == 11);
}

function iswhitekey(note) {
    note %= 12;
    if (note < 0) note += 12;
    return (note == 0 || note == 2 || note == 3 || note == 5 || note == 7 || note == 8 || note == 10);
}

function notename(note) {
    var names_sharp = ['A', 'A\u266f', 'B', 'C', 'C\u266f', 'D', 'D\u266f', 'E', 'F', 'F\u266f', 'G', 'G\u266f'];
    var names_flat = ['A', 'B\u266d', 'B', 'C', 'D\u266d', 'D', 'E\u266d', 'E', 'F', 'G\u266d', 'G', 'A\u266d'];
    note %= 12;
    if (note < 0) note += 12;
    return (flatkey ? names_flat : names_sharp)[note];
}
