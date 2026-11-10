/* Portal do Revendedor Açaí Go — versão real (Firebase Auth + Firestore). */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, connectAuthEmulator, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, where, runTransaction, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const isoDia = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
const hoje = () => isoDia(new Date());
const maisDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return isoDia(d); };
const fmtDia = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
const ms = (t) => (t && t.toMillis ? t.toMillis() : Date.now());
const fmtHora = (t) => new Date(ms(t)).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const soNum = (s) => String(s || "").replace(/\D/g, "");

/* Produtos (sabor + tamanho em ml) ficam no Firestore, coleção "produtos". Esta lista só semeia o catálogo na 1ª vez. */
const SEMENTE = ["Abacaxi", "Maracujá", "Morango", "Paçoca", "Trufado"].map((nome) => ({ nome, ml: 300, preco: 0, estoque: 0, ativo: true }));
const rotulo = (p) => `${p.nome} ${p.ml} ml`;
const ordenar = (l) => l.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR") || a.ml - b.ml);

function toast(t) {
  const el = document.getElementById("toast");
  el.textContent = t; el.classList.add("on");
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 3200);
}
const marca = (link) => `<${link ? 'a href="../index.html"' : "div"} class="marca"><img src="../img/logo.png" alt=""><span><b>Açaí<i>Go</i> PE</b><small>Portal do revendedor</small></span></${link ? "a" : "div"}>`;

/* ---------- Firebase ---------- */
const emulador = ["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).has("emulador");
const configurado = emulador || !Object.values(firebaseConfig).some((v) => String(v).includes("COLE_AQUI"));
if (!configurado) {
  $app.innerHTML = `<div class="fundo"><div class="caixa">${marca(true)}<div class="painel"><h2>Quase lá</h2>
    <p class="sub">O banco de dados ainda não foi ligado. Siga o passo a passo do arquivo <b>backend/LEIA-ME.md</b> e cole a configuração do Firebase em <code>portal/firebase-config.js</code>.</p></div></div></div>`;
  throw new Error("Firebase não configurado");
}
const app = initializeApp(emulador ? { apiKey: "demo", projectId: "demo-acaigo", appId: "demo" } : firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
if (emulador) { connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true }); connectFirestoreEmulator(db, "127.0.0.1", 8186); }

/* ---------- estado ---------- */
const S = { tela: location.hash === "#cadastro" ? "cadastro" : "login", aba: "", cart: {}, geo: null, aviso: "", avisoTipo: "", obs: "", datas: {}, uid: null };
const D = { me: null, produtos: [], pedidos: [], usuarios: [], pronto: false };
const prod = (id) => D.produtos.find((x) => x.id === id);
let unsubs = [];
let pendente = false;
let jaCarregouPedidos = false;

function parar() { unsubs.forEach((u) => u()); unsubs = []; D.me = null; D.produtos = []; D.pedidos = []; D.usuarios = []; D.pronto = false; jaCarregouPedidos = false; }

function ouvir(u) {
  const uid = u.uid;
  unsubs.push(onSnapshot(doc(db, "usuarios", uid), (s) => {
    D.me = s.exists() ? { id: uid, ...s.data() } : null;
    D.pronto = true;
    if (D.me && D.me.status === "aprovado" && !D._lig) { D._lig = true; ligarDados(); }
    render(false);
  }, () => { D.pronto = true; render(false); }));
}

function ligarDados() {
  const admin = D.me.tipo === "admin";
  const erro = (e) => console.warn("Firestore:", e.code);
  if (admin) getDoc(doc(db, "contador", "pedidos")).then((c) => { if (!c.exists()) return setDoc(doc(db, "contador", "pedidos"), { n: 1000 }); }).catch(erro);
  unsubs.push(onSnapshot(collection(db, "produtos"), async (s) => {
    if (s.empty && !s.metadata.fromCache && admin && !D._semeou) {
      D._semeou = true;
      const w = writeBatch(db); SEMENTE.forEach((p) => w.set(doc(collection(db, "produtos")), { ...p, criado: serverTimestamp() })); await w.commit().catch(erro); return;
    }
    D.produtos = s.docs.map((d) => ({ id: d.id, ...d.data() })); render(false);
  }, erro));
  const q = admin ? collection(db, "pedidos") : query(collection(db, "pedidos"), where("revId", "==", D.me.id));
  unsubs.push(onSnapshot(q, (s) => {
    if (admin && jaCarregouPedidos) s.docChanges().forEach((c) => { if (c.type === "added" && !c.doc.metadata.hasPendingWrites) { toast(`🔔 Novo pedido de ${c.doc.data().revNegocio}`); try { navigator.vibrate && navigator.vibrate(200); } catch (e) {} } });
    if (!admin && jaCarregouPedidos) s.docChanges().forEach((c) => { if (c.type === "modified" && !c.doc.metadata.hasPendingWrites) toast(`Pedido #${c.doc.data().num}: ${statusTxt[c.doc.data().status]}`); });
    jaCarregouPedidos = true;
    D.pedidos = s.docs.map((d) => ({ id: d.id, ...d.data() })); render(false);
  }, erro));
  if (admin) unsubs.push(onSnapshot(collection(db, "usuarios"), (s) => { D.usuarios = s.docs.map((d) => ({ id: d.id, ...d.data() })); render(false); }, erro));
}

