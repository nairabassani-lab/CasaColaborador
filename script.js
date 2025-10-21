// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbxY1VsWmQB_4FDolmaMNnmSbyyXMDKjxeQ9RBP_qX8kcmoATHl1h3g-w8NsUfuXlf8B/exec';

const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modais de Agendamento (Usuário)
const modalAgendamento = document.getElementById('modal-agendamento');
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnCancelar = document.getElementById('btn-cancelar-agendamento');
const btnConfirmar = document.getElementById('btn-confirmar');
const modalMensagem = document.getElementById('modal-mensagem');

// Botões Ação Principal
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda');
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');

// --- REFERÊNCIAS DE MODAIS (ADMIN E CONSULTA) ---
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

// --- NOVAS REFERÊNCIAS ESPECÍFICAS DO MODAL ADICIONAR ---
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

// --- Variáveis de Estado e Configurações ---
let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;
let isAdmin = false;
const ADMIN_PASSWORD = 'admin'; // Senha simples para demonstração

// --- MAPA DE ATIVIDADES E REGRAS ---
const professionalRules = {
  'Ana': { 
    activities: ['Fit Class (Ballet Fit)', 'Funcional Dance', 'Power Gap'], 
    type: 'aula', 
    defaultVagas: 15 
  },
  'Carlos': { 
    activities: ['Funcional', 'Mat Pilates', 'Ritmos / Zumba', 'Jump'], 
    type: 'aula', 
    defaultVagas: 15 
  },
  'Luis': { 
    activities: ['Quick Massage'], 
    type: 'quick_massage', 
    defaultVagas: 1 
  },
  'Maria Eduarda': { 
    activities: ['Quick Massage'], 
    type: 'quick_massage', 
    defaultVagas: 1 
  },
  'Rafael': { 
    activities: ['Quick Massage', 'Reiki'], 
    type: 'mixed', 
    defaultVagas: 1 
  }
};

const quickMassageHours = [
  '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', 
  '10:30', '10:45', '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', 
  '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', 
  '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', 
  '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45'
];


// --- FUNÇÕES DE UTILIDADE (MODAIS) ---

function abrirModal(modalElement) {
  modalElement.classList.remove('hidden');
  setTimeout(() => modalElement.style.opacity = 1, 10); 
}

function fecharModal(modalElement) {
  modalElement.style.opacity = 0;
  setTimeout(() => modalElement.classList.add('hidden'), 300);
}

// --- FUNÇÕES DE UTILIDADE (DATA) ---

function atualizarDiaDaSemana(dataString) {
  if (!dataString) {
    diaSemanaSpan.textContent = '';
    return;
  }
  const partes = dataString.split('-'); 
  // O construtor Date precisa de YYYY, MM-1, DD
  const data = new Date(partes[0], partes[1] - 1, partes[2]);
  const opcoes = { weekday: 'long', timeZone: 'UTC' }; 
  let diaDaSemana = data.toLocaleDateString('pt-BR', opcoes);
  diaDaSemana = diaDaSemana.charAt(0).toUpperCase() + diaDaSemana.slice(1);
  diaSemanaSpan.textContent = `(${diaDaSemana})`;
}

// --- LÓGICA DE CARREGAMENTO E RENDERIZAÇÃO DA AGENDA (ESSENCIAL) ---

async function carregarAgenda() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');
  const dataPadrao = `${yyyy}-${mm}-${dd}`;
  
  // Define a data atual se não houver seleção ou se a data for inválida
  const dataSelecionada = seletorData.value || dataPadrao;
  
  seletorData.value = dataSelecionada;
  atualizarDiaDaSemana(dataSelecionada);
  renderizarAgendaParaData(dataSelecionada);
}

