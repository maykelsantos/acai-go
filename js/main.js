(function () {
  const D = window.ACAI;
  const page = document.body.dataset.page || "";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const wa = (txt) => `https://wa.me/${D.whatsapp}${txt ? "?text=" + encodeURIComponent(txt) : ""}`;

  const sv = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const icons = {
    whats: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    insta: sv('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>'),
    pin: sv('<path d="M12 22s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>'),
    moto: sv('<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-3-8H8M15 17l2-6h-4"/>'),
    menu: sv('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
    mais: sv('<path d="M12 5v14M5 12h14"/>'),
    menos: sv('<path d="M5 12h14"/>'),
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    estrela: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1c.7 5.6 3.4 9.3 11 11-7.6 1.7-10.300 5.400-11 11-.7-5.600-3.400-9.300-11-11 7.600-1.700 10.300-5.400 11-11Z"/></svg>'
  };

  /* ---------- status (fuso de Recife) ---------- */
  function agora() {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Recife", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date());
    const wd = p.find((x) => x.type === "weekday").value;
    const h = parseInt(p.find((x) => x.type === "hour").value, 10) % 24;
    return { dia: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd), h };
  }
  function status() {
    const n = agora();
    if (!D.diasProducao.includes(n.dia)) return { ok: false, txt: "Hoje não tem produção · pedidos para o próximo dia útil" };
    if (n.h >= D.horaLimiteEntrega) return { ok: false, txt: `Entregas de hoje encerradas (até as ${D.horaLimiteEntrega}h) · peça para o próximo dia útil` };
    return { ok: true, txt: `Produzindo hoje · entrega até as ${D.horaLimiteEntrega}h` };
  }

  /* ---------- cabeçalho e rodapé ---------- */
  const links = [
    ["index.html", "Início", "inicio"],
    ["sabores.html", "Sabores e pedido", "sabores"],
    ["revenda.html", "Seja revendedor", "revenda"],
    ["contato.html", "Contato", "contato"]
  ];
  const brand = `<a class="brand" href="index.html" aria-label="Açaí Go Gourmet, página inicial"><img src="img/logo.png" alt="" width="46" height="46"><span>Açaí<b>Go</b><small>Gourmet</small></span></a>`;

  const header = document.getElementById("header");
  if (header) {
    header.innerHTML = `
    <header class="topbar">
      <div class="container topbar__inner">
        ${brand}
        <nav class="nav" id="nav" aria-label="Principal">
          ${links.map(([h, t, id]) => `<a href="${h}"${id === page ? ' aria-current="page"' : ""}>${t}</a>`).join("")}
        </nav>
        <a class="btn btn--ouro btn--sm" href="${wa("Oi! Quero pedir Açaí Go 💜")}" target="_blank" rel="noopener">${icons.whats}<span>Pedir</span></a>
        <button class="menu-toggle" type="button" aria-controls="nav" aria-expanded="false" aria-label="Abrir menu">${icons.menu}</button>
      </div>
    </header>`;
    const btn = header.querySelector(".menu-toggle");
    const nav = header.querySelector(".nav");
    const toggle = (open) => {
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open);
      btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      btn.innerHTML = open ? icons.close : icons.menu;
    };
    btn.addEventListener("click", () => toggle(!nav.classList.contains("is-open")));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) toggle(false); });
  }

  const footer = document.getElementById("footer");
  if (footer) {
    footer.innerHTML = `
    <footer class="rodape">
      <div class="rodape__onda" aria-hidden="true"></div>
      <div class="container rodape__grid">
        <div>
          ${brand}
          <p class="rodape__lema">Açaí na garrafa que combina com qualquer momento. Pediu, chegou!</p>
          <p class="rodape__peq">${esc(D.cidade)}</p>
        </div>
        <div>
          <h4>Navegue</h4>
          <ul>${links.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul>
        </div>
        <div>
          <h4>Fale com a gente</h4>
          <ul>
            <li><a href="${wa("Oi! Quero pedir Açaí Go 💜")}" target="_blank" rel="noopener">WhatsApp ${esc(D.whatsappExibido)}</a></li>
            <li><a href="${D.instagramUrl}" target="_blank" rel="noopener">Instagram @${esc(D.instagram)}</a></li>
          </ul>
          <p class="rodape__peq" data-status-txt></p>
        </div>
      </div>
      <div class="container rodape__fim"><span>© ${new Date().getFullYear()} Açaí Go Gourmet</span><span>Prévia do site · conteúdo sujeito a ajustes</span></div>
    </footer>`;
  }

  /* barra fixa (celular) / botão flutuante (desktop) */
  const dock = document.createElement("div");
  dock.className = "dock";
  dock.innerHTML = `
    <a class="btn btn--ouro" href="${wa("Oi! Quero pedir Açaí Go 💜")}" target="_blank" rel="noopener">${icons.whats}<span>Pedir no WhatsApp</span></a>
    <a class="btn btn--vidro" href="${D.instagramUrl}" target="_blank" rel="noopener">${icons.insta}<span>Instagram</span></a>`;
  document.body.appendChild(dock);

  /* ---------- status e data-link ---------- */
  const st = status();
  document.querySelectorAll("[data-status]").forEach((el) => {
    el.classList.toggle("is-ok", st.ok);
    el.innerHTML = `<i></i>${esc(st.txt)}`;
  });
  document.querySelectorAll("[data-status-txt]").forEach((el) => { el.textContent = st.txt; });
  document.querySelectorAll("[data-link]").forEach((el) => {
    const k = el.dataset.link;
    if (k === "conversa") { el.href = wa(el.dataset.msg || "Oi! Quero pedir Açaí Go 💜"); el.target = "_blank"; el.rel = "noopener"; }
    if (k === "insta") { el.href = D.instagramUrl; el.target = "_blank"; el.rel = "noopener"; }
  });
  document.querySelectorAll("[data-icon]").forEach((el) => { el.insertAdjacentHTML("afterbegin", icons[el.dataset.icon] || ""); });
  document.querySelectorAll("[data-fone]").forEach((el) => { el.textContent = D.whatsappExibido; });
  document.querySelectorAll("[data-seguidores]").forEach((el) => { el.textContent = D.seguidores; });

  /* ---------- garrafa em SVG ---------- */
  let uid = 0;
  function garrafa(f) {
    const id = "g" + ++uid;
    const fundo = f.fundo || f.c2;
    return `<svg class="garrafa" viewBox="0 0 100 190" role="img" aria-label="Garrafa de açaí sabor ${esc(f.nome)}">
      <defs>
        <clipPath id="${id}"><path d="M35 24h30v8c0 7 14 10 14 24v112c0 8-6 14-14 14H35c-8 0-14-6-14-14V56c0-14 14-17 14-24v-8Z"/></clipPath>
        <linearGradient id="${id}b" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
      </defs>
      <rect x="34" y="6" width="32" height="16" rx="3" fill="#fff"/>
      <path d="M38 8v12M43 8v12M48 8v12M53 8v12M58 8v12M62 8v12" stroke="#d9d2e6" stroke-width="1.2"/>
      <rect x="32" y="22" width="36" height="3" rx="1.5" fill="#e9e3f3"/>
      <g clip-path="url(#${id})">
        <rect width="100" height="190" fill="${fundo}"/>
        <path d="M0 34c22 6 34-8 58 4s30 8 42 0v34c-24 10-40-6-62 4S10 74 0 66Z" fill="${f.c1}"/>
        <path d="M0 140c18-8 30 6 50-2s34-10 50 0v60H0Z" fill="${f.c1}"/>
        <path d="M18 66c10 10 6 24 14 34s-6 22 4 34c-12 2-24-8-24-22S10 76 18 66Z" fill="${f.c1}" opacity=".9"/>
        <path d="M82 70c-10 8-4 22-12 32s4 20-2 32c14-4 22-14 18-28S92 76 82 70Z" fill="${f.c1}" opacity=".85"/>
      </g>
      <path d="M35 24h30v8c0 7 14 10 14 24v112c0 8-6 14-14 14H35c-8 0-14-6-14-14V56c0-14 14-17 14-24v-8Z" fill="url(#${id}b)"/>
      <g class="garrafa__rotulo">
        <rect x="21" y="78" width="58" height="66" rx="3" fill="#4B1A8F"/>
        <rect x="21" y="78" width="58" height="66" rx="3" fill="none" stroke="#FFC62B" stroke-opacity=".55" stroke-width=".8"/>
        <ellipse cx="50" cy="94" rx="19" ry="9" fill="none" stroke="#FF8F1F" stroke-width="2.2"/>
        <ellipse cx="50" cy="94" rx="14" ry="6" fill="#FFC62B" opacity=".25"/>
        <circle cx="42" cy="93" r="4" fill="#E8B9A0"/><circle cx="52" cy="92" r="4" fill="#F2C9B0"/>
        <text x="50" y="119" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="${f.nome.length > 7 ? 9.5 : 11}" fill="#fff">${esc(f.nome.toUpperCase())}</text>
        <text x="50" y="128" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="5.5" fill="#FFC62B">300ml</text>
        <text x="50" y="138" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="4" fill="#d8c8f5" letter-spacing=".4">AGITE ANTES DE TOMAR</text>
      </g>
    </svg>`;
  }

  /* ---------- cards dos sabores (vitrine, sem pedido) ---------- */
  const vitrine = document.querySelector("[data-sabores]");
  if (vitrine) {
    vitrine.innerHTML = D.sabores.map((f, i) => `
      <article class="sabor reveal" style="--d:${i * 70}ms">
        <div class="sabor__garrafa">${garrafa(f)}</div>
        <h3>${esc(f.nome)}</h3>
        <p>${esc(f.sub)}</p>
        <span class="sabor__tam">${esc(D.tamanho)}</span>
      </article>`).join("");
  }

  /* ---------- pedido (página sabores) ---------- */
  const pedido = document.getElementById("pedido");
  if (pedido) {
    const qtd = {};
    D.sabores.forEach((f) => (qtd[f.slug] = 0));
    const lista = pedido.querySelector("[data-lista]");
    const resumo = pedido.querySelector("[data-resumo]");
    const enviar = pedido.querySelector("[data-enviar]");
    const total = pedido.querySelector("[data-total]");
    const dockBtn = document.querySelector(".dock .btn--ouro");

    lista.innerHTML = D.sabores.map((f, i) => `
      <article class="item reveal" style="--d:${i * 60}ms" data-slug="${f.slug}">
        <div class="item__garrafa">${garrafa(f)}</div>
        <div class="item__txt">
          <h3>${esc(f.nome)}</h3>
          <p>${esc(f.sub)} · ${esc(D.tamanho)}</p>
          <p class="item__preco">${f.preco == null ? '<span class="placeholder">[preço a confirmar]</span>' : brl(f.preco)}</p>
        </div>
        <div class="qtd" role="group" aria-label="Quantidade de ${esc(f.nome)}">
          <button type="button" data-d="-1" aria-label="Menos uma ${esc(f.nome)}">${icons.menos}</button>
          <output aria-live="polite">0</output>
          <button type="button" data-d="1" aria-label="Mais uma ${esc(f.nome)}">${icons.mais}</button>
        </div>
      </article>`).join("");

    const campos = () => ({
      nome: pedido.querySelector("[name=nome]").value.trim(),
      end: pedido.querySelector("[name=endereco]").value.trim(),
      obs: pedido.querySelector("[name=obs]").value.trim()
    });

    function atualizar() {
      const itens = D.sabores.filter((f) => qtd[f.slug] > 0);
      const n = itens.reduce((s, f) => s + qtd[f.slug], 0);
      resumo.innerHTML = itens.length
        ? itens.map((f) => `<li><span>${qtd[f.slug]}× ${esc(f.nome)}</span><span>${f.preco == null ? "" : brl(f.preco * qtd[f.slug])}</span></li>`).join("")
        : '<li class="vazio">Escolha os sabores ao lado ✦</li>';
      const somavel = itens.length && itens.every((f) => f.preco != null);
      total.textContent = somavel ? brl(itens.reduce((s, f) => s + f.preco * qtd[f.slug], 0)) : n ? "a combinar" : "—";
      enviar.setAttribute("aria-disabled", n ? "false" : "true");
      enviar.querySelector("span").textContent = n ? `Enviar pedido (${n}) no WhatsApp` : "Escolha ao menos uma garrafa";
      const c = campos();
      let msg = "Oi! Quero fazer um pedido de Açaí Go 💜\n\n";
      msg += itens.map((f) => `• ${qtd[f.slug]}x ${f.nome} (${D.tamanho})`).join("\n");
      if (c.nome) msg += `\n\nNome: ${c.nome}`;
      if (c.end) msg += `\nEndereço/bairro: ${c.end}`;
      if (c.obs) msg += `\nObs.: ${c.obs}`;
      enviar.href = n ? wa(msg) : "#pedido";
      document.querySelectorAll("[data-contador]").forEach((el) => { el.textContent = n; el.hidden = !n; });
    }
    lista.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-d]");
      if (!b) return;
      const card = b.closest(".item");
      const slug = card.dataset.slug;
      qtd[slug] = Math.max(0, Math.min(99, qtd[slug] + Number(b.dataset.d)));
      card.querySelector("output").textContent = qtd[slug];
      card.classList.toggle("is-on", qtd[slug] > 0);
      atualizar();
    });
    pedido.querySelectorAll("input,textarea").forEach((el) => el.addEventListener("input", atualizar));
    enviar.addEventListener("click", (e) => { if (enviar.getAttribute("aria-disabled") === "true") e.preventDefault(); });
    atualizar();
    if (dockBtn) dockBtn.closest(".dock").classList.add("dock--pedido");
  }

  /* ---------- vídeos (reels) ---------- */
  const reels = document.querySelector("[data-reels]");
  if (reels) {
    reels.innerHTML = D.videos.map((v) => `
      <figure class="reel">
        <button class="reel__btn" type="button" aria-label="Pausar ou tocar: ${esc(v.legenda)}">
          <video muted loop playsinline preload="none" poster="video/${v.arq}.jpg" data-src="video/${v.arq}.mp4"></video>
          <span class="reel__play">${icons.play}</span>
        </button>
        <figcaption>${esc(v.legenda)}</figcaption>
      </figure>`).join("");
  }
  const videos = document.querySelectorAll("video[data-src], video[autoplay]");
  const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          if (v.dataset.src && !v.src) v.src = v.dataset.src;
          if (!reduz && !v.dataset.pausado) v.play().catch(() => {});
        } else v.pause();
      });
    }, { threshold: 0.5 });
    videos.forEach((v) => io.observe(v));
  }
  document.querySelectorAll(".reel__btn").forEach((b) => {
    b.addEventListener("click", () => {
      const v = b.querySelector("video");
      if (!v.src) v.src = v.dataset.src;
      if (v.paused) { v.dataset.pausado = ""; delete v.dataset.pausado; v.play().catch(() => {}); b.classList.remove("is-pausado"); }
      else { v.pause(); v.dataset.pausado = "1"; b.classList.add("is-pausado"); }
    });
  });
  const rolar = document.querySelector("[data-rolar]");
  if (rolar) {
    document.querySelectorAll("[data-rolar-btn]").forEach((b) => b.addEventListener("click", () => {
      rolar.scrollBy({ left: Number(b.dataset.rolarBtn) * Math.min(rolar.clientWidth * 0.8, 600), behavior: "smooth" });
    }));
  }

  /* ---------- reveal ---------- */
  const rv = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduz) {
    const io2 = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add("is-in"); io2.unobserve(e.target); }
    }), { threshold: 0.1 });
    rv.forEach((el) => io2.observe(el));
  } else rv.forEach((el) => el.classList.add("is-in"));
})();
