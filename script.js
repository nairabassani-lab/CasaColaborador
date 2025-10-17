// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbxY1VsWmQB_4FDolmaMNnmSbyyXMDKjxeQ9RBP_qX8kcmoATHl1h3g-w8NsUfuXlf8B/exec';

// --- REFERÊNCIAS DE DOM (ESCOPO GLOBAL) ---
const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modais de Agendamento (Usuário)
const modalAgendamento = document.getElementById('modal-agendamento');
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnConfirmar = document.getElementById('btn-confirmar');
const modalMensagemOverlay = document.getElementById('modal-mensagem-overlay'); 

// Botões Ação Principal
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda'); 

// --- REFERÊNCIAS DE MODAIS (ADMIN E CONSULTA) ---
// Admin Login (Omitido para brevidade, mantido no código final)

// Admin Gerenciar (Painel de Administração) (Omitido para brevidade)

// Admin Adicionar Horário (Omitido para brevidade)
const modalAdminAdicionar = document.getElementById('modal-admin-adicionar');
const formAdicionarHorario = document.getElementById('form-adicionar-horario');
const adminSelectProfissional = document.getElementById('admin-select-profissional');
const adminSelectAtividade = document.getElementById('admin-select-atividade');
const quickMassageContainer = document.getElementById('quick-massage-container');
const quickMassageHorariosGrid = document.getElementById('quick-massage-horarios');
const quickMassageIndisponivelAll = document.getElementById('qm-indisponivel');
const horarioUnicoContainer = document.getElementById('horario-unico-container');
const adminInputHorario = document.getElementById('admin-input-horario');
const adminInputVagas = document.getElementById('admin-input-vagas');
const btnConfirmarAdicionarFinal = document.getElementById('btn-confirmar-adicionar-final');
const adminAddMensagem = document.getElementById('admin-add-mensagem');
const adminSelectData = document.getElementById('admin-select-data');


// Consulta (Minhas Reservas)
const modalConsulta = document.getElementById('modal-consulta'); 
const inputConsultaMatricula = document.getElementById('input-consulta-matricula');
const consultaViewInicial = document.getElementById('consulta-view-inicial');
const consultaViewResultados = document.getElementById('consulta-view-resultados');
const consultaMensagem = document.getElementById('consulta-mensagem');
const btnBuscarReservas = document.getElementById('btn-buscar-reservas');
const btnVoltarConsulta = document.getElementById('btn-voltar-consulta');
const listaAgendamentos = document.getElementById('lista-agendamentos');


// --- Variáveis de Estado e Configurações ---
let agendaData = {};
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
    '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', 
    '10:30', '10:45', '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', 
    '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', 
    '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', 
    '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45'
];


// --- FUNÇÕES DE UTILIDADE (MODAIS E FORMATAÇÃO) ---

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

