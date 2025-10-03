// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

// --- Variáveis de Configuração Admin ---
const ADMIN_PASSWORD = 'C@sacolab#123';
let isAdmin = false;
const PROFISSIONAIS = ['Ana', 'Carlos', 'Maria Eduarda', 'Luis', 'Rafael'];
const ATIVIDADES_POR_PROFISSIONAL = {
    'Ana': ['Fit Class', 'Funcional Dance', 'Power Gap', 'Funcional Dance'],
    'Carlos': ['Funcional', 'Mat Pilates', 'Ritmos/Zumba', 'Jump'],
    'Maria Eduarda': ['Quick Massage'],
    'Luis': ['Quick Massage'],
    'Rafael': ['Quick Massage', 'Reiki']
};
// Horários fixos para Quick Massage e Reiki (43 slots)
const QUICK_MASSAGE_REIKI_TIMES = [
    '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30',
    '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15',
    '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45'
];
const ATIVIDADES_COM_HORARIO_FIXO = ['Quick Massage', 'Reiki'];


// --- Seletores de Elementos (Completos e padronizados) ---
const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modal de Agendamento
const modalAgendamento = document.getElementById('modal-agendamento');
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnCancelarAgendamento = document.getElementById('btn-cancelar-agendamento');
const btnConfirmar = document.getElementById('btn-confirmar');
const modalMensagem = document.getElementById('modal-mensagem');

// Modal de Consulta
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');
const modalConsulta = document.getElementById('modal-consulta');
const consultaViewInicial = document.getElementById('consulta-view-inicial');
const consultaViewResultados = document.getElementById('consulta-view-resultados');
const inputConsultaMatricula = document.getElementById('input-consulta-matricula');
const btnFecharConsulta = document.getElementById('btn-fechar-consulta');
const btnBuscarReservas = document.getElementById('btn-buscar-reservas');
const btnVoltarConsulta = document.getElementById('btn-voltar-consulta');
const listaAgendamentos = document.getElementById('lista-agendamentos');
const consultaMensagem = document.getElementById('consulta-mensagem');

// Novos Seletores Admin
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda');
const modalAdminLogin = document.getElementById('modal-admin-login');
const inputAdminPassword = document.getElementById('input-admin-password');
const btnConfirmarAdminLogin = document.getElementById('btn-confirmar-admin-login');
const btnCancelarAdminLogin = document.getElementById('btn-cancelar-admin-login');
const adminLoginMensagem = document.getElementById('admin-login-mensagem');

const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const selectAdminProfissional = document.getElementById('select-admin-profissional');
const selectAdminAtividade = document.getElementById('select-admin-atividade');
const inputAdminData = document.getElementById('input-admin-data');
const inputAdminMatricula = document.getElementById('input-admin-matricula');
const adminFormDinamico = document.getElementById('admin-form-dinamico'); // NOVO CONTAINER
const btnAdicionarHorario = document.getElementById('btn-adicionar-horario');
const btnFecharAdminGerenciar = document.getElementById('btn-fechar-admin-gerenciar');
const btnAdminLogout = document.getElementById('btn-admin-logout');
const adminAdicionarMensagem = document.getElementById('admin-adicionar-mensagem');


let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;


// --- Funções Auxiliares ---

/**
 * Atualiza o dia da semana no seletor.
 */
function atualizarDiaDaSemana(dataISO) {
    if (!dataISO) {
        diaSemanaSpan.textContent = '';
        return;
    }
    const data = new Date(dataISO + 'T00:00:00'); // Garante que a data seja interpretada como local
    const opcoes = { weekday: 'long', timeZone: 'UTC' };
    const dia = data.toLocaleDateString('pt-BR', opcoes);
    diaSemanaSpan.textContent = dia.charAt(0).toUpperCase() + dia.slice(1);
}

/**
 * Processa os dados brutos da API para facilitar a renderização da grade.
 */
