/* -------- Polyfill super simples para URLSearchParams (compat. legado) -------- */
(function () {
  if (typeof window.URLSearchParams === 'undefined') {
    function SimpleURLSearchParams(init) {
      this._pairs = [];
      if (typeof init === 'string') {
        init.replace(/^\?/, '').split('&').forEach(p => {
          if (!p) return;
          const idx = p.indexOf('=');
          const k = idx >= 0 ? p.slice(0, idx) : p;
          const v = idx >= 0 ? p.slice(idx + 1) : '';
          this.append(decodeURIComponent(k), decodeURIComponent(v));
        });
      } else if (init && typeof init === 'object') {
        Object.keys(init).forEach(k => this.append(k, init[k]));
      }
    }
    SimpleURLSearchParams.prototype.append = function (k, v) {
      this._pairs.push([String(k), String(v)]);
    };
    SimpleURLSearchParams.prototype.toString = function () {
      return this._pairs
        .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
        .join('&');
    };
    window.URLSearchParams = SimpleURLSearchParams;
  }
})();

/* ---------------- Util: encoder x-www-form-urlencoded (sem depender do polyfill) ---------------- */
function formEncode(obj) {
  const parts = [];
  for (const k in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(obj[k])));
  }
  return parts.join('&');
}

/* ========================= CONFIG ========================= */
// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbxY1VsWmQB_4FDolmaMNnmSbyyXMDKjxeQ9RBP_qX8kcmoATHl1h3g-w8NsUfuXlf8B/exec';

/* ========================= DOM REFS / ESTADO / DADOS ========================= */
const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

const modalAgendamento = document.getElementById('modal-agendamento');
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnCancelar = document.getElementById('btn-cancelar-agendamento');
const btnConfirmar = document.getElementById('btn-confirmar');
const modalMensagem = document.getElementById('modal-mensagem');

const btnAdminLogin = document.getElementById('btn-admin-login');
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda');
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');

const modalAdminLogin = document.getElementById('modal-admin-login');
const inputAdminPassword = document.getElementById('input-admin-password');
const adminLoginMensagem = document.getElementById('admin-login-mensagem');

const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnAdminAdicionar = document.getElementById('btn-admin-adicionar');
const btnAdminLogout = document.getElementById('btn-admin-logout');
const btnFecharAdminGerenciar = document.getElementById('btn-fechar-admin-gerenciar');

const modalAdminAdicionar = document.getElementById('modal-admin-adicionar');
const formAdicionarHorario = document.getElementById('form-adicionar-horario');

const modalConsulta = document.getElementById('modal-consulta');
const inputConsultaMatricula = document.getElementById('input-consulta-matricula');
const consultaViewInicial = document.getElementById('consulta-view-inicial');
const consultaViewResultados = document.getElementById('consulta-view-resultados');
const consultaMensagem = document.getElementById('consulta-mensagem');
const btnFecharConsulta = document.getElementById('btn-fechar-consulta');
const btnBuscarReservas = document.getElementById('btn-buscar-reservas');
const btnVoltarConsulta = document.getElementById('btn-voltar-consulta');
const listaAgendamentos = document.getElementById('lista-agendamentos');

const adminSelectProfissional = document.getElementById('admin-select-profissional');
const adminSelectAtividade = document.getElementById('admin-select-atividade');
const quickMassageContainer = document.getElementById('quick-massage-container');
const quickMassageHorariosGrid = document.getElementById('quick-massage-horarios');
const horarioUnicoContainer = document.getElementById('horario-unico-container');
const vagasContainerUnico = document.getElementById('vagas-container-unico');
const adminInputVagas = document.getElementById('admin-input-vagas');
const adminInputHorario = document.getElementById('admin-input-horario');
const btnConfirmarAdicionarFinal = document.getElementById('btn-confirmar-adicionar-final');
const btnCancelarAdicionarFinal = document.getElementById('btn-cancelar-adicionar-final');
const adminAddMensagem = document.getElementById('admin-add-mensagem');
const adminSelectData = document.getElementById('admin-select-data');

let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;
let isAdmin = false;
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

/* ========================= Helpers ========================= */
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