async function renderizarAgendaParaData(dataISO) {
  container.innerHTML = '<p class="loading">Carregando agenda...</p>';

  // Converte de AAAA-MM-DD para DD/MM/AAAA para a API
  const dataApi = dataISO.split('-').reverse().join('/'); 

  try {
    const query = new URLSearchParams({ action: 'getSchedule', date: dataApi }).toString();
    const response = await fetch(`${apiUrl}?${query}`);
    
    // Verifica se a resposta foi bem sucedida a nível de rede (código 200)
    if (!response.ok) {
      throw new Error(`Erro de rede (${response.status}): Falha ao carregar agenda.`);
    }
    
    const result = await response.json();
    
    if (result.status === "success") {
      todosOsAgendamentos = result.data;
      container.innerHTML = criarHTMLAgenda(todosOsAgendamentos);
    } else {
      // Se o status for diferente de 'success' (erro reportado pela API/Script)
      container.innerHTML = `<p class="alerta-erro">Erro ao carregar a agenda: ${result.message || 'Resposta da API inválida.'}</p>`;
    }
  } catch (error) {
    console.error('Erro de comunicação com a API:', error);
    container.innerHTML = `<p class="alerta-erro">Erro de conexão. Verifique a URL da API ou o console. Detalhe: ${error.message}</p>`;
  }
}