function processarDadosParaGrade(dataFormatoPlanilha) {
    const dadosFiltrados = todosOsAgendamentos.filter(item => item.Data === dataFormatoPlanilha);
    const dadosProcessados = {};

    dadosFiltrados.forEach(item => {
        const { Atividade, Profissional, Horário } = item;
        
        if (!dadosProcessados[Atividade]) {
            dadosProcessados[Atividade] = {
                horarios: [],
                profissionais: [],
                grade: {}
            };
        }

        const atividadeData = dadosProcessados[Atividade];

        // 1. Horários (mantém a ordem e garante unicidade)
        if (!atividadeData.horarios.includes(Horário)) {
            atividadeData.horarios.push(Horário);
            atividadeData.horarios.sort();
        }

        // 2. Profissionais (garante unicidade)
        if (!atividadeData.profissionais.includes(Profissional)) {
            atividadeData.profissionais.push(Profissional);
        }

        // 3. Grade
        if (!atividadeData.grade[Horário]) {
            atividadeData.grade[Horário] = {};
        }
        // Armazena todos os dados do agendamento (incluindo Vagas e Reserva)
        atividadeData.grade[Horário][Profissional] = item;
    });

    // Ordena os profissionais dentro de cada atividade
    for (const key in dadosProcessados) {
        dadosProcessados[key].profissionais.sort();
    }
    
    return dadosProcessados;
}


// --- Funções Principais ---

/**
 * Carrega a agenda da API (doGet sem action)
 */
async function carregarAgenda() {
    container.innerHTML = `<p class="loading">Carregando agenda...</p>`;
    try {
        const response = await fetch(apiUrl, { cache: 'no-cache' }); 
        
        if (!response.ok) {
             throw new Error(`Erro de rede: Status ${response.status}. Verifique o URL da API.`);
        }
        
        // CORREÇÃO: Limpa a variável global antes de atribuir
        todosOsAgendamentos = [];
        const data = await response.json();
        if (Array.isArray(data)) {
            todosOsAgendamentos = data;
        } else {
             console.warn("A resposta da API não é um array:", data);
        }
        
        // Inicialização de data e renderização
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const hojeFormatado = hoje.toISOString().slice(0, 10);
        
        if (seletorData) {
            // Define o valor inicial (só se for a primeira vez)
            if (!seletorData.value) {
                seletorData.value = hojeFormatado;
            }
            renderizarAgendaParaData(seletorData.value);
            
            if (!seletorData.dataset.listenerAdded) {
                 seletorData.addEventListener('change', () => renderizarAgendaParaData(seletorData.value));
                 seletorData.dataset.listenerAdded = 'true';
            }
        } else {
            renderizarAgendaParaData(hojeFormatado);
        }

    } catch (error) {
        console.error('Erro ao carregar a agenda:', error);
        container.innerHTML = `<p class="loading error-message">⚠️ Erro: ${error.message}. Verifique a publicação do Apps Script. Se estiver usando o modo Admin, certifique-se de que a última publicação seja 'doGet'.</p>`;
    }
}

/**
 * Renderiza a grade de horários para a data selecionada
 */