onAuthStateChanged(auth, (u) => {
  parar(); D._lig = false;
  if (u) { S.uid = u.uid; ouvir(u); } else { S.uid = null; D.pronto = true; render(true); }
});

/* ---------- telas ---------- */
const errosAuth = {
  "auth/invalid-credential": "E-mail ou senha incorretos.", "auth/wrong-password": "E-mail ou senha incorretos.", "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/invalid-email": "E-mail inválido.", "auth/email-already-in-use": "Já existe um cadastro com este e-mail.", "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente de novo.", "auth/network-request-failed": "Sem conexão com a internet."
};
const msgErro = (e) => errosAuth[e.code] || "Algo deu errado. Tente de novo.";

function telaLogin() {
  return `<div class="fundo"><div class="caixa">${marca(true)}<div class="painel">
    <h2>Entrar</h2><p class="sub">Acesso exclusivo para revendedores aprovados.</p>
    ${S.aviso ? `<div class="aviso ${S.avisoTipo}">${esc(S.aviso)}</div>` : ""}
    <form data-form="login" novalidate>
      <label class="campo"><span>E-mail</span><input name="email" type="email" autocomplete="username" required></label>
      <label class="campo"><span>Senha</span><input name="senha" type="password" autocomplete="current-password" required></label>
      <button class="btn btn--ouro btn--bloco" type="submit">Entrar</button>
    </form>
    <p class="sub" style="margin:1rem 0 .3rem"><button class="link" data-acao="esqueci" type="button">Esqueci minha senha</button></p>
    <p class="sub" style="margin:0">Ainda não é revendedor? <button class="link" data-acao="ir-cadastro" type="button">Solicitar cadastro</button></p>
  </div></div></div>`;
}
const geoTxt = (g) => `✅ Localização capturada (${g.lat.toFixed(5)}, ${g.lng.toFixed(5)}) · precisão ~${Math.round(g.prec)} m`;
function telaCadastro() {
  return `<div class="fundo"><div class="caixa">${marca(true)}<div class="painel">
    <h2>Solicitar cadastro</h2><p class="sub">Preencha seus dados. Depois que o Açaí Go aprovar, você poderá fazer pedidos por aqui.</p>
    <form data-form="cadastro" novalidate>
      <label class="campo"><span>Nome completo *</span><input name="nome" autocomplete="name" required></label>
      <label class="campo"><span>Nome do negócio / ponto de venda *</span><input name="negocio" required></label>
      <div class="linha2">
        <label class="campo"><span>WhatsApp *</span><input name="whats" type="tel" autocomplete="tel" inputmode="tel" placeholder="(81) 9 0000-0000" required></label>
        <label class="campo"><span>CPF ou CNPJ</span><input name="doc" inputmode="numeric"></label>
      </div>
      <label class="campo"><span>E-mail (será seu login) *</span><input name="email" type="email" autocomplete="email" required></label>
      <label class="campo"><span>Crie uma senha (mín. 6) *</span><input name="senha" type="password" autocomplete="new-password" minlength="6" required></label>
      <div class="linha2">
        <label class="campo"><span>Rua *</span><input name="rua" autocomplete="address-line1" required></label>
        <label class="campo"><span>Número *</span><input name="num" required></label>
      </div>
      <div class="linha2">
        <label class="campo"><span>Bairro *</span><input name="bairro" required></label>
        <label class="campo"><span>Ponto de referência</span><input name="ref"></label>
      </div>
      <div class="geo"><button class="btn btn--vidro btn--peq" type="button" data-acao="geo">📍 Usar minha localização atual</button>
        <p id="geoinfo">${S.geo ? geoTxt(S.geo) : "Ajuda a gente a achar você na hora da entrega. O navegador vai pedir sua permissão."}</p></div>
      <label class="campo"><span>Observações</span><textarea name="obs" rows="2" placeholder="Ex.: horário de recebimento, onde vende"></textarea></label>
      <label class="campo" style="display:flex;gap:.6rem;align-items:flex-start"><input type="checkbox" name="lgpd" style="width:22px;height:22px;margin-top:.1rem;flex:none">
        <span style="font-weight:500">Concordo que o Açaí Go use meus dados (nome, contato, endereço, localização e CPF/CNPJ, se informado) apenas para meu cadastro, pedidos e entregas. Posso pedir a correção ou a exclusão deles a qualquer momento, falando com o Açaí Go.</span></label>
      <div class="aviso aviso--erro" id="cadErro" hidden></div>
      <button class="btn btn--ouro btn--bloco" type="submit" id="cadBtn">Enviar solicitação</button>
    </form>
    <p class="sub" style="margin:1rem 0 0"><button class="link" data-acao="ir-login" type="button">← Voltar para o login</button></p>
  </div></div></div>`;
}
function telaEspera(me) {
  const recusado = me.status === "recusado";
  return `<div class="fundo"><div class="caixa">${marca(true)}<div class="painel">
    <h2>${recusado ? "Cadastro não aprovado" : "Cadastro enviado! 🎉"}</h2>
    <p class="sub">${recusado ? "Fale com o Açaí Go pelo WhatsApp para entender o motivo." : `Olá, ${esc(me.nome)}! Seu cadastro está <b>aguardando aprovação</b>. Assim que for aprovado, esta tela libera sozinha e você já pode fazer pedidos.`}</p>
    <div class="aviso ${recusado ? "aviso--erro" : "aviso--ok"}">Status: ${recusado ? "não aprovado" : "aguardando aprovação"}</div>
    <button class="btn btn--vidro btn--bloco" data-acao="sair" type="button">Sair</button></div></div></div>`;
}
function telaCarregando() { return `<div class="fundo"><div class="caixa">${marca(true)}<p class="sub">Carregando…</p></div></div>`; }
function telaSemPerfil() {
  return `<div class="fundo"><div class="caixa">${marca(true)}<div class="painel"><h2>Perfil não encontrado</h2><p class="sub">Esta conta não tem cadastro de revendedor. Peça um cadastro ao Açaí Go.</p><button class="btn btn--vidro btn--bloco" data-acao="sair" type="button">Sair</button></div></div></div>`;
}

