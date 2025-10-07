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

const modalAdminAdicionar = document.getElementById('modal-admin-adicionar');
const formAdicionarHorario = document.getElementById('form-adicionar-horario');

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
    setTimeout(() => modalElement.style.opacity = 1, 10); 
}

function fecharModal(modalElement) {
    modalElement.style.opacity = 0;
    setTimeout(() => modalElement.classList.add('hidden'), 300);
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
             container.insertAdjacentHTML('beforebegin', '<p class="aviso-admin">MODO ADMIN ATIVADO. Clique nos slots para GEREENCIAR (Excluir/Ver).</p>');
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
    if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente o slot da linha ${idLinha}?`)) {
        return;
    }
    
    // WIP: Lógica para buscar as reservas futuras desta matrícula via API
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
        // ... (restante da validação mantida) ...
        consultaMensagem.textContent = 'Por favor, insira sua matrícula.';
        consultaMensagem.style.color = 'red';
        return;
    }
    
    consultaMensagem.textContent = 'Buscando reservas...';
    consultaMensagem.style.color = 'var(--cinza-texto)';

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
}

// ... (Resto das funções de carregamento e renderização mantidas) ...

// --- LIGAÇÃO DE EVENT LISTENERS FINAIS ---

// Listeners do Modal Adicionar (NOVA LÓGICA DE ENADEAMENTO)
adminSelectProfissional.addEventListener('change', (e) => {
    updateActivitySelector(e.target.value);
    toggleAdminInputs();
});

adminSelectAtividade.addEventListener('change', toggleAdminInputs);

// Modal Adicionar
btnAdminAdicionar.addEventListener('click', () => {
    // Limpa o formulário antes de abrir
    formAdicionarHorario.reset();
    adminSelectAtividade.disabled = true;
    toggleAdminInputs(); 
    adminAddMensagem.textContent = '';
    
    fecharModal(modalAdminGerenciar);
    abrirModal(modalAdminAdicionar);
});
btnCancelarAdicionarFinal.addEventListener('click', () => fecharModal(modalAdminAdicionar)); // ID corrigido
formAdicionarHorario.addEventListener('submit', handleAdminAdicionar);

// Botão de Cancelamento de Reserva no Modal Consulta
modalConsulta.addEventListener('click', handleCancelBooking);


// ... (Manter os demais listeners) ...
container.addEventListener('click', function(event) {
    const target = event.target;
    // ... (Toggle do Acordeão) ...
    if (target.classList.contains('titulo-atividade')) {
        // ...
    }

    // Ação na Célula de Agendamento (Usuário / Admin)
    if (isAdmin && target.classList.contains('status-admin-excluir')) {
        const idLinha = target.dataset.idLinha;
        if (idLinha) {
            handleAdminDelete(idLinha);
        }
    } else if (target.classList.contains('status-disponivel') && !isAdmin) {
        // Ação de reserva do Usuário
        celulaClicada = target;
        abrirModalReserva(target.dataset);
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
// ... (demais ligações de botões) ...

// Inicialização
carregarAgenda();
