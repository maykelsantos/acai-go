/* Portal do Revendedor — PROTÓTIPO. Dados fictícios guardados no localStorage do navegador.
   Em produção isto vira banco de dados + login de verdade (as senhas aqui NÃO são seguras). */
(function () {
  const KEY = "acaigo_portal_v1";
  const SESS = "acaigo_portal_sessao";
  const $app = document.getElementById("app");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const SABORES = [
    { slug: "abacaxi", nome: "Abacaxi", sub: "Delícia de Abacaxi" },
    { slug: "maracuja", nome: "Maracujá", sub: "Açaí com maracujá" },
    { slug: "morango", nome: "Morango", sub: "Açaí com morango" },
    { slug: "pacoca", nome: "Paçoca", sub: "Açaí com paçoca" },
    { slug: "trufado", nome: "Trufado", sub: "Ninho com Nutella" }
  ];
  const nomeSabor = (s) => (SABORES.find((x) => x.slug === s) || {}).nome || s;

  /* ---------- dados ---------- */
  const isoDia = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
  const hoje = () => isoDia(new Date());
  const maisDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return isoDia(d); };
  const fmtDia = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  const fmtHora = (ts) => new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  function semente() {
    const agora = Date.now();
    const it = (slug, qtd, preco) => ({ slug, nome: nomeSabor(slug), qtd, preco });
    return {
      seq: 1004,
      usuarios: [
        { id: "u0", tipo: "admin", email: "admin@acaigo.demo", senha: "admin123", nome: "Dono Açaí Go", status: "aprovado" },
        { id: "u1", tipo: "rev", email: "maria@demo.com", senha: "1234", nome: "Maria Souza", negocio: "Mercadinho da Maria", doc: "", whats: "(81) 98888-1111", endereco: { rua: "Rua das Flores", num: "120", bairro: "Santo Inácio", ref: "Perto da padaria" }, geo: { lat: -8.2847, lng: -35.0343, prec: 25 }, status: "aprovado", criado: agora - 9e8 },
        { id: "u2", tipo: "rev", email: "joao@demo.com", senha: "1234", nome: "João Pereira", negocio: "Lanchonete do João", doc: "", whats: "(81) 97777-2222", endereco: { rua: "Av. Dr. Alexandre Cardoso", num: "45", bairro: "Centro", ref: "" }, geo: null, status: "pendente", criado: agora - 3e6 },
        { id: "u3", tipo: "rev", email: "carla@demo.com", senha: "1234", nome: "Carla Lima", negocio: "Carla Gelados", doc: "", whats: "(81) 96666-3333", endereco: { rua: "Rua Projetada", num: "8", bairro: "Charneca", ref: "Casa azul" }, geo: { lat: -8.2901, lng: -35.0198, prec: 40 }, status: "pendente", criado: agora - 1e6 }
      ],
      estoque: { abacaxi: 48, maracuja: 30, morango: 5, pacoca: 0, trufado: 20 },
      precos: { abacaxi: 6, maracuja: 6, morango: 6, pacoca: 6.5, trufado: 8 },
      pedidos: [
        { id: "p1001", num: 1001, revId: "u1", itens: [it("abacaxi", 12, 6), it("maracuja", 12, 6)], total: 144, status: "entregue", criado: agora - 5e8, entrega: maisDias(-4), obs: "" },
        { id: "p1002", num: 1002, revId: "u1", itens: [it("trufado", 10, 8)], total: 80, status: "aceito", criado: agora - 4e6, entrega: maisDias(1), obs: "Deixar com o seguranca" },
        { id: "p1003", num: 1003, revId: "u1", itens: [it("morango", 6, 6), it("abacaxi", 6, 6)], total: 72, status: "novo", criado: agora - 6e5, entrega: null, obs: "" }
      ]
    };
  }
  const ler = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.usuarios) return d; } catch (e) {} return null; };
  let db = ler() || semente();
  const salvar = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  salvar();
  const usuario = () => { try { return db.usuarios.find((u) => u.id === sessionStorage.getItem(SESS)) || null; } catch (e) { return null; } };
  const porId = (id) => db.usuarios.find((u) => u.id === id);

  function toast(t) {
    const el = document.getElementById("toast");
    el.textContent = t; el.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2800);
  }

  /* ---------- estado de tela ---------- */
  const S = { tela: "login", aba: "", msg: null, cart: {}, geo: null, aviso: "" };

  const marca = (link) => `<${link ? "a href=\"../index.html\"" : "div"} class="marca"><img src="../img/logo.png" alt=""><span><b>Açaí<i>Go</i> PE</b><small>Portal do revendedor</small></span></${link ? "a" : "div"}>`;

  /* ---------- telas públicas ---------- */
  function telaLogin() {
    return `<div class="fundo"><div class="caixa">
      ${marca(true)}
      <div class="painel">
        <h2>Entrar</h2>
        <p class="sub">Acesso exclusivo para revendedores aprovados.</p>
        ${S.aviso ? `<div class="aviso ${S.avisoTipo || ""}">${S.aviso}</div>` : ""}
        <form data-form="login" novalidate>
          <label class="campo"><span>E-mail</span><input name="email" type="email" autocomplete="username" required></label>
          <label class="campo"><span>Senha</span><input name="senha" type="password" autocomplete="current-password" required></label>
          <button class="btn btn--ouro btn--bloco" type="submit">Entrar</button>
        </form>
        <p class="sub" style="margin:1rem 0 0">Ainda não é revendedor? <button class="link" data-acao="ir-cadastro" type="button">Solicitar cadastro</button></p>
        <div class="demo-acessos">
          <b>Acessos de teste:</b><br>
          Dono: <code>admin@acaigo.demo</code> / <code>admin123</code><br>
          Revendedora aprovada: <code>maria@demo.com</code> / <code>1234</code><br>
          Cadastro pendente: <code>joao@demo.com</code> / <code>1234</code>
        </div>
      </div></div></div>`;
  }

  function telaCadastro() {
    const g = S.geo;
    return `<div class="fundo"><div class="caixa">
      ${marca(true)}
      <div class="painel">
        <h2>Solicitar cadastro</h2>
        <p class="sub">Preencha seus dados. Depois que o Açaí Go aprovar, você poderá entrar e fazer pedidos.</p>
        <form data-form="cadastro" novalidate>
          <label class="campo"><span>Nome completo *</span><input name="nome" autocomplete="name" required></label>
          <label class="campo"><span>Nome do negócio / ponto de venda *</span><input name="negocio" required></label>
          <div class="linha2">
            <label class="campo"><span>WhatsApp *</span><input name="whats" type="tel" autocomplete="tel" inputmode="tel" placeholder="(81) 9 0000-0000" required></label>
            <label class="campo"><span>CPF ou CNPJ</span><input name="doc" inputmode="numeric"></label>
          </div>
          <label class="campo"><span>E-mail (será seu login) *</span><input name="email" type="email" autocomplete="email" required></label>
          <label class="campo"><span>Crie uma senha *</span><input name="senha" type="password" autocomplete="new-password" minlength="4" required></label>
          <div class="linha2">
            <label class="campo"><span>Rua *</span><input name="rua" autocomplete="address-line1" required></label>
            <label class="campo"><span>Número *</span><input name="num" required></label>
          </div>
          <div class="linha2">
            <label class="campo"><span>Bairro *</span><input name="bairro" required></label>
            <label class="campo"><span>Ponto de referência</span><input name="ref"></label>
          </div>
          <div class="geo">
            <button class="btn btn--vidro btn--peq" type="button" data-acao="geo">📍 Usar minha localização atual</button>
            <p id="geoinfo">${g ? geoTxt(g) : "Ajuda a gente a achar você na hora da entrega. O navegador vai pedir sua permissão."}</p>
          </div>
          <label class="campo"><span>Observações</span><textarea name="obs" rows="2" placeholder="Ex.: horário de recebimento, onde vende"></textarea></label>
          <div class="aviso aviso--erro" id="cadErro" hidden></div>
          <button class="btn btn--ouro btn--bloco" type="submit">Enviar solicitação</button>
        </form>
        <p class="sub" style="margin:1rem 0 0"><button class="link" data-acao="ir-login" type="button">← Voltar para o login</button></p>
      </div></div></div>`;
  }
  const geoTxt = (g) => `✅ Localização capturada (${g.lat.toFixed(5)}, ${g.lng.toFixed(5)}) · precisão ~${Math.round(g.prec)} m`;

  function telaEnviado() {
    return `<div class="fundo"><div class="caixa">${marca(true)}<div class="painel">
      <h2>Solicitação enviada! 🎉</h2>
      <p class="sub">Recebemos seu cadastro. Assim que for aprovado, você já poderá entrar com seu e-mail e senha e fazer pedidos por aqui.</p>
      <div class="aviso aviso--ok">Status: aguardando aprovação</div>
      <button class="btn btn--ouro btn--bloco" data-acao="ir-login" type="button">Ir para o login</button>
    </div></div></div>`;
  }

  /* ---------- casca logada ---------- */
  function casca(u, abas, corpo) {
    return `<div class="fundo">
      <div class="topo"><div class="topo__in">${marca(false)}
        <div class="topo__quem"><b>${esc(u.nome)}</b><br>${u.tipo === "admin" ? "Painel do dono" : esc(u.negocio)}</div>
        <button class="btn btn--vidro btn--peq" data-acao="sair" type="button">Sair</button></div>
        <div class="abas" role="tablist">${abas.map(([id, t, n]) => `<button role="tab" aria-selected="${S.aba === id}" data-acao="aba" data-aba="${id}" type="button">${t}${n ? `<span class="n">${n}</span>` : ""}</button>`).join("")}</div>
      </div>
      <div class="conteudo">${corpo}</div></div>`;
  }

  const statusTxt = { novo: "Aguardando aceite", aceito: "Agendado", entregue: "Entregue", recusado: "Recusado", cancelado: "Cancelado" };
  function cardPedido(p, papel) {
    const rev = porId(p.revId) || {};
    let extra = "";
    if (p.status === "aceito") extra = `<p class="meta">📅 <b>Entrega agendada: ${esc(fmtDia(p.entrega))}</b></p>`;
    if (p.status === "entregue") extra = `<p class="meta">✅ Entregue (${esc(fmtDia(p.entrega))})</p>`;
    if (p.status === "recusado") extra = `<p class="meta">Motivo: ${esc(p.motivo || "não informado")}</p>`;
    let acoes = "";
    if (papel === "admin") {
      if (p.status === "novo") acoes = `<div><label for="d${p.id}">Entregar em</label><input type="date" id="d${p.id}" value="${maisDias(1)}" min="${hoje()}"></div>
        <button class="btn btn--ok btn--peq" data-acao="aceitar" data-id="${p.id}" type="button">Aceitar e agendar</button>
        <button class="btn btn--ruim btn--peq" data-acao="recusar" data-id="${p.id}" type="button">Recusar</button>`;
      if (p.status === "aceito") acoes = `<button class="btn btn--ok btn--peq" data-acao="entregue" data-id="${p.id}" type="button">Marcar como entregue</button>`;
    } else if (p.status === "novo") acoes = `<button class="btn btn--vidro btn--peq" data-acao="cancelar" data-id="${p.id}" type="button">Cancelar pedido</button>`;
    if (p.status === "aceito" || p.status === "entregue") acoes += `<button class="btn btn--vidro btn--peq" data-acao="nota" data-id="${p.id}" type="button">🧾 Ver nota</button>`;
    const quem = papel === "admin" ? `<p class="meta"><b>${esc(rev.negocio)}</b> · ${esc(rev.nome)} · <a href="https://wa.me/55${String(rev.whats || "").replace(/\D/g, "")}" target="_blank" rel="noopener">${esc(rev.whats)}</a><br>
      📍 ${esc(rev.endereco?.rua)}, ${esc(rev.endereco?.num)} — ${esc(rev.endereco?.bairro)}${rev.geo ? ` · <a href="https://www.google.com/maps?q=${rev.geo.lat},${rev.geo.lng}" target="_blank" rel="noopener">abrir no mapa</a>` : ""}</p>` : "";
    return `<article class="pedido"><div class="pedido__topo"><h3>Pedido #${p.num}</h3><span class="etq etq--${p.status}">${statusTxt[p.status]}</span></div>
      <p class="meta">${esc(fmtHora(p.criado))}</p>${quem}
      <ul>${p.itens.map((i) => `<li><span>${i.qtd}× ${esc(i.nome)}</span><span>${brl(i.qtd * i.preco)}</span></li>`).join("")}<li><b>Total</b><b>${brl(p.total)}</b></li></ul>
      ${p.obs ? `<p class="meta">Obs.: ${esc(p.obs)}</p>` : ""}${extra}
      ${acoes ? `<div class="pedido__acoes">${acoes}</div>` : ""}</article>`;
  }

  /* ---------- revendedor ---------- */
  function telaRev(u) {
    const meus = db.pedidos.filter((p) => p.revId === u.id).sort((a, b) => b.num - a.num);
    const ab = [["pedir", "Fazer pedido"], ["meus", "Meus pedidos", meus.filter((p) => p.status === "novo" || p.status === "aceito").length]];
    if (!S.aba) S.aba = "pedir";
    let corpo;
    if (S.aba === "pedir") {
      corpo = `<h2 style="font-size:1.8rem;margin-bottom:.3rem">Estoque disponível</h2>
        <p class="sub">Escolha as quantidades. Preços de revenda (fictícios no protótipo).</p>
        <div class="grade">${SABORES.map((s) => {
          const q = db.estoque[s.slug] || 0;
          const cls = q === 0 ? "zero" : q <= 10 ? "baixo" : "ok";
          return `<div class="cartao"><h3>${s.nome}</h3><p class="meta">${s.sub} · 300 ml</p>
            <p style="margin:.4rem 0"><b>${brl(db.precos[s.slug])}</b> <span class="meta">/ garrafa</span></p>
            <span class="estoque estoque--${cls}">${q === 0 ? "Esgotado" : q <= 10 ? `Últimas ${q}` : `${q} disponíveis`}</span>
            <div class="qtd"><button type="button" data-acao="qtd" data-s="${s.slug}" data-d="-1" aria-label="Menos ${s.nome}" ${q === 0 ? "disabled" : ""}>−</button>
              <input type="number" min="0" max="${q}" value="${S.cart[s.slug] || 0}" data-qtd="${s.slug}" aria-label="Quantidade de ${s.nome}" ${q === 0 ? "disabled" : ""}>
              <button type="button" data-acao="qtd" data-s="${s.slug}" data-d="1" aria-label="Mais ${s.nome}" ${q === 0 ? "disabled" : ""}>+</button></div></div>`;
        }).join("")}</div>
        <div class="resumo" id="resumo"></div>`;
    } else {
      corpo = meus.length ? meus.map((p) => cardPedido(p, "rev")).join("") : '<p class="vazio">Você ainda não fez pedidos.</p>';
    }
    return casca(u, ab, corpo);
  }

  function resumoHtml(u) {
    const itens = SABORES.filter((s) => (S.cart[s.slug] || 0) > 0);
    const total = itens.reduce((t, s) => t + S.cart[s.slug] * db.precos[s.slug], 0);
    const n = itens.reduce((t, s) => t + S.cart[s.slug], 0);
    return `<div class="resumo__linha"><b>${n ? `${n} garrafa${n > 1 ? "s" : ""}` : "Nenhum item"}</b><b>${brl(total)}</b></div>
      ${n ? `<p class="meta" style="margin:.3rem 0">${itens.map((s) => `${S.cart[s.slug]}× ${s.nome}`).join(" · ")}</p>` : ""}
      <p class="meta" style="margin:.3rem 0">Entrega em: ${esc(u.endereco.rua)}, ${esc(u.endereco.num)} — ${esc(u.endereco.bairro)}</p>
      <label class="campo" style="margin:.5rem 0"><span>Observação para a entrega</span><input id="obsPed" placeholder="Opcional"></label>
      <button class="btn btn--ouro btn--bloco" data-acao="enviar-pedido" type="button" ${n ? "" : "disabled"}>Enviar pedido</button>`;
  }

  /* ---------- admin ---------- */
  function telaAdmin(u) {
    const novos = db.pedidos.filter((p) => p.status === "novo");
    const pend = db.usuarios.filter((x) => x.tipo === "rev" && x.status === "pendente");
    const ab = [["pedidos", "Pedidos", novos.length], ["cadastros", "Cadastros", pend.length], ["estoque", "Estoque"]];
    if (!S.aba) S.aba = "pedidos";
    let corpo = "";
    const ord = (l) => l.sort((a, b) => b.num - a.num);
    if (S.aba === "pedidos") {
      const ag = db.pedidos.filter((p) => p.status === "aceito").sort((a, b) => a.entrega.localeCompare(b.entrega));
      const hist = ord(db.pedidos.filter((p) => ["entregue", "recusado", "cancelado"].includes(p.status)));
      corpo = `<h2 style="font-size:1.6rem;margin-bottom:.6rem">Novos pedidos</h2>${novos.length ? ord(novos.slice()).map((p) => cardPedido(p, "admin")).join("") : '<p class="vazio">Nenhum pedido novo.</p>'}
        <h2 style="font-size:1.6rem;margin:1.4rem 0 .6rem">Agendados</h2>${ag.length ? ag.map((p) => cardPedido(p, "admin")).join("") : '<p class="vazio">Nada agendado.</p>'}
        <h2 style="font-size:1.6rem;margin:1.4rem 0 .6rem">Histórico</h2>${hist.length ? hist.map((p) => cardPedido(p, "admin")).join("") : '<p class="vazio">Sem histórico.</p>'}`;
    } else if (S.aba === "cadastros") {
      const revs = db.usuarios.filter((x) => x.tipo === "rev").sort((a, b) => (a.status === "pendente" ? -1 : 1) - (b.status === "pendente" ? -1 : 1));
      corpo = revs.length ? revs.map((r) => `<article class="pedido cad"><div class="pedido__topo"><h3>${esc(r.negocio)}</h3><span class="etq etq--${r.status === "aprovado" ? "entregue" : r.status === "pendente" ? "novo" : "recusado"}">${r.status}</span></div>
        <dl><dt>Nome</dt><dd>${esc(r.nome)}</dd><dt>WhatsApp</dt><dd><a href="https://wa.me/55${r.whats.replace(/\D/g, "")}" target="_blank" rel="noopener">${esc(r.whats)}</a></dd>
        <dt>E-mail</dt><dd>${esc(r.email)}</dd>${r.doc ? `<dt>CPF/CNPJ</dt><dd>${esc(r.doc)}</dd>` : ""}
        <dt>Endereço</dt><dd>${esc(r.endereco.rua)}, ${esc(r.endereco.num)} — ${esc(r.endereco.bairro)}${r.endereco.ref ? ` (${esc(r.endereco.ref)})` : ""}</dd>
        <dt>Localização</dt><dd>${r.geo ? `<a href="https://www.google.com/maps?q=${r.geo.lat},${r.geo.lng}" target="_blank" rel="noopener">📍 ver no mapa</a> (±${Math.round(r.geo.prec)} m)` : "não informada"}</dd>
        ${r.obs ? `<dt>Obs.</dt><dd>${esc(r.obs)}</dd>` : ""}</dl>
        <div class="pedido__acoes">${r.status !== "aprovado" ? `<button class="btn btn--ok btn--peq" data-acao="aprovar" data-id="${r.id}" type="button">Aprovar</button>` : `<button class="btn btn--vidro btn--peq" data-acao="bloquear" data-id="${r.id}" type="button">Bloquear acesso</button>`}
        ${r.status === "pendente" ? `<button class="btn btn--ruim btn--peq" data-acao="recusar-cad" data-id="${r.id}" type="button">Recusar</button>` : ""}</div></article>`).join("") : '<p class="vazio">Nenhum cadastro ainda.</p>';
    } else {
      corpo = `<h2 style="font-size:1.6rem;margin-bottom:.3rem">Estoque e preços</h2><p class="sub">Os revendedores veem estes números na hora de pedir.</p>
        <div class="painel"><table class="tabela"><thead><tr><th>Sabor</th><th>Garrafas</th><th>Preço (R$)</th></tr></thead><tbody>
        ${SABORES.map((s) => `<tr><td>${s.nome}</td><td><input type="number" min="0" data-est="${s.slug}" value="${db.estoque[s.slug] || 0}" aria-label="Estoque de ${s.nome}"></td><td><input type="number" min="0" step="0.5" data-prec="${s.slug}" value="${db.precos[s.slug]}" aria-label="Preço de ${s.nome}"></td></tr>`).join("")}
        </tbody></table><p style="margin-top:1rem"><button class="btn btn--ouro" data-acao="salvar-estoque" type="button">Salvar estoque</button></p></div>`;
    }
    return casca(u, ab, corpo);
  }

  /* ---------- nota ---------- */
  function abrirNota(p) {
    const rev = porId(p.revId) || {};
    const el = document.createElement("div");
    el.className = "nota-fundo";
    el.innerHTML = `<div class="nota" role="dialog" aria-label="Nota do pedido ${p.num}">
      <h2>Açaí Go Gourmet</h2><p class="peq">Comprovante de pedido nº ${p.num} · ${esc(fmtHora(p.criado))}</p>
      <p style="margin-top:.8rem"><b>${esc(rev.negocio)}</b><br>${esc(rev.nome)} · ${esc(rev.whats)}<br>${esc(rev.endereco?.rua)}, ${esc(rev.endereco?.num)} — ${esc(rev.endereco?.bairro)}</p>
      <p style="margin-top:.5rem">Entrega: <b>${p.entrega ? esc(fmtDia(p.entrega)) : "a agendar"}</b> · ${statusTxt[p.status]}</p>
      <table><thead><tr><th>Item</th><th>Qtd</th><th>Unit.</th><th>Subtotal</th></tr></thead><tbody>
      ${p.itens.map((i) => `<tr><td>${esc(i.nome)} 300ml</td><td>${i.qtd}</td><td>${brl(i.preco)}</td><td>${brl(i.qtd * i.preco)}</td></tr>`).join("")}</tbody></table>
      <p class="tot">Total: ${brl(p.total)}</p>
      <p class="peq">Documento de controle, sem valor fiscal. Protótipo com valores fictícios.</p>
      <div class="nota__acoes"><button class="btn btn--ouro" type="button" data-fechar-nota>Fechar</button><button class="btn btn--vidro" type="button" onclick="window.print()" style="color:#222;box-shadow:inset 0 0 0 2px #999">Imprimir</button></div></div>`;
    el.addEventListener("click", (e) => { if (e.target === el || e.target.closest("[data-fechar-nota]")) el.remove(); });
    document.body.appendChild(el);
  }

  /* ---------- render ---------- */
  function render() {
    const u = usuario();
    if (u && u.tipo === "admin") $app.innerHTML = telaAdmin(u);
    else if (u && u.tipo === "rev") $app.innerHTML = telaRev(u);
    else $app.innerHTML = S.tela === "cadastro" ? telaCadastro() : S.tela === "enviado" ? telaEnviado() : telaLogin();
    const r = document.getElementById("resumo");
    if (r && u) r.innerHTML = resumoHtml(u);
    window.scrollTo(0, 0);
  }
  const atualizaResumo = () => { const u = usuario(), r = document.getElementById("resumo"); if (r && u) { const o = document.getElementById("obsPed"); const v = o ? o.value : ""; r.innerHTML = resumoHtml(u); if (v) document.getElementById("obsPed").value = v; } };

  /* ---------- ações ---------- */
  function setQtd(slug, v) {
    const max = db.estoque[slug] || 0;
    v = Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
    S.cart[slug] = v;
    const inp = $app.querySelector(`[data-qtd="${slug}"]`);
    if (inp) inp.value = v;
    atualizaResumo();
  }

  $app.addEventListener("input", (e) => { if (e.target.matches("[data-qtd]")) setQtd(e.target.dataset.qtd, e.target.value); });

  $app.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, tipo = f.dataset.form;
    const v = Object.fromEntries(new FormData(f).entries());
    if (tipo === "login") {
      const u = db.usuarios.find((x) => x.email.toLowerCase() === String(v.email).trim().toLowerCase() && x.senha === v.senha);
      S.avisoTipo = "aviso--erro";
      if (!u) { S.aviso = "E-mail ou senha incorretos."; return render(); }
      if (u.status === "pendente") { S.aviso = "Seu cadastro ainda está <b>aguardando aprovação</b>. Assim que for aprovado, você consegue entrar."; return render(); }
      if (u.status === "recusado") { S.aviso = "Seu cadastro não foi aprovado. Fale com o Açaí Go pelo WhatsApp."; return render(); }
      sessionStorage.setItem(SESS, u.id); S.aviso = ""; S.aba = ""; S.cart = {};
      return render();
    }
    if (tipo === "cadastro") {
      const erro = document.getElementById("cadErro");
      const falta = ["nome", "negocio", "whats", "email", "senha", "rua", "num", "bairro"].filter((k) => !String(v[k] || "").trim());
      let msg = "";
      if (falta.length) msg = "Preencha todos os campos marcados com *.";
      else if (!/^\S+@\S+\.\S+$/.test(v.email)) msg = "Digite um e-mail válido.";
      else if (String(v.senha).length < 4) msg = "A senha precisa ter pelo menos 4 caracteres.";
      else if (String(v.whats).replace(/\D/g, "").length < 10) msg = "Digite o WhatsApp com DDD.";
      else if (db.usuarios.some((x) => x.email.toLowerCase() === v.email.trim().toLowerCase())) msg = "Já existe um cadastro com este e-mail.";
      if (msg) { erro.textContent = msg; erro.hidden = false; erro.scrollIntoView({ block: "center" }); return; }
      db.usuarios.push({ id: "u" + Date.now(), tipo: "rev", email: v.email.trim(), senha: v.senha, nome: v.nome.trim(), negocio: v.negocio.trim(), doc: v.doc.trim(), whats: v.whats.trim(), endereco: { rua: v.rua.trim(), num: v.num.trim(), bairro: v.bairro.trim(), ref: v.ref.trim() }, geo: S.geo, obs: v.obs.trim(), status: "pendente", criado: Date.now() });
      salvar(); S.geo = null; S.tela = "enviado"; render();
    }
  });

  $app.addEventListener("click", (e) => {
    const b = e.target.closest("[data-acao]");
    if (!b) return;
    const a = b.dataset.acao, id = b.dataset.id;
    const u = usuario();
    switch (a) {
      case "ir-cadastro": S.tela = "cadastro"; S.aviso = ""; return render();
      case "ir-login": S.tela = "login"; S.aviso = ""; return render();
      case "sair": sessionStorage.removeItem(SESS); S.tela = "login"; S.aba = ""; S.aviso = ""; return render();
      case "aba": S.aba = b.dataset.aba; return render();
      case "geo": {
        const info = document.getElementById("geoinfo");
        if (!navigator.geolocation) { info.textContent = "Este navegador não permite localização. Preencha o endereço."; return; }
        info.textContent = "Buscando sua localização…";
        navigator.geolocation.getCurrentPosition(
          (p) => { S.geo = { lat: p.coords.latitude, lng: p.coords.longitude, prec: p.coords.accuracy, em: Date.now() }; info.textContent = geoTxt(S.geo); },
          (er) => { info.textContent = er.code === 1 ? "Permissão negada. Você pode continuar só com o endereço, ou liberar a localização no navegador e tentar de novo." : "Não consegui pegar a localização agora. Tente de novo ou continue só com o endereço."; },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
        return;
      }
      case "qtd": return setQtd(b.dataset.s, (S.cart[b.dataset.s] || 0) + Number(b.dataset.d));
      case "enviar-pedido": {
        const itens = SABORES.filter((s) => (S.cart[s.slug] || 0) > 0).map((s) => ({ slug: s.slug, nome: s.nome, qtd: S.cart[s.slug], preco: db.precos[s.slug] }));
        const sem = itens.find((i) => i.qtd > (db.estoque[i.slug] || 0));
        if (!itens.length) return;
        if (sem) { toast(`Só temos ${db.estoque[sem.slug]} de ${sem.nome}.`); return render(); }
        db.seq += 1;
        db.pedidos.push({ id: "p" + db.seq, num: db.seq, revId: u.id, itens, total: itens.reduce((t, i) => t + i.qtd * i.preco, 0), status: "novo", criado: Date.now(), entrega: null, obs: (document.getElementById("obsPed") || {}).value || "" });
        salvar(); S.cart = {}; S.aba = "meus"; render(); toast("Pedido enviado! Aguarde o aceite.");
        return;
      }
      case "cancelar": { const p = db.pedidos.find((x) => x.id === id); if (p && p.status === "novo" && confirm("Cancelar este pedido?")) { p.status = "cancelado"; salvar(); render(); } return; }
      case "nota": return abrirNota(db.pedidos.find((x) => x.id === id));
      case "aceitar": {
        const p = db.pedidos.find((x) => x.id === id);
        const d = document.getElementById("d" + id).value;
        if (!d) return toast("Escolha a data de entrega.");
        const sem = p.itens.find((i) => i.qtd > (db.estoque[i.slug] || 0));
        if (sem) return toast(`Estoque insuficiente de ${sem.nome} (${db.estoque[sem.slug] || 0}). Ajuste o estoque ou recuse.`);
        p.itens.forEach((i) => { db.estoque[i.slug] -= i.qtd; });
        p.status = "aceito"; p.entrega = d; salvar(); render(); toast(`Pedido #${p.num} agendado para ${fmtDia(d)}.`);
        return;
      }
      case "recusar": { const p = db.pedidos.find((x) => x.id === id); const m = prompt("Motivo da recusa (o revendedor vai ver):", "Sem estoque no momento"); if (m === null) return; p.status = "recusado"; p.motivo = m; salvar(); render(); return; }
      case "entregue": { const p = db.pedidos.find((x) => x.id === id); p.status = "entregue"; salvar(); render(); toast("Marcado como entregue."); return; }
      case "aprovar": porId(id).status = "aprovado"; salvar(); render(); return toast("Cadastro aprovado. A pessoa já pode entrar.");
      case "recusar-cad": porId(id).status = "recusado"; salvar(); render(); return;
      case "bloquear": if (confirm("Bloquear o acesso deste revendedor?")) { porId(id).status = "recusado"; salvar(); render(); } return;
      case "salvar-estoque":
        $app.querySelectorAll("[data-est]").forEach((i) => { db.estoque[i.dataset.est] = Math.max(0, Math.floor(Number(i.value) || 0)); });
        $app.querySelectorAll("[data-prec]").forEach((i) => { db.precos[i.dataset.prec] = Math.max(0, Number(i.value) || 0); });
        salvar(); return toast("Estoque e preços salvos.");
    }
  });

  document.getElementById("resetar").addEventListener("click", () => {
    if (!confirm("Apagar tudo e voltar aos dados de teste?")) return;
    db = semente(); salvar(); sessionStorage.removeItem(SESS); S.tela = "login"; S.aba = ""; S.cart = {}; S.aviso = ""; render(); toast("Dados de teste restaurados.");
  });

  render();
})();
