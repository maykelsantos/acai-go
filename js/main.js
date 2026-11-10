(function () {
  const D = window.ACAI;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const wa = (txt) => `https://wa.me/${D.whatsapp}${txt ? "?text=" + encodeURIComponent(txt) : ""}`;
  const sv = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const icons = {
    whats: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    insta: sv('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>'),
    user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>'),
    check: sv('<path d="m5 12 5 5 9-10"/>')
  };

  const brand = `<a class="brand" href="index.html" aria-label="Açaí Go PE, página inicial"><img src="img/logo.png" alt="" width="46" height="46"><span>Açaí<b>Go</b><small>PE</small></span></a>`;

  const header = document.getElementById("header");
  if (header) {
    header.innerHTML = `
    <header class="topbar">
      <div class="container topbar__inner">
        ${brand}
        <a class="btn btn--ouro btn--sm" href="portal/index.html">${icons.user}<span>Área do revendedor</span></a>
      </div>
    </header>`;
  }

  const footer = document.getElementById("footer");
  if (footer) {
    footer.innerHTML = `
    <footer class="rodape">
      <div class="rodape__onda" aria-hidden="true"></div>
      <div class="container rodape__grid" style="grid-template-columns:1fr">
        <div>
          ${brand}
          <p class="rodape__lema">Açaí na garrafa que combina com qualquer momento. Pediu, chegou!</p>
          <p class="rodape__peq">${esc(D.cidade)} · <a href="${D.instagramUrl}" target="_blank" rel="noopener">@${esc(D.instagram)}</a></p>
        </div>
      </div>
      <div class="container rodape__fim"><span>© ${new Date().getFullYear()} Açaí Go PE</span><span>Prévia do site · conteúdo sujeito a ajustes</span></div>
    </footer>`;
  }

  /* barra fixa no celular / botão flutuante no desktop */
  const dock = document.createElement("div");
  dock.className = "dock";
  dock.innerHTML = `
    <a class="btn btn--ouro" href="portal/index.html">${icons.user}<span>Entrar no portal</span></a>
    <a class="btn btn--vidro" href="${wa("Oi! Quero ser revendedor Açaí Go PE 💜")}" target="_blank" rel="noopener">${icons.whats}<span>WhatsApp</span></a>`;
  document.body.appendChild(dock);

  document.querySelectorAll("[data-link]").forEach((el) => {
    if (el.dataset.link === "conversa") { el.href = wa(el.dataset.msg || "Oi! Quero ser revendedor Açaí Go PE 💜"); el.target = "_blank"; el.rel = "noopener"; }
  });
  document.querySelectorAll("[data-icon]").forEach((el) => { el.insertAdjacentHTML("afterbegin", icons[el.dataset.icon] || ""); });
  document.querySelectorAll("[data-seguidores]").forEach((el) => { el.textContent = D.seguidores; });

  const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rv = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduz) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }), { threshold: 0.1 });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add("is-in"));
})();
