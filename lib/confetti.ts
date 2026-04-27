export function burstConfetti(count = 50) {
  if (typeof document === "undefined") return;
  const wrap = document.createElement("div");
  wrap.className = "confetti";
  const colors = ["#ffd93d", "#ff6b9d", "#4ade80", "#60a5fa", "#c4b5fd"];
  for (let i = 0; i < count; i++) {
    const c = document.createElement("i");
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = Math.random() * 0.5 + "s";
    c.style.animationDuration = 2 + Math.random() * 2 + "s";
    wrap.appendChild(c);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 4500);
}