function renderizarAgendaParaData(dataCalendario) {
    const [ano, mes, dia] = dataCalendario.split('-');
    const dataFormatoPlanilha = `${dia}/${mes}/${ano}`;
    
    atualizarDiaDaSemana(dataCalendario);
    const dadosProcessados = processarDadosParaGrade(dataFormatoPlanilha);
    container.innerHTML = '';
    
    // Adiciona o aviso de administrador se logado
    if (isAdmin) {
        const aviso = document.createElement('p');
        aviso.className = 'aviso-admin';
        aviso.textContent = 'MODO ADMINISTRADOR ATIVO: Clique em uma célula (Disponível ou Lotada) para excluir o horário, indisponibilizar ou remover reservas.';
        container.appendChild(aviso);
    }
    
    if (Object.keys(dadosProcessados).length === 0) {
        container.innerHTML += `<p class="loading">Nenhum horário encontrado para a data ${dataFormatoPlanilha}.</p>`;
        return;
    }

    for (const nomeAtividade in dadosProcessados) {
        const { horarios, profissionais, grade } = dadosProcessados[nomeAtividade];
        const titulo = document.createElement('h2');
        titulo.className = 'titulo-atividade';
        titulo.textContent = nomeAtividade;
        container.appendChild(titulo);

        let tabelaHtml = `<div class="tabela-container"><table class="tabela-agenda"><thead><tr><th>Horário</th>${profissionais.map(p => `<th>${p}</th>`).join('')}</tr></thead><tbody>`;
        
        horarios.forEach(horario => {
            tabelaHtml += `<tr><td class="horario-col">${horario}</td>`;
            
            profissionais.forEach(profissional => {
                const agendamento = grade[horario][profissional];
                let statusHtml = '<div class="status-indisponivel">-</div>';

                if (agendamento) {
                    const vagasTotais = parseInt(agendamento.Vagas) || 0;
                    // Filtra para garantir que não hajam strings vazias do split
                    const reservas = agendamento.Reserva ? agendamento.Reserva.split(',').filter(r => r && r.trim() !== '') : [];
                    const vagasOcupadas = reservas.length;
                    const vagasDisponiveis = vagasTotais - vagasOcupadas;
                    
                    let statusClass = '';
                    let dataAttributes = `data-id="${agendamento.ID}" data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}" data-reservas="${reservas.join(',')}" data-vagas="${vagasTotais}"`;
                    let textoStatus = '';
                    
                    if (vagasTotais <= 0) {
                         // Horário indisponível (Vagas = 0 ou negativo)
                         statusClass = 'status-indisponivel';
                         textoStatus = 'Indisponível';
                    } else if (vagasDisponiveis > 0) {
                        statusClass = 'status-disponivel';
                        textoStatus = `${vagasDisponiveis} <span>Vaga(s)</span>`;
                    } else {
                        statusClass = 'status-lotado';
                        textoStatus = 'Lotado';
                    }
                    
                    // Lógica para modo Admin: todas as células com ID ficam clicáveis para manutenção
                    if (isAdmin) {
                        statusClass += ' status-admin-maintenance'; 
                        if (vagasDisponiveis > 0) {
                           statusClass = 'status-admin-excluir'; // Destaca as disponíveis para exclusão rápida
                        }
                    } else if (statusClass !== 'status-disponivel') {
                        // Modo usuário normal, desabilita clique em lotado/indisponível
                        dataAttributes += ` style="cursor: not-allowed;"`;
                    }

                    statusHtml = `<div class="status-cell ${statusClass}" ${dataAttributes}>${textoStatus}</div>`;
                }
                tabelaHtml += `<td>${statusHtml}</td>`;
            });
            tabelaHtml += `</tr>`;
        });
        tabelaHtml += `</tbody></table></div>`;
        titulo.insertAdjacentHTML('afterend', tabelaHtml);
    }
    
    adicionarListenersCelulas();
    adicionarListenersAcordeao();
}

/**
 * Envia o agendamento para a API (doGet com action=book)
 */
