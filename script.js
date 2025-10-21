/* Polyfill mínimo para URLSearchParams (compatibilidade legada) */
(function () {
  if (typeof window !== 'undefined' && typeof window.URLSearchParams === 'undefined') {
    function SimpleURLSearchParams(init) {
      this._pairs = [];
      if (init && typeof init === 'object') { for (var k in init) if (Object.prototype.hasOwnProperty.call(init, k)) this.append(k, init[k]); }
      else if (typeof init === 'string') {
        init.replace(/^\?/, '').split('&').forEach(function (p) {
          if (!p) return; var i = p.indexOf('=');
          var key = i >= 0 ? p.slice(0, i) : p;
          var val = i >= 0 ? p.slice(i + 1) : '';
          this.append(decodeURIComponent(key), decodeURIComponent(val));
        }, this);
      }
    }
    SimpleURLSearchParams.prototype.append = function (k, v) { this._pairs.push([String(k), String(v)]); };
    SimpleURLSearchParams.prototype.toString = function () {
      return this._pairs.map(function (kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]); }).join('&');
    };
    window.URLSearchParams = SimpleURLSearchParams;
  }
})();

// ================== CONFIG ==================
const apiUrl = 'https://script.google.com/macros/s/AKfycbzP0ZIMKk80WED0OOfuJ9kl4lGFjzS3Q1WwlfU_B2H4RNCF3Al55eGET32fLNbZIIAF/exec';

// ================== Utils ==================
function formEncode(obj) {
  const out = [];
  for (const k in obj) { if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    out.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(obj[k])));
  }
  return out.join('&');
}
function withQuery(base, paramsObj) { const qs = formEncode(paramsObj); return qs ? `${base}?${qs}` : base; }
function padHora(h) {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec((h || '').trim()); if (!m) return '';
  let hh = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  let mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}
function isElegivel(slot) {
  const status = String(slot.reserva || '').toUpperCase();
  const livres = (slot.vagas_totais || 0) - (slot.reservas || 0);
  return status !== 'INDISPONIVEL' && status !== 'BLOQUEADO' && livres > 0;
}

// ================== DOM refs ==================
const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');
const menuAtividades = document.getElementById('menu-atividades');

const modalAgendamento = document.getElementById('modal-agendamento');
const modalDetalhes   = document.getElementById('modal-detalhes');
const inputMatricula  = document.getElementById('input-matricula');
const btnCancelar     = document.getElementById('btn-cancelar-agendamento');
const btnConfirmar    = document.getElementById('btn-confirmar');
const modalMensagem   = document.getElementById('modal-mensagem');

const btnAdminLogin        = document.getElementById('btn-admin-login');
const btnGerenciarAgenda   = document.getElementById('btn-gerenciar-agenda');
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');

const modalAdminLogin     = document.getElementById('modal-admin-login');
const inputAdminPassword  = document.getElementById('input-admin-password');
const adminLoginMensagem  = document.getElementById('admin-login-mensagem');

const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnAdminAdicionar   = document.getElementById('btn-admin-adicionar');
const btnAdminDashboard   = document.getElementById('btn-admin-dashboard');
const btnAdminLogout      = document.getElementById('btn-admin-logout');
const btnFecharAdminGerenciar = document.getElementById('btn-fechar-admin-gerenciar');

const modalAdminAdicionar   = document.getElementById('modal-admin-adicionar');
const formAdicionarHorario  = document.getElementById('form-adicionar-horario');

const modalConsulta          = document.getElementById('modal-consulta');
const inputConsultaMatricula = document.getElementById('input-consulta-matricula');
const consultaViewInicial    = document.getElementById('consulta-view-inicial');
const consultaViewResultados = document.getElementById('consulta-view-resultados');
const consultaMensagem       = document.getElementById('consulta-mensagem');
const btnFecharConsulta      = document.getElementById('btn-fechar-consulta');
const btnBuscarReservas      = document.getElementById('btn-buscar-reservas');
const btnVoltarConsulta      = document.getElementById('btn-voltar-consulta');
const listaAgendamentos      = document.getElementById('lista-agendamentos');