function mostrarMensagem(titulo, texto, isSuccess = false) {
    if (modalMensagemOverlay) {
        modalMensagemOverlay.querySelector('#modal-mensagem-titulo').textContent = titulo;
        modalMensagemOverlay.querySelector('#modal-mensagem-texto').textContent = texto;
        
        const content = modalMensagemOverlay.querySelector('.modal-content');
        if (content) {
            content.classList.toggle('success-message', isSuccess);
            content.classList.toggle('error-message', !isSuccess);
        }
        abrirModal(modalMensagemOverlay);
    } else {
        alert(`${titulo}\n\n${texto}`); // Fallback
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

function hojeISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function atualizarDiaSemanaLabel(dateISO) {
    if (!diaSemanaSpan || !dateISO) return;
    diaSemanaSpan.textContent = `(${getDayOfWeek(dateISO)})`;
}

// --- LÓGICA DE ADMIN E UI (Omitido para brevidade, mantido no código final) ---
function toggleAdminView(loggedIn) { /* ... */ }

/**
 * Abre o modal de confirmação preenchendo os detalhes do slot selecionado.
 * (implementação completa para evitar erro ao clicar)
 */
function abrirModalReserva(dataset) {
    if (!dataset) return;
    modalDetalhes.innerHTML = `
        <li><strong>Profissional:</strong> ${dataset.profissional}</li>
        <li><strong>Atividade:</strong> ${dataset.atividade}</li>
        <li><strong>Data:</strong> ${formatarDataParaDisplay(dataset.data)}</li>
        <li><strong>Horário:</strong> ${dataset.horario}</li>
        <li><strong>Vagas disponíveis:</strong> ${dataset.vagasDisp}</li>
    `;
    // guarda apenas o rowId que será usado na confirmação
    modalAgendamento.dataset.slotData = JSON.stringify({ rowId: dataset.rowId });
    // limpa input e desabilita botão até digitar matrícula
    inputMatricula.value = '';
    if (btnConfirmar) btnConfirmar.disabled = true;
    abrirModal(modalAgendamento);
}


// --- FUNÇÕES DE INTERAÇÃO COM API (APPS SCRIPT) ---

function renderAgenda(dados) {
    if (!container) return;

    if (!dados || dados.length === 0) {
        container.innerHTML = '<p class="aviso-admin">Nenhum horário cadastrado para esta data.</p>';
        return;
    }
    
    const groupedData = dados.reduce((acc, item) => {
        const key = `${item.profissional}-${item.atividade}`;
        if (!acc[key]) {
            acc[key] = {
                profissional: item.profissional,
                atividade: item.atividade,
                slots: []
            };
        }
        acc[key].slots.push(item);
        return acc;
    }, {});

    let html = `
        <div class="agenda-header">
            <div>Profissional / Atividade</div>
            <div>Horário</div>
            <div>Status</div>
            <div>Ações</div>
        </div>
    `;

    Object.values(groupedData).forEach(group => {
        const slotsHtml = group.slots.map(slot => {
            const vagasDisp = slot.vagas_total - slot.agendados;
            const isAvailable = vagasDisp > 0 && slot.status === 'Disponível';
            const statusClass = isAdmin 
                ? 'status-admin-gerenciar' 
                : (isAvailable ? 'status-disponivel' : 'status-lotado');
            const statusText = isAvailable ? `${vagasDisp} vagas` : (slot.status === 'Disponível' ? 'Lotado' : slot.status);
            
            const dataAttributes = `
                data-row-id="${slot.id}" 
                data-profissional="${slot.profissional}" 
                data-atividade="${slot.atividade}" 
                data-data="${slot.data}"
                data-horario="${slot.horario}"
                data-vagas-disp="${vagasDisp}"
                data-vagas-total="${slot.vagas_total}"
            `;

            return `
                <div class="agenda-row ${statusClass}" ${dataAttributes}>
                    <div class="slot-info">${slot.horario}</div>
                    <div class="slot-status">
                        <span class="${isAvailable ? 'tag-verde' : 'tag-vermelha'}">${statusText}</span>
                    </div>
                    <div class="slot-actions">
                        ${isAdmin 
                            ? `<button class="btn-excluir-slot" data-row-id="${slot.id}" type="button">Excluir</button>` 
                            : (isAvailable ? `<button class="btn-agendar-slot" data-row-id="${slot.id}" type="button">Agendar</button>` : '')
                        }
                    </div>
                </div>
            `;
        }).join('');

        html += `
            <div class="agenda-group">
                <div class="group-header">
                    <span class="prof-name">${group.profissional}</span> - ${group.atividade}
                </div>
                ${slotsHtml}
            </div>
        `;
    });

    container.innerHTML = html;
}


async function fetchAgenda(data) {
    // Se não houver data, define para hoje e tenta novamente
    if (!data) {
        if (seletorData) {
            seletorData.value = hojeISO();
            atualizarDiaSemanaLabel(seletorData.value);
            data = seletorData.value;
        } else {
            container.innerHTML = '<p class="aviso-admin">Escolha uma data para carregar a agenda.</p>';
            return;
        }
    }

    if (container) {
        container.innerHTML = '<p class="loading">Carregando agenda...</p>';
    }

    try {
        const response = await fetch(`${apiUrl}?action=getSchedule&date=${encodeURIComponent(data)}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar a agenda.');
        }

        const result = await response.json();

        if (result.status === 'success') {
            agendaData = result.data;
            renderAgenda(result.data);
        } else {
            container.innerHTML = `<p class="aviso-admin">Erro: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Erro na requisição da agenda:', error);
        container.innerHTML = '<p class="aviso-admin">Falha na comunicação com o servidor.</p>';
    }
}

async function handleConfirmarReserva() {
    const matricula = inputMatricula.value.trim();
    const slotData = JSON.parse(modalAgendamento.dataset.slotData || '{}');

    if (!matricula || !slotData.rowId) {
        mostrarMensagem('Erro', 'Dados de reserva incompletos. Tente novamente.');
        return;
    }

    fecharModal(modalAgendamento);
    mostrarMensagem('Processando', 'Confirmando sua reserva...');
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'bookSlot',
                rowId: slotData.rowId,
                matricula: matricula
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();

        if (result.status === 'success') {
            mostrarMensagem('Agendamento Confirmado', result.message, true);
            carregarAgenda(); 
        } else {
            mostrarMensagem('Falha no Agendamento', result.message);
        }
    } catch (error) {
        console.error('Erro ao confirmar reserva:', error);
        mostrarMensagem('Erro de Conexão', 'Não foi possível se comunicar com o servidor.');
    }
}

async function handleAdminDelete(rowId) {
    if (!isAdmin || !rowId || !confirm('Tem certeza que deseja EXCLUIR este horário e todos os seus agendamentos? Esta ação é irreversível.')) {
        return;
    }

    mostrarMensagem('Processando', 'Excluindo horário da agenda...');

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'deleteSchedule',
                rowId: rowId
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();

        if (result.status === 'success') {
            mostrarMensagem('Exclusão Concluída', result.message, true);
            carregarAgenda(); 
        } else {
            mostrarMensagem('Falha na Exclusão', result.message);
        }
    } catch (error) {
        console.error('Erro ao excluir horário:', error);
        mostrarMensagem('Erro de Conexão', 'Não foi possível se comunicar com o servidor.');
    }
}

// --- FLUXO DE CONSULTA E CANCELAMENTO ---

/**
 * Busca as reservas de um usuário pela matrícula.
 */
async function handleBuscarReservas(matricula) {
    if (matricula.trim() === '') {
        consultaMensagem.textContent = 'Insira sua matrícula.';
        consultaMensagem.style.color = 'red';
        return;
    }
    
    consultaMensagem.textContent = 'Buscando reservas...';
    consultaMensagem.style.color = 'orange';
    listaAgendamentos.innerHTML = '';
    
    try {
        const response = await fetch(`${apiUrl}?action=getReservations&matricula=${encodeURIComponent(matricula)}`);
        const result = await response.json();

        if (result.status === 'success' && result.data.length > 0) {
            renderReservations(result.data);
            consultaViewInicial.classList.add('hidden');
            consultaViewResultados.classList.remove('hidden');
            consultaMensagem.textContent = '';
        } else {
            consultaMensagem.textContent = result.message || 'Nenhuma reserva ativa encontrada.';
            consultaMensagem.style.color = 'red';
            consultaViewInicial.classList.remove('hidden');
            consultaViewResultados.classList.add('hidden');
        }

    } catch (error) {
        console.error('Erro ao buscar reservas:', error);
        consultaMensagem.textContent = 'Falha na comunicação com o servidor.';
        consultaMensagem.style.color = 'red';
    }
}

/**
 * Renderiza a lista de reservas encontradas.
 */
function renderReservations(reservas) {
    let html = '';
    reservas.forEach(reserva => {
        html += `
            <li class="agendamento-item">
                <div class="item-info">
                    <strong>${reserva.atividade}</strong> com ${reserva.profissional}
                    <p>${formatarDataParaDisplay(reserva.data)} às ${reserva.horario}</p>
                    <span class="tag-tipo">${reserva.tipo === 'Aula' ? 'Aula/Reiki' : 'Quick Massage'}</span>
                </div>
                <button class="btn-cancelar-reserva btn-vermelho" 
                        data-row-id="${reserva.id}" 
                        data-slot-id="${reserva.slotId}" 
                        data-atividade="${reserva.atividade}">
                    Cancelar
                </button>
            </li>
        `;
    });
    listaAgendamentos.innerHTML = html;
}

/**
 * Cancela uma reserva específica (POST).
 * (inclui matrícula para o back-end validar quando aplicável)
 */
async function handleCancelamentoReserva(rowId, slotId, atividade, matricula) {
    if (!confirm(`Tem certeza que deseja cancelar sua reserva para ${atividade}?`)) {
        return;
    }

    fecharModal(modalConsulta);
    mostrarMensagem('Processando', 'Cancelando sua reserva...');

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'cancelReservation',
                rowId: rowId, // ID da linha na planilha Reservas/Dados
                slotId: slotId, // ID da linha na planilha Dados (para Quick Massage/Aula)
                matricula: (matricula || '').trim()
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();

        if (result.status === 'success') {
            mostrarMensagem('Cancelamento Concluído', result.message, true);
            carregarAgenda();
        } else {
            mostrarMensagem('Falha no Cancelamento', result.message);
        }
    } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        mostrarMensagem('Erro de Conexão', 'Não foi possível cancelar a reserva.');
    }
}