async function confirmarAgendamento() {
    const matricula = inputMatricula.value.trim();
    if (!matricula) {
        modalMensagem.textContent = 'Por favor, insira sua matrícula.';
        modalMensagem.style.color = 'red';
        return;
    }
    
    btnConfirmar.disabled = true;
    modalMensagem.textContent = 'Agendando, aguarde...';
    modalMensagem.style.color = 'var(--cinza-texto)';
    
    // USANDO GET COM PARÂMETROS NA URL
    const params = new URLSearchParams({
        action: 'book',
        ...agendamentoAtual,
        matricula: matricula
    });
    const requestUrl = `${apiUrl}?${params.toString()}`;

    try {
        const response = await fetch(requestUrl);
        const result = await response.json();

        if (result.status === "success") {
            modalMensagem.textContent = result.message;
            modalMensagem.style.color = 'var(--verde-moinhos)';
            
            // Re-renderiza para a data correta
            const [dia, mes, ano] = agendamentoAtual.data.split('/');
            const dataISO = `${ano}-${mes}-${dia}`;
            await carregarAgenda(); 
            if (seletorData) seletorData.value = dataISO;
            renderizarAgendaParaData(dataISO); 
            
            setTimeout(fecharModalAgendamento, 2000);
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Erro ao enviar agendamento:', error);
        modalMensagem.textContent = error.message || 'Erro de comunicação. Tente novamente.';
        modalMensagem.style.color = 'red';
    } finally {
        btnConfirmar.disabled = false;
    }
}

// --- Funções de Modal (Sem alteração, exceto as novas funções Admin) ---
function abrirModalAgendamento(detalhes) {
    agendamentoAtual = detalhes;
    modalDetalhes.innerHTML = `<li><strong>Data:</strong> ${detalhes.data}</li><li><strong>Horário:</strong> ${detalhes.horario}</li><li><strong>Atividade:</strong> ${detalhes.atividade}</li><li><strong>Profissional:</strong> ${detalhes.profissional}</li>`;
    inputMatricula.value = '';
    modalMensagem.innerHTML = '';
    btnConfirmar.disabled = false;
    modalAgendamento.classList.remove('hidden');
}

function fecharModalAgendamento() {
    modalAgendamento.classList.add('hidden');
}

function abrirModalConsulta() {
    consultaViewInicial.classList.remove('hidden');
    consultaViewResultados.classList.add('hidden');
    inputConsultaMatricula.value = '';
    consultaMensagem.textContent = '';
    modalConsulta.classList.remove('hidden');
}

function fecharModalConsulta() {
    modalConsulta.classList.add('hidden');
}

// --- Funções de Consulta e Cancelamento ---

/**
 * Busca reservas do usuário (doGet com action=getMyBookings)
 */
async function buscarReservas() {
    const matricula = inputConsultaMatricula.value.trim();
    if (!matricula) {
        consultaMensagem.textContent = 'Por favor, digite sua matrícula.';
        consultaMensagem.style.color = 'red';
        return;
    }
    consultaMensagem.textContent = 'Buscando...';
    consultaMensagem.style.color = 'var(--cinza-texto)';
    
    const params = new URLSearchParams({ action: 'getMyBookings', matricula });
    const requestUrl = `${apiUrl}?${params.toString()}`;
    
    try {
        const response = await fetch(requestUrl);
        const result = await response.json();

        if (result.status === "success") {
            renderizarListaReservas(result.data);
            consultaViewInicial.classList.add('hidden');
            consultaViewResultados.classList.remove('hidden');
            consultaMensagem.textContent = '';
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        consultaMensagem.textContent = error.message || 'Erro ao buscar reservas.';
        consultaMensagem.style.color = 'red';
    }
}

/**
 * Renderiza a lista de agendamentos buscados.
 * CORREÇÃO: Assegura que Data e Horário não sejam 'undefined'.
 */
function renderizarListaReservas(reservas) {
    listaAgendamentos.innerHTML = '';
    if (reservas.length === 0) {
        listaAgendamentos.innerHTML = '<p style="text-align: center;">Nenhuma reserva futura encontrada.</p>';
        return;
    }
    
    reservas.forEach(reserva => {
        // CORREÇÃO: Usa ?? '' para garantir que não haverá 'undefined' na string
        const data = reserva.Data ?? 'Data Indefinida';
        const horario = reserva.Horário ?? 'Horário Indefinido';
        
        const item = document.createElement('div');
        item.className = 'item-agendamento';
        item.innerHTML = `
            <div class="detalhes-agendamento">
                <strong>${reserva.Atividade ?? 'Atividade Indefinida'} - ${reserva.Profissional ?? 'Profissional Indefinido'}</strong>
                <span>${data} às ${horario}</span>
            </div>
            <button class="btn-cancelar-item" type="button" data-id="${reserva.ID}" data-matricula="${reserva.Matricula}">Cancelar</button>
        `;
        listaAgendamentos.appendChild(item);
    });
    
    // Adicionar listener aos botões de cancelamento
    document.querySelectorAll('.btn-cancelar-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const matricula = e.target.dataset.matricula;
            if (confirm(`Tem certeza que deseja cancelar a reserva para matrícula ${matricula} no horário selecionado?`)) {
                cancelarReserva(id, matricula);
            }
        });
    });
}

/**
 * Cancela uma reserva específica (doGet com action=cancel)
 */