function casca(u, abas, corpo) {
  return `<div class="fundo"><div class="topo"><div class="topo__in">${marca(false)}
    <div class="topo__quem"><b>${esc(u.nome)}</b><br>${u.tipo === "admin" ? "Painel do dono" : esc(u.negocio)}</div>
    <button class="btn btn--vidro btn--peq" data-acao="sair" type="button">Sair</button></div>
    <div class="abas" role="tablist">${abas.map(([id, t, n]) => `<button role="tab" aria-selected="${S.aba === id}" data-acao="aba" data-aba="${id}" type="button">${t}${n ? `<span class="n">${n}</span>` : ""}</button>`).join("")}</div></div>
    <div class="conteudo">${corpo}</div></div>`;
}

const statusTxt = { novo: "Aguardando aceite", aceito: "Agendado", entregue: "Entregue", recusado: "Recusado", cancelado: "Cancelado" };
function cardPedido(p, papel) {
  let extra = "";
  if (p.status === "aceito") extra = `<p class="meta">📅 <b>Entrega agendada: ${esc(fmtDia(p.entrega))}</b></p>`;
  if (p.status === "entregue") extra = `<p class="meta">✅ Entregue (${esc(fmtDia(p.entrega))})</p>`;
  if (p.status === "recusado") extra = `<p class="meta">Motivo: ${esc(p.motivo || "não informado")}</p>`;
  let acoes = "";
  if (papel === "admin") {
    if (p.status === "novo") acoes = `<div><label for="d${p.id}">Entregar em</label><input type="date" id="d${p.id}" data-data="${p.id}" value="${S.datas[p.id] || maisDias(1)}" min="${hoje()}"></div>
      <button class="btn btn--ok btn--peq" data-acao="aceitar" data-id="${p.id}" type="button">Aceitar e agendar</button>
      <button class="btn btn--ruim btn--peq" data-acao="recusar" data-id="${p.id}" type="button">Recusar</button>`;
    if (p.status === "aceito") acoes = `<button class="btn btn--ok btn--peq" data-acao="entregue" data-id="${p.id}" type="button">Marcar como entregue</button>
      <button class="btn btn--vidro btn--peq" data-acao="desfazer" data-id="${p.id}" type="button">Cancelar e devolver ao estoque</button>`;
  } else if (p.status === "novo") acoes = `<button class="btn btn--vidro btn--peq" data-acao="cancelar" data-id="${p.id}" type="button">Cancelar pedido</button>`;
  if (p.status === "aceito" || p.status === "entregue") acoes += `<button class="btn btn--vidro btn--peq" data-acao="nota" data-id="${p.id}" type="button">🧾 Ver nota</button>`;
  const rev = D.usuarios.find((x) => x.id === p.revId);
  const quem = papel === "admin" ? `<p class="meta"><b>${esc(p.revNegocio)}</b> · ${esc(p.revNome)}${rev ? ` · <a href="https://wa.me/55${soNum(rev.whats)}" target="_blank" rel="noopener">${esc(rev.whats)}</a><br>📍 ${esc(rev.endereco?.rua)}, ${esc(rev.endereco?.num)} — ${esc(rev.endereco?.bairro)}${rev.geo ? ` · <a href="https://www.google.com/maps?q=${rev.geo.lat},${rev.geo.lng}" target="_blank" rel="noopener">abrir no mapa</a>` : ""}` : ""}</p>` : "";
  return `<article class="pedido"><div class="pedido__topo"><h3>Pedido #${p.num}</h3><span class="etq etq--${p.status}">${statusTxt[p.status]}</span></div>
    <p class="meta">${esc(fmtHora(p.criado))}</p>${quem}
    <ul>${p.itens.map((i) => `<li><span>${i.qtd}× ${esc(i.nome)}${i.ml ? ` ${i.ml} ml` : ""}</span><span>${brl(i.qtd * i.preco)}</span></li>`).join("")}<li><b>Total</b><b>${brl(p.total)}</b></li></ul>
    ${p.obs ? `<p class="meta">Obs.: ${esc(p.obs)}</p>` : ""}${extra}${acoes ? `<div class="pedido__acoes">${acoes}</div>` : ""}</article>`;
}
const porNum = (a, b) => b.num - a.num;

