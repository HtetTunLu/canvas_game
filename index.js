const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.querySelector("#scoreEl");
const lvlEl = document.querySelector("#lvlEl");
const crystalEl = document.querySelector("#crystalEl");
const startGameBtn = document.querySelector("#startGameBtn");
const restartGameBtn = document.querySelector("#restartGameBtn");
const modalEl = document.querySelector("#modalEl");
const pauseModalEl = document.querySelector("#pauseModalEl");
const resumeGameBtn = document.querySelector("#resumeGameBtn");
const bigScoreEl = document.querySelector("#bigScoreEl");
const pauseGameBtn = document.querySelector("#pauseGameBtn");
const countEl = document.querySelector("#countEl");
pauseModalEl.style.display = "none";
if (!localStorage.getItem("data")) {
  restartGameBtn.style.display = "none";
}

class Star {
  constructor(x, y, spikes, outerRadius, innerRadius, velocity) {
    this.x = x;
    this.y = y;
    this.spikes = spikes;
    this.outerRadius = outerRadius;
    this.innerRadius = innerRadius;
    this.velocity = velocity;
    this.rot = (Math.PI / 2) * 3;
    this.step = Math.PI / spikes;
  }

  draw() {
    c.strokeSyle = "#000";
    c.beginPath();
    c.moveTo(this.x, this.y - this.outerRadius);
    for (let i = 0; i < this.spikes; i++) {
      this.x = this.x + Math.cos(this.rot) * this.outerRadius;
      this.y = this.y + Math.sin(this.rot) * this.outerRadius;
      c.lineTo(this.x, this.y);
      this.rot += this.step;

      this.x = this.x + Math.cos(this.rot) * this.innerRadius;
      this.y = this.y + Math.sin(this.rot) * this.innerRadius;
      c.lineTo(this.x, this.y);
      this.rot += this.step;
    }
    c.lineTo(this.x, this.y - this.outerRadius);
    c.closePath();
    c.lineWidth = 7;
    c.strokeStyle = "pink";
    c.stroke();
    c.fillStyle = "skyblue";
    c.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enamy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

const friction = 0.99;
class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 10, "white");
let projectiles = [];
let enemies = [];
let particles = [];
let pause = false;
let animationId;
let score = 0;
let level = 1;
let crystal = localStorage.getItem("crystal")
  ? JSON.parse(localStorage.getItem("crystal"))
  : 0;
let scorePerLvl = 2000;
let generateEnemy;
let generateStar;

function init(flg) {
  if (!flg) {
    localStorage.removeItem("data");
  }
  player = new Player(x, y, 10, "white");
  projectiles = [];
  enemies = [];
  particles = [];
  score =
    flg === "tryAgain"
      ? JSON.parse(localStorage.getItem("data")).currentScore
      : 0;
  level =
    flg === "tryAgain"
      ? JSON.parse(localStorage.getItem("data")).currentLevel
      : 1;
  scoreEl.innerHTML = score;
  lvlEl.innerHTML = level;
  crystalEl.innerHTML = crystal;
  bigScoreEl.innerHTML = score;
}

function spawnEnemies() {
  generateEnemy = setInterval(() => {
    if (!pause) {
      const radius = Math.random() * (30 + level * 3) + 4;
      let x;
      let y;
      if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
        y = Math.random() * canvas.height;
      } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
      }
      // randomize color
      const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

      const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
      const speed = level / 10 + 0.5;
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };
      enemies.push(new Enamy(x, y, radius, color, velocity));
    }
  }, 2000 - level * 10);
}

function spawnStars() {
  generateStar = setInterval(() => {
    if (!pause) {
      let x;
      let y;
      if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 : canvas.width;
        y = Math.random() * canvas.height;
      } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 : canvas.height;
      }

      const angle = Math.atan2(
        canvas.height / 2 - y + Math.floor(Math.random() * 500) + 1,
        canvas.width / 2 - x + Math.floor(Math.random() * 500) + 1
      );
      const speed = level / 10 + 0.5;
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };
      enemies.push(new Star(x, y, 3, 10, 5, velocity));
    }
  }, 10000 - level * 30);
}

