const canvas = document.getElementById("ChaosCanvas");
const ctx = canvas.getContext("2d");
let mouse = { 
    x: canvas.width / 2, 
    y: canvas.height / 2,
    velocity: { x: 0, y: 0 },
    prevX: canvas.width / 2,
    prevY: canvas.height / 2
};

const CONFIG = {
    NUM_SHAPES: 100,
    TRAIL_ALPHA: 0.08,
    SHAPE: {
        TYPES: ['circle', 'square', 'triangle'],
        MIN_SIZE: 4,
        MAX_SIZE: 12,
        SPIN_RANGE: 0.02,
        CONNECTION_DISTANCE: 150,
        GRAVITY_FACTOR: 0.15,    // Reduced for gentler attraction
        REPULSION_FACTOR: 0.3,   // Added repulsion force
        DAMPING: 0.98,          // Increased for smoother motion
        MOUSE_RADIUS: 200,      // Reduced interaction radius
        MAX_VELOCITY: 15,       // Added velocity cap
        MOUSE_INFLUENCE: 0.7    // Added mouse velocity influence
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
        this.mass = this.size * 0.5; // Added mass property
    }

    update() {
        // Mouse interaction with velocity influence
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const maxDist = CONFIG.SHAPE.MOUSE_RADIUS;

        if (distance < maxDist && distance > 5) {
            // Calculate base force
            const force = (1 - distance/maxDist) * CONFIG.SHAPE.GRAVITY_FACTOR;
            
            // Add mouse velocity influence
            const mouseSpeed = Math.sqrt(mouse.velocity.x**2 + mouse.velocity.y**2);
            const velocityInfluence = mouseSpeed * CONFIG.SHAPE.MOUSE_INFLUENCE;
            
            // Combine forces
            const totalForce = force * (1 + velocityInfluence);
            
            // Apply force based on distance
            if (distance < maxDist * 0.3) {
                // Repulsion when too close
                this.acceleration.x -= (dx/distance) * totalForce * CONFIG.SHAPE.REPULSION_FACTOR;
                this.acceleration.y -= (dy/distance) * totalForce * CONFIG.SHAPE.REPULSION_FACTOR;
            } else {
                // Attraction at medium distance
                this.acceleration.x += (dx/distance) * totalForce;
                this.acceleration.y += (dy/distance) * totalForce;
            }
            
            // Add some of mouse's velocity to shape
            this.velocity.x += mouse.velocity.x * force * 0.2;
            this.velocity.y += mouse.velocity.y * force * 0.2;
        }

        // Physics simulation with velocity cap
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        
        // Cap maximum velocity
        const speed = Math.sqrt(this.velocity.x**2 + this.velocity.y**2);
        if (speed > CONFIG.SHAPE.MAX_VELOCITY) {
            const scale = CONFIG.SHAPE.MAX_VELOCITY / speed;
            this.velocity.x *= scale;
            this.velocity.y *= scale;
        }
        
        // Apply damping
        this.velocity.x *= CONFIG.SHAPE.DAMPING;
        this.velocity.y *= CONFIG.SHAPE.DAMPING;
        
        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Spin based on velocity
        this.rotation += this.spin + (Math.abs(this.velocity.x) + Math.abs(this.velocity.y)) * 0.01;

        // Reset acceleration
        this.acceleration.x = 0;
        this.acceleration.y = 0;

        // Soft boundary wrapping with momentum preservation
        const buffer = this.size * 4;
        if (this.x < -buffer) {
            this.x = canvas.width + buffer;
            this.velocity.x *= 0.5; // Reduce velocity when wrapping
        }
        if (this.x > canvas.width + buffer) {
            this.x = -buffer;
            this.velocity.x *= 0.5;
        }
        if (this.y < -buffer) {
            this.y = canvas.height + buffer;
            this.velocity.y *= 0.5;
        }
        if (this.y > canvas.height + buffer) {
            this.y = -buffer;
            this.velocity.y *= 0.5;
        }
    }
}

let shapes = Array.from({ length: CONFIG.NUM_SHAPES }, () => new QuantumShape());

function drawConnections() {
    ctx.lineWidth = 1.5;
    shapes.forEach((a, i) => {
        shapes.slice(i+1).forEach(b => {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if(dist < CONFIG.SHAPE.CONNECTION_DISTANCE) {
                const alpha = 1 - (dist/CONFIG.SHAPE.CONNECTION_DISTANCE);
                // Color based on combined velocity
                const speedA = Math.sqrt(a.velocity.x**2 + a.velocity.y**2);
                const speedB = Math.sqrt(b.velocity.x**2 + b.velocity.y**2);
                const hue = ((speedA + speedB) * 20) % 360;
                
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

    drawConnections();

    // Update mouse velocity
    mouse.velocity = {
        x: mouse.x - mouse.prevX,
        y: mouse.y - mouse.prevY
    };
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;

    // Draw shapes
    shapes.forEach(shape => {
        shape.update();
        
        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);

        // Velocity-based color
        const speed = Math.sqrt(shape.velocity.x**2 + shape.velocity.y**2);
        const hue = (speed * 20) % 360;
        const saturation = Math.min(100, speed * 20 + 60);

        // RGB separation layers with velocity influence
        [-3, 0, 3].forEach(offset => {
            ctx.fillStyle = `hsl(${(hue + offset * 30) % 360}, ${saturation}%, 60%)`;
            ctx.globalAlpha = 0.3 - Math.abs(offset)*0.1;
            
            const offsetScale = 1 + speed * 0.1; // Increase separation with velocity
            
            switch(shape.type) {
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(offset * offsetScale, offset * offsetScale, shape.size, 0, Math.PI*2);
                    ctx.fill();
                    break;
                case 'square':
                    ctx.fillRect(-shape.size + offset * offsetScale, 
                               -shape.size + offset * offsetScale, 
                               shape.size*2, shape.size*2);
                    break;
                case 'triangle':
                    ctx.beginPath();
                    ctx.moveTo(-shape.size + offset * offsetScale, 
                             shape.size + offset * offsetScale);
                    ctx.lineTo(shape.size + offset * offsetScale, 
                             shape.size + offset * offsetScale);
                    ctx.lineTo(offset * offsetScale, -shape.size + offset * offsetScale);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
        });

        // Core shape
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, 70%, 0.6)`;
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

    // Draw a subtle quantum cursor effect
    const mouseSpeed = Math.sqrt(mouse.velocity.x**2 + mouse.velocity.y**2);
    
    // Inner glow
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
    ctx.fill();
    
    // Orbital rings
    const numRings = 2;
    for (let i = 0; i < numRings; i++) {
        ctx.beginPath();
        const radius = 8 + i * 6;
        ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 - i * 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

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
    shapes = Array.from({ length: CONFIG.NUM_SHAPES }, () => new QuantumShape());
});

draw();