// --- INICIALIZAÇÃO E LISTENERS GERAIS ---
function carregarAgenda() {
    if (seletorData) {
        fetchAgenda(seletorData.value);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Define data padrão (hoje) se estiver vazia e atualiza rótulo do dia
    if (seletorData && !seletorData.value) {
        seletorData.value = hojeISO();
    }
    if (seletorData) {
        atualizarDiaSemanaLabel(seletorData.value);
    }

    // Carrega agenda inicial
    carregarAgenda();
    
    // Listeners de Data
    if (seletorData) {
        seletorData.addEventListener('change', () => {
            atualizarDiaSemanaLabel(seletorData.value);
            carregarAgenda();
        });
    }
    
    // Fechar Modais (se tiver botões específicos, adicione aqui)

    // Lógica de Login Admin (mantida no seu fluxo)
    
    // Listeners de Adição (mantidos)
    // Submissão do formulário de adição (mantida)

    // --- LISTENERS DE CONSULTA (USUÁRIO) ---
    if(btnConsultarReservas) btnConsultarReservas.addEventListener('click', () => {
        abrirModal(modalConsulta);
        consultaViewInicial.classList.remove('hidden');
        consultaViewResultados.classList.add('hidden');
        consultaMensagem.textContent = '';
        inputConsultaMatricula.value = '';
        listaAgendamentos.innerHTML = '';
    });
    
    if (btnBuscarReservas) btnBuscarReservas.addEventListener('click', () => {
        handleBuscarReservas(inputConsultaMatricula.value.trim());
    });
    
    if (btnVoltarConsulta) btnVoltarConsulta.addEventListener('click', () => {
        consultaViewResultados.classList.add('hidden');
        consultaViewInicial.classList.remove('hidden');
        listaAgendamentos.innerHTML = '';
        consultaMensagem.textContent = '';
    });


    // --- LISTENERS DE RESERVA E CONFIRMAÇÃO ---
    if (inputMatricula) {
        inputMatricula.addEventListener('input', (e) => {
            if (btnConfirmar) btnConfirmar.disabled = e.target.value.trim().length === 0;
        });
    }
    
    if (btnConfirmar) btnConfirmar.addEventListener('click', handleConfirmarReserva);


    // --- AÇÃO NA CÉLULA DA AGENDA (DELEGAÇÃO DE EVENTOS) ---
    if (container) {
        container.addEventListener('click', function(event) {
            const target = event.target;
            
            // Ação de AGENDAMENTO (Botão ou Slot Disponível)
            const btnAgendar = target.closest('.btn-agendar-slot') || target.closest('.agenda-row.status-disponivel');
            if (btnAgendar && !isAdmin) {
                const row = btnAgendar.closest('.agenda-row');
                if (row) {
                    celulaClicada = row;
                    abrirModalReserva(row.dataset);
                }
                return;
            }
            
            // Ação de EXCLUSÃO (Botão Admin)
            const btnExcluir = target.closest('.btn-excluir-slot');
            if (btnExcluir && isAdmin) {
                const rowId = btnExcluir.dataset.rowId;
                handleAdminDelete(rowId);
                return;
            }
        });
    }
    
    // --- LISTENER DE CANCELAMENTO NA ABA DE RESULTADOS DA CONSULTA ---
    if (listaAgendamentos) {
        listaAgendamentos.addEventListener('click', function(event) {
            const btnCancelar = event.target.closest('.btn-cancelar-reserva');
            if (btnCancelar) {
                const rowId = btnCancelar.dataset.rowId; // ID da linha na planilha de Reserva/Dados
                const slotId = btnCancelar.dataset.slotId; // ID da linha na planilha Dados
                const atividade = btnCancelar.dataset.atividade;
                const matricula = (inputConsultaMatricula?.value || '').trim();
                handleCancelamentoReserva(rowId, slotId, atividade, matricula);
            }
        });
    }
}); // <-- CHAVE DE FECHAMENTO FINAL CORRIGIDA