const adminSelectProfissional = document.getElementById('admin-select-profissional');
const adminSelectAtividade    = document.getElementById('admin-select-atividade');
const quickMassageContainer   = document.getElementById('quick-massage-container');
const quickMassageHorariosGrid= document.getElementById('quick-massage-horarios');
const horarioUnicoContainer   = document.getElementById('horario-unico-container');
const vagasContainerUnico     = document.getElementById('vagas-container-unico');
const adminInputVagas         = document.getElementById('admin-input-vagas');
const adminInputHorario       = document.getElementById('admin-input-horario');
const btnConfirmarAdicionarFinal = document.getElementById('btn-confirmar-adicionar-final');
const btnCancelarAdicionarFinal  = document.getElementById('btn-cancelar-adicionar-final');
const adminAddMensagem        = document.getElementById('admin-add-mensagem');
const adminSelectData         = document.getElementById('admin-select-data');

// Dashboard refs
const modalAdminDashboard = document.getElementById('modal-admin-dashboard');
const dashSelectDate      = document.getElementById('dash-select-date');
const dashInfo            = document.getElementById('dash-info');
const dashActivityTable   = document.getElementById('dash-activity-table');
const dashProfTable       = document.getElementById('dash-prof-table');
const dashAPTable         = document.getElementById('dash-ap-table');
const btnDashClose        = document.getElementById('btn-dash-close');

// ================== Estado ==================
let todosOsAgendamentos = [];
let agendamentoAtual = {};
let isAdmin = false;
let isSubmittingAdmin = false;
let atividadeSelecionada = 'TODAS';
const ADMIN_PASSWORD = 'admin';

const professionalRules = {
  'Ana': { activities: ['Fit Class (Ballet Fit)', 'Funcional Dance', 'Power Gap'], type: 'aula', defaultVagas: 15 },
  'Carlos': { activities: ['Funcional', 'Mat Pilates', 'Ritmos / Zumba', 'Jump'], type: 'aula', defaultVagas: 15 },
  'Luis': { activities: ['Quick Massage'], type: 'quick_massage', defaultVagas: 1 },
  'Maria Eduarda': { activities: ['Quick Massage'], type: 'quick_massage', defaultVagas: 1 },
  'Rafael': { activities: ['Quick Massage', 'Reiki'], type: 'mixed', defaultVagas: 1 }
};

const quickMassageHours = [
  '08:15','08:30','08:45','09:00','09:15','09:30','09:45','10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45','12:00','12:15','12:30',
  '12:45','13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45','15:00','15:15','15:30','15:45','16:00','16:15','16:30','16:45','17:00',
  '17:15','17:30','17:45','18:00','18:15','18:30','18:45'
];

// ================== Helpers UI ==================
function abrirModal(m){ m.classList.remove('hidden'); setTimeout(()=>m.style.opacity=1,10); }
function fecharModal(m){ m.style.opacity=0; setTimeout(()=>m.classList.add('hidden'),300); }
function atualizarDiaDaSemana(dataString){
  if(!dataString){ diaSemanaSpan.textContent=''; return; }
  const [Y,M,D]=dataString.split('-').map(Number);
  const data=new Date(Y,M-1,D);
  const opcoes={weekday:'long', timeZone:'UTC'};
  let dia=data.toLocaleDateString('pt-BR',opcoes);
  dia=dia.charAt(0).toUpperCase()+dia.slice(1);
  diaSemanaSpan.textContent=`(${dia})`;
}

// ================== Agenda (carregar e filtrar) ==================
async function carregarAgenda(){
  const hoje=new Date();
  const yyyy=hoje.getFullYear();
  const mm=String(hoje.getMonth()+1).padStart(2,'0');
  const dd=String(hoje.getDate()).padStart(2,'0');
  const dataPadrao=`${yyyy}-${mm}-${dd}`;

  seletorData.min = `${yyyy}-${mm}-${dd}`;
  adminSelectData.min = seletorData.min;

  const dataSelecionada=seletorData.value||dataPadrao;
  seletorData.value=dataSelecionada;
  atualizarDiaDaSemana(dataSelecionada);
  await renderizarAgendaParaData(dataSelecionada);
}

