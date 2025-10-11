// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

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
let agendamentoAtual = {}; // Usado para armazenar os dados do slot antes de abrir o modal de agendamento
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
    // A chamada a carregarAgenda() foi substituída por renderizarAgendaParaData
    if (seletorData.value) {
        renderizarAgendaParaData(seletorData.value.split('-').reverse().join('/'));
    }
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
// (Funções updateActivitySelector, renderQuickMassageGrid, toggleAdminInputs, handleAdminAdicionar, mantidas)

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
// (Funções handleBuscarReservas, renderizarReservas, handleCancelBooking, voltarConsulta mantidas)

async function handleBuscarReservas() {
    const matricula = inputConsultaMatricula.value.trim();
    if (!matricula) {
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

// --- NOVAS FUNÇÕES DE CARREGAMENTO, RENDERIZAÇÃO E AGENDAMENTO (ESSENCIAIS) ---

/**
 * Retorna o dia da semana em português.
 * @param {string} data - Data no formato DD/MM/AAAA.
 */
function getDiaSemana(data) {
    const [dia, mes, ano] = data.split('/').map(Number);
    // Mês é 0-indexed no JavaScript
    const date = new Date(ano, mes - 1, dia); 
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[date.getDay()];
}

/**
 * Cria a estrutura HTML da agenda (Acordeão e Tabelas).
 * **Esta é uma implementação simplificada para fazer o carregamento funcionar.**
 * @param {Array<Object>} agendamentosFiltrados - Slots da planilha para a data selecionada.
 * @param {string} dataSelecionada - Data no formato DD/MM/AAAA.
 */
function renderizarAgendaParaData(agendamentosFiltrados, dataSelecionada) {
    if (agendamentosFiltrados.length === 0) {
        // Se for admin, mostra opção de adicionar; se não, apenas informa que está fechado.
        container.innerHTML = `<p class="loading">Agenda vazia para esta data. ${isAdmin ? 'Use o botão "Gerenciar Agenda" ou clique em "Adicionar" (se disponível) para criar novos slots.' : 'Nenhum horário disponível.'}</p>`;
        return;
    }

    // 1. Agrupa por Atividade e, dentro de cada Atividade, por Horário
    const agendaAgrupada = agendamentosFiltrados.reduce((acc, curr) => {
        const key = curr.Atividade;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(curr);
        return acc;
    }, {});
    
    let htmlAgenda = '';

    // 2. Itera sobre os grupos (Atividades)
    for (const atividade in agendaAgrupada) {
        const slotsDaAtividade = agendaAgrupada[atividade];
        
        // Agrupa por Horário para construir as colunas da tabela
        const horariosProfissionais = slotsDaAtividade.reduce((acc, slot) => {
            const horario = slot.Horário;
            if (!acc[horario]) {
                acc[horario] = {};
            }
            acc[horario][slot.Profissional] = slot;
            return acc;
        }, {});

        const profissionais = Array.from(new Set(slotsDaAtividade.map(s => s.Profissional))).sort();
        const horariosOrdenados = Object.keys(horariosProfissionais).sort();
        
        let tabelaHTML = `
            <div class="tabela-container">
                <table class="tabela-agenda">
                    <thead>
                        <tr>
                            <th class="horario-col">Horário</th>
                            ${profissionais.map(p => `<th>${p}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        // 3. Itera sobre os Horários
        horariosOrdenados.forEach((horario) => {
            tabelaHTML += `<tr><td class="horario-col">${horario}</td>`;
            
            // 4. Itera sobre os Profissionais (Colunas)
            profissionais.forEach((profissional) => {
                const slot = horariosProfissionais[horario][profissional];
                let cellClass = 'status-fechado';
                let cellContent = '—';
                let dataAttrs = '';
                
                if (slot) {
                    const matriculas = (slot.Reserva || '').split(',').map(m => m.trim()).filter(Boolean);
                    const vagasOcupadas = matriculas.filter(m => m.toLowerCase() !== 'indisponivel').length;
                    const vagasTotais = parseInt(slot.Vagas) || 0;
                    const vagasDisponiveis = vagasTotais - vagasOcupadas;
                    const isIndisponivel = matriculas.map(r => r.toLowerCase()).includes('indisponivel');

                    // Data-attributes para o JS
                    dataAttrs = `data-data="${dataSelecionada}" data-horario="${horario}" data-atividade="${atividade}" data-profissional="${profissional}" data-id-linha="${slot.ID_LINHA}"`;

                    if (isIndisponivel) {
                        cellClass = 'status-indisponivel';
                        cellContent = 'Indisponível';
                    } else if (vagasDisponiveis > 0) {
                        cellClass = 'status-disponivel';
                        cellContent = `Disponível <span>${vagasDisponiveis}/${vagasTotais}</span>`;
                        
                        if (isAdmin) {
                            cellClass = 'status-admin-excluir'; // Permite excluir slots existentes
                            cellContent = `Gerenciar <span>ID: ${slot.ID_LINHA}</span>`;
                        }
                    } else {
                        cellClass = 'status-lotado';
                        cellContent = `Lotado <span>(${vagasTotais} vagas)</span>`;
                        
                        if (isAdmin) {
                            cellClass = 'status-admin-lotado'; // Mostra que está lotado, mas pode ter reservas
                            cellContent = `Reservado <span>(${vagasOcupadas}/${vagasTotais})</span>`;
                        }
                    }
                } 
                
                // Opção de adicionar slot (modo Admin) para células vazias
                if (!slot && isAdmin) {
                     cellClass = 'status-admin-adicionar';
                     cellContent = 'Adicionar Slot';
                     dataAttrs = `data-data="${dataSelecionada}" data-horario="${horario}" data-atividade="${atividade}" data-profissional="${profissional}"`;
                }


                tabelaHTML += `<td class="status-cell ${cellClass}" ${dataAttrs}>${cellContent}</td>`;
            });
            
            tabelaHTML += `</tr>`;
        });

        tabelaHTML += `
                    </tbody>
                </table>
            </div>
        `;

        htmlAgenda += `
            <h2 class="titulo-atividade" data-atividade-key="${atividade}">${atividade}</h2>
            ${tabelaHTML}
        `;
    }
    
    container.innerHTML = htmlAgenda;
    
    // Adiciona listener para o acordeão após a renderização
    document.querySelectorAll('.titulo-atividade').forEach(titulo => {
        titulo.addEventListener('click', (e) => {
            e.target.classList.toggle('ativo');
            const containerTabela = e.target.nextElementSibling;
            if (containerTabela.style.maxHeight) {
                containerTabela.style.maxHeight = null;
            } else {
                // Seta a altura para permitir o efeito de transição
                containerTabela.style.maxHeight = containerTabela.scrollHeight + "px";
            }
        });
    });
}

/**
 * Abre o modal de agendamento (usuário) e preenche os detalhes.
 */
function abrirModalReserva(dataset) {
    agendamentoAtual = dataset; // Salva os dados para o botão de confirmação
    modalDetalhes.innerHTML = `
        <li>Data: <strong>${dataset.data}</strong></li>
        <li>Horário: <strong>${dataset.horario}</strong></li>
        <li>Atividade: <strong>${dataset.atividade}</strong></li>
        <li>Profissional: <strong>${dataset.profissional}</strong></li>
    `;
    inputMatricula.value = '';
    modalMensagem.textContent = '';
    abrirModal(modalAgendamento);
}

/**
 * Lógica de confirmação de agendamento (usuário).
 */
async function confirmarReserva() {
    const matricula = inputMatricula.value.trim();
    if (!matricula) {
        modalMensagem.textContent = 'A matrícula é obrigatória.';
        modalMensagem.style.color = 'red';
        return;
    }

    btnConfirmar.disabled = true;
    modalMensagem.textContent = 'Reservando...';
    modalMensagem.style.color = 'var(--cinza-texto)';

    try {
        const dadosParaEnviar = {
            action: 'book',
            matricula: matricula,
            // Detalhes do agendamento
            data: agendamentoAtual.data,
            horario: agendamentoAtual.horario,
            atividade: agendamentoAtual.atividade,
            profissional: agendamentoAtual.profissional
        };

        const query = new URLSearchParams(dadosParaEnviar).toString();
        const response = await fetch(`${apiUrl}?${query}`);
        const result = await response.json();

        if (result.status === "success") {
            modalMensagem.textContent = result.message;
            modalMensagem.style.color = 'var(--verde-moinhos)';
            carregarAgenda(); // Recarrega a agenda
            setTimeout(() => fecharModal(modalAgendamento), 2000);

        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Erro ao reservar:', error);
        modalMensagem.textContent = error.message || 'Erro de comunicação ao reservar. Tente novamente.';
        modalMensagem.style.color = 'red';
    } finally {
        btnConfirmar.disabled = false;
    }
}


/**
 * Filtra os agendamentos pela data selecionada e re-renderiza a grade da agenda.
 * (Chamado após o carregamento inicial e a cada mudança no seletor de data)
 */
function filtrarEAtualizarAgenda(dataSelecionada) {
    // Atualiza o dia da semana na interface
    const diaSemana = getDiaSemana(dataSelecionada);
    diaSemanaSpan.textContent = `(${diaSemana})`; // Adicionando parênteses para estética

    if (!todosOsAgendamentos || todosOsAgendamentos.length === 0) {
        container.innerHTML = `<p class="loading">Nenhuma agenda encontrada. ${isAdmin ? 'Adicione horários no painel Admin.' : 'Aguarde o Administrador cadastrar horários.'}</p>`;
        return;
    }

    // Filtra os agendamentos para a data selecionada (DD/MM/AAAA)
    const agendamentosFiltrados = todosOsAgendamentos.filter(a => a.Data === dataSelecionada);

    // Renderiza o HTML da agenda
    renderizarAgendaParaData(agendamentosFiltrados, dataSelecionada);
}

/**
 * Função principal que busca todos os dados da agenda da API (Google Apps Script).
 */
async function carregarAgenda() {
    container.innerHTML = '<p class="loading">Carregando agenda...</p>';

    // Define a data atual como padrão no seletor na primeira carga
    if (!seletorData.value) {
        const today = new Date().toISOString().split('T')[0];
        seletorData.value = today;
    }
    
    // Converte a data inicial para o formato DD/MM/AAAA para a função de filtragem
    const dataInicial = seletorData.value.split('-').reverse().join('/');

    try {
        const response = await fetch(apiUrl); 
        const result = await response.json(); 

        if (Array.isArray(result)) {
            todosOsAgendamentos = result;
            
            // Chama a função que filtra e renderiza para a data inicial
            filtrarEAtualizarAgenda(dataInicial);
            
        } else if (result && result.status === 'error') {
            throw new Error(result.message);
        } else {
             throw new Error('Erro de formato ou Web App indisponível. Verifique o URL.');
        }

    } catch (error) {
        console.error("Erro ao carregar dados da API:", error);
        container.innerHTML = `<p class="loading" style="color: red;">
            Erro ao carregar agenda: ${error.message}.
            <br>Verifique o URL do Apps Script e as permissões de acesso (deve ser 'Qualquer Pessoa').
        </p>`;
    }
}


// --- LIGAÇÃO DE EVENT LISTENERS FINAIS ---

// Event Listener para a mudança de data
seletorData.addEventListener('change', (event) => {
    const dataSelecionada = event.target.value.split('-').reverse().join('/'); // DD/MM/AAAA
    filtrarEAtualizarAgenda(dataSelecionada);
});

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
btnCancelarAdicionarFinal.addEventListener('click', () => fecharModal(modalAdminAdicionar)); 
formAdicionarHorario.addEventListener('submit', handleAdminAdicionar);

// Botão de Cancelamento de Reserva no Modal Consulta
modalConsulta.addEventListener('click', handleCancelBooking);

// Listeners de Ação Principal
btnAdminLogin.addEventListener('click', handleAdminLoginClick);
document.getElementById('btn-confirmar-admin-login').addEventListener('click', confirmarAdminLogin);
document.getElementById('btn-cancelar-admin-login').addEventListener('click', () => fecharModal(modalAdminLogin));
btnGerenciarAgenda.addEventListener('click', () => abrirModal(modalAdminGerenciar));
document.getElementById('btn-fechar-admin-gerenciar').addEventListener('click', () => fecharModal(modalAdminGerenciar));
document.getElementById('btn-admin-logout').addEventListener('click', () => toggleAdminView(false)); // Logout direto do painel

btnConsultarReservas.addEventListener('click', () => {
    inputConsultaMatricula.value = '';
    voltarConsulta();
    abrirModal(modalConsulta);
});
btnFecharConsulta.addEventListener('click', () => fecharModal(modalConsulta));
btnVoltarConsulta.addEventListener('click', voltarConsulta);
btnBuscarReservas.addEventListener('click', handleBuscarReservas);

// Listeners do Modal de Agendamento (Usuário)
btnCancelar.addEventListener('click', () => fecharModal(modalAgendamento));
btnConfirmar.addEventListener('click', confirmarReserva); // Chamada à nova função

// Listener Geral para cliques na Agenda (Agendamento, Exclusão, Adição)
container.addEventListener('click', function(event) {
    const target = event.target;
    // Toggle do Acordeão (mantido para compatibilidade, mas a lógica foi movida para renderizarAgendaParaData)
    if (target.classList.contains('titulo-atividade')) {
        // A lógica de toggle agora é anexada dinamicamente em renderizarAgendaParaData
        return;
    }

    // Ação na Célula de Agendamento (Usuário / Admin)
    if (isAdmin && target.classList.contains('status-admin-excluir')) {
        // Excluir ou Gerenciar
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

        // Não fecha o modal de gerenciar, apenas abre o de adicionar (ou pode fechar para focar)
        // fecharModal(modalAdminGerenciar); 
        abrirModal(modalAdminAdicionar);
    }
});

// Inicialização: Chama a função principal para carregar os dados
carregarAgenda();
