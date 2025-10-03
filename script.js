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
const inputAdminHorario = document.getElementById('input-admin-horario');
const inputAdminVagas = document.getElementById('input-admin-vagas');
const inputAdminMatricula = document.getElementById('input-admin-matricula');
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
 * (Função completa, apenas para referência, deve ser a mesma do seu código existente)
 */
function processarDadosParaGrade(dataFormatoPlanilha) {
    const dadosFiltrados = todosOsAgendamentos.filter(item => item.Data === dataFormatoPlanilha);
    const dadosProcessados = {};

    dadosFiltrados.forEach(item => {
        const { Atividade, Profissional, Horário, Data } = item;
        
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
        
        todosOsAgendamentos = await response.json();
        
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
        container.innerHTML = `<p class="loading error-message">⚠️ Erro: ${error.message}. Verifique a publicação do Apps Script.</p>`;
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
        aviso.textContent = 'MODO ADMINISTRADOR ATIVO: Clique em uma célula disponível para excluir o horário ou em uma célula lotada/indisponível para gerenciar as reservas.';
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
                    const reservas = agendamento.Reserva ? agendamento.Reserva.split(',').filter(Boolean) : [];
                    const vagasOcupadas = reservas.length;
                    const vagasDisponiveis = vagasTotais - vagasOcupadas;
                    
                    let statusClass = '';
                    let dataAttributes = `data-id="${agendamento.ID}" data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}" data-reservas="${reservas.join(',')}" data-vagas="${vagasTotais}"`;
                    let textoStatus = '';
                    
                    if (vagasTotais <= 0) {
                         // Horário indisponível (Vagas = 0 ou negativo)
                         statusClass = 'status-indisponivel';
                         textoStatus = '-';
                    } else if (vagasDisponiveis > 0) {
                        statusClass = 'status-disponivel';
                        textoStatus = `${vagasDisponiveis} <span>Vaga(s)</span>`;
                    } else {
                        statusClass = 'status-lotado';
                        textoStatus = 'Lotado';
                    }
                    
                    // Adiciona classes específicas para o modo Admin
                    if (isAdmin) {
                        if (statusClass === 'status-disponivel') {
                            statusClass = 'status-admin-excluir'; // Permite excluir o horário
                        } else if (statusClass === 'status-lotado') {
                            statusClass += ' status-admin-lotado'; // Indica que pode gerenciar reservas
                        }
                        // O modo admin não usa 'cursor: not-allowed'
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
    // ... (restante da função confirmarAgendamento, sem alteração)
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
            
            await carregarAgenda(); // Recarrega para atualizar a grade
            
            // Re-renderiza para a data correta
            const [dia, mes, ano] = agendamentoAtual.data.split('/');
            const dataISO = `${ano}-${mes}-${dia}`;
            if (seletorData) seletorData.value = dataISO;
            renderizarAgendaParaData(dataISO); // Força a atualização da grade
            
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

// --- Funções de Consulta e Cancelamento (Sem alteração) ---

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
 */
function renderizarListaReservas(reservas) {
    listaAgendamentos.innerHTML = '';
    if (reservas.length === 0) {
        listaAgendamentos.innerHTML = '<p style="text-align: center;">Nenhuma reserva futura encontrada.</p>';
        return;
    }
    
    reservas.forEach(reserva => {
        const item = document.createElement('div');
        item.className = 'item-agendamento';
        item.innerHTML = `
            <div class="detalhes-agendamento">
                <strong>${reserva.Atividade} - ${reserva.Profissional}</strong>
                <span>${reserva.Data} às ${reserva.Horário}</span>
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
            if (confirm(`Tem certeza que deseja cancelar a reserva para ${matricula} no horário selecionado?`)) {
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
 */
function adicionarListenersCelulas() {
    document.querySelectorAll('.status-cell').forEach(cell => {
        const isDisponivel = cell.classList.contains('status-disponivel');
        const isExcluirAdmin = cell.classList.contains('status-admin-excluir');
        const isGerenciarAdmin = cell.classList.contains('status-lotado') && isAdmin;

        if (isDisponivel) {
            cell.addEventListener('click', (e) => {
                const data = e.target.dataset.data;
                const horario = e.target.dataset.horario;
                const atividade = e.target.dataset.atividade;
                const profissional = e.target.dataset.profissional;
                abrirModalAgendamento({ data, horario, atividade, profissional });
            });
        }
        
        if (isAdmin) {
             cell.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const data = e.target.dataset.data;
                const horario = e.target.dataset.horario;
                const atividade = e.target.dataset.atividade;
                const profissional = e.target.dataset.profissional;
                const reservas = e.target.dataset.reservas ? e.target.dataset.reservas.split(',') : [];
                const vagas = e.target.dataset.vagas;
                
                // MODO ADMIN: Lógica de Exclusão/Gerenciamento
                if (isExcluirAdmin) {
                    if (confirm(`[ADMIN] Deseja EXCLUIR o horário de ${atividade} com ${profissional} em ${data} às ${horario}?`)) {
                        // Action: adminUpdate, Vagas: 0 (para excluir)
                        alternarStatusReservaAdmin(id, { vagas: 0 }, data, horario);
                    }
                } else if (isGerenciarAdmin || cell.classList.contains('status-indisponivel')) {
                    // MODO ADMIN: Gerenciar Reservas/Indisponibilidade
                    if (confirm(`[ADMIN] Gerenciar agendamento ID: ${id}. Reservas atuais: ${reservas.join(', ') || 'Nenhuma'}. Vagas: ${vagas}.` + 
                                '\n\nOK para remover reservas (ex: Matrícula) ou CANCELAR para indisponibilizar/excluir (Vagas=0).')) {
                        
                        const matriculaParaRemover = prompt("Digite a matrícula para remover a reserva (ou deixe vazio para cancelar/indisponibilizar):");
                        
                        if (matriculaParaRemover !== null) { // Se o usuário não cancelou o prompt
                            if (matriculaParaRemover.trim() === '') {
                                // Se deixou vazio, pede confirmação para indisponibilizar
                                if (confirm(`Deseja indisponibilizar/excluir o agendamento ID ${id} (Vagas=0)?`)) {
                                     alternarStatusReservaAdmin(id, { vagas: 0 }, data, horario);
                                }
                            } else {
                                // Remover uma reserva
                                alternarStatusReservaAdmin(id, { matriculaToRemove: matriculaParaRemover.trim() }, data, horario);
                            }
                        }
                    }
                }
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
        titulo.nextElementSibling.style.maxHeight = '0';
        
        titulo.addEventListener('click', () => {
            const tabelaContainer = titulo.nextElementSibling;
            
            // Toggle do estado
            if (tabelaContainer.style.maxHeight !== '0px' && tabelaContainer.style.maxHeight !== '') {
                // Fechar
                tabelaContainer.style.maxHeight = '0';
                titulo.classList.remove('ativo');
            } else {
                // Abrir
                // Fechar outros abertos para um "accordion" clássico
                document.querySelectorAll('.titulo-atividade.ativo').forEach(t => {
                    t.nextElementSibling.style.maxHeight = '0';
                    t.classList.remove('ativo');
                });
                // Abrir o atual (usamos um valor grande para simular 'auto')
                tabelaContainer.style.maxHeight = tabelaContainer.scrollHeight + 'px';
                titulo.classList.add('ativo');
            }
        });
    });
}

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
 * Popula a lista de atividades com base no profissional selecionado.
 */
function popularAtividadesAdmin() {
    const profissional = selectAdminProfissional.value;
    selectAdminAtividade.innerHTML = '';

    if (!profissional) {
        selectAdminAtividade.innerHTML = '<option value="">Selecione um profissional primeiro</option>';
        return;
    }
    
    ATIVIDADES_POR_PROFISSIONAL[profissional].forEach(ativ => {
        const option = document.createElement('option');
        option.value = ativ;
        option.textContent = ativ;
        selectAdminAtividade.appendChild(option);
    });
}


// --- Funções de Administração ---

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
        btnGerenciarAgenda.classList.remove('hidden');
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
    popularAtividadesAdmin();
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
 */
async function adicionarNovoAgendamento() {
    const profissional = selectAdminProfissional.value;
    const atividade = selectAdminAtividade.value;
    const dataISO = inputAdminData.value;
    const horario = inputAdminHorario.value;
    const vagas = parseInt(inputAdminVagas.value);
    const matricula = inputAdminMatricula.value.trim(); // Matrícula opcional do admin para registro

    if (!profissional || !atividade || !dataISO || !horario || isNaN(vagas) || vagas <= 0) {
        adminAdicionarMensagem.textContent = 'Preencha todos os campos obrigatórios (Profissional, Atividade, Data, Horário e Vagas > 0).';
        adminAdicionarMensagem.style.color = 'red';
        return;
    }
    
    btnAdicionarHorario.disabled = true;
    adminAdicionarMensagem.textContent = 'Adicionando horário, aguarde...';
    adminAdicionarMensagem.style.color = 'var(--cinza-texto)';
    
    // Converte data ISO para DD/MM/AAAA
    const [ano, mes, dia] = dataISO.split('-');
    const dataFormatoPlanilha = `${dia}/${mes}/${ano}`;

    const params = new URLSearchParams({
        action: 'create',
        data: dataFormatoPlanilha,
        horario: horario,
        atividade: atividade,
        profissional: profissional,
        vagas: vagas,
        matriculaAdmin: matricula || '' // Passa a matrícula do admin, se houver
    });
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
            throw new Error(result.message);
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

selectAdminProfissional.addEventListener('change', popularAtividadesAdmin);
btnAdicionarHorario.addEventListener('click', adicionarNovoAgendamento);