/* ========================= Carregar Agenda ========================= */
async function carregarAgenda(){
  const hoje=new Date();
  const yyyy=hoje.getFullYear();
  const mm=String(hoje.getMonth()+1).padStart(2,'0');
  const dd=String(hoje.getDate()).padStart(2,'0');
  const dataPadrao=`${yyyy}-${mm}-${dd}`;
  const dataSelecionada=seletorData.value||dataPadrao;
  seletorData.value=dataSelecionada;
  atualizarDiaDaSemana(dataSelecionada);
  renderizarAgendaParaData(dataSelecionada);
}

async function renderizarAgendaParaData(dataISO){
  container.innerHTML='<p class="loading">Carregando agenda...</p>';
  const dataApi=dataISO.split('-').reverse().join('/');

  try{
    const query = new URLSearchParams({ action:'getSchedule', date:dataApi }).toString();
    const response = await fetch(`${apiUrl}?${query}`);
    if(!response.ok) throw new Error(`Erro de rede (${response.status}): Falha ao carregar agenda.`);
    const result = await response.json();
    if(result.status==="success"){
      todosOsAgendamentos = result.data;
      container.innerHTML = criarHTMLAgenda(todosOsAgendamentos);
    } else {
      container.innerHTML = `<p class="alerta-erro">Erro ao carregar a agenda: ${result.message || 'Resposta da API inválida.'}</p>`;
    }
  }catch(error){
    console.error('Erro de comunicação com a API:', error);
    container.innerHTML = `<p class="alerta-erro">Erro de conexão. Detalhe: ${error.message}</p>`;
  }
}

function criarHTMLAgenda(agendamentos){
  if(!agendamentos||agendamentos.length===0){
    if(isAdmin) return `<p class="alerta-admin">Não há horários para esta data. Use o botão "Adicionar Novos Horários".</p>`;
    return '<p class="alerta-info">Não há horários disponíveis para a data selecionada.</p>';
  }
  const agendaAgrupada = agendamentos.reduce((acc, slot)=>{
    const chave = `${slot.atividade}|${slot.profissional}`;
    if(!acc[chave]) acc[chave] = { atividade:slot.atividade, profissional:slot.profissional, slots:[] };
    acc[chave].slots.push(slot);
    return acc;
  },{});

  let html='';
  for(const chave in agendaAgrupada){
    const grupo=agendaAgrupada[chave];
    const isQuickMassageOrReiki = grupo.atividade.includes('Quick Massage') || grupo.atividade.includes('Reiki');
    html += `<div class="bloco-atividade">
      <h3 class="titulo-atividade">${grupo.atividade} <span class="nome-profissional">(${grupo.profissional})</span></h3>
      <div class="horarios-atividade">`;
    grupo.slots.sort((a,b)=>a.horario.localeCompare(b.horario)).forEach(slot=>{
      let statusClass = '';
      let vagasTexto = '';
      const vagasLivres = slot.vagas_totais - slot.reservas;
      const dataISO = seletorData.value;
      const dataApi = dataISO.split('-').reverse().join('/');
      if(['INDISPONIVEL','BLOQUEADO'].includes(slot.reserva.toUpperCase())){
        statusClass='status-indisponivel'; vagasTexto='Indisp.';
      } else if (vagasLivres>0){
        statusClass='status-disponivel';
        vagasTexto = isQuickMassageOrReiki ? 'Vaga' : `${vagasLivres}/${slot.vagas_totais} Vagas`;
      } else {
        statusClass='status-lotado'; vagasTexto='Esgotado';
      }
      let adminSlotHtml='';
      if(isAdmin){
        adminSlotHtml = `
          <span class="admin-id">ID: ${slot.id_linha}</span>
          <button class="status-admin-excluir" data-id-linha="${slot.id_linha}">Excluir</button>
          ${
            slot.reserva.toUpperCase()==='INDISPONIVEL'
            ? `<span class="status-admin-reservas" data-reservas="${slot.reservas}">0 Reservas</span>`
            : `<span class="status-admin-reservas" data-reservas="${slot.reservas}">Reservas: ${slot.reservas>0?slot.reservas:slot.reserva||0}</span>`
          }`;
        if(vagasLivres>0 && !['INDISPONIVEL','BLOQUEADO'].includes(slot.reserva.toUpperCase())){
          statusClass += ' status-admin-ativo';
        }
      }
      html += `
        <div class="slot-horario ${statusClass}"
             data-id-linha="${slot.id_linha}"
             data-data="${dataApi}"
             data-horario="${slot.horario}"
             data-atividade="${grupo.atividade}"
             data-profissional="${grupo.profissional}"
             data-vagas-total="${slot.vagas_totais}"
             data-vagas-livres="${vagasLivres}">
          <span class="horario-label">${slot.horario}</span>
          <span class="vagas-label">${vagasTexto}</span>
          ${adminSlotHtml}
        </div>`;
    });
    if(isAdmin){
      html += `
        <div class="slot-horario status-admin-adicionar"
             data-data="${seletorData.value.split('-').reverse().join('/')}"
             data-profissional="${grupo.profissional}"
             data-atividade="${grupo.atividade}"
             data-horario="">
          <span class="adicionar-label">+ Adicionar Slot</span>
        </div>`;
    }
    html += `</div></div>`;
  }
  return html;
}