function telaRev(u) {
  const meus = D.pedidos.slice().sort(porNum);
  const ab = [["pedir", "Fazer pedido"], ["meus", "Meus pedidos", meus.filter((p) => p.status === "novo" || p.status === "aceito").length]];
  if (!S.aba) S.aba = "pedir";
  let corpo;
  if (S.aba === "pedir") {
    corpo = `<h2 style="font-size:1.8rem;margin-bottom:.3rem">Estoque disponível</h2><p class="sub">Escolha as quantidades. O estoque é atualizado em tempo real.</p>
      ${ordenar(D.produtos.filter((p) => p.ativo !== false)).length ? "" : '<p class="vazio">Nenhum produto disponível no momento.</p>'}
      <div class="grade">${ordenar(D.produtos.filter((p) => p.ativo !== false)).map((s) => {
        const q = Number(s.estoque || 0), pr = Number(s.preco || 0);
        const cls = q === 0 ? "zero" : q <= 10 ? "baixo" : "ok";
        const off = q === 0 || !pr ? "disabled" : "";
        return `<div class="cartao"><h3>${esc(s.nome)}</h3><p class="meta">${esc(s.ml)} ml</p>
          <p style="margin:.4rem 0">${pr ? `<b>${brl(pr)}</b> <span class="meta">/ unidade</span>` : '<span class="meta">preço a combinar</span>'}</p>
          <span class="estoque estoque--${cls}">${q === 0 ? "Esgotado" : q <= 10 ? `Últimas ${q}` : `${q} disponíveis`}</span>
          <div class="qtd"><button type="button" data-acao="qtd" data-s="${s.id}" data-d="-1" aria-label="Menos ${esc(rotulo(s))}" ${off}>−</button>
          <input type="number" min="0" max="${q}" value="${Math.min(S.cart[s.id] || 0, q)}" data-qtd="${s.id}" aria-label="Quantidade de ${esc(rotulo(s))}" ${off}>
          <button type="button" data-acao="qtd" data-s="${s.id}" data-d="1" aria-label="Mais ${esc(rotulo(s))}" ${off}>+</button></div></div>`;
      }).join("")}</div><div class="resumo" id="resumo">${resumoHtml(u)}</div>`;
  } else corpo = meus.length ? meus.map((p) => cardPedido(p, "rev")).join("") : '<p class="vazio">Você ainda não fez pedidos.</p>';
  return casca(u, ab, corpo);
}
function resumoHtml(u) {
  const itens = D.produtos.filter((s) => (S.cart[s.id] || 0) > 0);
  const total = itens.reduce((t, s) => t + S.cart[s.id] * Number(s.preco || 0), 0);
  const n = itens.reduce((t, s) => t + S.cart[s.id], 0);
  return `<div class="resumo__linha"><b>${n ? `${n} unidade${n > 1 ? "s" : ""}` : "Nenhum item"}</b><b>${brl(total)}</b></div>
    ${n ? `<p class="meta" style="margin:.3rem 0">${itens.map((s) => `${S.cart[s.id]}× ${esc(rotulo(s))}`).join(" · ")}</p>` : ""}
    <p class="meta" style="margin:.3rem 0">Entrega em: ${esc(u.endereco.rua)}, ${esc(u.endereco.num)} — ${esc(u.endereco.bairro)}</p>
    <label class="campo" style="margin:.5rem 0"><span>Observação para a entrega</span><input id="obsPed" value="${esc(S.obs)}" placeholder="Opcional"></label>
    <button class="btn btn--ouro btn--bloco" data-acao="enviar-pedido" type="button" ${n ? "" : "disabled"}>Enviar pedido</button>`;
}

