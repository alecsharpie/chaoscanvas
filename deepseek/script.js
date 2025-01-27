const canvas = document.getElementById("ChaosCanvas");
const ctx = canvas.getContext("2d");
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

const CONFIG = {
    NUM_SHAPES: 100,
    TRAIL_ALPHA: 0.08,
    SHAPE: {
        TYPES: ['circle', 'square', 'triangle'],
        MIN_SIZE: 4,
        MAX_SIZE: 12,
        SPIN_RANGE: 0.02,
        CONNECTION_DISTANCE: 150,
        GRAVITY_FACTOR: 0.2,
        DAMPING: 0.95,
        MOUSE_RADIUS: 300,
        CONNECTION_FORCE_FACTOR: 0.3 // New parameter for connection force
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
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * (CONFIG.SHAPE.MAX_SIZE - CONFIG.SHAPE.MIN_SIZE) + CONFIG.SHAPE.MIN_SIZE;
        this.spin = (Math.random() - 0.5) * CONFIG.SHAPE.SPIN_RANGE;
        this.rotation = Math.random() * Math.PI * 2;
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.mouseForce = { x: 0, y: 0 }; // Track mouse force separately
    }

    applyMouseForces() {
        // Calculate mouse gravitational pull
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const maxDist = CONFIG.SHAPE.MOUSE_RADIUS;

        if (distance < maxDist && distance > 10) {
            const force = (1 - distance/maxDist) * CONFIG.SHAPE.GRAVITY_FACTOR;
            this.mouseForce.x = (dx/distance) * force;
            this.mouseForce.y = (dy/distance) * force;
        } else {
            this.mouseForce.x = 0;
            this.mouseForce.y = 0;
        }
        
        this.acceleration.x += this.mouseForce.x;
        this.acceleration.y += this.mouseForce.y;
    }

    update() {
        // Physics simulation
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.velocity.x *= CONFIG.SHAPE.DAMPING;
        this.velocity.y *= CONFIG.SHAPE.DAMPING;
        
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.rotation += this.spin;

        // Reset acceleration
        this.acceleration.x = 0;
        this.acceleration.y = 0;

        // Boundary wrapping
        const buffer = this.size * 4;
        if (this.x < -buffer) this.x = canvas.width + buffer;
        if (this.x > canvas.width + buffer) this.x = -buffer;
        if (this.y < -buffer) this.y = canvas.height + buffer;
        if (this.y > canvas.height + buffer) this.y = -buffer;
    }
}

let shapes = Array.from({ length: CONFIG.NUM_SHAPES }, () => new QuantumShape());

function applyConnectedForces() {
    shapes.forEach((a, i) => {
        shapes.slice(i+1).forEach(b => {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distSq = dx*dx + dy*dy;

            if(distSq < CONFIG.SHAPE.CONNECTION_DISTANCE * CONFIG.SHAPE.CONNECTION_DISTANCE) {
                // Apply propagated mouse forces
                b.acceleration.x += a.mouseForce.x * CONFIG.SHAPE.CONNECTION_FORCE_FACTOR;
                b.acceleration.y += a.mouseForce.y * CONFIG.SHAPE.CONNECTION_FORCE_FACTOR;
                a.acceleration.x += b.mouseForce.x * CONFIG.SHAPE.CONNECTION_FORCE_FACTOR;
                a.acceleration.y += b.mouseForce.y * CONFIG.SHAPE.CONNECTION_FORCE_FACTOR;
            }
        });
    });
}

function drawConnections() {
    ctx.lineWidth = 1.5;
    shapes.forEach((a, i) => {
        shapes.slice(i+1).forEach(b => {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if(dist < CONFIG.SHAPE.CONNECTION_DISTANCE) {
                const alpha = 1 - (dist/CONFIG.SHAPE.CONNECTION_DISTANCE);
                const hue = ((a.rotation + b.rotation) * 180/Math.PI) % 360;
                
                ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha*0.4})`;
                
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        });
    });
}

function draw() {
    // Fade trail
    ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.TRAIL_ALPHA})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Reset accelerations and apply forces
    shapes.forEach(shape => {
        shape.acceleration.x = 0;
        shape.acceleration.y = 0;
    });

    // Apply forces in sequence
    shapes.forEach(shape => shape.applyMouseForces());
    applyConnectedForces();

    // Update physics
    shapes.forEach(shape => shape.update());

    drawConnections();

    // Draw shapes
    shapes.forEach(shape => {
        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);

        const mouseDist = Math.hypot(mouse.x - shape.x, mouse.y - shape.y);
        const hueBase = (mouse.x/canvas.width * 360 + Date.now()*0.02) % 360;
        const hue = (hueBase + mouseDist * 0.2) % 360;

        // RGB separation
        [-3, 0, 3].forEach(offset => {
            ctx.fillStyle = `hsl(${(hue + offset * 30) % 360}, 100%, 60%)`;
            ctx.globalAlpha = 0.3 - Math.abs(offset)*0.1;
            
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

        // Core shape
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.6)`;
        switch(shape.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, shape.size, 0, Math.PI*2);
                ctx.fill();
                break;
            case 'square':
                ctx.fillRect(-shape.size, -shape.size, shape.size*2, shape.size*2);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(-shape.size, shape.size);
                ctx.lineTo(shape.size, shape.size);
                ctx.lineTo(0, -shape.size);
                ctx.closePath();
                ctx.fill();
                break;
        }

        ctx.restore();
    });

    // Mouse cursor
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI*2);
    ctx.fillStyle = `hsl(${(Date.now()*0.3) % 360}, 100%, 70%)`;
    ctx.fill();

    requestAnimationFrame(draw);
}

// Event listeners remain the same
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

window.addEventListener("resize", () => {
    resizeCanvas();
    shapes = Array.from({ length: CONFIG.NUM_SHAPES }, () => new QuantumShape());
});

draw();