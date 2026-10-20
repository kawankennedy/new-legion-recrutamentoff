import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { ShieldCheck, Users, Check, X, Clock3, LogOut, ArrowLeft, Send, Swords, Crown, Target, Handshake, Star, CalendarDays, MessageCircle, Image as ImageIcon, UserRound, Hash, ChartNoAxesColumnIncreasing, Gamepad2, Link2 } from "lucide-react";
import "./styles.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && anonKey && !url.includes("SEU-PROJETO")
  ? createClient(url, anonKey)
  : null;

function Brand({ compact = false }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}>
    <img src="/logo-new-legion.png" alt="Logo New Legion" />
    {!compact && <p>MAIS QUE UMA GUILDA, UMA FAMÍLIA.</p>}
  </div>;
}

function SetupNotice() {
  return <div className="notice">
    <strong>Configuração necessária</strong>
    <p>Para salvar inscrições e habilitar o painel, configure o Supabase seguindo o arquivo <b>LEIA-ME.md</b>. Este aviso aparece enquanto as chaves de conexão não forem configuradas.</p>
  </div>;
}

function ApplicationForm() {
  const [form, setForm] = useState({
    nickname: "", player_id: "", age: "", level: "", guild_war: "sim", about: "", discord: ""
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    if (!supabase) return setMessage("O site ainda precisa ser conectado ao Supabase pelo administrador.");
    if (Number(form.age) < 15) return setMessage("A idade mínima para se candidatar é 15 anos.");
    if (Number(form.level) < 40) return setMessage("É necessário ter nível 40 ou mais no Free Fire.");
    if (form.guild_war !== "sim") return setMessage("É necessário participar das guerras de guilda.");
    setBusy(true);
    const { error } = await supabase.from("applications").insert([{
      nickname: form.nickname.trim(),
      player_id: form.player_id.trim(),
      age: Number(form.age),
      level: Number(form.level),
      guild_war: form.guild_war === "sim",
      about: form.about.trim(),
      discord: form.discord.trim() || null
    }]);
    setBusy(false);
    if (error) {
      setMessage("Não foi possível enviar agora. Confira sua conexão ou tente novamente mais tarde.");
    } else {
      setMessage("Solicitação enviada! A equipe da New Legion vai analisar sua ficha.");
      setForm({ nickname: "", player_id: "", age: "", level: "", guild_war: "sim", about: "", discord: "" });
    }
  }

  return <form className="application-form" onSubmit={submit}>
    <div className="section-heading">
      <span className="eyebrow">RECRUTAMENTO ABERTO</span>
      <h2>Solicitação de entrada</h2>
      <p>Preencha os dados para a equipe analisar seu perfil.</p>
    </div>
    <label>Nick no Free Fire<input name="nickname" value={form.nickname} onChange={update} placeholder="Digite seu nick completo" maxLength="40" required /></label>
    <label>ID do jogador<input name="player_id" value={form.player_id} onChange={update} placeholder="Ex.: 123456789" inputMode="numeric" maxLength="25" required /></label>
    <div className="field-grid">
      <label>Idade<input name="age" value={form.age} onChange={update} type="number" min="15" max="99" placeholder="15+" required /></label>
      <label>Nível no Free Fire<input name="level" value={form.level} onChange={update} type="number" min="40" max="100" placeholder="40+" required /></label>
    </div>
    <fieldset>
      <legend>Você joga guerra de guilda?</legend>
      <div className="choice-row">
        <label className={`choice ${form.guild_war === "sim" ? "selected" : ""}`}><input type="radio" name="guild_war" value="sim" checked={form.guild_war === "sim"} onChange={update} /> Sim</label>
        <label className={`choice ${form.guild_war === "nao" ? "selected" : ""}`}><input type="radio" name="guild_war" value="nao" checked={form.guild_war === "nao"} onChange={update} /> Não</label>
      </div>
    </fieldset>
    <label>Fale um pouco sobre você<textarea name="about" value={form.about} onChange={update} placeholder="Seu estilo de jogo, disponibilidade e por que quer entrar..." rows="4" maxLength="300" required /></label>
    <label>Discord (opcional)<input name="discord" value={form.discord} onChange={update} placeholder="usuario ou usuário#1234" maxLength="60" /></label>
    <p className="small-note">Ao enviar, você concorda em compartilhar esses dados com a equipe responsável pelo recrutamento.</p>
    <button className="primary-button" disabled={busy} type="submit"><Send size={17} /> {busy ? "Enviando..." : "Enviar solicitação"}</button>
    {message && <p className="form-message" role="status">{message}</p>}
  </form>;
}

function AdminPanel({ onBack }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("pendente");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => setSession(current));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function login(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMessage("Não foi possível entrar. Confira o e-mail e a senha.");
  }

  async function loadApplications() {
    if (!supabase || !session) return;
    const query = supabase.from("applications").select("*").order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) setMessage("Não foi possível carregar as fichas. Confirme se sua conta tem acesso de administrador.");
    else setItems(data || []);
  }

  useEffect(() => { if (session) loadApplications(); }, [session]);

  async function changeStatus(id, status) {
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) setMessage("Não foi possível atualizar. Verifique sua permissão de administrador.");
    else { setMessage("Status atualizado."); await loadApplications(); }
  }

  async function logout() { await supabase.auth.signOut(); setItems([]); }

  if (!supabase) return <main className="admin-shell"><button className="text-button" onClick={onBack}><ArrowLeft size={16}/> Voltar ao site</button><SetupNotice /></main>;

  if (!session) return <main className="admin-shell">
    <button className="text-button" onClick={onBack}><ArrowLeft size={16}/> Voltar ao site</button>
    <div className="login-card"><Brand compact /><h1>Painel administrativo</h1><p>Entre com a conta autorizada da New Legion.</p>
      <form onSubmit={login}>
        <label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label>
        <label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>
        <button className="primary-button" disabled={busy}>{busy ? "Entrando..." : "Entrar no painel"}</button>
      </form>{message && <p className="form-message">{message}</p>}
    </div>
  </main>;

  const filtered = filter === "todas" ? items : items.filter(x => x.status === filter);
  return <main className="admin-shell">
    <header className="admin-header"><Brand compact /><button className="text-button" onClick={logout}><LogOut size={16}/> Sair</button></header>
    <div className="admin-title"><div><span className="eyebrow">NEW LEGION / ADMIN</span><h1>Solicitações</h1><p>Analise as fichas e atualize o status de cada candidato.</p></div><div className="count-card"><Users size={20}/><strong>{items.length}</strong><span>fichas</span></div></div>
    <div className="filter-row">{["pendente","aprovada","recusada","todas"].map(f => <button key={f} className={filter === f ? "filter active" : "filter"} onClick={() => setFilter(f)}>{f[0].toUpperCase()+f.slice(1)}</button>)}</div>
    {message && <p className="form-message">{message}</p>}
    {filtered.length === 0 ? <div className="empty-state"><Clock3 size={28}/><h3>Nenhuma ficha aqui ainda</h3><p>As novas inscrições aparecerão nesta área.</p></div> :
      <div className="applications-list">{filtered.map(app => <article className="candidate-card" key={app.id}>
        <div className="candidate-top"><div><span className={`status status-${app.status}`}>{app.status}</span><h2>{app.nickname}</h2><p>ID: {app.player_id}</p></div><span className="candidate-age">{app.age} anos · Nv. {app.level}</span></div>
        <p><b>Guerra de guilda:</b> {app.guild_war ? "Sim" : "Não"}</p>
        {app.discord && <p><b>Discord:</b> {app.discord}</p>}
        <p className="candidate-about">{app.about}</p>
        <p className="date-text">Enviada em {new Date(app.created_at).toLocaleString("pt-BR")}</p>
        <div className="action-row"><button className="approve" onClick={() => changeStatus(app.id, "aprovada")}><Check size={16}/> Aprovar</button><button className="reject" onClick={() => changeStatus(app.id, "recusada")}><X size={16}/> Recusar</button><button className="pending" onClick={() => changeStatus(app.id, "pendente")}><Clock3 size={16}/> Pendente</button></div>
      </article>)}</div>}
  </main>;
}

