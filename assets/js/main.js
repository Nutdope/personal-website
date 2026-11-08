/* ---------------------------------------------------- */
/* 1. Animated Typewriter Tab Title (@nutdope)          */
/* ---------------------------------------------------- */
(function animatedTitle() {
  const targetText = "@nutdope";
  const typeSpeed = 200;    // Typing speed (ms)
  const deleteSpeed = 120;  // Deleting speed (ms)
  const holdDelay = 2200;   // Wait time when fully typed (ms)
  const restartDelay = 600; // Pause before typing again (ms)

  let index = 0;
  let isDeleting = false;

  function tick() {
    if (!isDeleting) {
      index++;
      document.title = targetText.slice(0, index);

      if (index === targetText.length) {
        isDeleting = true;
        setTimeout(tick, holdDelay);
        return;
      }
      setTimeout(tick, typeSpeed);
    } else {
      index--;
      document.title = index === 0 ? "\u200E" : targetText.slice(0, index);

      if (index === 0) {
        isDeleting = false;
        setTimeout(tick, restartDelay);
        return;
      }
      setTimeout(tick, deleteSpeed);
    }
  }

  tick();
})();

/* ---------------------------------------------------- */
/* 2. Interactive Entry Gate                            */
/* ---------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const gate = document.getElementById("gate");
  if (gate) {
    gate.addEventListener("click", () => {
      gate.classList.add("hidden");
    });
  }

  /* -------------------------------------------------- */
  /* 3. Discord Tag Copy Button                         */
  /* -------------------------------------------------- */
  const copyBtn = document.getElementById("copy-discord");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const tag = copyBtn.getAttribute("data-tag") || "nutdope";
      try {
        await navigator.clipboard.writeText(tag);
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color:#22c55e"></i>';
        setTimeout(() => {
          copyBtn.innerHTML = originalHtml;
        }, 1500);
      } catch (err) {
        console.error("Copy failed:", err);
      }
    });
  }

  /* -------------------------------------------------- */
  /* 4. 3D Card Tilt Effect                             */
  /* -------------------------------------------------- */
  const card = document.getElementById("bio-card");
  if (card && window.matchMedia("(hover: hover)").matches) {
    const maxTilt = 12;

    document.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const cardX = rect.left + rect.width / 2;
      const cardY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - cardX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - cardY) / (window.innerHeight / 2);

      const rotateX = -deltaY * maxTilt;
      const rotateY = deltaX * maxTilt;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });

    document.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    });
  }

  /* -------------------------------------------------- */
  /* 5. Ambient Background Particle Canvas              */
  /* -------------------------------------------------- */
  const canvas = document.getElementById("particle-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    const count = 35;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.8 + 0.6;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = -Math.random() * 0.5 - 0.15;
        this.opacity = Math.random() * 0.45 + 0.15;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
          this.reset();
          this.y = canvas.height + 10;
        }
      }
      draw() {
        ctx.fillStyle = `rgba(168, 85, 247, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }
});