// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

// --- REFERÊNCIAS DE DOM (Movidas para o escopo global para o fetch/render) ---
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
// Nota: 'btnGerenciarAgenda' e 'btnConsultarReservas' foram referenciados no seu código, mas não estão no HTML que você enviou. Mantive a referência, mas podem estar null.

// --- REFERÊNCIAS DE MODAIS (ADMIN E CONSULTA) ---
const modalAdminLogin = document.getElementById('modal-admin-login');
const inputAdminPassword = document.getElementById('input-admin-password');
const adminLoginMensagem = document.getElementById('admin-login-mensagem');

const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnAdminAdicionar = document.getElementById('btn-admin-adicionar');
const modalAdminAdicionar = document.getElementById('modal-admin-adicionar');
const formAdicionarHorario = document.getElementById('form-adicionar-horario');

// Nota: 'modalConsulta', 'inputConsultaMatricula', etc. não estão no HTML,
// mas vou manter a referência para evitar erros no código de Admin/Consulta que você forneceu.
const modalConsulta = document.getElementById('modal-consulta'); 
const inputConsultaMatricula = document.getElementById('input-consulta-matricula');
const consultaViewInicial = document.getElementById('consulta-view-inicial');
const consultaViewResultados = document.getElementById('consulta-view-resultados');
const consultaMensagem = document.getElementById('consulta-mensagem');
const btnFecharConsulta = document.getElementById('btn-fechar-consulta');
const btnBuscarReservas = document.getElementById('btn-buscar-reservas');
const btnVoltarConsulta = document.getElementById('btn-voltar-consulta');


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
const adminDataErroMensagem = document.getElementById('admin-data-erro-mensagem'); // Referência adicionada

// --- Variáveis de Estado e Configurações ---
let agendaData = {};
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


// --- FUNÇÕES DE UTILIDADE ---

function abrirModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('hidden');
        setTimeout(() => modalElement.style.opacity = 1, 10); 
    }
}

function fecharModal(modalElement) {
    if (modalElement) {
        modalElement.style.opacity = 0;
        setTimeout(() => modalElement.classList.add('hidden'), 300);
    }
}

function formatarDataParaDisplay(dataISO) {
    if (!dataISO) return '';
    const [year, month, day] = dataISO.split('-');
    return `${day}/${month}/${year}`;
}

function getDayOfWeek(dataISO) {
    const data = new Date(dataISO + 'T00:00:00'); 
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[data.getDay()];
}

function validarDataMinimaEAtualizarUI() {
    if (!adminSelectData || !btnConfirmarAdicionarFinal || !adminDataErroMensagem) return true;

    const dataSelecionadaString = adminSelectData.value;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const dd = String(hoje.getDate()).padStart(2, '0');
    const hojeString = `${yyyy}-${mm}-${dd}`;

    adminSelectData.min = hojeString;

    if (!dataSelecionadaString || dataSelecionadaString >= hojeString) {
        adminDataErroMensagem.classList.add('hidden');
        return true;
    } else {
        adminDataErroMensagem.textContent = 'Erro: A data selecionada não pode ser anterior ao dia de hoje.';
        adminDataErroMensagem.classList.remove('hidden');
        btnConfirmarAdicionarFinal.disabled = true;
        return false;
    }
}