/* ========================= Usuário – reservar ========================= */
function abrirModalReserva(dadosSlot){
  agendamentoAtual = {
    idLinha: dadosSlot.idLinha,
    data: dadosSlot.data,
    horario: dadosSlot.horario,
    atividade: dadosSlot.atividade,
    profissional: dadosSlot.profissional
  };
  modalDetalhes.innerHTML = `
    <li><strong>Data:</strong> ${agendamentoAtual.data}</li>
    <li><strong>Horário:</strong> ${agendamentoAtual.horario}</li>
    <li><strong>Atividade:</strong> ${agendamentoAtual.atividade}</li>
    <li><strong>Profissional:</strong> ${agendamentoAtual.profissional}</li>`;
  inputMatricula.value='';
  modalMensagem.textContent='';
  abrirModal(modalAgendamento);
}

async function confirmarAgendamento(){
  const matricula = inputMatricula.value.trim();
  if(!matricula){ modalMensagem.textContent='A matrícula é obrigatória.'; modalMensagem.style.color='red'; return; }
  btnConfirmar.disabled=true;
  modalMensagem.textContent='Processando sua reserva...';
  modalMensagem.style.color='var(--cinza-texto)';

  try{
    const body = formEncode({ action:'bookSlot', id_linha: agendamentoAtual.idLinha, matricula });
    const response = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body });
    if(!response.ok) throw new Error(`Erro de rede (${response.status}) ao tentar reservar.`);
    const result = await response.json();
    if(result.status==="success"){
      modalMensagem.textContent=result.message;
      modalMensagem.style.color='var(--verde-moinhos)';
      carregarAgenda();
      setTimeout(()=>fecharModal(modalAgendamento), 2000);
    } else {
      throw new Error(result.message);
    }
  }catch(error){
    console.error('Erro ao confirmar agendamento:', error);
    modalMensagem.textContent = error.message || 'Erro ao realizar reserva. Tente novamente.';
    modalMensagem.style.color='red';
  }finally{
    btnConfirmar.disabled=false;
  }
}

/* ========================= Admin – login/logout ========================= */
function toggleAdminView(loggedIn){
  isAdmin = loggedIn;
  if(loggedIn){
    btnAdminLogin.textContent='Logout Admin';
    btnAdminLogin.classList.remove('btn-cinza'); btnAdminLogin.classList.add('btn-vermelho');
    btnGerenciarAgenda.classList.remove('hidden');
    if(!document.querySelector('.aviso-admin')){
      container.insertAdjacentHTML('beforebegin','<p class="aviso-admin">MODO ADMIN ATIVADO. Clique nos slots para <strong>EXCLUIR</strong>.</p>');
    }
  } else {
    btnAdminLogin.textContent='Login Admin';
    btnAdminLogin.classList.remove('btn-vermelho'); btnAdminLogin.classList.add('btn-cinza');
    btnGerenciarAgenda.classList.add('hidden');
    const aviso=document.querySelector('.aviso-admin'); if(aviso) aviso.remove();
  }
  renderizarAgendaParaData(seletorData.value);
}
function handleAdminLoginClick(){ if(isAdmin){toggleAdminView(false);return;} abrirModal(modalAdminLogin); inputAdminPassword.value=''; adminLoginMensagem.textContent=''; }
function confirmarAdminLogin(){ const p=inputAdminPassword.value.trim(); if(p==='admin'){ toggleAdminView(true); fecharModal(modalAdminLogin);} else { adminLoginMensagem.textContent='Senha incorreta.'; adminLoginMensagem.style.color='red'; }}

