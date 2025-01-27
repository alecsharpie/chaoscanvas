const canvas = document.getElementById("ChaosCanvas");
const ctx = canvas.getContext("2d");
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

const CONFIG = {
NUM_SHAPES: 120,
TRAIL_ALPHA: 0.07,
SHAPE: {
    TYPES: ['circle', 'square', 'triangle'],
    MIN_SIZE: 5,
    MAX_SIZE: 15,
    SPIN_RANGE: 0.025,
    CONNECTION_DISTANCE: 180,
    GRAVITY: 0.4, // Increased force
    REPULSION: 0.6, // New repulsion force
    DAMPING: 0.92, // Less damping = more fluid motion
    MOUSE_RADIUS: 400
}
};

function resizeCanvas() {
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
}
resizeCanvas();

class QuantumShape {
constructor() {
    this.type = CONFIG.SHAPE.TYPES[Math.floor(Math.random() * 3)];
    this.reset();
    this.spin = (Math.random() - 0.5) * CONFIG.SHAPE.SPIN_RANGE;
    this.rotation = Math.random() * Math.PI * 2;
}

reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * (CONFIG.SHAPE.MAX_SIZE - CONFIG.SHAPE.MIN_SIZE) + CONFIG.SHAPE.MIN_SIZE;
    this.velocity = { x: 0, y: 0 };
}

update() {
    // Mouse interaction physics
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const direction = distance > 0 ? { x: dx/distance, y: dy/distance } : { x: 0, y: 0 };

    // Attraction/Repulsion system
    if (distance < CONFIG.SHAPE.MOUSE_RADIUS) {
        if (distance > 50) { // Attraction
            const force = (1 - distance/CONFIG.SHAPE.MOUSE_RADIUS) * CONFIG.SHAPE.GRAVITY;
            this.velocity.x += direction.x * force;
            this.velocity.y += direction.y * force;
        } else { // Repulsion
            const force = (1 - distance/50) * CONFIG.SHAPE.REPULSION;
            this.velocity.x -= direction.x * force;
            this.velocity.y -= direction.y * force;
        }
    }

    // Velocity updates
    this.velocity.x *= CONFIG.SHAPE.DAMPING;
    this.velocity.y *= CONFIG.SHAPE.DAMPING;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.rotation += this.spin;

    // Soft screen teleportation
    const buffer = this.size * 3;
    if (this.x < -buffer) this.x = canvas.width + buffer;
    if (this.x > canvas.width + buffer) this.x = -buffer;
    if (this.y < -buffer) this.y = canvas.height + buffer;
    if (this.y > canvas.height + buffer) this.y = -buffer;
}
}

let shapes = Array.from({ length: CONFIG.NUM_SHAPES }, () => new QuantumShape());

function drawConnections() {
ctx.lineWidth = 2;
shapes.forEach((a, i) => {
    shapes.slice(i+1).forEach(b => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if(dist < CONFIG.SHAPE.CONNECTION_DISTANCE) {
            const alpha = 1 - (dist/CONFIG.SHAPE.CONNECTION_DISTANCE);
            const hue = ((a.rotation - b.rotation) * 180/Math.PI) % 360;
            
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha*0.5})`;
            
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
    });
});
}

function draw() {
ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.TRAIL_ALPHA})`;
ctx.fillRect(0, 0, canvas.width, canvas.height);

shapes.forEach(shape => shape.update());
drawConnections();

// Draw shapes with velocity-based color
shapes.forEach(shape => {
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate(shape.rotation);

    // Velocity color effect
    const speed = Math.hypot(shape.velocity.x, shape.velocity.y);
    const hue = (Math.atan2(shape.velocity.y, shape.velocity.x) * 180/Math.PI + 360) % 360;
    
    // Chromatic layers
    [-4, 0, 4].forEach((offset, i) => {
        ctx.fillStyle = `hsl(${(hue + i*120) % 360}, 100%, ${60 - i*10}%)`;
        ctx.globalAlpha = 0.4 - Math.abs(i-1)*0.2;
        
        switch(shape.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(offset, offset, shape.size, 0, Math.PI*2);
                ctx.fill();
                break;
            case 'square':
                ctx.fillRect(-shape.size + offset, -shape.size + offset, 
                            shape.size*2, shape.size*2);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(-shape.size + offset, shape.size + offset);
                ctx.lineTo(shape.size + offset, shape.size + offset);
                ctx.lineTo(offset, -shape.size + offset);
                ctx.closePath();
                ctx.fill();
                break;
        }
    });

    ctx.restore();
});

// Draw mouse influence
ctx.beginPath();
ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI*2);
ctx.fillStyle = `hsl(${(performance.now()*0.1) % 360}, 100%, 70%)`;
ctx.fill();

requestAnimationFrame(draw);
}

// Event Listeners
canvas.addEventListener("mousemove", (e) => {
const rect = canvas.getBoundingClientRect();
mouse.x = e.clientX - rect.left;
mouse.y = e.clientY - rect.top;
});

window.addEventListener("resize", () => {
resizeCanvas();
shapes.forEach(shape => shape.reset());
});

draw();