// --- FUNÇÃO ADICIONADA: RENDERIZAÇÃO DA AGENDA (CRÍTICO) ---
function renderAgenda(data, container) {
    container.innerHTML = ''; // Limpa a mensagem "Carregando..."
    
    // Se não houver dados, exibe uma mensagem
    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = '<p class="loading-text">Nenhum horário disponível ou agendado para esta data.</p>';
        container.classList.remove('loading');
        return;
    }
    
    // Itera sobre as atividades no objeto de dados
    for (const atividade in data) {
        const agendamentos = data[atividade];
        
        // 1. Título do Acordeão
        const titulo = document.createElement('h2');
        titulo.className = 'titulo-atividade';
        titulo.textContent = atividade;
        // Padrão: comece fechado
        
        // 2. Container da Tabela (Acordeão)
        const tabelaContainer = document.createElement('div');
        tabelaContainer.className = 'tabela-container';
        
        const tabela = document.createElement('table');
        tabela.className = 'tabela-agenda';
        
        // --- Geração do Cabeçalho e Profissionais ---
        const thead = tabela.createTHead();
        let profissionais = [];
        
        // Coleta todos os profissionais que têm horários nesta atividade
        for (const horario in agendamentos) {
            for (const profissional in agendamentos[horario]) {
                if (!profissionais.includes(profissional)) {
                    profissionais.push(profissional);
                }
            }
        }
        
        // Cria a linha de cabeçalho
        let headerRow = thead.insertRow();
        let thHorario = document.createElement('th');
        thHorario.textContent = 'Horário';
        headerRow.appendChild(thHorario);
        
        profissionais.forEach(p => {
            let th = document.createElement('th');
            th.textContent = p;
            headerRow.appendChild(th);
        });
        
        // --- Geração do Corpo da Tabela ---
        const tbody = tabela.createTBody();
        const horariosUnicos = Object.keys(agendamentos).sort();
        const dataAtualISO = seletorData.value;
        
        horariosUnicos.forEach(horario => {
            let row = tbody.insertRow();
            let tdHorario = row.insertCell();
            tdHorario.className = 'horario-col';
            tdHorario.textContent = horario;
            
            profissionais.forEach(profissional => {
                let cell = row.insertCell();
                cell.className = 'status-cell';
                
                const slot = agendamentos[horario] ? agendamentos[horario][profissional] : null;
                
                // Adiciona dados necessários para Admin/Reserva
                cell.dataset.data = dataAtualISO;
                cell.dataset.horario = horario;
                cell.dataset.profissional = profissional;
                cell.dataset.atividade = atividade;

                if (slot) {
                    // Slot Existe (Disponível, Lotado ou Reservado)
                    const vagasOcupadas = slot.reservas ? slot.reservas.length : 0;
                    const vagasRestantes = slot.vagas - vagasOcupadas;
                    cell.dataset.id = slot.id; // ID do slot
                    
                    if (vagasRestantes > 0) {
                        cell.classList.add(isAdmin ? 'status-admin-excluir' : 'status-disponivel');
                        cell.innerHTML = `Disponível <span>(${vagasRestantes} vagas)</span>`;
                        
                        // Lógica de clique
                        cell.onclick = isAdmin 
                            ? (e) => handleAdminAction(e.currentTarget) // Gerenciar/Excluir
                            : (e) => abrirModalReserva(e.currentTarget.dataset); // Reserva do Usuário

                    } else {
                        cell.classList.add(isAdmin ? 'status-admin-lotado' : 'status-lotado');
                        cell.textContent = isAdmin ? 'Lotado (Gerenciar)' : 'Lotado';
                        cell.onclick = isAdmin ? (e) => handleAdminAction(e.currentTarget) : null;
                    }
                } else {
                    // Slot Não Existe (Fechado/Indisponível)
                    cell.classList.add(isAdmin ? 'status-admin-adicionar' : 'status-indisponivel');
                    cell.textContent = isAdmin ? 'Adicionar Slot' : 'Fechado';
                    
                    if (isAdmin) {
                        cell.onclick = (e) => handleAdminAction(e.currentTarget); // Adicionar Slot
                    }
                }
            });
        });
        
        tabelaContainer.appendChild(tabela);
        container.appendChild(titulo);
        container.appendChild(tabelaContainer);
        
        // Lógica para abrir o acordeão ao clicar no título
        titulo.addEventListener('click', () => {
             titulo.classList.toggle('ativo');
             // Ajuste o max-height para a altura real da tabela para a transição
             tabelaContainer.style.maxHeight = titulo.classList.contains('ativo') ? tabelaContainer.scrollHeight + 30 + "px" : "0";
        });
    }
    
    container.classList.remove('loading');
}