/* ========================= Admin – excluir ========================= */
async function handleAdminDelete(idLinha){
  if(!confirm(`Excluir definitivamente a linha ${idLinha}?`)) return;
  try{
    const body = formEncode({ action:'deleteSchedule', id_linha:idLinha });
    const response = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body });
    if(!response.ok) throw new Error(`Erro de rede (${response.status}) ao excluir.`);
    const result = await response.json();
    if(result.status==="success"){ alert(result.message); carregarAgenda(); } else { throw new Error(result.message); }
  }catch(error){
    console.error('Erro ao excluir:', error);
    alert(`Erro ao excluir: ${error.message}`);
  }
}

/* ========================= Admin – adicionar ========================= */
function updateActivitySelector(profissional){
  const rule=professionalRules[profissional];
  adminSelectAtividade.innerHTML='<option value="" disabled selected>Selecione a Modalidade</option>';
  adminSelectAtividade.disabled=false;
  if(rule){ rule.activities.forEach(a=>{ const op=document.createElement('option'); op.value=a; op.textContent=a; adminSelectAtividade.appendChild(op); }); }
}
function renderQuickMassageGrid(){
  quickMassageHorariosGrid.innerHTML='';
  quickMassageHours.forEach(horario=>{
    const id=`qm-${horario.replace(':','-')}`;
    quickMassageHorariosGrid.innerHTML+=`
      <div class="horario-item">
        <label for="${id}" class="horario-label">${horario}</label>
        <input type="checkbox" id="${id}" data-horario="${horario}" class="qm-checkbox">
        <label for="indisp-${id}" class="label-indisponivel">Indisp.</label>
        <input type="checkbox" id="indisp-${id}" data-horario="${horario}" class="qm-indisp-checkbox">
      </div>`;
  });
}
function toggleAdminInputs(){
  const profissional=adminSelectProfissional.value;
  const atividade=adminSelectAtividade.value;
  const rule=professionalRules[profissional];

  quickMassageContainer.classList.add('hidden');
  horarioUnicoContainer.classList.add('hidden');
  vagasContainerUnico.classList.add('hidden');
  btnConfirmarAdicionarFinal.disabled=true;

  if(!profissional||!atividade) return;

  const isQuickMassage = atividade==='Quick Massage';
  const isReiki = atividade==='Reiki';
  const isAula = rule && rule.type==='aula';

  btnConfirmarAdicionarFinal.disabled=false;

  if(isQuickMassage){
    quickMassageContainer.classList.remove('hidden');
    renderQuickMassageGrid();
    adminInputHorario.required=false;
    adminInputVagas.required=false;
  } else if (isAula || isReiki){
    horarioUnicoContainer.classList.remove('hidden');
    adminInputHorario.required=true;
    const defaultVagas = isReiki ? 1 : rule.defaultVagas;
    adminInputVagas.value = defaultVagas;
    if(!isReiki){ vagasContainerUnico.classList.remove('hidden'); adminInputVagas.required=true; }
  }
}