async function renderizarAgendaParaData(dataISO){
  container.innerHTML='<p class="loading">Carregando agenda...</p>';
  const dataApi=dataISO.split('-').reverse().join('/');

  try{
    const url = withQuery(apiUrl, { action:'getSchedule', date:dataApi });
    const response = await fetch(url);
    if(!response.ok) throw new Error('Erro de rede (' + response.status + ')');
    const result = await response.json();
    if(result.status==="success"){
      todosOsAgendamentos = (result.data || []).filter(isElegivel); // só elegíveis
      construirMenuAtividades(todosOsAgendamentos);
      if (atividadeSelecionada !== 'TODAS' && !getTodasAtividades(todosOsAgendamentos).includes(atividadeSelecionada)) {
        atividadeSelecionada = 'TODAS';
      }
      container.innerHTML = criarHTMLAgendaFiltrada(todosOsAgendamentos, atividadeSelecionada);
    } else {
      container.innerHTML = '<p class="alerta-erro">Erro ao carregar: ' + (result.message || 'Resposta inválida.') + '</p>';
      menuAtividades.innerHTML = '';
    }
  }catch(error){
    console.error('Erro de comunicação:', error);
    container.innerHTML = '<p class="alerta-erro">Falha ao carregar agenda: ' + error.message + '</p>';
    menuAtividades.innerHTML = '';
  }
}

// Helpers do filtro por atividade
function getTodasAtividades(agendamentos){
  const set = new Set();
  agendamentos.forEach(s=> set.add(s.atividade));
  return Array.from(set).sort((a,b)=>a.localeCompare(b,'pt-BR'));
}

function construirMenuAtividades(agendamentos){
  const atividades = getTodasAtividades(agendamentos);
  const dispPorAtividade = atividades.reduce(function(acc, atv){ acc[atv]=0; return acc; }, {});
  agendamentos.forEach(function(s){
    const livres = (s.vagas_totais - s.reservas);
    if (livres > 0) dispPorAtividade[s.atividade] = (dispPorAtividade[s.atividade]||0) + 1;
  });

  let html = '';
  const btn = function (nome, active, qtd){
    return '<button class="chip-atividade ' + (active?'ativo':'') + '" data-atividade="' + nome + '">' +
      nome + (qtd!=null?(' <span class="badge">' + qtd + '</span>'):'') + '</button>';
  };
  const totalDisp = Object.values(dispPorAtividade).reduce(function(a,b){return a+b;},0);
  html += btn('TODAS', atividadeSelecionada==='TODAS', totalDisp);
  atividades.forEach(function(a){ html += btn(a, atividadeSelecionada===a, dispPorAtividade[a]); });
  menuAtividades.innerHTML = html;
}

// HTML agenda filtrada
function criarHTMLAgendaFiltrada(agendamentos, atividadeFiltro){
  const grupos = agendamentos.reduce(function(acc, s){
    if (atividadeFiltro!=='TODAS' && s.atividade !== atividadeFiltro) return acc;
    const k = s.atividade + '|' + s.profissional;
    if(!acc[k]) acc[k] = { atividade:s.atividade, profissional:s.profissional, slots:[] };
    acc[k].slots.push(s);
    return acc;
  },{});

  const chaves = Object.keys(grupos).sort(function(a,b){ return a.localeCompare(b,'pt-BR'); });
  if(chaves.length===0){ return '<p class="alerta-info">Não há horários para esta atividade nesta data.</p>'; }

  let html='';
  chaves.forEach(function(k){
    const g = grupos[k];
    html += '<div class="bloco-atividade">' +
      '<h3 class="titulo-atividade">' + g.atividade + '</h3>' +
      '<h4 class="subtitulo-profissional">' + g.profissional + '</h4>' +
      '<div class="horarios-atividade">';

    g.slots.sort(function(a,b){ return a.horario.localeCompare(b.horario); }).forEach(function(s){
      const vagasLivres = s.vagas_totais - s.reservas;
      let statusClass='status-disponivel';
      const isQM = s.atividade.indexOf('Quick Massage') !== -1 || s.atividade.indexOf('Reiki') !== -1;
      const vagasTxt = isQM ? 'Vaga' : (vagasLivres + '/' + s.vagas_totais + ' Vagas');

      const dataApi = seletorData.value.split('-').reverse().join('/');
      html +=
        '<div class="slot-horario ' + statusClass + '"' +
        ' data-id-linha="' + s.id_linha + '"' +
        ' data-data="' + dataApi + '"' +
        ' data-horario="' + s.horario + '"' +
        ' data-atividade="' + s.atividade + '"' +
        ' data-profissional="' + s.profissional + '"' +
        ' data-vagas-total="' + s.vagas_totais + '"' +
        ' data-vagas-livres="' + vagasLivres + '">' +
          '<span class="horario-label">' + s.horario + '</span>' +
          '<span class="vagas-label">' + vagasTxt + '</span>' +
        '</div>';
    });

    // atalho admin para criar novo slot dentro do grupo
    if(isAdmin){
      html +=
        '<div class="slot-horario status-admin-adicionar"' +
        ' data-data="' + seletorData.value.split('-').reverse().join('/') + '"' +
        ' data-profissional="' + g.profissional + '"' +
        ' data-atividade="' + g.atividade + '">' +
          '<span class="adicionar-label">+ Adicionar Slot</span>' +
        '</div>';
    }

    html += '</div></div>';
  });

  return html || '<p class="alerta-info">Não há horários disponíveis para esta atividade.</p>';
}