// --- FUNÇÃO ADICIONADA: BUSCA DE DADOS (CRÍTICO) ---
async function fetchAgenda(dataISO, container) {
    if (!dataISO) return;

    container.classList.add('loading');
    container.innerHTML = '<p class="loading-text">Carregando a agenda...</p>';

    try {
        const urlComData = `${apiUrl}?action=getAgenda&date=${dataISO}`;
        const response = await fetch(urlComData);
        
        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Salva os dados e renderiza
        agendaData = data.agenda || {};
        renderAgenda(agendaData, container);
        
    } catch (error) {
        console.error('Erro ao buscar a agenda:', error);
        container.innerHTML = '<p class="loading-text" style="color: red;">Erro ao carregar a agenda. Verifique sua conexão ou a URL da API.</p>';
        container.classList.remove('loading');
    }
}

// --- FUNÇÃO DE CONTROLE DE CARREGAMENTO (Chamada na inicialização e mudança de data) ---
function carregarAgenda() {
    if (seletorData && container) {
        fetchAgenda(seletorData.value, container);
    }
}


// --- LÓGICA DE ADMIN AÇÃO NA CÉLULA (Simplificada) ---
function handleAdminAction(cell) {
    const data = cell.dataset;
    
    if (cell.classList.contains('status-admin-adicionar')) {
        // Pré-preenche o modal de adição
        adminSelectData.value = data.data.split('/').reverse().join('-');
        adminSelectProfissional.value = data.profissional;
        
        // Dispara o evento 'change' para atualizar a lista de atividades e os inputs
        updateActivitySelector(data.profissional);
        adminSelectAtividade.value = data.atividade;
        toggleAdminInputs();
        
        // Para Quick Massage (grade), o horário não será pré-preenchido
        if (data.atividade !== 'Quick Massage') {
            adminInputHorario.value = data.horario;
        }
        
        // Oculta gerenciar e abre adicionar
        fecharModal(modalAdminGerenciar);
        abrirModal(modalAdminAdicionar);

    } else if (cell.classList.contains('status-admin-excluir') || cell.classList.contains('status-admin-lotado')) {
        // Lógica para Gerenciar/Excluir (aqui você abriria um modal de gestão)
        // Por enquanto, vamos chamar a função de exclusão direta se for 'status-admin-excluir'
        if (cell.classList.contains('status-admin-excluir')) {
             handleAdminDelete(data.id);
        } else {
             alert(`Slot Lotado ID ${data.id}. Implementar modal de gestão de reservas.`);
        }
    }
}

// --- FUNÇÃO ADICIONADA: ABRIR MODAL DE RESERVA ---
function abrirModalReserva(data) {
    const detalhes = document.getElementById('modal-agendamento-detalhes');
    
    detalhes.innerHTML = `
        <ul class="detalhes-agendamento-lista">
            <li><strong>Atividade:</strong> ${data.atividade}</li>
            <li><strong>Profissional:</strong> ${data.profissional}</li>
            <li><strong>Data:</strong> ${formatarDataParaDisplay(data.data)}</li>
            <li><strong>Horário:</strong> ${data.horario}</li>
        </ul>
    `;
    abrirModal(modalAgendamento);
    // Armazena dados do slot clicado para o botão Confirmar
    modalAgendamento.dataset.slotData = JSON.stringify(data);
}


// --- LÓGICA DE ADMIN (Funções existentes, mantidas) ---

