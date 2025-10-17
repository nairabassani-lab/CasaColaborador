// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modais de Agendamento (Usuário) - Já existentes
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
const btnAdminLogout = document.getElementById('btn-admin-logout'); // Adicionado
const btnFecharAdminGerenciar = document.getElementById('btn-fechar-admin-gerenciar'); // Adicionado

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
const listaAgendamentos = document.getElementById('lista-agendamentos'); // Adicionado

// --- NOVAS REFERÊNCIAS ESPECÍFICAS DO MODAL ADICIONAR ---
const adminSelectProfissional = document.getElementById('admin-select-profissional');
const adminSelectAtividade = document.getElementById('admin-select-atividade');
const quickMassageContainer = document.getElementById('quick-massage-container');
const quickMassageHorariosGrid = document.getElementById('quick-massage-horarios');
const horarioUnicoContainer = document.getElementById('horario-unico-container');
const vagasContainerUnico = document.getElementById('vagas-container-unico'); // ID corrigido
const adminInputVagas = document.getElementById('admin-input-vagas');
const adminInputHorario = document.getElementById('admin-input-horario');
const btnConfirmarAdicionarFinal = document.getElementById('btn-confirmar-adicionar-final'); // ID corrigido
const btnCancelarAdicionarFinal = document.getElementById('btn-cancelar-adicionar-final'); // ID corrigido
const adminAddMensagem = document.getElementById('admin-add-mensagem');
const adminSelectData = document.getElementById('admin-select-data');

// --- Variáveis de Estado e Configurações ---
let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;
let isAdmin = false;
const ADMIN_PASSWORD = 'admin'; // Senha simples para demonstração

// --- MAPA DE ATIVIDADES E REGRAS (IMPLEMENTAÇÃO DAS REGRAS) ---
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
        type: 'mixed', // Permite Quick Massage e Reiki
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
    // Adicione um pequeno delay para garantir que o CSS de transição funcione
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
    const partes = dataString.split('-'); // Espera AAAA-MM-DD
    const data = new Date(partes[0], partes[1] - 1, partes[2]);
    const opcoes = { weekday: 'long', timeZone: 'UTC' }; // Use UTC para evitar desvios de fuso horário
    let diaDaSemana = data.toLocaleDateString('pt-BR', opcoes);
    // Capitaliza a primeira letra para melhor apresentação
    diaDaSemana = diaDaSemana.charAt(0).toUpperCase() + diaDaSemana.slice(1);
    diaSemanaSpan.textContent = `(${diaDaSemana})`;
}

// --- LÓGICA DE CARREGAMENTO E RENDERIZAÇÃO DA AGENDA (ESSENCIAL) ---

// **FUNÇÃO CORRIGIDA/ADICIONADA**
async function carregarAgenda() {
    const dataSelecionada = seletorData.value;
    if (!dataSelecionada) {
        // Define a data atual como padrão se não houver seleção
        const hoje = new Date();
        const yyyy = hoje.getFullYear();
        const mm = String(hoje.getMonth() + 1).padStart(2, '0');
        const dd = String(hoje.getDate()).padStart(2, '0');
        const dataPadrao = `${yyyy}-${mm}-${dd}`;
        seletorData.value = dataPadrao;
        atualizarDiaDaSemana(dataPadrao);
        renderizarAgendaParaData(dataPadrao);
        return;
    }
    atualizarDiaDaSemana(dataSelecionada);
    renderizarAgendaParaData(dataSelecionada);
}