// ================== Usuário – reservar ==================
function abrirModalReserva(dadosSlot){
  agendamentoAtual = {
    idLinha: dadosSlot.idLinha,
    data: dadosSlot.data,
    horario: dadosSlot.horario,
    atividade: dadosSlot.atividade,
    profissional: dadosSlot.profissional
  };
  modalDetalhes.innerHTML =
    '<li><strong>Data:</strong> ' + agendamentoAtual.data + '</li>' +
    '<li><strong>Horário:</strong> ' + agendamentoAtual.horario + '</li>' +
    '<li><strong>Atividade:</strong> ' + agendamentoAtual.atividade + '</li>' +
    '<li><strong>Profissional:</strong> ' + agendamentoAtual.profissional + '</li>';
  inputMatricula.value=''; modalMensagem.textContent='';
  abrirModal(modalAgendamento);
}

async function confirmarAgendamento(){
  const matricula=inputMatricula.value.trim();
  if(!matricula){ modalMensagem.textContent='A matrícula é obrigatória.'; modalMensagem.style.color='red'; return; }
  btnConfirmar.disabled=true;
  modalMensagem.textContent='Processando...'; modalMensagem.style.color='var(--cinza-texto)';

  try{
    const body = formEncode({ action:'bookSlot', id_linha: agendamentoAtual.idLinha, matricula });
    const resp = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body });
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const result = await resp.json();
    if(result.status==='success'){
      modalMensagem.textContent=result.message; modalMensagem.style.color='var(--verde-moinhos)';
      carregarAgenda(); setTimeout(function(){ fecharModal(modalAgendamento); }, 1500);
    }else{ throw new Error(result.message); }
  }catch(err){
    modalMensagem.textContent = err.message || 'Erro ao reservar.'; modalMensagem.style.color='red';
  }finally{ btnConfirmar.disabled=false; }
}

// ================== Admin – login/logout ==================
function toggleAdminView(on){
  isAdmin = on;
  if(on){
    btnAdminLogin.textContent='Logout Admin';
    btnAdminLogin.classList.remove('btn-cinza'); btnAdminLogin.classList.add('btn-vermelho');
    btnGerenciarAgenda.classList.remove('hidden');
    if(!document.querySelector('.aviso-admin')){
      container.insertAdjacentHTML('beforebegin','<p class="aviso-admin">MODO ADMIN. Clique em "Excluir" para remover slots.</p>');
    }
  }else{
    btnAdminLogin.textContent='Login Admin';
    btnAdminLogin.classList.remove('btn-vermelho'); btnAdminLogin.classList.add('btn-cinza');
    btnGerenciarAgenda.classList.add('hidden');
    const aviso=document.querySelector('.aviso-admin'); if(aviso) aviso.remove();
  }
  container.innerHTML = criarHTMLAgendaFiltrada(todosOsAgendamentos, atividadeSelecionada);
}
function handleAdminLoginClick(){ if(isAdmin){toggleAdminView(false);return;} abrirModal(modalAdminLogin); inputAdminPassword.value=''; adminLoginMensagem.textContent=''; }
function confirmarAdminLogin(){ if(inputAdminPassword.value.trim()===ADMIN_PASSWORD){ toggleAdminView(true); fecharModal(modalAdminLogin); } else { adminLoginMensagem.textContent='Senha incorreta.'; adminLoginMensagem.style.color='red'; } }