async function handleAdminAdicionar(e){
  e.preventDefault();

  const data = adminSelectData.value.split('-').reverse().join('/'); // DD/MM/AAAA
  const profissional = adminSelectProfissional.value;
  const atividade = adminSelectAtividade.value;
  let horariosParaEnviar = [];

  btnConfirmarAdicionarFinal.disabled=true;
  adminAddMensagem.textContent='Enviando dados para a planilha...';
  adminAddMensagem.style.color='var(--cinza-texto)';

  if(atividade==='Quick Massage'){
    const items = quickMassageHorariosGrid.querySelectorAll('.horario-item');
    items.forEach(item=>{
      const cb=item.querySelector('.qm-checkbox');
      const ind=item.querySelector('.qm-indisp-checkbox');
      const horario=cb.dataset.horario;
      if(cb.checked || (ind && ind.checked)){
        const reserva = ind && ind.checked ? 'Indisponivel' : '';
        horariosParaEnviar.push({ Horario: horario, Vagas: 1, Reserva: reserva });
      }
    });
  } else {
    const horario = adminInputHorario.value.trim();
    let vagas = parseInt(adminInputVagas.value.trim());
    if(atividade==='Reiki') vagas = 1;
    if(!horario || isNaN(vagas) || vagas<1){
      adminAddMensagem.textContent='Preencha horário e vagas corretamente.';
      adminAddMensagem.style.color='red';
      btnConfirmarAdicionarFinal.disabled=false;
      return;
    }
    horariosParaEnviar.push({ Horario: horario, Vagas: vagas, Reserva: '' });
  }

  if(horariosParaEnviar.length===0){
    adminAddMensagem.textContent='Selecione/preencha pelo menos um horário.';
    adminAddMensagem.style.color='orange';
    btnConfirmarAdicionarFinal.disabled=false;
    return;
  }

  try{
    const body = formEncode({
      action:'addMultiple',
      data, profissional, atividade,
      horariosJson: JSON.stringify(horariosParaEnviar)
    });
    const response = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body });
    if(!response.ok) throw new Error(`Erro de rede (${response.status}) ao adicionar.`);
    const result = await response.json();
    if(result.status==='success'){
      adminAddMensagem.textContent=result.message;
      adminAddMensagem.style.color='var(--verde-moinhos)';
      carregarAgenda();
      setTimeout(()=>fecharModal(modalAdminAdicionar), 2000);
    } else {
      throw new Error(result.message);
    }
  }catch(error){
    console.error('Erro ao adicionar agendamento:', error);
    adminAddMensagem.textContent = `Erro de processamento POST: ${error.message}`;
    adminAddMensagem.style.color='red';
  }finally{
    btnConfirmarAdicionarFinal.disabled=false;
  }
}

/* ========================= Consulta – minhas reservas ========================= */
async function handleBuscarReservas(){
  const matricula = inputConsultaMatricula.value.trim();
  if(!matricula){ consultaMensagem.textContent='Por favor, insira sua matrícula.'; consultaMensagem.style.color='red'; return; }
  consultaMensagem.textContent='Buscando reservas...';
  consultaMensagem.style.color='var(--cinza-texto)';
  listaAgendamentos.innerHTML='';

  try{
    const query = new URLSearchParams({ action:'getMyBookings', matricula }).toString();
    const response = await fetch(`${apiUrl}?${query}`);
    if(!response.ok) throw new Error(`Erro de rede (${response.status}) ao buscar reservas.`);
    const result = await response.json();
    consultaMensagem.textContent='';
    consultaViewInicial.classList.add('hidden');
    consultaViewResultados.classList.remove('hidden');
    if(result.status==='success'){
      listaAgendamentos.innerHTML = renderizarReservas(result.data, matricula);
    } else {
      listaAgendamentos.innerHTML = `<p style="text-align:center; color:red;">${result.message || 'Erro desconhecido ao buscar reservas.'}</p>`;
    }
  }catch(error){
    console.error('Erro ao buscar reservas:', error);
    consultaMensagem.textContent=`Erro ao buscar: ${error.message}`;
    consultaMensagem.style.color='red';
  }
}

function renderizarReservas(reservas, matricula){
  reservas.sort((a,b)=>{
    const [da,ma,aa]=a.data.split('/'); const [db,mb,ab]=b.data.split('/');
    const A=new Date(aa,ma-1,da); const B=new Date(ab,mb-1,db);
    if(A.getTime()!==B.getTime()) return A-B;
    return a.horario.localeCompare(b.horario);
  });
  if(!reservas||reservas.length===0) return `<p style="text-align:center;">Nenhuma reserva futura encontrada para ${matricula}.</p>`;
  let html='<ul>';
  reservas.forEach(r=>{
    html += `<li class="item-reserva">
      <span>${r.data} | ${r.horario} | <strong>${r.atividade}</strong> com ${r.profissional}</span>
      <button class="btn-cancelar-reserva btn-modal btn-vermelho"
        data-booking-id="${r.id}" data-slot-id="${r.slotId}" data-matricula="${matricula}">Cancelar</button>
    </li>`;
  });
  html+='</ul>';
  return html;
}