function telaAdmin(u) {
  const novos = D.pedidos.filter((p) => p.status === "novo");
  const pend = D.usuarios.filter((x) => x.tipo === "rev" && x.status === "pendente");
  const ab = [["pedidos", "Pedidos", novos.length], ["cadastros", "Cadastros", pend.length], ["estoque", "Estoque"]];
  if (!S.aba) S.aba = "pedidos";
  document.title = (novos.length + pend.length ? `(${novos.length + pend.length}) ` : "") + "Portal do Revendedor | Açaí Go PE";
  let corpo = "";
  if (S.aba === "pedidos") {
    const ag = D.pedidos.filter((p) => p.status === "aceito").sort((a, b) => a.entrega.localeCompare(b.entrega));
    const hist = D.pedidos.filter((p) => ["entregue", "recusado", "cancelado"].includes(p.status)).sort(porNum);
    const bloco = (t, l, v) => `<h2 style="font-size:1.6rem;margin:1.2rem 0 .6rem">${t}</h2>${l.length ? l.map((p) => cardPedido(p, "admin")).join("") : `<p class="vazio">${v}</p>`}`;
    corpo = bloco("Novos pedidos", novos.slice().sort(porNum), "Nenhum pedido novo.") + bloco("Agendados", ag, "Nada agendado.") + bloco("Histórico", hist, "Sem histórico.");
  } else if (S.aba === "cadastros") {
    const revs = D.usuarios.filter((x) => x.tipo === "rev").sort((a, b) => (a.status === "pendente" ? -1 : 1) - (b.status === "pendente" ? -1 : 1));
    corpo = revs.length ? revs.map((r) => `<article class="pedido cad"><div class="pedido__topo"><h3>${esc(r.negocio)}</h3><span class="etq etq--${r.status === "aprovado" ? "entregue" : r.status === "pendente" ? "novo" : "recusado"}">${r.status}</span></div>
      <dl><dt>Nome</dt><dd>${esc(r.nome)}</dd><dt>WhatsApp</dt><dd><a href="https://wa.me/55${soNum(r.whats)}" target="_blank" rel="noopener">${esc(r.whats)}</a></dd>
      <dt>E-mail</dt><dd>${esc(r.email)}</dd>${r.doc ? `<dt>CPF/CNPJ</dt><dd>${esc(r.doc)}</dd>` : ""}
      <dt>Endereço</dt><dd>${esc(r.endereco?.rua)}, ${esc(r.endereco?.num)} — ${esc(r.endereco?.bairro)}${r.endereco?.ref ? ` (${esc(r.endereco.ref)})` : ""}</dd>
      <dt>Localização</dt><dd>${r.geo ? `<a href="https://www.google.com/maps?q=${r.geo.lat},${r.geo.lng}" target="_blank" rel="noopener">📍 ver no mapa</a> (±${Math.round(r.geo.prec)} m)` : "não informada"}</dd>${r.obs ? `<dt>Obs.</dt><dd>${esc(r.obs)}</dd>` : ""}</dl>
      <div class="pedido__acoes">${r.status !== "aprovado" ? `<button class="btn btn--ok btn--peq" data-acao="aprovar" data-id="${r.id}" type="button">Aprovar</button>` : `<button class="btn btn--vidro btn--peq" data-acao="bloquear" data-id="${r.id}" type="button">Bloquear acesso</button>`}
      ${r.status === "pendente" ? `<button class="btn btn--ruim btn--peq" data-acao="recusar-cad" data-id="${r.id}" type="button">Recusar</button>` : ""}</div></article>`).join("") : '<p class="vazio">Nenhum cadastro ainda.</p>';
  } else {
    corpo = `<h2 style="font-size:1.6rem;margin-bottom:.3rem">Produtos, estoque e preços</h2><p class="sub">Cada linha é um produto (sabor + tamanho). Cada alteração é salva ao sair do campo e os revendedores veem na hora. Produto desativado some para eles, mas continua nos pedidos antigos.</p>
      <div class="painel" style="overflow-x:auto"><table class="tabela"><thead><tr><th>Sabor</th><th>ml</th><th>Estoque</th><th>Preço (R$)</th><th>Ativo</th></tr></thead><tbody>
      ${ordenar(D.produtos).map((s) => `<tr data-prod="${s.id}"><td><input style="width:130px" type="text" data-campo="nome" value="${esc(s.nome)}" aria-label="Sabor"></td>
        <td><input type="number" min="1" data-campo="ml" value="${Number(s.ml || 0)}" aria-label="Tamanho em ml"></td>
        <td><input type="number" min="0" data-campo="estoque" value="${Number(s.estoque || 0)}" aria-label="Estoque de ${esc(rotulo(s))}"></td>
        <td><input type="number" min="0" step="0.5" data-campo="preco" value="${Number(s.preco || 0)}" aria-label="Preço de ${esc(rotulo(s))}"></td>
        <td><input type="checkbox" data-campo="ativo" ${s.ativo !== false ? "checked" : ""} style="width:22px;height:22px" aria-label="Ativo"></td></tr>`).join("")}
      </tbody></table></div>
      <div class="painel"><h2 style="font-size:1.3rem">Adicionar produto</h2><p class="sub">O mesmo sabor pode ter tamanhos diferentes (ex.: Morango 300 ml e Morango 500 ml).</p>
        <form data-form="produto" novalidate><div class="linha2"><label class="campo"><span>Sabor *</span><input name="nome" required placeholder="Ex.: Morango"></label>
          <label class="campo"><span>Tamanho (ml) *</span><input name="ml" type="number" min="1" list="mls" required placeholder="300"><datalist id="mls"><option value="200"><option value="300"><option value="500"><option value="1000"></datalist></label></div>
          <div class="linha2"><label class="campo"><span>Preço (R$)</span><input name="preco" type="number" min="0" step="0.5" placeholder="0,00"></label>
          <label class="campo"><span>Estoque inicial</span><input name="estoque" type="number" min="0" placeholder="0"></label></div>
          <div class="aviso aviso--erro" id="prodErro" hidden></div>
          <button class="btn btn--ouro" type="submit">Adicionar produto</button></form></div>`;
  }
  return casca(u, ab, corpo);
}

