export function createVictoryCelebration({ sceneEl }) {
  function playVictorySound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Bright arpeggio fanfare (C5 - E5 - G5 - C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.11);

        gain.gain.setValueAtTime(0.001, now + i * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.11 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.11 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.11);
        osc.stop(now + i * 0.11 + 0.48);
      });

      // Filtered noise bursts for firework crackles
      [0.25, 0.65, 1.05].forEach((delay) => {
        const bufferSize = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.07));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now + delay);

        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.16, now + delay);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.24);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now + delay);
      });

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 2200);
    } catch (err) {
      console.warn('Victory audio playback skipped:', err);
    }
  }

  function spawnFireworkBurst(origin, palette) {
    const threeScene = sceneEl?.object3D;
    if (!threeScene || !window.THREE) return;

    const count = 64;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = [];

    const baseColor = new window.THREE.Color(
      palette[Math.floor(Math.random() * palette.length)]
    );

    for (let i = 0; i < count; i++) {
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 1.4 + Math.random() * 2.2;

      velocities.push({
        x: Math.sin(phi) * Math.cos(theta) * speed,
        y: Math.cos(phi) * speed + 0.6,
        z: Math.sin(phi) * Math.sin(theta) * speed
      });

      const c = baseColor
        .clone()
        .offsetHSL((Math.random() - 0.5) * 0.08, 0, (Math.random() - 0.5) * 0.15);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new window.THREE.BufferGeometry();
    geometry.setAttribute('position', new window.THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new window.THREE.BufferAttribute(colors, 3));

    const material = new window.THREE.PointsMaterial({
      size: 0.11,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false
    });

    const points = new window.THREE.Points(geometry, material);
    threeScene.add(points);

    const startTime = performance.now();
    const duration = 1600;
    let lastTime = startTime;

    function step(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const progress = (now - startTime) / duration;

      if (progress >= 1) {
        threeScene.remove(points);
        geometry.dispose();
        material.dispose();
        return;
      }

      const posAttr = geometry.getAttribute('position');
      for (let i = 0; i < count; i++) {
        velocities[i].y -= 2.4 * dt;
        velocities[i].x *= 0.985;
        velocities[i].z *= 0.985;

        posAttr.array[i * 3] += velocities[i].x * dt;
        posAttr.array[i * 3 + 1] += velocities[i].y * dt;
        posAttr.array[i * 3 + 2] += velocities[i].z * dt;
      }
      posAttr.needsUpdate = true;
      material.opacity = 1 - progress;

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function trigger() {
    playVictorySound();

    const palette = ['#00ffcc', '#ffd166', '#ff595e', '#8ac926', '#4cc9f0'];
    const bursts = [
      { origin: { x: 0.7, y: 2.3, z: -2.9 }, delay: 0 },
      { origin: { x: -0.6, y: 2.7, z: -3.4 }, delay: 280 },
      { origin: { x: 1.6, y: 2.6, z: -2.4 }, delay: 560 },
      { origin: { x: 0.3, y: 3.1, z: -3.8 }, delay: 850 }
    ];

    bursts.forEach(({ origin, delay }) => {
      setTimeout(() => spawnFireworkBurst(origin, palette), delay);
    });
  }

  return { trigger };
}