async function cancelarReserva(id, matricula) {
    const btn = document.querySelector(`.btn-cancelar-item[data-id="${id}"]`);
    btn.disabled = true;
    btn.textContent = 'Cancelando...';
    
    const params = new URLSearchParams({ 
        action: 'cancel', 
        id: id, 
        matricula: matricula 
    });
    const requestUrl = `${apiUrl}?${params.toString()}`;
    
    try {
        const response = await fetch(requestUrl);
        const result = await response.json();
        
        if (result.status === "success") {
            alert(result.message);
            await carregarAgenda(); // Recarrega para atualizar a grade
            buscarReservas(); // Atualiza a lista de reservas do modal
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert(error.message || 'Erro ao cancelar a reserva.');
        btn.disabled = false;
        btn.textContent = 'Cancelar';
    }
}


// --- Funções de Inicialização e Event Listeners ---

/**
 * Adiciona listeners às células da agenda.
 * PONTO 6: Melhoria na UX de Manutenção Admin (substituindo o prompt genérico)
 */
function adicionarListenersCelulas() {
    document.querySelectorAll('.status-cell').forEach(cell => {
        const isDisponivel = cell.classList.contains('status-disponivel');
        const isManutencaoAdmin = cell.classList.contains('status-admin-maintenance');

        if (isAdmin) {
             cell.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const data = e.target.dataset.data;
                const horario = e.target.dataset.horario;
                const atividade = e.target.dataset.atividade;
                const profissional = e.target.dataset.profissional;
                const reservasString = e.target.dataset.reservas;
                const reservas = reservasString ? reservasString.split(',').filter(r => r.trim() !== '') : [];
                const vagas = e.target.dataset.vagas;
                
                // MODO ADMIN: Lógica de Exclusão/Gerenciamento
                let opcoesTexto = `[ADMIN] Manutenção do Horário ID: ${id}\nData: ${data} | Horário: ${horario}\nAtividade: ${atividade} | Profissional: ${profissional}\nVagas Totais: ${vagas} | Reservas Atuais (${reservas.length}): ${reservas.join(', ') || 'Nenhuma'}`;
                
                opcoesTexto += "\n\nOpções:\n1. Deletar Horário (Fica Indisponível/Vagas=0).\n2. Remover uma Matrícula específica (Digite a matrícula).\n3. Cancelar (Manter como está).";
                
                const acao = prompt(opcoesTexto, '3'); // Padrão '3' para cancelar
                
                if (acao === null || acao.trim() === '3') {
                    return; // Cancelou ou escolheu 'Cancelar'
                }
                
                if (acao.trim() === '1') {
                    // Deletar Horário (Indisponibiliza)
                    if (confirm(`Confirma a exclusão (Vagas=0) para o ID ${id}?`)) {
                        alternarStatusReservaAdmin(id, { vagas: 0 }, data, horario);
                    }
                } else if (acao.trim() !== '') {
                    // Remover Matrícula Específica
                    if (confirm(`Confirma a remoção da reserva para a Matrícula ${acao.trim()} no ID ${id}?`)) {
                        alternarStatusReservaAdmin(id, { matriculaToRemove: acao.trim() }, data, horario);
                    }
                }
            });
        } 
        
        if (isDisponivel && !isAdmin) {
            cell.addEventListener('click', (e) => {
                const data = e.target.dataset.data;
                const horario = e.target.dataset.horario;
                const atividade = e.target.dataset.atividade;
                const profissional = e.target.dataset.profissional;
                abrirModalAgendamento({ data, horario, atividade, profissional });
            });
        }
    });
}

/**
 * Adiciona listeners para o efeito acordeão.
 */
function adicionarListenersAcordeao() {
    document.querySelectorAll('.titulo-atividade').forEach(titulo => {
        // Inicializa o acordeão fechado
        const tabelaContainer = titulo.nextElementSibling;
        if (tabelaContainer && tabelaContainer.classList.contains('tabela-container')) {
            tabelaContainer.style.maxHeight = '0';
        }
        
        titulo.addEventListener('click', () => {
            const tabelaContainer = titulo.nextElementSibling;
            if (tabelaContainer && tabelaContainer.classList.contains('tabela-container')) {
                // Toggle do estado
                if (tabelaContainer.style.maxHeight !== '0px' && tabelaContainer.style.maxHeight !== '') {
                    // Fechar
                    tabelaContainer.style.maxHeight = '0';
                    titulo.classList.remove('ativo');
                } else {
                    // Abrir
                    // Fechar outros abertos para um "accordion" clássico
                    document.querySelectorAll('.titulo-atividade.ativo').forEach(t => {
                        const tc = t.nextElementSibling;
                        if (tc && tc.classList.contains('tabela-container')) {
                             tc.style.maxHeight = '0';
                             t.classList.remove('ativo');
                        }
                    });
                    // Abrir o atual (usamos scrollHeight)
                    tabelaContainer.style.maxHeight = tabelaContainer.scrollHeight + 'px';
                    titulo.classList.add('ativo');
                }
            }
        });
    });
}

// --- Funções de Administração ---

/**
 * Popula a lista de profissionais no modal admin.
 */
function popularProfissionaisAdmin() {
    selectAdminProfissional.innerHTML = '<option value="">Selecione...</option>';
    PROFISSIONAIS.forEach(prof => {
        const option = document.createElement('option');
        option.value = prof;
        option.textContent = prof;
        selectAdminProfissional.appendChild(option);
    });
}

/**
 * Popula a lista de atividades e renderiza o formulário dinâmico.
 */