// --- Seleção de Elementos ---
const body = document.body;

// Modais
const modalAgendamento = document.getElementById('modal-agendamento');
const modalConsulta = document.getElementById('modal-consulta');
const modalAdminLogin = document.getElementById('modal-admin-login');
const modalMensagem = document.getElementById('modal-mensagem');

// Botões e Inputs Principais
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');
const btnAdminLogin = document.getElementById('btn-admin-login');
const seletorData = document.getElementById('seletor-data'); // NOVO: Seleção de data
const diaSemanaLabel = document.getElementById('dia-semana'); // NOVO: Label do dia da semana
const agendaContainer = document.getElementById('agenda-container'); // NOVO: Container da agenda

// Botões do Modal Agendamento
const btnCancelarAgendamento = document.getElementById('btn-cancelar-agendamento');
const btnConfirmarReserva = document.getElementById('btn-confirmar'); // NOVO: Botão de confirmação
const inputMatricula = document.getElementById('input-matricula'); // NOVO: Input de Matrícula
const modalDetalhes = document.getElementById('modal-detalhes'); // NOVO: Lista de detalhes

// Botões do Modal Consulta
const btnFecharConsulta = document.getElementById('btn-fechar-consulta');
const btnConsultar = document.getElementById('btn-consultar'); // NOVO: Botão Consultar (Matrícula)