function criarHTMLAgenda(agendamentos) {
  if (!agendamentos || agendamentos.length === 0) {
    // Se for admin, mostra a opção de adicionar horários
    if (isAdmin) {
          return `<p class="alerta-admin">Não há horários para esta data. Use o botão "Adicionar Novos Horários" no Gerenciador.</p>`;
    }
    return '<p class="alerta-info">Não há horários disponíveis para a data selecionada.</p>';
  }

  // 1. Agrupar por Atividade
  const agendaAgrupada = agendamentos.reduce((acc, slot) => {
    const chave = `${slot.atividade}|${slot.profissional}`;
    if (!acc[chave]) {
      acc[chave] = {
        atividade: slot.atividade,
        profissional: slot.profissional,
        slots: []
      };
    }
    acc[chave].slots.push(slot);
    return acc;
  }, {});

  let html = '';

  // 2. Criar a estrutura HTML para cada grupo (Atividade/Profissional)
  for (const chave in agendaAgrupada) {
    const grupo = agendaAgrupada[chave];
    const isQuickMassageOrReiki = grupo.atividade.includes('Quick Massage') || grupo.atividade.includes('Reiki');

    html += `
        <div class="bloco-atividade">
            <h3 class="titulo-atividade">
                ${grupo.atividade} 
                <span class="nome-profissional">(${grupo.profissional})</span>
                <span class="icone-toggle">▼</span>
            </h3>
            <div class="horarios-atividade">
    `;
    
    // 3. Renderizar os slots
    grupo.slots.sort((a, b) => a.horario.localeCompare(b.horario)).forEach(slot => {
      let statusClass = '';
      let vagasTexto = '';
      let adminSlotHtml = '';
      const vagasLivres = slot.vagas_totais - slot.reservas;
      const dataISO = seletorData.value;
      const dataApi = dataISO.split('-').reverse().join('/'); 

      if (slot.reserva.toUpperCase() === 'INDISPONIVEL' || slot.reserva.toUpperCase() === 'BLOQUEADO') {
          statusClass = 'status-indisponivel';
          vagasTexto = 'Indisp.';
      } else if (vagasLivres > 0) {
        statusClass = 'status-disponivel';
        vagasTexto = isQuickMassageOrReiki ? 'Vaga' : `${vagasLivres}/${slot.vagas_totais} Vagas`;
      } else {
        statusClass = 'status-lotado';
        vagasTexto = 'Esgotado';
      }
      
      // Lógica Admin View
      if (isAdmin) {
        adminSlotHtml = `
            <span class="admin-id">ID: ${slot.id_linha}</span>
            <button class="status-admin-excluir" data-id-linha="${slot.id_linha}">Excluir</button>
            ${slot.reserva.toUpperCase() === 'INDISPONIVEL' ? 
              `<span class="status-admin-reservas" data-reservas="${slot.reservas}">0 Reservas</span>` : 
              `<span class="status-admin-reservas" data-reservas="${slot.reservas}">Reservas: ${slot.reservas > 0 ? slot.reservas : slot.reserva || 0}</span>` // Exibe matrícula ou contagem de aulas
            }
        `;
          if (vagasLivres > 0 && slot.reserva.toUpperCase() !== 'INDISPONIVEL' && slot.reserva.toUpperCase() !== 'BLOQUEADO') {
            statusClass = statusClass + ' status-admin-ativo';
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
          </div>
      `;
    });

    // Adiciona um slot de adição para admin no final do grupo (se for admin)
    if (isAdmin) {
          html += `
            <div class="slot-horario status-admin-adicionar"
              data-data="${dataApi}"
              data-profissional="${grupo.profissional}"
              data-atividade="${grupo.atividade}"
              data-horario="" >
              <span class="adicionar-label">+ Adicionar Slot</span>
            </div>
          `;
    }

    html += `
          </div>
        </div>
    `;
  }

  return html;
}

// --- LÓGICA DE AGENDAMENTO (USUÁRIO) ---

function abrirModalReserva(dadosSlot) {
  agendamentoAtual = {
    idLinha: dadosSlot.idLinha,
    data: dadosSlot.data,
    horario: dadosSlot.horario,
    atividade: dadosSlot.atividade,
    profissional: dadosSlot.profissional
  };

  modalDetalhes.innerHTML = `
    <li>**Data:** ${agendamentoAtual.data}</li>
    <li>**Horário:** ${agendamentoAtual.horario}</li>
    <li>**Atividade:** ${agendamentoAtual.atividade}</li>
    <li>**Profissional:** ${agendamentoAtual.profissional}</li>
  `;
  inputMatricula.value = ''; 
  modalMensagem.textContent = ''; 
  abrirModal(modalAgendamento);
}

/**
 * CORRIGIDO: Envia JSON para evitar erro de URLSearchParams.
 */
async function confirmarAgendamento() {
  const matricula = inputMatricula.value.trim();
  if (!matricula) {
    modalMensagem.textContent = 'A matrícula é obrigatória.';
    modalMensagem.style.color = 'red';
    return;
  }
  
  btnConfirmar.disabled = true;
  modalMensagem.textContent = 'Processando sua reserva...';
  modalMensagem.style.color = 'var(--cinza-texto)';

  try {
    const dadosParaEnviar = {
      action: 'bookSlot',
      id_linha: agendamentoAtual.idLinha,
      matricula: matricula
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json', // Alterado para JSON
      },
      body: JSON.stringify(dadosParaEnviar) // Enviando como JSON
    });
    
    if (!response.ok) {
      throw new Error(`Erro de rede (${response.status}) ao tentar reservar.`);
    }
    
    const result = await response.json();
    
    if (result.status === "success") {
      modalMensagem.textContent = result.message;
      modalMensagem.style.color = 'var(--verde-moinhos)';
      carregarAgenda(); 
      setTimeout(() => fecharModal(modalAgendamento), 2000);
    } else {
      throw new Error(result.message);
    }

  } catch (error) {
    console.error('Erro ao confirmar agendamento:', error);
    modalMensagem.textContent = error.message || 'Erro ao realizar reserva. Tente novamente.';
    modalMensagem.style.color = 'red';
  } finally {
    btnConfirmar.disabled = false;
  }
}


// --- LÓGICA DE ADMIN ---

function toggleAdminView(loggedIn) {
  isAdmin = loggedIn;
    if (loggedIn) {
      btnAdminLogin.textContent = 'Logout Admin';
      btnAdminLogin.classList.remove('btn-cinza');
      btnAdminLogin.classList.add('btn-vermelho'); 
      btnGerenciarAgenda.classList.remove('hidden');
      if (!document.querySelector('.aviso-admin')) {
          container.insertAdjacentHTML('beforebegin', '<p class="aviso-admin">MODO ADMIN ATIVADO. Clique nos slots para **EXCLUIR** (permanentemente).</p>');
      }
    } else {
      btnAdminLogin.textContent = 'Login Admin';
      btnAdminLogin.classList.remove('btn-vermelho');
      btnAdminLogin.classList.add('btn-cinza');
      btnGerenciarAgenda.classList.add('hidden');
      const aviso = document.querySelector('.aviso-admin');
      if (aviso) aviso.remove();
    }
  renderizarAgendaParaData(seletorData.value);
}

function handleAdminLoginClick() {
  if (isAdmin) {
    toggleAdminView(false);
    return;
  }
  abrirModal(modalAdminLogin);
  inputAdminPassword.value = '';
  adminLoginMensagem.textContent = '';
}

function confirmarAdminLogin() {
  const password = inputAdminPassword.value.trim();
  if (password === ADMIN_PASSWORD) {
    toggleAdminView(true);
    fecharModal(modalAdminLogin);
  } else {
    adminLoginMensagem.textContent = 'Senha incorreta.';
    adminLoginMensagem.style.color = 'red';
  }
}

/**
 * CORRIGIDO: Envia JSON para evitar erro de URLSearchParams.
 */
async function handleAdminDelete(idLinha) {
  if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente o slot da linha ${idLinha}? ATENÇÃO: Isso também cancela quaisquer reservas existentes para este slot.`)) {
    return;
  }
  
  try {
    const dadosParaEnviar = { action: 'deleteSchedule', id_linha: idLinha };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json', // Alterado para JSON
      },
      body: JSON.stringify(dadosParaEnviar) // Enviando como JSON
    });

    if (!response.ok) {
      throw new Error(`Erro de rede (${response.status}) ao tentar excluir.`);
    }
    
    const result = await response.json();

    if (result.status === "success") {
      alert(result.message);
      carregarAgenda(); 
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erro ao excluir:', error);
    alert(`Erro ao excluir: ${error.message}`);
  }
}


// --- LÓGICA DE ADICIONAR HORÁRIO (Admin) ---

function updateActivitySelector(profissional) {
  const rule = professionalRules[profissional];
  adminSelectAtividade.innerHTML = '<option value="" disabled selected>Selecione a Modalidade</option>';
  adminSelectAtividade.disabled = false;
  
  if (rule) {
    rule.activities.forEach(activity => {
      const option = document.createElement('option');
      option.value = activity;
      option.textContent = activity;
      adminSelectAtividade.appendChild(option);
    });
  }
}

function renderQuickMassageGrid() {
  quickMassageHorariosGrid.innerHTML = '';
  quickMassageHours.forEach(horario => {
    const inputId = `qm-${horario.replace(':', '-')}`;
    
    quickMassageHorariosGrid.innerHTML += `
      <div class="horario-item">
        <label for="${inputId}" class="horario-label">${horario}</label>
        <input type="checkbox" id="${inputId}" data-horario="${horario}" class="qm-checkbox">
        
        <label for="indisp-${inputId}" class="label-indisponivel">Indisp.</label>
        <input type="checkbox" id="indisp-${inputId}" data-horario="${horario}" class="qm-indisp-checkbox">
      </div>
    `;
  });
}

function toggleAdminInputs() {
  const profissional = adminSelectProfissional.value;
  const atividade = adminSelectAtividade.value;
  const rule = professionalRules[profissional];
  
  quickMassageContainer.classList.add('hidden');
  horarioUnicoContainer.classList.add('hidden');
  vagasContainerUnico.classList.add('hidden'); 
  btnConfirmarAdicionarFinal.disabled = true;

  if (!profissional || !atividade) return;
  
  const isQuickMassage = atividade === 'Quick Massage';
  const isReiki = atividade === 'Reiki';
  const isAula = rule && rule.type === 'aula';
  
  btnConfirmarAdicionarFinal.disabled = false; 

  // 1. Quick Massage: Exibe a grade pré-definida
  if (isQuickMassage) {
    quickMassageContainer.classList.remove('hidden');
    renderQuickMassageGrid(); 
    
    adminInputHorario.required = false;
    adminInputVagas.required = false;
  } 
  // 2. Aulas ou Reiki: Exibe os inputs de horário e vagas
  else if (isAula || isReiki) {
    horarioUnicoContainer.classList.remove('hidden');
    adminInputHorario.required = true;
    
    const defaultVagas = isReiki ? 1 : rule.defaultVagas;
    adminInputVagas.value = defaultVagas;
    
    if (isReiki) {
      vagasContainerUnico.classList.add('hidden');
      adminInputVagas.required = false;
    } else {
      vagasContainerUnico.classList.remove('hidden');
      adminInputVagas.required = true;
    }
  }
}

/**
 * CORRIGIDO: Envia JSON para evitar erro de URLSearchParams.
 */
async function handleAdminAdicionar(event) {
  event.preventDefault();

  const data = adminSelectData.value.split('-').reverse().join('/'); // DD/MM/AAAA
  const profissional = adminSelectProfissional.value;
  const atividade = adminSelectAtividade.value;
  let horariosParaEnviar = [];

  btnConfirmarAdicionarFinal.disabled = true;
  adminAddMensagem.textContent = 'Enviando dados para a planilha...';
  adminAddMensagem.style.color = 'var(--cinza-texto)';

  // 1. Quick Massage (Múltiplos Slots)
  if (atividade === 'Quick Massage') {
    const checkboxes = quickMassageHorariosGrid.querySelectorAll('.qm-checkbox');
    checkboxes.forEach(cb => {
      const horario = cb.dataset.horario;
      const indispCb = document.getElementById(`indisp-qm-${horario.replace(':', '-')}`);
      
      if (cb.checked || indispCb.checked) {
        const reservaStatus = indispCb.checked ? 'Indisponivel' : '';
        horariosParaEnviar.push({
          Horario: horario,
          Vagas: 1, 
          Reserva: reservaStatus 
        });
      }
    });
  } 
  // 2. Aulas ou Reiki (Slot Único)
  else {
    const horario = adminInputHorario.value.trim();
    let vagas = parseInt(adminInputVagas.value.trim());

    if (atividade === 'Reiki') {
      vagas = 1;
    }
    
    if (!horario || isNaN(vagas) || vagas < 1) {
      adminAddMensagem.textContent = 'Por favor, preencha o horário e vagas corretamente.';
      adminAddMensagem.style.color = 'red';
      btnConfirmarAdicionarFinal.disabled = false;
      return;
    }

    horariosParaEnviar.push({
      Horario: horario,
      Vagas: vagas,
      Reserva: '' 
    });
  }

  if (horariosParaEnviar.length === 0) {
    adminAddMensagem.textContent = 'Selecione ou preencha pelo menos um horário para adicionar.';
    adminAddMensagem.style.color = 'orange';
    btnConfirmarAdicionarFinal.disabled = false;
    return;
  }
  
  // Dados finais para a API
  const dadosParaEnviar = {
    action: 'addMultiple', 
    data: data,
    profissional: profissional,
    atividade: atividade,
    horariosJson: JSON.stringify(horariosParaEnviar)
  };

  try {
    
    // CORREÇÃO: Enviar JSON no corpo da requisição
    const response = await fetch(apiUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json', // Mudar para JSON
      },
      body: JSON.stringify(dadosParaEnviar) // Enviar objeto como string JSON
    });
    
    if (!response.ok) {
      throw new Error(`Erro de rede (${response.status}) ao tentar adicionar horários.`);
    }
    
    const result = await response.json(); 

    if (result.status === "success") {
      adminAddMensagem.textContent = result.message;
      adminAddMensagem.style.color = 'var(--verde-moinhos)';
      
      carregarAgenda(); 
      setTimeout(() => fecharModal(modalAdminAdicionar), 2000); 

    } else {
      // Erro reportado pelo Apps Script
      throw new Error(result.message);
    }

  } catch (error) {
    console.error('Erro ao adicionar agendamento:', error);
    adminAddMensagem.textContent = `Erro de comunicação: ${error.message}`;
    adminAddMensagem.style.color = 'red';
  } finally {
    btnConfirmarAdicionarFinal.disabled = false;
  }
}