function App() {
  const [page, setPage] = useState("home");
  const [warChoice, setWarChoice] = useState("sim");
  if (page === "admin") return <AdminPanel onBack={() => setPage("home")} />;
  return <div className="site nl-page">
    <header className="topbar nl-topbar">
      <a href="#inicio" className="top-brand"><img src="/logo-new-legion.png" alt="Logo New Legion"/><span>NEW LEGION</span></a>
      <nav><a href="#inicio">Início</a><a href="#sobre">Sobre</a><a className="nav-current" href="#recrutamento">Recrutamento</a><a href="#discord">Discord</a></nav>
      <span className="freefire-wordmark">FREE FIRE</span>
    </header>
    <main>
      <section className="nl-hero" id="inicio">
        <div className="nl-hero-brand"><img src="/logo-new-legion.png" alt="Logo New Legion"/><p>MAIS QUE UMA GUILDA,<br/>UMA FAMÍLIA.</p></div>
        <div className="nl-hero-copy" id="sobre"><span className="eyebrow">RECRUTAMENTO</span><h1>FAÇA PARTE<br/>DA NEW LEGION</h1><p>Procuramos jogadores comprometidos,<br className="desktop-break"/> que jogam em equipe e querem evoluir juntos.<br className="desktop-break"/> Aqui, o seu esforço é reconhecido.</p><span className="hero-rule"/><small>NEW LEGION&nbsp; / &nbsp;FREE FIRE</small></div>
        <div className="hero-scribble">♕<br/>JUNTOS<br/>SOMOS<br/>MAIS FORTES</div>
      </section>
      <section className="content-grid nl-content" id="recrutamento">
        <form className="application-form nl-form" onSubmit={async (e) => { e.preventDefault(); const formEl=e.currentTarget; const data=new FormData(formEl); const age=Number(data.get('age')); const level=Number(data.get('level')); const msg=document.getElementById('form-message'); if(age<15){msg.textContent='A idade mínima para se candidatar é 15 anos.';return;} if(level<40){msg.textContent='É necessário ter nível 40 ou mais no Free Fire.';return;} if(warChoice!=='sim'){msg.textContent='É necessário participar das guerras de guilda.';return;} if(!supabase){msg.textContent='O formulário está pronto, mas o administrador precisa conectar o banco de dados para receber inscrições.';return;} const {error}=await supabase.from('applications').insert([{nickname:String(data.get('nickname')||'').trim(),player_id:String(data.get('player_id')||'').trim(),age,level,guild_war:true,about:String(data.get('about')||'').trim(),discord:String(data.get('discord')||'').trim()||null}]); msg.textContent=error?'Não foi possível enviar agora. Tente novamente mais tarde.':'Solicitação enviada! A equipe da New Legion vai analisar sua ficha.'; if(!error)formEl.reset(); }}>
          <div className="section-heading"><span className="heading-mark"/><h2>Solicitação de entrada</h2><p>Preencha os dados abaixo para fazer parte da New Legion.<br/>Vamos analisar seu perfil e entrar em contato!</p></div>
          <label className="icon-field"><span className="field-icon"><UserRound/></span><span className="field-content">Nick no Free Fire<input name="nickname" placeholder="Digite seu nick completo" maxLength="40" required /></span></label>
          <label className="icon-field"><span className="field-icon"><Hash/></span><span className="field-content">ID do jogador<input name="player_id" placeholder="Digite seu ID (ex: 123456789)" inputMode="numeric" maxLength="25" required /></span></label>
          <label className="icon-field"><span className="field-icon"><CalendarDays/></span><span className="field-content">Idade<input name="age" type="number" min="15" max="99" placeholder="Digite sua idade" required /></span></label>
          <label className="icon-field"><span className="field-icon"><ChartNoAxesColumnIncreasing/></span><span className="field-content">Nível no Free Fire<input name="level" type="number" min="40" max="100" placeholder="Digite seu nível (ex: 40+)" required /></span></label>
          <fieldset className="icon-field fieldset-icon"><span className="field-icon"><Gamepad2/></span><div className="field-content"><legend>Você joga guerra de guilda?</legend><div className="choice-row"><label className={`choice ${warChoice === 'sim' ? 'selected' : ''}`}><input type="radio" name="guild_war" checked={warChoice === 'sim'} onChange={() => setWarChoice('sim')}/><Check size={17}/> Sim</label><label className={`choice ${warChoice === 'nao' ? 'selected' : ''}`}><input type="radio" name="guild_war" checked={warChoice === 'nao'} onChange={() => setWarChoice('nao')}/><X size={17}/> Não</label></div></div></fieldset>
          <label className="icon-field"><span className="field-icon"><MessageCircle/></span><span className="field-content">Sobre você<small>Fale um pouco sobre você, seu estilo de jogo e o que te motiva a entrar na New Legion.</small><textarea name="about" placeholder="Escreva aqui..." rows="4" maxLength="300" onChange={(e) => {const el=document.getElementById('about-count'); if(el) el.textContent=String(e.target.value.length)+'/300';}} required/><span className="char-count" id="about-count">0/300</span></span></label>
          <label className="icon-field"><span className="field-icon"><Link2/></span><span className="field-content">Seu Discord (opcional)<input name="discord" placeholder="Ex: usuario#1234" maxLength="60" /></span></label>
          <label className="icon-field"><span className="field-icon"><ImageIcon/></span><span className="field-content">Anexe uma print do seu perfil (opcional)<span className="upload-box"><ImageIcon size={20}/><span>Clique para enviar ou arraste a imagem<br/><small>(PNG, JPG — máx. 5MB)</small></span><input type="file" accept="image/png,image/jpeg" /></span></span></label>
          <button className="primary-button nl-submit" type="submit"><Send size={18}/> Enviar solicitação</button>
          <p className="privacy-note">♙ &nbsp; Seus dados estão seguros.</p><p id="form-message" className="form-message" role="status"></p>
        </form>
        <aside className="side-panel nl-side" id="requisitos">
          <div className="side-logo"><img src="/logo-new-legion.png" alt="Logo New Legion"/><span>NL</span></div>
          <div className="side-section"><h2>Requisitos</h2>
            <div className="requirement"><Crown/><div><b>Nível 40+</b><p>Tenha um bom nível no jogo.</p></div></div>
            <div className="requirement"><Users/><div><b>Idade 15+</b><p>Respeito e maturidade são essenciais.</p></div></div>
            <div className="requirement"><Swords/><div><b>Jogar guerra de guilda</b><p>Compromisso com a guilda<br/>é fundamental.</p></div></div>
          </div>
          <div className="side-section values-section"><h2>Nossos valores</h2>
            <div className="requirement"><Users/><div><b>Trabalho em equipe</b><p>Juntos vamos mais longe.</p></div></div>
            <div className="requirement"><Target/><div><b>Evolução</b><p>Sempre buscando o próximo nível.</p></div></div>
            <div className="requirement"><Handshake/><div><b>Respeito</b><p>Aqui todos são importantes.</p></div></div>
            <div className="requirement"><Star/><div><b>Foco</b><p>No jogo e nos objetivos.</p></div></div>
          </div>
          <div className="side-slogan"><strong>NEW LEGION</strong><span>SEJA PARTE DESSA HISTÓRIA</span><div>────── ♕ ──────</div></div>
        </aside>
      </section>
    </main>
    <footer className="nl-footer"><span>NEW LEGION</span><i/><img src="/logo-new-legion.png" alt="Logo New Legion"/><i/><span>FREE FIRE</span></footer>
    <button className="admin-fab" onClick={() => setPage("admin")} aria-label="Abrir painel administrativo">Admin</button>
  </div>;
}
createRoot(document.getElementById("root")).render(<App />);