// Botões do Modal Admin
const btnAdminCancelar = document.getElementById('btn-admin-cancelar');
const btnAdminLogar = document.getElementById('btn-admin-logar');

// Botões do Modal Mensagem
const btnFecharMensagem = document.getElementById('btn-fechar-mensagem');

// Campos de Login Admin
const inputAdminUsuario = document.getElementById('input-admin-usuario');
const inputAdminSenha = document.getElementById('input-admin-senha');

// Variáveis de Estado (MUITO SIMPLES - DEVERIA SER BACKEND)
let horariosDisponiveis = [
    { hora: '08:00', total: 5, reservas: 3 },
    { hora: '09:00', total: 5, reservas: 5 }, // Cheio
    { hora: '10:00', total: 5, reservas: 0 },
    { hora: '11:00', total: 5, reservas: 1 },
    // ... mais horários
];
let reservaAtual = {}; // Armazena a info do agendamento em andamento

// --- Funções de Controle de Modal ---

/**
 * Abre um modal específico e bloqueia o scroll do body.
 * @param {HTMLElement} modal O elemento modal a ser aberto.
 */
function abrirModal(modal) {
    body.style.overflow = 'hidden';
    modal.classList.remove('hidden');
}

/**
 * Fecha um modal específico e restaura o scroll do body.
 * @param {HTMLElement} modal O elemento modal a ser fechado.
 */
