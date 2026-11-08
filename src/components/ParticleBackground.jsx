import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 35;

class Particle {
  constructor(width, height) {
    this.reset(width, height);
  }

  reset(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.random() * 1.8 + 0.6;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = -Math.random() * 0.5 - 0.15;
    this.opacity = Math.random() * 0.45 + 0.15;
  }

  update(width, height) {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.y < -10 || this.x < -10 || this.x > width + 10) {
      this.reset(width, height);
      this.y = height + 10;
    }
  }

  draw(ctx) {
    ctx.fillStyle = `rgba(168, 85, 247, ${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Ambient purple particles drifting upward behind everything. */
export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from(
      { length: PARTICLE_COUNT },
      () => new Particle(canvas.width, canvas.height)
    );

    let frame;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        if (!reduceMotion) p.update(canvas.width, canvas.height);
        p.draw(ctx);
      }
      if (!reduceMotion) frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas id="particle-canvas" ref={canvasRef} aria-hidden="true" />;
}