// --- LÓGICA DE CONSULTA (MINHAS RESERVAS) ---

async function handleBuscarReservas() {
  const matricula = inputConsultaMatricula.value.trim();
  if (!matricula) {
      consultaMensagem.textContent = 'Por favor, insira sua matrícula.';
      consultaMensagem.style.color = 'red';
      return;
  }
  
  consultaMensagem.textContent = 'Buscando reservas...';
  consultaMensagem.style.color = 'var(--cinza-texto)';
  listaAgendamentos.innerHTML = ''; 

  try {
    // Usa GET para consulta de dados (leitura)
    const query = new URLSearchParams({ action: 'getMyBookings', matricula }).toString();
    const response = await fetch(`${apiUrl}?${query}`);
    
    if (!response.ok) {
      throw new Error(`Erro de rede (${response.status}) ao buscar reservas.`);
    }
    
    const result = await response.json();
    
    consultaMensagem.textContent = '';
    consultaViewInicial.classList.add('hidden');
    consultaViewResultados.classList.remove('hidden');

    if (result.status === "success") {
      listaAgendamentos.innerHTML = renderizarReservas(result.data, matricula);
    } else {
        listaAgendamentos.innerHTML = `<p style="text-align:center; color:red;">${result.message || 'Erro desconhecido ao buscar reservas.'}</p>`;
    }
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    consultaMensagem.textContent = `Erro ao buscar: ${error.message}`;
    consultaMensagem.style.color = 'red';
  }
}