// **FUNÇÃO CORRIGIDA/ADICIONADA**
async function renderizarAgendaParaData(dataISO) {
    container.innerHTML = '<p class="loading">Carregando agenda...</p>';

    // Converte de AAAA-MM-DD para DD/MM/AAAA para a API (assumindo que a API espera DD/MM/AAAA)
    const dataApi = dataISO.split('-').reverse().join('/'); 

    try {
        const query = new URLSearchParams({ action: 'getSchedule', date: dataApi }).toString();
        const response = await fetch(`${apiUrl}?${query}`);
        const result = await response.json();
        
        if (result.status === "success") {
            todosOsAgendamentos = result.data;
            container.innerHTML = criarHTMLAgenda(todosOsAgendamentos);
        } else {
            container.innerHTML = `<p class="alerta-erro">Erro ao carregar a agenda: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Erro de comunicação com a API:', error);
        container.innerHTML = '<p class="alerta-erro">Erro de conexão. Verifique o console.</p>';
    }
}

// **FUNÇÃO CORRIGIDA/ADICIONADA**
function criarHTMLAgenda(agendamentos) {
    if (!agendamentos || agendamentos.length === 0) {
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
        const isQuickMassage = grupo.atividade.includes('Quick Massage') || grupo.atividade.includes('Reiki'); // Slots individuais

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

            if (slot.reserva === 'Indisponivel') {
                 statusClass = 'status-indisponivel';
                 vagasTexto = 'Indisp.';
            } else if (vagasLivres > 0) {
                statusClass = 'status-disponivel';
                vagasTexto = isQuickMassage ? 'Vaga' : `${vagasLivres}/${slot.vagas_totais} Vagas`;
            } else {
                statusClass = 'status-lotado';
                vagasTexto = 'Esgotado';
            }
            
            // Lógica Admin View
            if (isAdmin) {
                adminSlotHtml = `
                    <span class="admin-id">ID: ${slot.id_linha}</span>
                    <button class="status-admin-excluir" data-id-linha="${slot.id_linha}">Excluir</button>
                    ${slot.reserva === 'Indisponivel' ? `<span class="status-admin-reservas" data-reservas="${slot.reservas}">0 Reservas</span>` : `<span class="status-admin-reservas" data-reservas="${slot.reservas}">Reservas: ${slot.reservas}</span>`}
                `;
                 if (vagasLivres > 0 && slot.reserva !== 'Indisponivel') {
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

// **FUNÇÃO CORRIGIDA/ADICIONADA**
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
    inputMatricula.value = ''; // Limpa a matrícula
    modalMensagem.textContent = ''; // Limpa a mensagem
    abrirModal(modalAgendamento);
}

// **FUNÇÃO CORRIGIDA/ADICIONADA**
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
        const query = new URLSearchParams(dadosParaEnviar).toString();
        const response = await fetch(`${apiUrl}?${query}`);
        const result = await response.json();
        
        if (result.status === "success") {
            modalMensagem.textContent = result.message;
            modalMensagem.style.color = 'var(--verde-moinhos)';
            carregarAgenda(); // Recarrega para mostrar a mudança
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
    // ... (restante da função toggleAdminView mantida) ...
     if (loggedIn) {
        btnAdminLogin.textContent = 'Logout Admin';
        btnAdminLogin.classList.remove('btn-cinza');
        btnAdminLogin.classList.add('btn-vermelho'); 
        btnGerenciarAgenda.classList.remove('hidden');
        if (!document.querySelector('.aviso-admin')) {
             container.insertAdjacentHTML('beforebegin', '<p class="aviso-admin">MODO ADMIN ATIVADO. Clique nos slots para GERENCIAR (Excluir/Ver).</p>');
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

// IMPLEMENTAÇÃO DE EXCLUSÃO
async function handleAdminDelete(idLinha) {
    if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente o slot da linha ${idLinha}? ATENÇÃO: Isso também cancela quaisquer reservas existentes para este slot.`)) {
        return;
    }
    
    try {
        const query = new URLSearchParams({ action: 'deleteSchedule', id_linha: idLinha }).toString();
        const response = await fetch(`${apiUrl}?${query}`);
        const result = await response.json();

        if (result.status === "success") {
            alert(result.message);
            carregarAgenda(); // Recarrega para refletir a exclusão
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert(`Erro ao excluir: ${error.message}`);
    }
}


// --- LÓGICA DE ADICIONAR HORÁRIO (COMPLETA) ---

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
    
    // Esconde todos os containers por padrão
    quickMassageContainer.classList.add('hidden');
    horarioUnicoContainer.classList.add('hidden');
    vagasContainerUnico.classList.add('hidden'); // Esconde vagas por padrão
    btnConfirmarAdicionarFinal.disabled = true;

    if (!profissional || !atividade) return;
    
    const isQuickMassage = atividade === 'Quick Massage';
    const isReiki = atividade === 'Reiki';
    const isAula = rule && rule.type === 'aula';
    
    btnConfirmarAdicionarFinal.disabled = false; // Habilita o botão ao selecionar a Atividade

    // 1. Quick Massage: Exibe a grade pré-definida
    if (isQuickMassage) {
        quickMassageContainer.classList.remove('hidden');
        renderQuickMassageGrid(); 
        
        // Remove 'required' dos inputs de horário/vagas únicos
        adminInputHorario.required = false;
        adminInputVagas.required = false;
    } 
    // 2. Aulas ou Reiki: Exibe os inputs de horário e vagas
    else if (isAula || isReiki) {
        horarioUnicoContainer.classList.remove('hidden');
        adminInputHorario.required = true;
        
        // Ajusta o padrão de vagas
        const defaultVagas = isReiki ? 1 : rule.defaultVagas;
        adminInputVagas.value = defaultVagas;
        
        // Esconde o input de vagas para Reiki (sempre 1 vaga)
        if (isReiki) {
            vagasContainerUnico.classList.add('hidden');
            adminInputVagas.required = false;
        } else {
            vagasContainerUnico.classList.remove('hidden');
            adminInputVagas.required = true;
        }
    }
}

