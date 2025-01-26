const canvas = document.getElementById("ChaosCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let shapes = [];

function Shape(x, y, size, color) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.color = color;
  this.speedX = Math.random() * 2 - 1; // Random horizontal speed
  this.speedY = Math.random() * 2 - 1; // Random vertical speed
  this.accelerationX = (Math.random() - 0.5) * 0.1; // Random acceleration
  this.accelerationY = (Math.random() - 0.5) * 0.1; // Random acceleration
}

function init() {
  for (let i = 0; i < 50; i++) { // Number of Shapes
    shapes.push(new Shape(Math.random() * canvas.width, Math.random() * 
canvas.height, Math.random() * 5 + 5, `hsl(${Math.random() * 360}, 100%, 
50%)`)); // Generate shapes
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  for (let shape of shapes) {
    shape.x += shape.speedX;
    shape.y += shape.speedY;
    shape.accelerationX *= 0.95; // Decelerate
    shape.accelerationY *= 0.95; // Decelerate

    // Bounce off edges
    if (shape.x + shape.size > canvas.width || shape.x - shape.size < 0) {
      shape.speedX *= -1;
    }
    if (shape.y + shape.size > canvas.height || shape.y - shape.size < 0) {
      shape.speedY *= -1;
    }
    // Mouse gravity
    let distance = Math.hypot(mouse.x - shape.x, mouse.y - shape.y); 
    if (distance < (canvas.width / 3)) {
        const gravityStrength = 1 / (distance + 1); // Closer objects have stronger gravity
        shape.speedX += (mouse.x - shape.x) * (gravityStrength * 0.1); 
        shape.speedY += (mouse.y - shape.y) * (gravityStrength * 0.1); 
    }

    // Color swirl
    let hue = (mouse.x / canvas.width) * 360;
    shape.color = `hsl(${hue}, 100%, 50%)`;

    ctx.fillStyle = shape.color;
    ctx.beginPath();
    ctx.arc(shape.x, shape.y, shape.size, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(draw);
}

let mouse = { x: 0, y: 0 };
canvas.addEventListener("mousemove", (e) => {
  mouse.x = e.offsetX;
  mouse.y = e.offsetY;
});

init();
draw();