function abrirNota(p) {
  const rev = D.usuarios.find((x) => x.id === p.revId) || D.me;
  const el = document.createElement("div");
  el.className = "nota-fundo";
  el.innerHTML = `<div class="nota" role="dialog" aria-label="Nota do pedido ${p.num}"><h2>Açaí Go Gourmet</h2><p class="peq">Comprovante de pedido nº ${p.num} · ${esc(fmtHora(p.criado))}</p>
    <p style="margin-top:.8rem"><b>${esc(p.revNegocio)}</b><br>${esc(p.revNome)}${rev ? ` · ${esc(rev.whats)}<br>${esc(rev.endereco?.rua)}, ${esc(rev.endereco?.num)} — ${esc(rev.endereco?.bairro)}` : ""}</p>
    <p style="margin-top:.5rem">Entrega: <b>${p.entrega ? esc(fmtDia(p.entrega)) : "a agendar"}</b> · ${statusTxt[p.status]}</p>
    <table><thead><tr><th>Item</th><th>Qtd</th><th>Unit.</th><th>Subtotal</th></tr></thead><tbody>${p.itens.map((i) => `<tr><td>${esc(i.nome)}${i.ml ? ` ${i.ml}ml` : ""}</td><td>${i.qtd}</td><td>${brl(i.preco)}</td><td>${brl(i.qtd * i.preco)}</td></tr>`).join("")}</tbody></table>
    <p class="tot">Total: ${brl(p.total)}</p><p class="peq">Documento de controle, sem valor fiscal.</p>
    <div class="nota__acoes"><button class="btn btn--ouro" type="button" data-fechar-nota>Fechar</button><button class="btn btn--vidro" type="button" onclick="window.print()" style="color:#222;box-shadow:inset 0 0 0 2px #999">Imprimir</button></div></div>`;
  el.addEventListener("click", (e) => { if (e.target === el || e.target.closest("[data-fechar-nota]")) el.remove(); });
  document.body.appendChild(el);
}

/* ---------- render ---------- */
function render(topo = true) {
  const ativo = document.activeElement;
  if (!topo && ativo && $app.contains(ativo) && ativo.matches("input,textarea,select")) { pendente = true; return; }
  pendente = false;
  let html;
  if (!S.uid) html = S.tela === "cadastro" ? telaCadastro() : telaLogin();
  else if (!D.pronto) html = telaCarregando();
  else if (!D.me) html = S.criando ? telaCarregando() : telaSemPerfil();
  else if (D.me.status !== "aprovado") html = telaEspera(D.me);
  else html = D.me.tipo === "admin" ? telaAdmin(D.me) : telaRev(D.me);
  const y = window.scrollY;
  $app.innerHTML = html;
  window.scrollTo(0, topo ? 0 : y);
}
$app.addEventListener("focusout", () => { if (pendente) setTimeout(() => { if (pendente && !($app.contains(document.activeElement) && document.activeElement.matches("input,textarea,select"))) render(false); }, 50); });

function setQtd(slug, v) {
  const max = Number((prod(slug) || {}).estoque || 0);
  v = Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  S.cart[slug] = v;
  const inp = $app.querySelector(`[data-qtd="${slug}"]`); if (inp) inp.value = v;
  const r = document.getElementById("resumo"); if (r && D.me) { const f = document.activeElement; r.innerHTML = resumoHtml(D.me); if (f && f.id === "obsPed") document.getElementById("obsPed").focus(); }
}
$app.addEventListener("input", (e) => {
  if (e.target.matches("[data-qtd]")) setQtd(e.target.dataset.qtd, e.target.value);
  if (e.target.id === "obsPed") S.obs = e.target.value;
  if (e.target.matches("[data-data]")) S.datas[e.target.dataset.data] = e.target.value;
});