// ================== Admin – excluir ==================
async function handleAdminDelete(idLinha){
  if(!confirm('Excluir permanentemente a linha ' + idLinha + '?')) return;
  try{
    const body = formEncode({ action:'deleteSchedule', id_linha:idLinha });
    const resp = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body });
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const result = await resp.json();
    if(result.status==='success'){ alert(result.message); carregarAgenda(); }
    else { throw new Error(result.message); }
  }catch(err){ alert('Erro ao excluir: ' + err.message); }
}

// ================== Admin – adicionar ==================
function updateActivitySelector(prof){
  const rule=professionalRules[prof];
  adminSelectAtividade.innerHTML='<option value="" disabled selected>Selecione a Modalidade</option>';
  adminSelectAtividade.disabled=false;
  if(rule){ rule.activities.forEach(function(a){ const op=document.createElement('option'); op.value=a; op.textContent=a; adminSelectAtividade.appendChild(op); }); }
}
function renderQuickMassageGrid(){
  // Quick Massage: somente checkbox do horário (sem “Indisp.”)
  quickMassageHorariosGrid.innerHTML='';
  quickMassageHours.forEach(function(h){
    const id='qm-' + h.replace(':','-');
    quickMassageHorariosGrid.innerHTML +=
      '<div class="horario-item">' +
        '<label for="' + id + '" class="horario-label">' + h + '</label>' +
        '<input type="checkbox" id="' + id + '" data-horario="' + h + '" class="qm-checkbox">' +
      '</div>';
  });
}
function toggleAdminInputs(){
  const prof=adminSelectProfissional.value;
  const atividade=adminSelectAtividade.value;
  const rule=professionalRules[prof];

  quickMassageContainer.classList.add('hidden');
  horarioUnicoContainer.classList.add('hidden');
  vagasContainerUnico.classList.add('hidden');
  btnConfirmarAdicionarFinal.disabled=true;

  if(!prof||!atividade) return;

  const isQuick = atividade==='Quick Massage';
  const isReiki = atividade==='Reiki';
  const isAula = rule && rule.type==='aula';

  btnConfirmarAdicionarFinal.disabled=false;

  if(isQuick){
    quickMassageContainer.classList.remove('hidden');
    renderQuickMassageGrid();
    adminInputHorario.required=false; adminInputVagas.required=false;
  } else if (isAula || isReiki){
    horarioUnicoContainer.classList.remove('hidden');
    adminInputHorario.required=true;
    const defaultVagas = isReiki ? 1 : rule.defaultVagas;
    adminInputVagas.value = defaultVagas;
    if(!isReiki){ vagasContainerUnico.classList.remove('hidden'); adminInputVagas.required=true; }
  }
}

// anti-Enter no form admin
formAdicionarHorario.addEventListener('keydown', function(e){ if (e.key === 'Enter') e.preventDefault(); });

async function handleAdminAdicionar(e){
  e.preventDefault();
  if (isSubmittingAdmin) return;
  isSubmittingAdmin = true;

  const data = adminSelectData.value.split('-').reverse().join('/'); // DD/MM/AAAA
  const profissional = adminSelectProfissional.value;
  const atividade = adminSelectAtividade.value;
  let horariosParaEnviar = [];

  btnConfirmarAdicionarFinal.disabled=true;
  adminAddMensagem.textContent='Enviando dados...'; adminAddMensagem.style.color='var(--cinza-texto)';

  if(atividade==='Quick Massage'){
    const cbs = quickMassageHorariosGrid.querySelectorAll('.qm-checkbox');
    cbs.forEach(function(cb){
      if(cb.checked){
        horariosParaEnviar.push({ Horario: cb.dataset.horario, Vagas: 1, Reserva: '' });
      }
    });
  } else {
    const norm = padHora(adminInputHorario.value);
    if(!norm){
      adminAddMensagem.textContent='Horário inválido. Use o formato HH:MM (ex.: 08:30).';
      adminAddMensagem.style.color='red';
      btnConfirmarAdicionarFinal.disabled=false;
      isSubmittingAdmin = false;
      return;
    }
    adminInputHorario.value = norm;
    let vagas = parseInt(adminInputVagas.value.trim(),10);
    if(atividade==='Reiki') vagas = 1;
    if(isNaN(vagas) || vagas<1){
      adminAddMensagem.textContent='Preencha Vagas com um número válido (>=1).';
      adminAddMensagem.style.color='red';
      btnConfirmarAdicionarFinal.disabled=false;
      isSubmittingAdmin = false;
      return;
    }
    horariosParaEnviar.push({ Horario: norm, Vagas: vagas, Reserva: '' });
  }

  if(horariosParaEnviar.length===0){
    adminAddMensagem.textContent='Selecione/preencha pelo menos um horário.';
    adminAddMensagem.style.color='orange';
    btnConfirmarAdicionarFinal.disabled=false;
    isSubmittingAdmin = false;
    return;
  }

  try{
    const body = formEncode({
      action:'addMultiple',
      data, profissional, atividade,
      horariosJson: JSON.stringify(horariosParaEnviar)
    });
    const resp = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body });
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const result = await resp.json();
    if(result.status==='success'){
      adminAddMensagem.textContent=result.message; adminAddMensagem.style.color='var(--verde-moinhos)';
      await renderizarAgendaParaData(seletorData.value);
      setTimeout(function(){ fecharModal(modalAdminAdicionar); }, 1200);
    } else { throw new Error(result.message); }
  }catch(err){
    console.error('Erro ao adicionar agendamento:', err);
    adminAddMensagem.textContent = 'Erro de processamento POST: ' + err.message;
    adminAddMensagem.style.color='red';
  }finally{
    btnConfirmarAdicionarFinal.disabled=false;
    isSubmittingAdmin = false;
  }
}