function fecharModal(modal) {
    body.style.overflow = 'auto';
    modal.classList.add('hidden');
}

/**
 * Exibe o modal de mensagem com um título e texto personalizados.
 * @param {string} titulo O título da mensagem.
 * @param {string} texto O corpo da mensagem.
 */
function exibirMensagem(titulo, texto) {
    document.getElementById('modal-mensagem-titulo').textContent = titulo;
    document.getElementById('modal-mensagem-texto').textContent = texto;
    abrirModal(modalMensagem);
}

// --- Funções de Login e Ação ---

/**
 * Implementação de login de administrador (FRONTEND INSEGURO!)
 */
function realizarLoginAdmin() {
    const usuario = inputAdminUsuario.value.trim();
    const senha = inputAdminSenha.value.trim();
    
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = '12345'; 

    if (usuario === ADMIN_USER && senha === ADMIN_PASS) {
        fecharModal(modalAdminLogin);
        exibirMensagem('Login Bem-Sucedido', 'Bem-vindo, Administrador! Você agora tem acesso às funcionalidades de gestão.');
    } else {
        exibirMensagem('Erro de Login', 'Usuário ou senha incorretos.');
        inputAdminSenha.value = ''; 
    }
}

// --- Lógica de Data e Agenda ---

/**
 * Define a data mínima de seleção para amanhã.
 */
function configurarDataMinima() {
    const hoje = new Date();
    // Avança para o próximo dia para evitar agendamentos no dia atual
    hoje.setDate(hoje.getDate() + 1); 
    const amanha = hoje.toISOString().split('T')[0];
    seletorData.setAttribute('min', amanha);
    seletorData.value = amanha; // Define a data inicial
    atualizarAgenda(); // Carrega a agenda inicial
}

/**
 * Retorna o nome do dia da semana em português.
 * @param {Date} date O objeto Date.
 * @returns {string} O nome do dia da semana.
 */
function getDiaSemana(date) {
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[date.getDay()];
}

/**
 * Atualiza o label do dia da semana e recarrega a agenda.
 */
function atualizarAgenda() {
    const dataSelecionada = seletorData.value;
    if (!dataSelecionada) {
        diaSemanaLabel.textContent = 'Selecione uma data';
        agendaContainer.innerHTML = '<p class="observacao">Nenhuma data selecionada.</p>';
        return;
    }

    const dataObj = new Date(dataSelecionada + 'T00:00:00'); // Garante que a data seja interpretada corretamente
    const diaSemana = getDiaSemana(dataObj);

    diaSemanaLabel.textContent = `(${diaSemana})`;
    renderizarAgenda(dataSelecionada);
}

/**
 * Renderiza os blocos de horário no container da agenda.
 * @param {string} data A data selecionada.
 */
function renderizarAgenda(data) {
    // Simula o carregamento
    agendaContainer.innerHTML = '<p class="loading">Carregando horários...</p>';

    // Simulação: Após 500ms, exibe os horários
    setTimeout(() => {
        agendaContainer.innerHTML = ''; // Limpa o carregamento

        if (horariosDisponiveis.length === 0) {
            agendaContainer.innerHTML = '<p class="observacao">Nenhum horário disponível para esta data.</p>';
            return;
        }

        horariosDisponiveis.forEach(item => {
            const vagasRestantes = item.total - item.reservas;
            const disponivel = vagasRestantes > 0;
            const classeStatus = disponivel ? 'disponivel' : 'lotado';
            
            const bloco = document.createElement('div');
            bloco.classList.add('horario-bloco', classeStatus);
            bloco.dataset.hora = item.hora;
            bloco.dataset.data = data;
            
            bloco.innerHTML = `
                <span class="horario">${item.hora}</span>
                <span class="vagas">${disponivel ? `${vagasRestantes} vaga(s)` : 'LOTADO'}</span>
            `;

            if (disponivel) {
                bloco.classList.add('clicavel');
                bloco.addEventListener('click', () => abrirModalAgendamento(data, item.hora));
            }

            agendaContainer.appendChild(bloco);
        });

    }, 500);
}

