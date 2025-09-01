const CENTER = { x: 200, y: 200 };
const MAIN_RADIUS = 180;
const MED_RADIUS = 90;
const SMALL_RADIUS = 25;
let SHOW_POINTS = false;
let PAUSED = true;
let BACKGROUND_COLOR = "antiquewhite";
let WARP_SPEED = false;

function keyPressed() {
  if (key === 'p') SHOW_POINTS = !SHOW_POINTS;
  if (key === 'w') WARP_SPEED = !WARP_SPEED;
}

function mousePressed() {
  for (const b of [data.whiteBall, data.blackBall]) {
    if (dista({ x: mouseX, y: mouseY }, b) < SMALL_RADIUS + 10) {
      const s = len(b.v);
      const a = random(0, 360);
      b.v = { x: cos(a) * s, y: sin(a) * s };
    }
  }
}

function mouseMoved() {
  if (PAUSED) PAUSED = false;
}

// math
function normalize(p1) {
  const len = Math.sqrt(p1.x * p1.x + p1.y * p1.y);
  return { ...p1, x: p1.x / len, y: p1.y / len };
}

function dot(p1, p2) {
  return p1.x * p2.x + p1.y * p2.y;
}

function len(v) {
  return Math.sqrt(dot(v, v));
}

function sub(p1, p2) {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

function mult(p, s) {
  return { x: p.x * s, y: p.y * s };
}

function dista(a, b) {
  let d = createVector(a.x, a.y).dist(createVector(b.x, b.y));
  return d;
}

function distToLineSegment(item, p1, p2) {
  const l2 = dista(p1, p2) * dista(p1, p2);
  let t = dot(sub(item, p2), sub(p1, p2)) / l2;
  t = Math.max(0, Math.min(t, 1));
  return dista(item, { x: p2.x - t * (p1.x - p2.x), y: p2.y - t * (p1.y - p2.y) })
}

// shapes and physics

function arcOfPoints(cx, cy, r, fromDeg, toDeg, nPoints) {
  const points = [];
  for (let i = 1; i <= nPoints; i++) {
    const a = fromDeg + (toDeg - fromDeg) * (i / nPoints);
    points.push({ x: cx + cos(a) * r, y: cy + sin(a) * r });
  }
  return points;
}

function bounceFromCircle(c, item, itemV) {
  const directionOfHitPoint = normalize(sub(item, c));
  const normal = directionOfHitPoint;
  const v = normalize(itemV);
  const projectedVelocity = dot(normal, v);
  //const newDir = { x: v.x - 2*projectedVelocity*normal.x, y: v.y - 2*projectedVelocity*normal.y };
  const newDir = sub(v, mult(normal, 2 * projectedVelocity));
  return mult(newDir, len(itemV));
}

function clampToCircle(item, itemRadius, center, centerRadius) {
  if (dista(item, center) < centerRadius - itemRadius) { return item; }
  const a = atan2((item.y - center.y), item.x - center.x);
  const newLoc = {
    x: center.x + cos(a) * (centerRadius - itemRadius - 1),
    y: center.y + sin(a) * (centerRadius - itemRadius - 1),
  }
  return { ...item, ...newLoc }
}

function pushToCircle(item, itemRadius, center, centerRadius) {
  if (dista(item, center) > centerRadius - itemRadius) { return item; }
  const a = atan2((item.y - center.y), item.x - center.x);
  const newLoc = {
    x: center.x + cos(a) * (centerRadius - itemRadius + 1),
    y: center.y + sin(a) * (centerRadius - itemRadius + 1),
  }
  return { ...item, ...newLoc }
}

const data = {};
function setup() {
  const canvas = createCanvas(400, 400);
  canvas.parent("sketch");
  angleMode(DEGREES);


  const blackBorder = arcOfPoints(CENTER.x, CENTER.y + MED_RADIUS, MED_RADIUS, 90, 90 + 180, 60);
  const whiteBorder = arcOfPoints(CENTER.x, CENTER.y - MED_RADIUS, MED_RADIUS, 90, 90 - 180, 60);

  // from bottom to top
  data.border = [
    ...blackBorder,
    ...whiteBorder,
  ];
  // from top to bottom
  data.whiteOuter = arcOfPoints(CENTER.x, CENTER.y, MAIN_RADIUS, 270, 270 + 180, 60);
  // balls
  const vW = createVector(0.1, 4);
  const vB = createVector(-0.1, 4);
  data.whiteBall = { x: CENTER.x, y: CENTER.y - MED_RADIUS, r: SMALL_RADIUS, v: vW };
  data.blackBall = { x: CENTER.x, y: CENTER.y + MED_RADIUS, r: SMALL_RADIUS, v: vB };
}

function draw() {
  drawX();
  if (!WARP_SPEED) return;
  drawX();
  drawX();
  drawX();
  drawX();
  drawX();
  drawX();
  drawX();
  drawX();
  drawX();
  drawX();
  drawX();
}

let t = 0;
function drawX() {
  t++;
  render();

  if (t > 400) PAUSED = false;
  if (PAUSED) return;
  collisions();
}

function keyedMin(arr, pred) {
  return arr.reduce((acc, v) => pred(v) < pred(acc) ? v : acc, arr[0]);
}

function collisions() {
  for (const b of [data.whiteBall, data.blackBall]) {
    let newPosition = { x: b.x, y: b.y };
    let newVelocity = b.v;

    let movedBall = move(b);
    let originalV = b.v;
    const hitPoints = [];

    let newBorder = [];
    for (const p of data.border) {
      const d = dista(p, movedBall);
      if (d < SMALL_RADIUS - 4) {
        hitPoints.push({ point: p, distance: d });
        newBorder.push({ point: p, hit: true, distance: d });
      } else {
        newBorder.push({ point: p, hit: false });
      }
    }
    if (hitPoints.length > 0) {
      const closestPoint = keyedMin(hitPoints, (hp) => hp.distance).point;
      newVelocity = bounceFromCircle(closestPoint, movedBall, originalV)
      console.log("newV", newVelocity, closestPoint, originalV, movedBall)
      newBorder = newBorder.map(({ point, hit, distance }) => {
        if (!hit) return point;
        const movedPoint = pushToCircle(
          point, //{ ...point, x: point.x + (originalV.x * 1.5), y: point.y + (originalV.y * 1.5) },
          0,
          movedBall,
          SMALL_RADIUS,
        );
        if (dista(movedPoint, movedBall) < distance) { // got closer as result of moving?
          console.log("huh?", distance, dista(movedPoint, movedBall));
          return point; // don't move it in this case
        }
        return clampToCircle(movedPoint, 0, CENTER, MAIN_RADIUS); // clamp it to the border if needed
      });
    } else {
      newBorder = newBorder.map(({ point }) => point)
    }
    if (dista(movedBall, CENTER) > MAIN_RADIUS - SMALL_RADIUS) {
      // bounce from border:
      // override bounce from hit point if needed:
      newVelocity = bounceFromCircle(CENTER, movedBall, originalV);
    }
    newPosition = { x: b.x + newVelocity.x, y: b.y + newVelocity.y };
    newPosition = clampToCircle(newPosition, SMALL_RADIUS, CENTER, MAIN_RADIUS);
    if (b === data.whiteBall) {
      data.whiteBall = { ...b, ...newPosition, v: newVelocity };
    } else {
      data.blackBall = { ...b, ...newPosition, v: newVelocity };
    }
    data.border = refillBorder(newBorder);
  }
}


function refillBorder(points) {
  let found = true;
  while (found) {
    found = false;
    const refilledBorder = [points[0]];
    for (let i = 1; i < points.length; i++) {
      let point = points[i];
      let prevPoint = points[i - 1];
      if (dista(point, prevPoint) > 10) {
        const mid = { x: lerp(point.x, prevPoint.x, 0.5), y: lerp(point.y, prevPoint.y, 0.5) };
        refilledBorder.push(mid);
        found = true;
      }
      refilledBorder.push(point);
    }
    points = refilledBorder;
  }
  // now prune redundant points
  const canRemove = [];
  found = true;
  while (found) {
    found = false;
    for (let i = 2; i < points.length; i++) {
      if (dista(points[i], points[i - 2]) < 4) {
        canRemove.push(i);
        found = true;
        //console.log("removing")
      }
    }
    points = points.filter((p, i) => canRemove.indexOf(i) === -1);
  }
  return points;
}

function move(item) {
  return {
    ...item,
    x: item.x + item.v.x,
    y: item.y + item.v.y,
  }
}

function render() {
  background(BACKGROUND_COLOR);

  fill(0);
  strokeWeight(0);
  ellipse(CENTER.x, CENTER.y, MAIN_RADIUS * 2, MAIN_RADIUS * 2);

  fill(255);
  stroke(255);

  beginShape();
  data.whiteOuter.forEach(({ x, y }) => vertex(x, y));
  data.border.forEach(({ x, y }) => vertex(x, y));
  endShape();


  if (SHOW_POINTS) {
    fill("red")
    data.border.forEach(({ x, y }) => ellipse(x, y, 4, 4));
    data.whiteOuter.forEach(({ x, y }) => ellipse(x, y, 4, 4));
  }


  fill("white")
  ellipse(data.whiteBall.x, data.whiteBall.y, data.whiteBall.r * 2, data.whiteBall.r * 2);
  fill("black");
  ellipse(data.blackBall.x, data.blackBall.y, data.blackBall.r * 2, data.blackBall.r * 2);
}