function renderizarReservas(reservas, matricula) {
  // Ordena por data e depois por horário
  reservas.sort((a, b) => {
    // Converte data DD/MM/AAAA para Date para comparação
    const partsA = a.data.split('/');
    const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
    const partsB = b.data.split('/');
    const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);

    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return a.horario.localeCompare(b.horario);
  });
  
  if (!reservas || reservas.length === 0) {
    return `<p style="text-align:center;">Nenhuma reserva futura encontrada para ${matricula}.</p>`;
  }
  
  let html = '<ul>';
  reservas.forEach(reserva => {
    html += `
        <li class="item-reserva">
            <span>${reserva.data} | ${reserva.horario} | **${reserva.atividade}** com ${reserva.profissional}</span>
            <button class="btn-cancelar-reserva btn-modal btn-vermelho" 
                    data-booking-id="${reserva.id}" 
                    data-slot-id="${reserva.slotId}" 
                    data-matricula="${matricula}">Cancelar</button>
        </li>
    `;
  });
  html += '</ul>';
  return html;
}

/**
 * CORRIGIDO: Envia JSON para evitar erro de URLSearchParams.
 */
async function handleCancelBooking(event) {
  const target = event.target;
  if (!target.classList.contains('btn-cancelar-reserva')) return;
  
  // Pega bookingId (linha na Reservas) e slotId (linha na Dados)
  const { bookingId, slotId, matricula } = target.dataset; 
  if (!confirm(`Deseja realmente CANCELAR a reserva de ${target.previousElementSibling.textContent}?`)) return;

  target.disabled = true;
  target.textContent = 'Cancelando...';

  try {
    const dadosParaEnviar = { action: 'cancelBooking', bookingId, slotId, matricula };
    
    // Usa POST para operações de cancelamento (escrita)
    const response = await fetch(apiUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json', // Alterado para JSON
      },
      body: JSON.stringify(dadosParaEnviar) // Enviando como JSON
    });

    if (!response.ok) {
      throw new Error(`Erro de rede (${response.status}) ao tentar cancelar.`);
    }
    
    const result = await response.json();

    if (result.status === "success") {
      alert(result.message);
      handleBuscarReservas(); 
      carregarAgenda(); 
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erro ao cancelar:', error);
    alert(`Erro ao cancelar: ${error.message}`);
  } finally {
    target.disabled = false;
    target.textContent = 'Cancelar';
  }
}