// ================== Consulta – minhas reservas ==================
async function handleBuscarReservas(){
  const matricula=inputConsultaMatricula.value.trim();
  if(!matricula){ consultaMensagem.textContent='Informe sua matrícula.'; consultaMensagem.style.color='red'; return; }
  consultaMensagem.textContent='Buscando...'; consultaMensagem.style.color='var(--cinza-texto)';
  listaAgendamentos.innerHTML='';

  try{
    const url = withQuery(apiUrl, { action:'getMyBookings', matricula });
    const resp = await fetch(url);
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const result = await resp.json();
    consultaMensagem.textContent='';
    consultaViewInicial.classList.add('hidden');
    consultaViewResultados.classList.remove('hidden');

    if(result.status==='success'){
      listaAgendamentos.innerHTML = renderizarReservas(result.data, matricula);
    } else {
      listaAgendamentos.innerHTML = '<p style="text-align:center;color:red;">' + (result.message || 'Erro ao buscar.') + '</p>';
    }
  }catch(err){
    consultaMensagem.textContent='Erro ao buscar: ' + err.message; consultaMensagem.style.color='red';
  }
}

function renderizarReservas(reservas, matricula){
  reservas.sort(function(a,b){
    const da=a.data.split('/'); const db=b.data.split('/');
    const A=new Date(da[2],da[1]-1,da[0]); const B=new Date(db[2],db[1]-1,db[0]);
    if(A.getTime()!==B.getTime()) return A-B;
    return a.horario.localeCompare(b.horario);
  });
  if(!reservas||reservas.length===0) return '<p style="text-align:center;">Nenhuma reserva futura encontrada para ' + matricula + '.</p>';
  let html='<ul>';
  reservas.forEach(function(r){
    html += '<li class="item-reserva">' +
      '<span>' + r.data + ' | ' + r.horario + ' | <strong>' + r.atividade + '</strong> com ' + r.profissional + '</span>' +
      '<button class="btn-cancelar-reserva btn-modal btn-vermelho" data-booking-id="' + r.id + '" data-slot-id="' + r.slotId + '" data-matricula="' + matricula + '">Cancelar</button>' +
    '</li>';
  });
  html+='</ul>'; return html;
}

async function handleCancelBooking(event){
  const t=event.target;
  if(!t.classList.contains('btn-cancelar-reserva')) return;
  const bookingId = t.getAttribute('data-booking-id');
  const slotId    = t.getAttribute('data-slot-id');
  const matricula = t.getAttribute('data-matricula');
  if(!confirm('Cancelar ' + t.previousElementSibling.textContent + '?')) return;
  t.disabled=true; t.textContent='Cancelando...';
  try{
    const body = formEncode({ action:'cancelBooking', bookingId, slotId, matricula });
    const resp = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body });
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const result = await resp.json();
    if(result.status==='success'){ alert(result.message); handleBuscarReservas(); carregarAgenda(); }
    else { throw new Error(result.message); }
  }catch(err){ alert('Erro ao cancelar: ' + err.message); }
  finally{ t.disabled=false; t.textContent='Cancelar'; }
}