async function handleCancelBooking(event){
  const target=event.target;
  if(!target.classList.contains('btn-cancelar-reserva')) return;
  const { bookingId, slotId, matricula } = target.dataset;
  if(!confirm(`Deseja realmente CANCELAR a reserva de ${target.previousElementSibling.textContent}?`)) return;
  target.disabled=true; target.textContent='Cancelando...';

  try{
    const body = formEncode({ action:'cancelBooking', bookingId, slotId, matricula });
    const response = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body });
    if(!response.ok) throw new Error(`Erro de rede (${response.status}) ao cancelar.`);
    const result = await response.json();
    if(result.status==='success'){
      alert(result.message);
      handleBuscarReservas();
      carregarAgenda();
    } else {
      throw new Error(result.message);
    }
  }catch(error){
    console.error('Erro ao cancelar:', error);
    alert(`Erro ao cancelar: ${error.message}`);
  }finally{
    target.disabled=false; target.textContent='Cancelar';
  }
}

function voltarConsulta(){
  consultaViewInicial.classList.remove('hidden');
  consultaViewResultados.classList.add('hidden');
  consultaMensagem.textContent='';
}

/* ========================= Listeners ========================= */
seletorData.addEventListener('change', carregarAgenda);
btnCancelar.addEventListener('click', ()=>fecharModal(modalAgendamento));
btnConfirmar.addEventListener('click', confirmarAgendamento);

btnAdminLogin.addEventListener('click', handleAdminLoginClick);
document.getElementById('btn-cancelar-admin-login').addEventListener('click', ()=>fecharModal(modalAdminLogin));
document.getElementById('btn-confirmar-admin-login').addEventListener('click', confirmarAdminLogin);
btnGerenciarAgenda.addEventListener('click', ()=>abrirModal(modalAdminGerenciar));
btnFecharAdminGerenciar.addEventListener('click', ()=>fecharModal(modalAdminGerenciar));
btnAdminLogout.addEventListener('click', ()=>{ fecharModal(modalAdminGerenciar); toggleAdminView(false); });

adminSelectProfissional.addEventListener('change', (e)=>{ updateActivitySelector(e.target.value); toggleAdminInputs(); });
adminSelectAtividade.addEventListener('change', toggleAdminInputs);

btnAdminAdicionar.addEventListener('click', ()=>{
  formAdicionarHorario.reset();
  adminSelectAtividade.disabled=true;
  toggleAdminInputs();
  adminAddMensagem.textContent='';
  fecharModal(modalAdminGerenciar);
  abrirModal(modalAdminAdicionar);
});
btnCancelarAdicionarFinal.addEventListener('click', ()=>fecharModal(modalAdminAdicionar));
formAdicionarHorario.addEventListener('submit', handleAdminAdicionar);

btnConsultarReservas.addEventListener('click', ()=>{ voltarConsulta(); abrirModal(modalConsulta); });
btnFecharConsulta.addEventListener('click', ()=>fecharModal(modalConsulta));
btnBuscarReservas.addEventListener('click', handleBuscarReservas);
btnVoltarConsulta.addEventListener('click', voltarConsulta);
modalConsulta.addEventListener('click', handleCancelBooking);

container.addEventListener('click', function(event){
  const target=event.target;
  if(target.classList.contains('titulo-atividade')){
    target.classList.toggle('ativo');
    const horarios=target.nextElementSibling;
    horarios.style.maxHeight = horarios.style.maxHeight ? null : (horarios.scrollHeight + "px");
  } else if (isAdmin && target.classList.contains('status-admin-excluir')){
    const idLinha=target.dataset.idLinha; if(idLinha) handleAdminDelete(idLinha);
  } else if (target.closest('.slot-horario') && target.closest('.slot-horario').classList.contains('status-disponivel') && !isAdmin){
    const el=target.closest('.slot-horario'); celulaClicada=el; abrirModalReserva(el.dataset);
  } else if (isAdmin && target.closest('.slot-horario') && target.closest('.slot-horario').classList.contains('status-admin-adicionar')){
    const slotData=target.closest('.slot-horario').dataset;
    adminSelectData.value = slotData.data.split('/').reverse().join('-');
    adminSelectProfissional.value = slotData.profissional;
    updateActivitySelector(slotData.profissional);
    adminSelectAtividade.value = slotData.atividade;
    toggleAdminInputs();
    if(slotData.atividade!=='Quick Massage') adminInputHorario.value = slotData.horario;
    fecharModal(modalAdminGerenciar);
    abrirModal(modalAdminAdicionar);
  }
});

/* ========================= Start ========================= */
carregarAgenda();