function voltarConsulta() {
  consultaViewInicial.classList.remove('hidden');
  consultaViewResultados.classList.add('hidden');
  consultaMensagem.textContent = '';
  // inputConsultaMatricula.value = ''; // Mantém a matrícula preenchida para facilitar
}


// --- LIGAÇÃO DE EVENT LISTENERS FINAIS ---

seletorData.addEventListener('change', carregarAgenda);
btnCancelar.addEventListener('click', () => fecharModal(modalAgendamento));
btnConfirmar.addEventListener('click', confirmarAgendamento);
btnAdminLogin.addEventListener('click', handleAdminLoginClick);
document.getElementById('btn-cancelar-admin-login').addEventListener('click', () => fecharModal(modalAdminLogin));
document.getElementById('btn-confirmar-admin-login').addEventListener('click', confirmarAdminLogin);
btnGerenciarAgenda.addEventListener('click', () => abrirModal(modalAdminGerenciar));
btnFecharAdminGerenciar.addEventListener('click', () => fecharModal(modalAdminGerenciar));
btnAdminLogout.addEventListener('click', () => {
  fecharModal(modalAdminGerenciar);
  toggleAdminView(false);
});
adminSelectProfissional.addEventListener('change', (e) => {
  updateActivitySelector(e.target.value);
  toggleAdminInputs();
});
adminSelectAtividade.addEventListener('change', toggleAdminInputs);
btnAdminAdicionar.addEventListener('click', () => {
  formAdicionarHorario.reset();
  adminSelectAtividade.disabled = true;
  toggleAdminInputs(); 
  adminAddMensagem.textContent = '';
  fecharModal(modalAdminGerenciar);
  abrirModal(modalAdminAdicionar);
});
btnCancelarAdicionarFinal.addEventListener('click', () => fecharModal(modalAdminAdicionar)); 
formAdicionarHorario.addEventListener('submit', handleAdminAdicionar);
btnConsultarReservas.addEventListener('click', () => {
  voltarConsulta(); 
  abrirModal(modalConsulta);
});
btnFecharConsulta.addEventListener('click', () => fecharModal(modalConsulta));
btnBuscarReservas.addEventListener('click', handleBuscarReservas);
btnVoltarConsulta.addEventListener('click', voltarConsulta);
modalConsulta.addEventListener('click', handleCancelBooking);

