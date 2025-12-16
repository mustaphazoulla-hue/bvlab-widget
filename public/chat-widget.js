// public/chat-widget.js (nice bubble + smooth iframe open)
(function () {
  if (window.__BVLAB_WIDGET_LOADED) return;
  window.__BVLAB_WIDGET_LOADED = true;

  const IFRAME_URL = "http://localhost:3000/widget-ui"; // pour dev local
  const WIDTH = 360, HEIGHT = 520;

  const container = document.createElement("div");
  container.id = "bvlab-widget-container";
  Object.assign(container.style, {
    position: "fixed",
    right: "22px",
    bottom: "22px",
    zIndex: "999999",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
  });
  document.body.appendChild(container);

  const bubble = document.createElement("button");
  bubble.id = "bvlab-widget-bubble";
  bubble.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4C2.9 2 2 2.9 2 4V18C2 19.1 2.9 20 4 20H18L22 24V4C22 2.9 21.1 2 20 2Z" fill="white"/></svg>';
  Object.assign(bubble.style, {
    width: "64px",
    height: "64px",
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(180deg,#0b5cff,#4b8bff)",
    boxShadow: "0 12px 30px rgba(11,92,255,0.18)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });
  container.appendChild(bubble);

  const wrapper = document.createElement("div");
  Object.assign(wrapper.style, {
    width: WIDTH + "px",
    height: HEIGHT + "px",
    position: "absolute",
    bottom: "86px",
    right: "0",
    display: "none",
    borderRadius: "16px",
    overflow: "hidden",
    transformOrigin: "bottom right",
    transition: "transform .22s ease, opacity .22s ease",
    opacity: 0,
    transform: "scale(.95)",
    boxShadow: "0 20px 50px rgba(8,20,40,0.2)"
  });

  const iframe = document.createElement("iframe");
  iframe.src = IFRAME_URL;
  iframe.width = WIDTH;
  iframe.height = HEIGHT;
  iframe.style.border = "none";
  iframe.style.display = "block";
  iframe.style.background = "white";
  wrapper.appendChild(iframe);
  container.appendChild(wrapper);

  let open = false;
  function setOpen(v) {
    open = v;
    if (open) {
      wrapper.style.display = "block";
      requestAnimationFrame(() => {
        wrapper.style.opacity = "1";
        wrapper.style.transform = "scale(1)";
      });
    } else {
      wrapper.style.opacity = "0";
      wrapper.style.transform = "scale(.95)";
      setTimeout(() => { if (!open) wrapper.style.display = "none"; }, 220);
    }
    try { window.parent.postMessage({ type: "BVLAB_WIDGET_TOGGLED", open }, "*"); } catch (e) {}
  }

  bubble.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!open);
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target) && open) setOpen(false);
  });

  // small keyboard accessibility: press 'w' to toggle
  document.addEventListener("keydown", (e) => {
    if (e.key === "w") setOpen(!open);
  });

  console.log("[BVLAB widget] loaded (styled)");
})();
