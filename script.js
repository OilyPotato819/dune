const cnv = document.getElementById("canvas");
const ctx = cnv.getContext("2d");

cnv.width = 1000;
cnv.height = 800;

const waveNum = 10;
const aMin = 10;
const aMax = 30;
const fMin = 0.001;
const fMax = 0.01;
const segmentNum = 100;
const yOffset = 600;
const ballColor = "#3e236e";
const duneColor = "#c2b280";

let timeout = 1;
let waves = [];
let gameWindow = { x: 0, y: 0 };

document.addEventListener("mousedown", () => {
  ball.gravity += ball.gravityIncrease;
});

document.addEventListener("mouseup", () => {
  ball.gravity -= ball.gravityIncrease;
});

let ball = {
  x: 100,
  y: 50,
  r: 30,
  gravity: 0.1,
  gravityIncrease: 0.3,
  vx: 0,
  vy: 0,
  mass: 5,

  draw() {
    this.move();
    this.checkCollision();

    ctx.fillStyle = ballColor;
    ctx.beginPath();
    ctx.arc(this.x - gameWindow.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
  },

  move() {
    this.vy += this.gravity;

    this.x += this.vx;
    this.y += this.vy;

    gameWindow.x += this.vx;
  },

  checkCollision() {
    const pointNum = 10;
    let collision;
    let deepestPoint;

    if (
      Math.abs(evaluateWaves(this.x - this.r) - this.y) > this.r * 2 &&
      Math.abs(evaluateWaves(this.x + this.r) - this.y) > this.r * 2
    ) {
      return;
    }

    ctx.fillStyle = ballColor;
    ctx.beginPath();
    ctx.arc(this.x - gameWindow.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();

    for (let n = 1; n < pointNum; n++) {
      const theta = Math.PI / pointNum;
      const angle = theta * n;
      const currentPoint = {
        x: this.x + this.r * Math.cos(angle),
        y: this.y + this.r * Math.sin(angle),
      };
      const waveHeight = evaluateWaves(currentPoint.x);

      if (currentPoint.y > waveHeight) {
        collision = true;
      }

      ctx.fillStyle = "red";

      if (!deepestPoint || deepestPoint.dy < currentPoint.y - waveHeight) {
        deepestPoint = { x: currentPoint.x, dy: currentPoint.y - waveHeight };
        ctx.fillStyle = "blue";
      }

      ctx.fillRect(currentPoint.x - 2 + gameWindow.x, currentPoint.y - 2, 4, 4);
    }

    if (collision) {
      this.vy -= this.gravity;
      this.y -= deepestPoint.dy;

      let tanPoint1 = {
        x: deepestPoint.x - 0.001,
        y: evaluateWaves(deepestPoint.x - 0.001),
      };
      let tanPoint2 = {
        x: deepestPoint.x + 0.001,
        y: evaluateWaves(deepestPoint.x + 0.001),
      };

      this.updateVelocities(tanPoint1, tanPoint2);
    }
  },

  updateVelocities(tanPoint1, tanPoint2) {
    let slopeAngle = Math.atan2(
      tanPoint2.y - tanPoint1.y,
      tanPoint2.x - tanPoint1.x
    );
    slopeAngle =
      (this.vx || tanPoint2.y - tanPoint1.y) > 0
        ? slopeAngle
        : slopeAngle + Math.PI;

    const initialSpeed = Math.sqrt(this.vx ** 2 + this.vy ** 2);

    const friction = 1;

    this.vx = initialSpeed * Math.cos(slopeAngle) * friction;
    this.vy = initialSpeed * Math.sin(slopeAngle) * friction;

    const slopeAcceleration = this.gravity * Math.sin(slopeAngle);

    const slopeAccelerationX = slopeAcceleration * Math.cos(slopeAngle);
    const slopeAccelerationY = slopeAcceleration * Math.sin(slopeAngle);

    this.vx += slopeAccelerationX;
    this.vy += slopeAccelerationY;
  },
};

function createWaves() {
  for (let n = 0; n < waveNum; n++) {
    waves.push({
      a: randNum(aMin, aMax),
      f: randNum(fMin, fMax),
    });
  }
}

function randNum(min, max) {
  return Math.random() * (max - min) + min;
}

function drawWaves() {
  const firstY = evaluateWaves(gameWindow.x);

  ctx.beginPath();
  ctx.moveTo(0, firstY);
  for (let n = 1; n < segmentNum; n++) {
    const x = n * (cnv.width / segmentNum);

    let y = evaluateWaves(x + gameWindow.x);

    ctx.lineTo(x, y);
  }

  ctx.lineTo(cnv.width, cnv.height);
  ctx.lineTo(0, cnv.height);
  ctx.lineTo(0, firstY);

  ctx.fillStyle = duneColor;
  ctx.fill();
}

function evaluateWaves(x) {
  let y = 0;
  for (let i = 0; i < waves.length; i++) {
    y += waves[i].a * Math.sin(waves[i].f * x);
  }
  return y + yOffset;
}

function animate() {
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  drawWaves();
  ball.draw();

  if (!timeout) requestAnimationFrame(animate);
}

createWaves();
animate();
if (timeout) setInterval(animate, timeout);