function voltarConsulta(){
  consultaViewInicial.classList.remove('hidden');
  consultaViewResultados.classList.add('hidden');
  consultaMensagem.textContent='';
}

// ================== Dashboard (Admin) ==================
function formatNum(n){ return (n||0).toLocaleString('pt-BR'); }

function buildTable(headers, rows){
  let html = '<table class="dash-table"><thead><tr>';
  headers.forEach(function(h){ html += '<th>' + h + '</th>'; });
  html += '</tr></thead><tbody>';
  if(!rows.length){
    html += '<tr><td colspan="' + headers.length + '" style="text-align:center;color:#6c757d;">Sem dados</td></tr>';
  } else {
    rows.forEach(function(r){
      html += '<tr>';
      r.forEach(function(cell, i){
        const cls = (i>=headers.length-3)?' class="number"':'';
        html += '<td' + cls + '>' + cell + '</td>';
      });
      html += '</tr>';
    });
  }
  html += '</tbody></table>';
  return html;
}

function openDashboard(){
  // data padrão = selecionada na tela principal
  dashSelectDate.value = seletorData.value;
  atualizarDashboard();
  abrirModal(modalAdminDashboard);
}

function atualizarDashboard(){
  const dataISO = dashSelectDate.value;
  if(!dataISO){ dashActivityTable.innerHTML=''; dashProfTable.innerHTML=''; dashAPTable.innerHTML=''; return; }
  const dataBR = dataISO.split('-').reverse().join('/');

  // filtrar elegíveis do dia selecionado
  const slotsDia = todosOsAgendamentos.filter(function(s){ return s.data === dataBR; }).filter(isElegivel);

  // agregação por atividade
  const byAtv = {};
  // agregação por profissional
  const byProf = {};
  // agregação por atividade x profissional
  const byAP = {};

  slotsDia.forEach(function(s){
    const keyAtv = s.atividade;
    const keyProf = s.profissional;
    const keyAP = keyAtv + '|' + keyProf;

    if(!byAtv[keyAtv]) byAtv[keyAtv] = { tot:0, res:0 };
    if(!byProf[keyProf]) byProf[keyProf] = { tot:0, res:0 };
    if(!byAP[keyAP]) byAP[keyAP] = { atv: keyAtv, prof: keyProf, tot:0, res:0 };

    byAtv[keyAtv].tot += s.vagas_totais;
    byAtv[keyAtv].res += s.reservas;

    byProf[keyProf].tot += s.vagas_totais;
    byProf[keyProf].res += s.reservas;

    byAP[keyAP].tot += s.vagas_totais;
    byAP[keyAP].res += s.reservas;
  });

  // linhas
  const rowsAtv = Object.keys(byAtv).sort(function(a,b){return a.localeCompare(b,'pt-BR');})
    .map(function(k){ const o=byAtv[k]; return [k, formatNum(o.tot), formatNum(o.res), formatNum(o.tot - o.res)]; });

  const rowsProf = Object.keys(byProf).sort(function(a,b){return a.localeCompare(b,'pt-BR');})
    .map(function(k){ const o=byProf[k]; return [k, formatNum(o.tot), formatNum(o.res), formatNum(o.tot - o.res)]; });

  const rowsAP = Object.keys(byAP).sort(function(a,b){return a.localeCompare(b,'pt-BR');})
    .map(function(k){ const o=byAP[k]; return [o.atv + ' × ' + o.prof, formatNum(o.tot), formatNum(o.res), formatNum(o.tot - o.res)]; });

  dashActivityTable.innerHTML = buildTable(['Atividade','Total','Reservas','Disponíveis'], rowsAtv);
  dashProfTable.innerHTML     = buildTable(['Profissional','Total','Reservas','Disponíveis'], rowsProf);
  dashAPTable.innerHTML       = buildTable(['Atividade × Profissional','Total','Reservas','Disponíveis'], rowsAP);

  const sumTot = rowsAtv.reduce(function(a,r){ return a + parseInt((r[1]+'').replace(/\./g,''),10); },0);
  const sumRes = rowsAtv.reduce(function(a,r){ return a + parseInt((r[2]+'').replace(/\./g,''),10); },0);
  const sumDisp = rowsAtv.reduce(function(a,r){ return a + parseInt((r[3]+'').replace(/\./g,''),10); },0);
  dashInfo.textContent = 'Total: ' + formatNum(sumTot) + ' • Reservas: ' + formatNum(sumRes) + ' • Disponíveis: ' + formatNum(sumDisp);
}