async function handleAdminAdicionar(event) {
    event.preventDefault();

    const data = adminSelectData.value.split('-').reverse().join('/'); // Formato DD/MM/AAAA
    const profissional = adminSelectProfissional.value;
    const atividade = adminSelectAtividade.value;
    let horariosParaEnviar = [];

    btnConfirmarAdicionarFinal.disabled = true;
    adminAddMensagem.textContent = 'Enviando dados para a planilha...';
    adminAddMensagem.style.color = 'var(--cinza-texto)';

    // Lógica 1: Quick Massage (Múltiplos Slots)
    if (atividade === 'Quick Massage') {
        const checkboxes = quickMassageHorariosGrid.querySelectorAll('.qm-checkbox');
        checkboxes.forEach(cb => {
            const horario = cb.dataset.horario;
            const indispCb = document.getElementById(`indisp-qm-${horario.replace(':', '-')}`);
            
            // Cria o slot se o checkbox de horário está marcado OU o checkbox de indisponibilidade está marcado
            if (cb.checked || indispCb.checked) {
                const reservaStatus = indispCb.checked ? 'Indisponivel' : '';
                horariosParaEnviar.push({
                    Horario: horario,
                    Vagas: 1, // Regra: 1 vaga fixa
                    Reserva: reservaStatus 
                });
            }
        });
    } 
    // Lógica 2: Aulas ou Reiki (Slot Único)
    else {
        const horario = adminInputHorario.value.trim();
        let vagas = parseInt(adminInputVagas.value.trim());

        // Para Reiki, garante que vagas seja 1 (se estiver sendo usado o slot único)
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

    try {
        const dadosParaEnviar = {
            action: 'addMultiple', 
            data: data,
            profissional: profissional,
            atividade: atividade,
            horariosJson: JSON.stringify(horariosParaEnviar)
        };
        
        const query = new URLSearchParams(dadosParaEnviar).toString();
        const response = await fetch(`${apiUrl}?${query}`);
        const result = await response.json(); 

        if (result.status === "success") {
            adminAddMensagem.textContent = result.message;
            adminAddMensagem.style.color = 'var(--verde-moinhos)';
            
            carregarAgenda(); 
            setTimeout(() => fecharModal(modalAdminAdicionar), 2000); 

        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Erro ao adicionar agendamento:', error);
        adminAddMensagem.textContent = error.message || 'Erro de comunicação ao adicionar. Tente novamente.';
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
    listaAgendamentos.innerHTML = ''; // Limpa resultados anteriores

    try {
        const query = new URLSearchParams({ action: 'getMyBookings', matricula }).toString();
        const response = await fetch(`${apiUrl}?${query}`);
        const result = await response.json();
        
        consultaMensagem.textContent = '';
        consultaViewInicial.classList.add('hidden');
        consultaViewResultados.classList.remove('hidden');

        if (result.status === "success") {
            listaAgendamentos.innerHTML = renderizarReservas(result.data, matricula);
        } else {
             listaAgendamentos.innerHTML = `<p style="text-align:center; color:red;">Erro: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Erro ao buscar reservas:', error);
        consultaMensagem.textContent = 'Erro ao buscar. Tente novamente.';
        consultaMensagem.style.color = 'red';
    }
}

function renderizarReservas(reservas, matricula) {
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
                         data-matricula="${matricula}">Cancelar</button>
            </li>
        `;
    });
    html += '</ul>';
    return html;
}

async function handleCancelBooking(event) {
    const target = event.target;
    if (!target.classList.contains('btn-cancelar-reserva')) return;
    
    const { bookingId, matricula } = target.dataset;
    if (!confirm(`Deseja realmente CANCELAR a reserva de ${target.previousElementSibling.textContent}?`)) return;

    target.disabled = true;
    target.textContent = 'Cancelando...';

    try {
        const dadosParaEnviar = { action: 'cancelBooking', bookingId, matricula };
        const query = new URLSearchParams(dadosParaEnviar).toString();
        const response = await fetch(`${apiUrl}?${query}`);
        const result = await response.json();

        if (result.status === "success") {
            alert(result.message);
            handleBuscarReservas(); // Recarrega a lista
            carregarAgenda(); // Recarrega a grade principal
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
    inputConsultaMatricula.value = '';
}


// --- LIGAÇÃO DE EVENT LISTENERS FINAIS ---

// Data Selector
seletorData.addEventListener('change', carregarAgenda);

// Modal Reserva (Usuário)
btnCancelar.addEventListener('click', () => fecharModal(modalAgendamento));
btnConfirmar.addEventListener('click', confirmarAgendamento);

// Modal Login Admin
btnAdminLogin.addEventListener('click', handleAdminLoginClick);
document.getElementById('btn-cancelar-admin-login').addEventListener('click', () => fecharModal(modalAdminLogin));
document.getElementById('btn-confirmar-admin-login').addEventListener('click', confirmarAdminLogin);

// Modal Gerenciar Admin
btnGerenciarAgenda.addEventListener('click', () => abrirModal(modalAdminGerenciar));
btnFecharAdminGerenciar.addEventListener('click', () => fecharModal(modalAdminGerenciar));
btnAdminLogout.addEventListener('click', () => {
    fecharModal(modalAdminGerenciar);
    toggleAdminView(false);
});

// Modal Adicionar (Admin)
adminSelectProfissional.addEventListener('change', (e) => {
    updateActivitySelector(e.target.value);
    toggleAdminInputs();
});
adminSelectAtividade.addEventListener('change', toggleAdminInputs);
btnAdminAdicionar.addEventListener('click', () => {
    // Limpa o formulário antes de abrir
    formAdicionarHorario.reset();
    adminSelectAtividade.disabled = true;
    toggleAdminInputs(); 
    adminAddMensagem.textContent = '';
    
    fecharModal(modalAdminGerenciar);
    abrirModal(modalAdminAdicionar);
});
btnCancelarAdicionarFinal.addEventListener('click', () => fecharModal(modalAdminAdicionar)); 
formAdicionarHorario.addEventListener('submit', handleAdminAdicionar);

// Modal Consulta Reservas
btnConsultarReservas.addEventListener('click', () => {
    voltarConsulta(); // Reseta para a view inicial
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

    // Ação na Célula de Agendamento (Usuário / Admin)
    if (isAdmin && target.classList.contains('status-admin-excluir')) {
        const idLinha = target.dataset.idLinha;
        if (idLinha) {
            handleAdminDelete(idLinha);
        }
    } else if (target.closest('.slot-horario') && target.closest('.slot-horario').classList.contains('status-disponivel') && !isAdmin) {
         // Ação de reserva do Usuário
        const slotElement = target.closest('.slot-horario');
        celulaClicada = slotElement;
        abrirModalReserva(slotElement.dataset);

    }
    // Adicionar slot vazio (Admin)
    else if (isAdmin && target.classList.contains('status-admin-adicionar')) {
        // Pré-preenche o modal de adição com a data, prof e atividade do slot vazio
        adminSelectData.value = target.dataset.data.split('/').reverse().join('-');
        adminSelectProfissional.value = target.dataset.profissional;
        
        // Dispara o evento 'change' para atualizar a lista de atividades e os inputs
        updateActivitySelector(target.dataset.profissional);
        adminSelectAtividade.value = target.dataset.atividade;
        toggleAdminInputs();
        
        // Para Quick Massage (grade), o horário não será pré-preenchido
        if (target.dataset.atividade !== 'Quick Massage') {
            adminInputHorario.value = target.dataset.horario;
        }

        fecharModal(modalAdminGerenciar);
        abrirModal(modalAdminAdicionar);
    }
});


// Inicialização
carregarAgenda();