// Listener principal na grade de agendamentos
container.addEventListener('click', function(event) {
  const target = event.target;
  
  // Toggle do Acordeão
  if (target.classList.contains('titulo-atividade')) {
    target.classList.toggle('ativo');
    const horarios = target.nextElementSibling;
    if (horarios.style.maxHeight) {
      horarios.style.maxHeight = null;
    } else {
      horarios.style.maxHeight = horarios.scrollHeight + "px";
    }
  }

  // Ação Admin: Excluir
  if (isAdmin && target.classList.contains('status-admin-excluir')) {
    const idLinha = target.dataset.idLinha;
    if (idLinha) {
      handleAdminDelete(idLinha);
    }
  } 
  // Ação Usuário: Reservar
  else if (target.closest('.slot-horario') && target.closest('.slot-horario').classList.contains('status-disponivel') && !isAdmin) {
    const slotElement = target.closest('.slot-horario');
    celulaClicada = slotElement;
    abrirModalReserva(slotElement.dataset);
  }
  // Ação Admin: Adicionar Slot Vazio
  else if (isAdmin && target.closest('.slot-horario') && target.closest('.slot-horario').classList.contains('status-admin-adicionar')) {
    const slotData = target.closest('.slot-horario').dataset;
    adminSelectData.value = slotData.data.split('/').reverse().join('-');
    adminSelectProfissional.value = slotData.profissional;
    
    updateActivitySelector(slotData.profissional);
    adminSelectAtividade.value = slotData.atividade;
    toggleAdminInputs();
    
    if (slotData.atividade !== 'Quick Massage') {
      adminInputHorario.value = slotData.horario;
    }

    fecharModal(modalAdminGerenciar);
    abrirModal(modalAdminAdicionar);
  }
});


// Inicialização
carregarAgenda();
// A última linha deve ser o fechamento do bloco de código, sem chaves soltas ou blocos incompletos.