// ================== Listeners ==================
seletorData.addEventListener('change', function(){ atividadeSelecionada='TODAS'; carregarAgenda(); });
btnCancelar.addEventListener('click', function(){ fecharModal(modalAgendamento); });
btnConfirmar.addEventListener('click', confirmarAgendamento);

btnAdminLogin.addEventListener('click', handleAdminLoginClick);
document.getElementById('btn-cancelar-admin-login').addEventListener('click', function(){ fecharModal(modalAdminLogin); });
document.getElementById('btn-confirmar-admin-login').addEventListener('click', confirmarAdminLogin);
btnGerenciarAgenda.addEventListener('click', function(){ abrirModal(modalAdminGerenciar); });
btnFecharAdminGerenciar.addEventListener('click', function(){ fecharModal(modalAdminGerenciar); });
btnAdminLogout.addEventListener('click', function(){ fecharModal(modalAdminGerenciar); toggleAdminView(false); });
btnAdminDashboard.addEventListener('click', function(){ fecharModal(modalAdminGerenciar); openDashboard(); });

adminSelectProfissional.addEventListener('change', function(e){ updateActivitySelector(e.target.value); toggleAdminInputs(); });
adminSelectAtividade.addEventListener('change', toggleAdminInputs);

btnAdminAdicionar.addEventListener('click', function(){
  formAdicionarHorario.reset();
  adminSelectAtividade.disabled=true;
  toggleAdminInputs();
  adminAddMensagem.textContent='';
  fecharModal(modalAdminGerenciar);
  abrirModal(modalAdminAdicionar);
});
btnCancelarAdicionarFinal.addEventListener('click', function(){ fecharModal(modalAdminAdicionar); });
formAdicionarHorario.addEventListener('submit', handleAdminAdicionar);

btnConsultarReservas.addEventListener('click', function(){ voltarConsulta(); abrirModal(modalConsulta); });
btnFecharConsulta.addEventListener('click', function(){ fecharModal(modalConsulta); });
btnBuscarReservas.addEventListener('click', handleBuscarReservas);
btnVoltarConsulta.addEventListener('click', voltarConsulta);
modalConsulta.addEventListener('click', handleCancelBooking);

// click no container de slots (abre reserva / excluir / atalho admin)
container.addEventListener('click', function(ev){
  const el = ev.target.closest('.slot-horario');
  if(el && el.classList.contains('status-disponivel') && !isAdmin){
    abrirModalReserva(el.dataset);
    return;
  }
  if (isAdmin && ev.target.classList.contains('status-admin-excluir')){
    const id=ev.target.getAttribute('data-id-linha'); if(id) handleAdminDelete(id);
    return;
  }
  if (isAdmin && el && el.classList.contains('status-admin-adicionar')){
    const d=el.dataset;
    adminSelectData.value = d.data.split('/').reverse().join('-');
    adminSelectProfissional.value = d.profissional;
    updateActivitySelector(d.profissional);
    adminSelectAtividade.value = d.atividade;
    toggleAdminInputs();
    fecharModal(modalAdminGerenciar);
    abrirModal(modalAdminAdicionar);
  }
});

// clique no menu de atividades
menuAtividades.addEventListener('click', function(e){
  const btn = e.target.closest('.chip-atividade');
  if(!btn) return;
  atividadeSelecionada = btn.getAttribute('data-atividade') || 'TODAS';
  // marca ativo
  var chips = menuAtividades.querySelectorAll('.chip-atividade');
  for (var i=0;i<chips.length;i++){ chips[i].classList.remove('ativo'); }
  btn.classList.add('ativo');
  // re-render
  container.innerHTML = criarHTMLAgendaFiltrada(todosOsAgendamentos, atividadeSelecionada);
});

// Dashboard handlers
btnDashClose.addEventListener('click', function(){ fecharModal(modalAdminDashboard); });
dashSelectDate.addEventListener('change', atualizarDashboard);

// ================== Start ==================
carregarAgenda();