/**
 * Prepara e abre o modal de agendamento.
 * @param {string} data A data selecionada (YYYY-MM-DD).
 * @param {string} hora O horário selecionado (HH:MM).
 */
function abrirModalAgendamento(data, hora) {
    // Armazena a seleção atual
    reservaAtual = { data, hora };

    // Formata a data para exibição (ex: 18/10/2025)
    const [ano, mes, dia] = data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const diaSemana = getDiaSemana(new Date(data + 'T00:00:00'));

    // Atualiza os detalhes no modal
    modalDetalhes.innerHTML = `
        <li><strong>Data:</strong> ${dataFormatada} (${diaSemana})</li>
        <li><strong>Horário:</strong> ${hora}</li>
    `;

    // Limpa o input de matrícula e desabilita o botão
    inputMatricula.value = '';
    btnConfirmarReserva.disabled = true;

    abrirModal(modalAgendamento);
}

/**
 * Simula a confirmação da reserva (Aqui entraria a lógica de BACKEND).
 */
function confirmarReserva() {
    const matricula = inputMatricula.value.trim();

    if (matricula.length < 5 || isNaN(matricula)) {
        exibirMensagem('Matrícula Inválida', 'Por favor, digite uma matrícula válida (apenas números, mínimo de 5 dígitos).');
        return;
    }

    fecharModal(modalAgendamento);

    // Simulação de Sucesso
    setTimeout(() => {
        exibirMensagem('Reserva Confirmada! 🎉', `Sua reserva para ${reservaAtual.data} às ${reservaAtual.hora} foi confirmada. Matrícula: ${matricula}.`);
        // Lógica de atualização da agenda após a reserva (re-renderizar)
        atualizarAgenda();
    }, 300);
}


// --- Adição de Event Listeners ---

// NOVO: Monitora a mudança na data
seletorData.addEventListener('change', atualizarAgenda);

// Abrir Modais
btnConsultarReservas.addEventListener('click', () => abrirModal(modalConsulta));
btnAdminLogin.addEventListener('click', () => abrirModal(modalAdminLogin));

// Fechar Modais (Botões de Cancelar/Fechar)
btnCancelarAgendamento.addEventListener('click', () => fecharModal(modalAgendamento));
btnFecharConsulta.addEventListener('click', () => fecharModal(modalConsulta));
btnAdminCancelar.addEventListener('click', () => fecharModal(modalAdminLogin));
btnFecharMensagem.addEventListener('click', () => fecharModal(modalMensagem));

// Ação de Login Admin
btnAdminLogar.addEventListener('click', realizarLoginAdmin);
inputAdminSenha.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        realizarLoginAdmin();
    }
});

// Ação de Confirmação de Reserva
btnConfirmarReserva.addEventListener('click', confirmarReserva);

// NOVO: Validação do campo de Matrícula no Modal Agendamento
inputMatricula.addEventListener('input', () => {
    const matricula = inputMatricula.value.trim();
    // Habilita o botão se a matrícula tiver pelo menos 5 dígitos numéricos
    const isValid = matricula.length >= 5 && !isNaN(matricula);
    btnConfirmarReserva.disabled = !isValid;
});

// NOVO: Ação de Consulta de Reservas (Ainda precisa de implementação completa)
btnConsultar.addEventListener('click', () => {
    const mat = document.getElementById('input-consulta-matricula').value;
    if (mat.trim()) {
        exibirMensagem('Consultando...', `Buscando reservas para a matrícula ${mat}. (Ainda precisa de lógica de busca)`);
    } else {
        exibirMensagem('Atenção', 'Por favor, digite sua matrícula para consultar.');
    }
});


// Lógica de Fechamento ao Clicar Fora (Overlay)
[modalAgendamento, modalConsulta, modalAdminLogin, modalMensagem].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal(modal);
        }
    });
});

// --- Inicialização ---

/**
 * Função chamada quando a página é carregada.
 */
document.addEventListener('DOMContentLoaded', () => {
    configurarDataMinima();
});