function popularAtividadesAdmin() {
    const profissional = selectAdminProfissional.value;
    selectAdminAtividade.innerHTML = '';
    adminAdicionarMensagem.textContent = ''; // Limpa mensagens anteriores

    if (!profissional) {
        selectAdminAtividade.innerHTML = '<option value="">Selecione um profissional primeiro</option>';
        adminFormDinamico.innerHTML = '<p>Selecione um Profissional e Atividade para configurar os horários.</p>';
        return;
    }
    
    ATIVIDADES_POR_PROFISSIONAL[profissional].forEach(ativ => {
        const option = document.createElement('option');
        option.value = ativ;
        option.textContent = ativ;
        selectAdminAtividade.appendChild(option);
    });
    
    // Auto-seleciona o primeiro, se houver, e renderiza o form
    if (selectAdminAtividade.options.length > 0) {
        selectAdminAtividade.selectedIndex = 0;
    }
    renderizarFormAdmin();
}

/**
 * Renderiza o formulário de entrada de horário (simples ou grade).
 * PONTOS 2 E 3: Lógica de formulário dinâmico.
 */
function renderizarFormAdmin() {
    const atividade = selectAdminAtividade.value;
    const isHorarioFixo = ATIVIDADES_COM_HORARIO_FIXO.includes(atividade);
    
    adminFormDinamico.innerHTML = '';

    if (!atividade) {
        adminFormDinamico.innerHTML = '<p>Selecione uma Atividade para configurar os horários.</p>';
        return;
    }
    
    if (isHorarioFixo) {
        // PONTOS 2: Quick Massage / Reiki (Grade de 43 horários fixos)
        let tabelaHtml = `<p>Insira '1' para abrir o horário ou 'Indisponível' (ou deixe vazio) para bloquear o horário.</p>`;
        tabelaHtml += `<table class="tabela-horarios-fixos">
                            <thead>
                                <tr>
                                    <th>Horário</th>
                                    <th>Vagas (1 ou Indisponível)</th>
                                    <th>Horário</th>
                                    <th>Vagas (1 ou Indisponível)</th>
                                </tr>
                            </thead>
                            <tbody>`;
        
        // Renderiza em 2 colunas
        const halfLength = Math.ceil(QUICK_MASSAGE_REIKI_TIMES.length / 2);
        for (let i = 0; i < halfLength; i++) {
            const time1 = QUICK_MASSAGE_REIKI_TIMES[i];
            const time2 = QUICK_MASSAGE_REIKI_TIMES[i + halfLength];
            
            tabelaHtml += `<tr>
                <td>${time1}</td>
                <td><input type="text" class="input-admin-vagas-fixo" data-horario="${time1}" placeholder="1 ou Indisponível"></td>`;
            
            if (time2) {
                tabelaHtml += `<td>${time2}</td>
                <td><input type="text" class="input-admin-vagas-fixo" data-horario="${time2}" placeholder="1 ou Indisponível"></td>`;
            } else {
                 tabelaHtml += `<td></td><td></td>`; // Garante que a linha termine corretamente
            }
            tabelaHtml += `</tr>`;
        }
        
        tabelaHtml += `</tbody></table>`;
        adminFormDinamico.innerHTML = tabelaHtml;

    } else {
        // PONTO 3: Ana / Carlos (Input simples para horário e vagas)
        adminFormDinamico.innerHTML = `
            <div class="form-group grid-admin-simples">
                <div>
                    <label for="input-admin-horario">Horário:</label>
                    <input type="time" id="input-admin-horario" step="600" required>
                </div>
                <div>
                    <label for="input-admin-vagas">Quantidade de Vagas:</label>
                    <input type="number" id="input-admin-vagas" min="1" value="1" required>
                </div>
            </div>`;
    }
}


/**
 * Abre o modal de login admin
 */
function abrirModalAdminLogin() {
    inputAdminPassword.value = '';
    adminLoginMensagem.textContent = '';
    modalAdminLogin.classList.remove('hidden');
}

/**
 * Fecha o modal de login admin
 */
function fecharModalAdminLogin() {
    modalAdminLogin.classList.add('hidden');
}

/**
 * Lógica de Login Admin
 */