/* ---------- ações ---------- */
$app.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, tipo = f.dataset.form;
  const v = Object.fromEntries(new FormData(f).entries());
  const btn = f.querySelector("[type=submit]");
  if (tipo === "login") {
    btn.disabled = true;
    try { await signInWithEmailAndPassword(auth, String(v.email).trim(), v.senha); S.aviso = ""; S.aba = ""; S.cart = {}; }
    catch (er) { S.aviso = msgErro(er); S.avisoTipo = "aviso--erro"; btn.disabled = false; render(true); }
    return;
  }
  if (tipo === "produto") {
    const erro = document.getElementById("prodErro");
    const nome = String(v.nome || "").trim(), ml = Math.floor(Number(v.ml));
    if (!nome || !(ml > 0)) { erro.textContent = "Informe o sabor e o tamanho em ml."; erro.hidden = false; return; }
    if (D.produtos.some((p) => p.nome.toLowerCase() === nome.toLowerCase() && Number(p.ml) === ml)) { erro.textContent = `Já existe ${nome} ${ml} ml.`; erro.hidden = false; return; }
    btn.disabled = true;
    try {
      await setDoc(doc(collection(db, "produtos")), { nome, ml, preco: Math.max(0, Number(v.preco) || 0), estoque: Math.max(0, Math.floor(Number(v.estoque) || 0)), ativo: true, criado: serverTimestamp() });
      toast(`${nome} ${ml} ml adicionado.`); f.reset();
    } catch (er) { erro.textContent = "Não consegui adicionar. Tente de novo."; erro.hidden = false; }
    btn.disabled = false;
    return;
  }
  if (tipo === "cadastro") {
    const erro = document.getElementById("cadErro");
    const falta = ["nome", "negocio", "whats", "email", "senha", "rua", "num", "bairro"].filter((k) => !String(v[k] || "").trim());
    let msg = "";
    if (falta.length) msg = "Preencha todos os campos marcados com *.";
    else if (!/^\S+@\S+\.\S+$/.test(v.email)) msg = "Digite um e-mail válido.";
    else if (String(v.senha).length < 6) msg = "A senha precisa ter pelo menos 6 caracteres.";
    else if (soNum(v.whats).length < 10) msg = "Digite o WhatsApp com DDD.";
    else if (!v.lgpd) msg = "Marque a caixa de concordância para enviar o cadastro.";
    if (msg) { erro.textContent = msg; erro.hidden = false; erro.scrollIntoView({ block: "center" }); return; }
    btn.disabled = true; S.criando = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, v.email.trim(), v.senha);
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        tipo: "rev", status: "pendente", nome: v.nome.trim(), negocio: v.negocio.trim(), doc: v.doc.trim(), whats: v.whats.trim(), email: v.email.trim(),
        endereco: { rua: v.rua.trim(), num: v.num.trim(), bairro: v.bairro.trim(), ref: v.ref.trim() }, geo: S.geo, obs: v.obs.trim(), consentimento: serverTimestamp(), criado: serverTimestamp()
      });
      S.geo = null;
    } catch (er) { erro.textContent = msgErro(er); erro.hidden = false; btn.disabled = false; }
    S.criando = false;
  }
});

/* admin: edição de produto salva ao sair do campo */
$app.addEventListener("change", async (e) => {
  const el = e.target, linha = el.closest("[data-prod]");
  if (!linha || !el.dataset.campo || !D.me || D.me.tipo !== "admin") return;
  const c = el.dataset.campo; let v;
  if (c === "nome") { v = el.value.trim(); if (!v) { toast("O sabor não pode ficar vazio."); return render(false); } }
  else if (c === "ml") { v = Math.floor(Number(el.value)); if (!(v > 0)) { toast("Informe o tamanho em ml."); return render(false); } }
  else if (c === "estoque") v = Math.max(0, Math.floor(Number(el.value) || 0));
  else if (c === "preco") v = Math.max(0, Number(el.value) || 0);
  else if (c === "ativo") v = el.checked;
  try { await updateDoc(doc(db, "produtos", linha.dataset.prod), { [c]: v }); toast("Salvo ✓"); }
  catch (er) { toast("Não consegui salvar. Tente de novo."); }
});