function animate() {
  if (pause) {
    pauseModalEl.style.display = "flex";
    return;
  }
  animationId = requestAnimationFrame(animate);
  // Black Screen
  c.fillStyle = "rgba(0, 0, 0, 0.1)";
  c.fillRect(0, 0, canvas.width, canvas.height);
  // Create Player
  player.draw();
  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });

  projectiles.forEach((projectile, index) => {
    projectile.update();

    // remove from edges of screen
    if (
      projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      setTimeout(() => {
        // remove items
        projectiles.splice(index, 1);
      }, 0);
    }
  });

  enemies.forEach((enemy, index) => {
    enemy.update();
    // distance between player and enemy
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    // end game
    if (dist - enemy.radius - player.radius < 1) {
      cancelAnimationFrame(animationId);
      restartGameBtn.style.display = "block";
      modalEl.style.display = "flex";
      bigScoreEl.innerHTML = score;
      clearInterval(generateEnemy);
      clearInterval(generateStar);
    }

    projectiles.forEach((projectile, projectileIndex) => {
      // distance between projectile and enemy
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      // when projectiles touch enemy
      if (!enemy.color) {
        if (dist < 15) {
          setTimeout(() => {
            crystal++;
            // remove items
            enemies.splice(index, 1);
            projectiles.splice(projectileIndex, 1);
            crystalEl.innerHTML = crystal;
            localStorage.setItem("crystal", crystal);
          }, 0);
        }
      }
      if (dist - enemy.radius - projectile.radius < 1) {
        // create explosions
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 6),
                y: (Math.random() - 0.5) * (Math.random() * 6),
              }
            )
          );
        }
        if (enemy.radius - 10 > 5) {
          // increase Score
          score += 100;
          scoreEl.innerHTML = score;
          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });
          // not to flash
          setTimeout(() => {
            // remove items
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          //remove from scene alltogether
          score += 250;
          scoreEl.innerHTML = score;
          if (score > scorePerLvl * (level * 1.5)) {
            level++;
            lvlEl.innerHTML = level;
            const data = {
              currentLevel: level,
              currentScore: score,
            };
            localStorage.setItem("data", JSON.stringify(data));
          }
          // not to flash
          setTimeout(() => {
            // remove items
            enemies.splice(index, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });
  });
}

addEventListener("click", (event) => {
  const angle = Math.atan2(
    event.clientY - canvas.height / 2,
    event.clientX - canvas.width / 2
  );
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5,
  };
  projectiles.push(
    new Projectile(canvas.width / 2, canvas.height / 2, 5, "white", velocity)
  );
});

startGameBtn.addEventListener("click", () => {
  init();
  animate();
  spawnEnemies();
  spawnStars();
  modalEl.style.display = "none";
});

restartGameBtn.addEventListener("click", () => {
  init("tryAgain");
  animate();
  spawnEnemies();
  spawnStars();
  modalEl.style.display = "none";
});

pauseGameBtn.addEventListener("click", () => {
  countEl.style.display = "none";
  pause = !pause;
  animate();
});

function doSetTimeout(i) {
  setTimeout(function () {
    alert(i);
  }, i * 5000);
}

resumeGameBtn.addEventListener("click", () => {
  resumeGameBtn.disabled = "true";
  let secs = 3;
  countEl.style.display = "inline-block";
  countEl.innerText = "Resume In " + secs + "...";
  for (let i = 1; i < 3; ++i) {
    setTimeout(() => {
      secs -= 1;
      countEl.innerText = "Resume In " + secs + "...";
    }, 1000 * i);
  }
  setTimeout(() => {
    pause = !pause;
    pauseModalEl.style.display = "none";
    animate();
    resumeGameBtn.disabled = "";
  }, 3000);
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    countEl.style.display = "none";
    pause = true;
    pauseModalEl.style.display = "flex";
    animate();
  } else if (event.code === "Enter") {
    resumeGameBtn.click();
  }
});