function processarLoginAdmin() {
    const senha = inputAdminPassword.value;
    if (senha === ADMIN_PASSWORD) {
        isAdmin = true;
        fecharModalAdminLogin();
        btnAdminLogin.textContent = 'Logout Admin';
        btnGerenciarAgenda.classList.remove('hidden'); // Exibe o botão de Gerenciamento
        renderizarAgendaParaData(seletorData.value); // Re-renderiza no modo admin
    } else {
        adminLoginMensagem.textContent = 'Senha incorreta.';
        adminLoginMensagem.style.color = 'red';
    }
}

/**
 * Lógica de Logout Admin
 */
function processarLogoutAdmin() {
    isAdmin = false;
    btnAdminLogin.textContent = 'Login Admin';
    btnGerenciarAgenda.classList.add('hidden');
    renderizarAgendaParaData(seletorData.value); // Re-renderiza no modo normal
    fecharModalAdminGerenciar();
}

/**
 * Abre o modal de gerenciamento admin
 */
function abrirModalAdminGerenciar() {
    popularProfissionaisAdmin();
    // A chamada para popularAtividadesAdmin e renderizarFormAdmin será feita no listener de 'change'
    adminAdicionarMensagem.textContent = '';
    
    // Define a data atual como padrão
    const hoje = new Date();
    hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
    inputAdminData.value = hoje.toISOString().slice(0, 10);
    
    modalAdminGerenciar.classList.remove('hidden');
}

/**
 * Fecha o modal de gerenciamento admin
 */
function fecharModalAdminGerenciar() {
    modalAdminGerenciar.classList.add('hidden');
}

/**
 * Adiciona um novo agendamento (doGet com action=create)
 * PONTOS 3 E 5: Trata submissão simples ou submissão de grade.
 */
async function adicionarNovoAgendamento() {
    const profissional = selectAdminProfissional.value;
    const atividade = selectAdminAtividade.value;
    const dataISO = inputAdminData.value;
    const matriculaAdmin = inputAdminMatricula.value.trim();
    
    if (!profissional || !atividade || !dataISO) {
        adminAdicionarMensagem.textContent = 'Selecione o Profissional, Atividade e Data.';
        adminAdicionarMensagem.style.color = 'red';
        return;
    }
    
    btnAdicionarHorario.disabled = true;
    adminAdicionarMensagem.textContent = 'Adicionando horário(s), aguarde...';
    adminAdicionarMensagem.style.color = 'var(--cinza-texto)';
    
    const [ano, mes, dia] = dataISO.split('-');
    const dataFormatoPlanilha = `${dia}/${mes}/${ano}`;
    
    let agendamentosParaCriar = [];
    const isHorarioFixo = ATIVIDADES_COM_HORARIO_FIXO.includes(atividade);

    if (isHorarioFixo) {
        // Coleta dados da grade (Quick Massage/Reiki)
        document.querySelectorAll('.input-admin-vagas-fixo').forEach(input => {
            let vagas = input.value.trim().toLowerCase();
            let numVagas = 0;
            
            if (vagas === '1') {
                numVagas = 1;
            } else if (vagas === 'indisponível' || vagas === 'indisponivel' || vagas === '') {
                numVagas = 0; // 0 vagas = Indisponível/Excluído
            } else if (!isNaN(parseInt(vagas)) && parseInt(vagas) > 0) {
                 // Aceita outros números de vagas se for digitado, embora a regra seja 1.
                 numVagas = parseInt(vagas); 
            }
            
            if (numVagas >= 0) {
                agendamentosParaCriar.push({
                    horario: input.dataset.horario,
                    vagas: numVagas
                });
            }
        });

    } else {
        // Coleta dados da entrada simples (Ana/Carlos)
        const horario = document.getElementById('input-admin-horario').value;
        const vagas = parseInt(document.getElementById('input-admin-vagas').value);
        
        if (!horario || isNaN(vagas) || vagas <= 0) {
            adminAdicionarMensagem.textContent = 'Preencha o Horário e Vagas (deve ser > 0) para esta atividade.';
            adminAdicionarMensagem.style.color = 'red';
            btnAdicionarHorario.disabled = false;
            return;
        }
        agendamentosParaCriar.push({ horario, vagas });
    }
    
    if (agendamentosParaCriar.length === 0) {
        adminAdicionarMensagem.textContent = 'Nenhum horário válido para adicionar.';
        adminAdicionarMensagem.style.color = 'red';
        btnAdicionarHorario.disabled = false;
        return;
    }
    
    // Constrói o objeto de dados a ser enviado.
    // Usamos 'bookingsData' para enviar múltiplos horários de uma vez
    const payload = {
        action: 'create',
        data: dataFormatoPlanilha,
        atividade: atividade,
        profissional: profissional,
        matriculaAdmin: matriculaAdmin,
        bookingsData: JSON.stringify(agendamentosParaCriar) 
    };
    
    // IMPORTANTE: Para enviar o bookingsData como um objeto grande, você precisará
    // usar o método POST ou o método GET com o URLSearchParams. 
    // Para simplificar a compatibilidade com o Apps Script, usamos GET/URLSearchParams.
    const params = new URLSearchParams(payload);
    const requestUrl = `${apiUrl}?${params.toString()}`;

    try {
        const response = await fetch(requestUrl);
        const result = await response.json();

        if (result.status === "success") {
            adminAdicionarMensagem.textContent = result.message;
            adminAdicionarMensagem.style.color = 'var(--verde-moinhos)';
            await carregarAgenda(); // Recarrega para atualizar a grade
            renderizarAgendaParaData(dataISO); // Força a atualização da grade
        } else {
            // PONTO 5: Se retornar "Ação não reconhecida", o erro está no Apps Script!
            // Avisa o admin sobre isso.
             throw new Error(result.message || 'Erro de comunicação. Verifique se o seu Apps Script reconhece a "action=create".');
        }

    } catch (error) {
        console.error('Erro ao adicionar agendamento:', error);
        adminAdicionarMensagem.textContent = error.message || 'Erro de comunicação. Tente novamente.';
        adminAdicionarMensagem.style.color = 'red';
    } finally {
        btnAdicionarHorario.disabled = false;
    }
}