$app.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-acao]");
  if (!b) return;
  const a = b.dataset.acao, id = b.dataset.id, u = D.me;
  const pedido = () => D.pedidos.find((x) => x.id === id);
  try {
    switch (a) {
      case "ir-cadastro": S.tela = "cadastro"; S.aviso = ""; return render(true);
      case "ir-login": S.tela = "login"; S.aviso = ""; return render(true);
      case "sair": S.tela = "login"; S.aba = ""; S.aviso = ""; await signOut(auth); document.title = "Portal do Revendedor | Açaí Go PE"; return;
      case "esqueci": {
        const em = (document.querySelector("[name=email]") || {}).value;
        if (!em) { S.aviso = "Digite seu e-mail no campo acima e toque em “Esqueci minha senha”."; S.avisoTipo = ""; return render(true); }
        await sendPasswordResetEmail(auth, em.trim()).catch(() => {});
        S.aviso = "Se esse e-mail tiver cadastro, enviamos um link para criar uma nova senha."; S.avisoTipo = "aviso--ok"; return render(true);
      }
      case "aba": S.aba = b.dataset.aba; return render(true);
      case "geo": {
        const info = document.getElementById("geoinfo");
        if (!navigator.geolocation) { info.textContent = "Este navegador não permite localização. Preencha o endereço."; return; }
        info.textContent = "Buscando sua localização…";
        navigator.geolocation.getCurrentPosition(
          (p) => { S.geo = { lat: p.coords.latitude, lng: p.coords.longitude, prec: p.coords.accuracy }; info.textContent = geoTxt(S.geo); },
          (er) => { info.textContent = er.code === 1 ? "Permissão negada. Você pode continuar só com o endereço, ou liberar a localização no navegador e tentar de novo." : "Não consegui pegar a localização agora. Tente de novo ou continue só com o endereço."; },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
        return;
      }
      case "qtd": return setQtd(b.dataset.s, (S.cart[b.dataset.s] || 0) + Number(b.dataset.d));
      case "enviar-pedido": {
        const itens = D.produtos.filter((s) => (S.cart[s.id] || 0) > 0).map((s) => ({ pid: s.id, nome: s.nome, ml: Number(s.ml), qtd: S.cart[s.id], preco: Number(s.preco || 0) }));
        if (!itens.length) return;
        const sem = itens.find((i) => i.qtd > Number((prod(i.pid) || {}).estoque || 0) || !i.preco);
        if (sem) { toast(`Só temos ${Number((prod(sem.pid) || {}).estoque || 0)} de ${sem.nome} ${sem.ml} ml.`); return; }
        b.disabled = true;
        const num = await runTransaction(db, async (t) => {
          const cr = doc(db, "contador", "pedidos"); const c = await t.get(cr);
          const n = (c.exists() ? c.data().n : 1000) + 1;
          if (c.exists()) t.update(cr, { n }); else t.set(cr, { n });
          t.set(doc(collection(db, "pedidos")), { num: n, revId: u.id, revNome: u.nome, revNegocio: u.negocio, itens, total: itens.reduce((s, i) => s + i.qtd * i.preco, 0), status: "novo", criado: serverTimestamp(), entrega: null, obs: S.obs.trim() });
          return n;
        });
        S.cart = {}; S.obs = ""; S.aba = "meus"; render(true); toast(`Pedido #${num} enviado! Aguarde o aceite.`);
        return;
      }
      case "cancelar": if (confirm("Cancelar este pedido?")) await updateDoc(doc(db, "pedidos", id), { status: "cancelado" }); return;
      case "nota": return abrirNota(pedido());
      case "aceitar": {
        const dia = (document.getElementById("d" + id) || {}).value;
        if (!dia) return toast("Escolha a data de entrega.");
        b.disabled = true;
        await runTransaction(db, async (t) => {
          const pr = doc(db, "pedidos", id);
          const ps = await t.get(pr); const p = ps.data();
          if (p.status !== "novo") throw new Error("Este pedido já foi tratado.");
          const refs = p.itens.map((i) => doc(db, "produtos", i.pid));
          const snaps = await Promise.all(refs.map((r) => t.get(r)));
          const itens = p.itens.map((i, k) => {
            const pd = snaps[k].data();
            if (!pd) throw new Error(`Produto ${i.nome} ${i.ml} ml não existe mais.`);
            if ((pd.estoque || 0) < i.qtd) throw new Error(`Estoque insuficiente de ${i.nome} ${i.ml} ml (${pd.estoque || 0}).`);
            return { ...i, preco: Number(pd.preco ?? i.preco) };
          });
          itens.forEach((i, k) => t.update(refs[k], { estoque: (snaps[k].data().estoque || 0) - i.qtd }));
          t.update(pr, { status: "aceito", entrega: dia, itens, total: itens.reduce((s, i) => s + i.qtd * i.preco, 0) });
        });
        delete S.datas[id]; toast(`Pedido agendado para ${fmtDia(dia)}.`);
        return;
      }
      case "recusar": { const m = prompt("Motivo da recusa (o revendedor vai ver):", "Sem estoque no momento"); if (m === null) return; await updateDoc(doc(db, "pedidos", id), { status: "recusado", motivo: m }); return; }
      case "entregue": await updateDoc(doc(db, "pedidos", id), { status: "entregue" }); return toast("Marcado como entregue.");
      case "desfazer": {
        if (!confirm("Cancelar este pedido e devolver as garrafas ao estoque?")) return;
        await runTransaction(db, async (t) => {
          const pr = doc(db, "pedidos", id);
          const ps = await t.get(pr);
          if (ps.data().status !== "aceito") throw new Error("Este pedido não está mais agendado.");
          const itens = ps.data().itens, refs = itens.map((i) => doc(db, "produtos", i.pid));
          const snaps = await Promise.all(refs.map((r) => t.get(r)));
          itens.forEach((i, k) => { if (snaps[k].exists()) t.update(refs[k], { estoque: (snaps[k].data().estoque || 0) + i.qtd }); });
          t.update(pr, { status: "cancelado" });
        });
        return toast("Pedido cancelado e estoque devolvido.");
      }
      case "aprovar": await updateDoc(doc(db, "usuarios", id), { status: "aprovado" }); return toast("Cadastro aprovado. A pessoa já pode entrar.");
      case "recusar-cad": await updateDoc(doc(db, "usuarios", id), { status: "recusado" }); return;
      case "bloquear": if (confirm("Bloquear o acesso deste revendedor?")) await updateDoc(doc(db, "usuarios", id), { status: "recusado" }); return;
    }
  } catch (er) {
    console.warn(er);
    toast(er.code === "permission-denied" ? "Sem permissão para essa ação." : er.message || "Algo deu errado. Tente de novo.");
    if (b) b.disabled = false;
  }
});