function toggleAdminView(loggedIn) {
    // ... (Mantida a lógica que você forneceu) ...
    isAdmin = loggedIn;
    // ... (restante da função toggleAdminView mantida) ...
    if (loggedIn) {
        btnAdminLogin.textContent = 'Logout Admin';
        btnAdminLogin.classList.remove('btn-cinza');
        btnAdminLogin.classList.add('btn-vermelho'); 
        // btnGerenciarAgenda.classList.remove('hidden'); // Comentei pois não está no HTML
        if (!document.querySelector('.aviso-admin')) {
             container.insertAdjacentHTML('beforebegin', '<p class="aviso-admin">MODO ADMIN ATIVADO. Clique nos slots para GEREENCIAR (Excluir/Ver).</p>');
        }
    } else {
        btnAdminLogin.textContent = 'Login Admin';
        btnAdminLogin.classList.remove('btn-vermelho');
        btnAdminLogin.classList.add('btn-cinza');
        // btnGerenciarAgenda.classList.add('hidden'); // Comentei
        const aviso = document.querySelector('.aviso-admin');
        if (aviso) aviso.remove();
    }
    carregarAgenda();
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

function updateActivitySelector(profissional) {
    // ... (Mantida a lógica que você forneceu) ...
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
    // ... (Mantida a lógica que você forneceu) ...
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
    // ... (Mantida a lógica que você forneceu) ...
    const profissional = adminSelectProfissional.value;
    const atividade = adminSelectAtividade.value;
    const rule = professionalRules[profissional];
    
    // Esconde todos os containers por padrão
    quickMassageContainer.classList.add('hidden');
    horarioUnicoContainer.classList.add('hidden');
    vagasContainerUnico.classList.add('hidden');
    btnConfirmarAdicionarFinal.disabled = true;

    validarDataMinimaEAtualizarUI();

    if (!profissional || !atividade || !adminSelectData.value || !validarDataMinimaEAtualizarUI()) return;

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
        // O botão será habilitado se houver horários selecionados (lógica a ser implementada no grid listener)
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

async function handleAdminAdicionar(event) {
    // ... (Mantida a lógica que você forneceu) ...
    event.preventDefault();

    const data = adminSelectData.value.split('-').reverse().join('/'); // DD/MM/AAAA
    const profissional = adminSelectProfissional.value;
    const atividade = adminSelectAtividade.value;
    let horariosParaEnviar = [];

    btnConfirmarAdicionarFinal.disabled = true;
    adminAddMensagem.textContent = 'Enviando dados para a planilha...';
    adminAddMensagem.style.color = '#495057';

    // Lógica 1: Quick Massage (Múltiplos Slots)
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
    // Lógica 2: Aulas ou Reiki (Slot Único)
    else {
        const horario = adminInputHorario.value.trim();
        const vagas = parseInt(adminInputVagas.value.trim());

        if (!horario || isNaN(vagas) || vagas < 1) {
            adminAddMensagem.textContent = 'Por favor, preencha o horário e vagas corretamente.';
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
            adminAddMensagem.style.color = '#00a99d';
            
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

async function handleAdminDelete(idLinha) {
    // ... (Mantida a lógica que você forneceu) ...
    if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente o slot da linha ${idLinha}?`)) {
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


// --- LÓGICA DE CONSULTA (Funções existentes, mantidas) ---

async function handleBuscarReservas() {
    // ... (Mantida a lógica que você forneceu) ...
    const matricula = inputConsultaMatricula.value.trim();
    if (!matricula) {
        consultaMensagem.textContent = 'Por favor, insira sua matrícula.';
        consultaMensagem.style.color = 'red';
        return;
    }
    
    consultaMensagem.textContent = 'Buscando reservas...';
    consultaMensagem.style.color = 'var(--cinza-texto)';

    // ... (Lógica de fetch e renderização mantida) ...
    
    try {
        const query = new URLSearchParams({ action: 'getMyBookings', matricula }).toString();
        const response = await fetch(`${apiUrl}?${query}`);
        const result = await response.json();
        
        consultaMensagem.textContent = '';
        consultaViewInicial.classList.add('hidden');
        consultaViewResultados.classList.remove('hidden');

        if (result.status === "success") {
            document.getElementById('lista-agendamentos').innerHTML = renderizarReservas(result.data, matricula);
        } else {
             document.getElementById('lista-agendamentos').innerHTML = `<p style="text-align:center; color:red;">Erro: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Erro ao buscar reservas:', error);
        consultaMensagem.textContent = 'Erro ao buscar. Tente novamente.';
        consultaMensagem.style.color = 'red';
    }
}

function renderizarReservas(reservas, matricula) {
    // ... (Mantida a lógica que você forneceu) ...
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
    // ... (Mantida a lógica que você forneceu) ...
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
    // ... (Lógica mantida) ...
    if (consultaViewInicial) consultaViewInicial.classList.remove('hidden');
    if (consultaViewResultados) consultaViewResultados.classList.add('hidden');
    if (consultaMensagem) consultaMensagem.textContent = '';
}


// --- INICIALIZAÇÃO E LISTENERS ---

function initializePage() {
    // 1. Define a data atual como padrão no seletor
    const hoje = new Date().toISOString().split('T')[0];
    if (seletorData) {
        seletorData.value = hoje;
        seletorData.addEventListener('change', (e) => {
            diaSemanaSpan.textContent = getDayOfWeek(e.target.value);
            carregarAgenda();
        });
        // Configura o dia da semana inicial
        if (diaSemanaSpan) diaSemanaSpan.textContent = getDayOfWeek(hoje);
    }

    // 2. Inicia o carregamento da agenda com a data atual
    carregarAgenda();
    
    // 3. Adiciona listeners gerais
    
    // Listeners do seletor de data Admin
    if (adminSelectData) {
        adminSelectData.addEventListener('change', toggleAdminInputs);
        validarDataMinimaEAtualizarUI(); // Configura o 'min' inicial
    }

    // Listeners do Modal Adicionar (NOVA LÓGICA DE ENADEAMENTO)
    if (adminSelectProfissional) {
        adminSelectProfissional.addEventListener('change', (e) => {
            updateActivitySelector(e.target.value);
            toggleAdminInputs();
        });
    }

    if (adminSelectAtividade) {
        adminSelectAtividade.addEventListener('change', toggleAdminInputs);
    }

    // Login Admin
    if (btnAdminLogin) btnAdminLogin.addEventListener('click', handleAdminLoginClick);
    if (btnConfirmarAdminLogin) btnConfirmarAdminLogin.addEventListener('click', confirmarAdminLogin);
    if (btnCancelarAdminLogin) btnCancelarAdminLogin.addEventListener('click', () => fecharModal(modalAdminLogin));
    
    // Modal Admin Gerenciar
    if (btnAdminAdicionar) btnAdminAdicionar.addEventListener('click', () => {
        formAdicionarHorario.reset();
        if (adminSelectAtividade) adminSelectAtividade.disabled = true;
        toggleAdminInputs(); 
        if (adminAddMensagem) adminAddMensagem.textContent = '';
        
        fecharModal(modalAdminGerenciar);
        abrirModal(modalAdminAdicionar);
    });
    
    // Modal Adicionar
    if (btnCancelarAdicionarFinal) btnCancelarAdicionarFinal.addEventListener('click', () => fecharModal(modalAdminAdicionar));
    if (formAdicionarHorario) formAdicionarHorario.addEventListener('submit', handleAdminAdicionar);

    // Fechar Modais com 'X'
    document.querySelectorAll('.modal-fechar').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-backdrop');
            fecharModal(modal);
        });
    });
    
    // Clique na célula da agenda (Reserva/Admin)
    if (container) {
        container.addEventListener('click', function(event) {
            const target = event.target.closest('.status-cell');
            if (!target) return;
            
            // Ação na Célula de Agendamento (Usuário / Admin)
            if (isAdmin) {
                 handleAdminAction(target);
            } else if (target.classList.contains('status-disponivel')) {
                // Ação de reserva do Usuário
                celulaClicada = target;
                abrirModalReserva(target.dataset);
            }
        });
    }

    // Confirmação de Reserva (Usuário)
    if (inputMatricula) {
         inputMatricula.addEventListener('input', (e) => {
            if (btnConfirmar) btnConfirmar.disabled = e.target.value.trim().length === 0;
        });
    }
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => {
            const matricula = inputMatricula.value.trim();
            const modal = modalAgendamento;
            const slotData = JSON.parse(modal.dataset.slotData);
            
            if (matricula) {
                 // **TODO: Implementar a função sendReservation para a API**
                 alert(`Confirmando reserva para Matrícula: ${matricula} no slot: ${slotData.id}. Implementar API call.`);
                 fecharModal(modal);
                 carregarAgenda();
            }
        });
    }

    // Botão de Cancelamento de Reserva no Modal Consulta
    if (modalConsulta) modalConsulta.addEventListener('click', handleCancelBooking);
}

document.addEventListener('DOMContentLoaded', initializePage);