/**
 * Função para Excluir Horário (Vagas=0) ou Remover uma Matrícula do campo Reserva.
 * (doGet com action=adminUpdate)
 */
async function alternarStatusReservaAdmin(id, updates, dataFormatoPlanilha, horario) {
    if (!id) return;
    
    const statusCell = document.querySelector(`.status-cell[data-id="${id}"]`);
    if (statusCell) {
        statusCell.textContent = 'Atualizando...';
        statusCell.style.pointerEvents = 'none'; // Desabilita clique durante a requisição
    }

    const params = new URLSearchParams({
        action: 'adminUpdate',
        id: id,
        ...updates
    });
    const requestUrl = `${apiUrl}?${params.toString()}`;
    
    try {
        const response = await fetch(requestUrl);
        const result = await response.json();

        if (result.status === "success") {
            alert(result.message);
            // Re-renderiza a agenda
            await carregarAgenda(); 
            const [dia, mes, ano] = dataFormatoPlanilha.split('/');
            const dataISO = `${ano}-${mes}-${dia}`;
            renderizarAgendaParaData(dataISO); 
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert(error.message || 'Erro de comunicação na atualização administrativa.');
    }
}


// --- Event Listeners Globais ---
document.addEventListener('DOMContentLoaded', carregarAgenda);
btnCancelarAgendamento.addEventListener('click', fecharModalAgendamento);
btnConfirmar.addEventListener('click', confirmarAgendamento);
btnConsultarReservas.addEventListener('click', abrirModalConsulta);
btnFecharConsulta.addEventListener('click', fecharModalConsulta);
btnBuscarReservas.addEventListener('click', buscarReservas);
btnVoltarConsulta.addEventListener('click', () => {
    consultaViewResultados.classList.add('hidden');
    consultaViewInicial.classList.remove('hidden');
    consultaMensagem.textContent = '';
});


// --- Event Listeners Admin ---
btnAdminLogin.addEventListener('click', () => {
    if (isAdmin) {
        processarLogoutAdmin();
    } else {
        abrirModalAdminLogin();
    }
});
btnCancelarAdminLogin.addEventListener('click', fecharModalAdminLogin);
btnConfirmarAdminLogin.addEventListener('click', processarLoginAdmin);

btnGerenciarAgenda.addEventListener('click', abrirModalAdminGerenciar);
btnFecharAdminGerenciar.addEventListener('click', fecharModalAdminGerenciar);
btnAdminLogout.addEventListener('click', processarLogoutAdmin);

// Lógica de atualização dinâmica do formulário
selectAdminProfissional.addEventListener('change', popularAtividadesAdmin);
selectAdminAtividade.addEventListener('change', renderizarFormAdmin);
btnAdicionarHorario.addEventListener('click', adicionarNovoAgendamento);
