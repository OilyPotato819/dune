const cnv = document.getElementById('canvas');
const ctx = cnv.getContext('2d');

cnv.width = 1000;
cnv.height = 800;

const waveNum = 10;
const aMin = 10;
const aMax = 30;
const fMin = 0.001;
const fMax = 0.01;
const segmentNum = 100;
const yOffset = 600;
const ballColor = 'orange';
const duneColor = '#c2b280';
const timeout = 0;

let mousedown;
let waves;
let gameWindow;
let ball;

document.addEventListener('mousedown', () => {
  mousedown = true;
});

document.addEventListener('mouseup', () => {
  mousedown = false;
  ball.gravity = ball.defaultGravity;
});

function start() {
  mousedown = false;
  waves = JSON.parse(
    '[{"a":27.123000346284986,"f":0.005402210090431551},{"a":24.908368818310365,"f":0.0010802535782841452},{"a":25.962682820719337,"f":0.0074529351323309075},{"a":13.226033026203288,"f":0.001708213196119043},{"a":22.35766562879153,"f":0.005678888384285505},{"a":18.834823166790528,"f":0.009288577451266322},{"a":13.676468635427286,"f":0.0067570155409546655},{"a":16.053625957083625,"f":0.00459601030527129},{"a":23.867420206844674,"f":0.0013936869822604111},{"a":17.03438729718585,"f":0.002977581346985042}]'
  );
  // waves = createWaves();
  gameWindow = { x: 0, y: 0, zoom: 1 };

  ball = {
    x: 100,
    y: 400,
    r: 30,
    defaultGravity: 0.1,
    gravity: 0.1,
    clickIncrease: { fall: 0.3, roll: 0.1 },
    vx: 0,
    vy: 5,
    mass: 5,
    friction: 0.999,
    state: false,

    draw() {
      if (mousedown) this.speedUp();
      this.move();
      this.checkCollision();

      ctx.fillStyle = ballColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
      ctx.fill();

      gameWindow.x += this.vx;
    },

    move() {
      this.vy += this.gravity;

      this.x += this.vx;
      this.y += this.vy;
      this.angle = Math.atan2(this.vy, this.vx);
    },

    checkCollision() {
      const pointNum = 10;
      let deepestPoint;
      let collision;

      if (Math.abs(evaluateWaves(this.x - this.r) - this.y) > this.r * 2 && Math.abs(evaluateWaves(this.x + this.r) - this.y) > this.r * 2) {
        this.state = 'falling';
        return;
      }

      for (let n = 0; n < pointNum; n++) {
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

        if (!deepestPoint || deepestPoint.dy < currentPoint.y - waveHeight) {
          deepestPoint = {
            x: currentPoint.x,
            y: currentPoint.y,
            dy: currentPoint.y - waveHeight,
          };
        }
      }

      if (collision) {
        this.state = this.state === 'falling' ? 'landing' : 'rolling';
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
      } else {
        this.state = 'falling';
      }
    },

    updateVelocities(tanPoint1, tanPoint2) {
      let slopeAngle = Math.atan2(tanPoint2.y - tanPoint1.y, tanPoint2.x - tanPoint1.x);
      slopeAngle = (this.vx || tanPoint2.y - tanPoint1.y) > 0 ? slopeAngle : slopeAngle + Math.PI;

      let speedCoefficient;
      if (this.state === 'landing') {
        const angleDifference = Math.abs(slopeAngle - this.angle);
        speedCoefficient = Math.cos(angleDifference);
      } else {
        speedCoefficient = 1;
      }

      let initialSpeed = Math.sqrt(this.vx ** 2 + this.vy ** 2) * speedCoefficient;

      this.vx = initialSpeed * Math.cos(slopeAngle) * this.friction;
      this.vy = initialSpeed * Math.sin(slopeAngle) * this.friction;

      const slopeAcceleration = this.gravity * Math.sin(slopeAngle);

      const slopeAccelerationX = slopeAcceleration * Math.cos(slopeAngle);
      const slopeAccelerationY = slopeAcceleration * Math.sin(slopeAngle);

      this.vx += slopeAccelerationX;
      this.vy += slopeAccelerationY;
    },

    speedUp() {
      if (this.state === 'falling') {
        this.gravity = this.defaultGravity + this.clickIncrease.fall;
      } else {
        this.gravity = this.defaultGravity;
        this.vx += this.clickIncrease.roll * Math.cos(this.angle);
        this.vy += this.clickIncrease.roll * Math.sin(this.angle);
      }
    },
  };
}

function createWaves() {
  let waveArray = [];

  for (let n = 0; n < waveNum; n++) {
    waveArray.push({
      a: randNum(aMin, aMax),
      f: randNum(fMin, fMax),
    });
  }

  return waveArray;
}

function randNum(min, max) {
  return Math.random() * (max - min) + min;
}

function drawWaves() {
  const firstY = evaluateWaves(0);

  ctx.beginPath();
  ctx.moveTo(0, firstY);
  for (let n = 1; n <= segmentNum; n++) {
    const x = n * (cnv.width / segmentNum);

    let y = evaluateWaves(x);

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

  gameWindow.zoom *= 0.99;
  drawWaves();
  ball.draw();

  if (!timeout) requestAnimationFrame(animate);
}

start();
animate();
if (timeout) setInterval(animate, timeout);
