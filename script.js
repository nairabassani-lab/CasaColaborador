// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

// --- Variáveis Globais de Status ---
const ADMIN_PASSWORD = 'admin123'; // MUDE ESTA SENHA EM AMBIENTE DE PRODUÇÃO
let isAdminLoggedIn = false;
let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;

// --- Dicionário de Modalidades (Regra do Cliente - Requisito 2) ---
const MODALIDADES_POR_PROFISSIONAL = {
    // Ana e Carlos: Aulas com vagas maiores
    'Ana': ['Fit Class (Ballet Fit)', 'Funcional Dance', 'Power Gap'],
    'Carlos': ['Funcional', 'Mat Pilates', 'Ritmos / Zumba', 'Jump'],
    // Luis, Maria Eduarda e Rafael: Quick Massage/Reiki (Grade 15/15)
    'Luis': ['Quick Massage'],
    'Maria Eduarda': ['Quick Massage'],
    'Rafael': ['Quick Massage', 'Reiki']
};


// --- Seletores de Elementos ---
const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modal de Agendamento (Usuário)
const modalAgendamento = document.getElementById('modal-agendamento');
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnCancelarAgendamento = document.getElementById('btn-cancelar-agendamento');
const btnConfirmar = document.getElementById('btn-confirmar');
const modalMensagem = document.getElementById('modal-mensagem');

// Modal de Consulta (Usuário)
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

// Elementos Admin
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda'); 

// Modal de Login Admin
const modalAdminLogin = document.getElementById('modal-admin-login');
const inputAdminPassword = document.getElementById('input-admin-password');
const btnConfirmarAdminLogin = document.getElementById('btn-confirmar-admin-login');
const adminLoginMensagem = document.getElementById('admin-login-mensagem');
const btnCancelarAdminLogin = document.getElementById('btn-cancelar-admin-login');

// Modal de Gerenciamento Admin (Geral)
const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnFecharAdminGerenciar = document.getElementById('btn-fechar-admin-gerenciar');
const btnAdminLogout = document.getElementById('btn-admin-logout');
const btnAdminAdicionar = document.getElementById('btn-admin-adicionar'); // Botão de acesso ao modal de adição

// Modal de Adição Admin (Novo - Requisito 1)
const modalAdminAdicionar = document.getElementById('modal-admin-adicionar');
const formAdicionarHorario = document.getElementById('form-adicionar-horario');
const adminSelectData = document.getElementById('admin-select-data');
const adminSelectProfissional = document.getElementById('admin-select-profissional');
const adminSelectAtividade = document.getElementById('admin-select-atividade');
const quickMassageContainer = document.getElementById('quick-massage-container');
const quickMassageHorarios = document.getElementById('quick-massage-horarios');
const horarioUnicoContainer = document.getElementById('horario-unico-container');
const adminInputHorario = document.getElementById('admin-input-horario');
const vagasContainer = document.getElementById('vagas-container');
const adminInputVagas = document.getElementById('admin-input-vagas');
const btnCancelarAdicionar = document.getElementById('btn-cancelar-adicionar');
const btnConfirmarAdicionar = document.getElementById('btn-confirmar-adicionar');
const adminAddMensagem = document.getElementById('admin-add-mensagem');


// --- Funções Principais ---

async function carregarAgenda() {
    try {
        // Usa a URL com o parâmetro 'action' para carregar os dados
        const requestUrl = `${apiUrl}?action=loadData`; 
        const response = await fetch(requestUrl, { cache: 'no-cache' }); 
        
        if (!response.ok) {
             throw new Error(`Erro de rede: Status ${response.status}. Verifique o URL da API.`);
        }
        
        const data = await response.json();
        
        if (data.status === "error") {
            throw new Error(data.message || "Erro desconhecido ao carregar a agenda.");
        }
        
        todosOsAgendamentos = data;
        
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const hojeFormatado = hoje.toISOString().slice(0, 10);
        
        if (seletorData) {
            const dataParaRenderizar = seletorData.value || hojeFormatado; 
            seletorData.value = dataParaRenderizar;
            renderizarAgendaParaData(dataParaRenderizar);
            
            if (!seletorData.dataset.listenerAdded) {
                 seletorData.addEventListener('change', () => renderizarAgendaParaData(seletorData.value));
                 seletorData.dataset.listenerAdded = 'true';
            }
        } else {
            renderizarAgendaParaData(hojeFormatado);
        }

    } catch (error) {
        console.error('Erro ao carregar a agenda:', error);
        container.innerHTML = `<p class="loading error-message">⚠️ Erro ao carregar: ${error.message}.</p>`;
    }
}

/**
 * Renderiza a grade de horários para a data selecionada com a lógica de status (Requisito 2).
 */
function renderizarAgendaParaData(dataCalendario) {
    const [ano, mes, dia] = dataCalendario.split('-');
    const dataFormatoPlanilha = `${dia}/${mes}/${ano}`;
    
    atualizarDiaDaSemana(dataCalendario);
    const dadosProcessados = processarDadosParaGrade(dataFormatoPlanilha);
    container.innerHTML = '';
    
    if (isAdminLoggedIn) {
        container.innerHTML = `<p class="aviso-admin">MODO ADMINISTRADOR ATIVADO: Clique em um horário para AÇÃO ADMIN (EXCLUIR/INFORMAÇÕES).</p>`;
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
                    const reservas = agendamento.Reserva ? agendamento.Reserva.split(',').map(m => m.trim()).filter(Boolean) : [];
                    const vagasOcupadas = reservas.length;
                    const vagasDisponiveis = vagasTotais - vagasOcupadas;
                    
                    let statusClass = 'status-indisponivel';
                    let dataAttributes = `data-id="${agendamento.ID_LINHA}"`; 
                    let textoStatus = '-';
                    
                    dataAttributes += ` data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}" data-vagas-disponiveis="${vagasDisponiveis}"`;
                    
                    const rawReserva = agendamento.Reserva;
                    // Lógica para o status "Indisponivel" setado pelo Admin
                    const isExplicitlyIndisponivel = (typeof rawReserva === 'string' && rawReserva.trim().toLowerCase() === 'indisponivel');
                    
                    if (isExplicitlyIndisponivel || vagasTotais === 0) {
                        // 1. Indisponível (Admin marcou explicitamente OU vagas totais são zero)
                        statusClass = 'status-indisponivel';
                        textoStatus = 'Indisponível'; 

                    } else if (vagasTotais > 0) {
                        
                        if (vagasDisponiveis > 0) {
                            // 2. Disponível: Mostra o número de vagas restantes e "Reservar"
                            statusClass = 'status-disponivel';
                            textoStatus = `${vagasDisponiveis} <span>Vaga(s) / Reservar</span>`;

                            // MODO ADMIN: Célula disponível vira EXCLUIR
                            if (isAdminLoggedIn) {
                                statusClass = 'status-admin-excluir';
                                textoStatus = 'EXCLUIR';
                            }

                        } else {
                            // 3. Lotado/Reservado
                            statusClass = 'status-lotado';
                            textoStatus = 'Reservado'; 
                            
                            // MODO ADMIN: Célula lotada - mostra matrícula para fins de admin
                            if (isAdminLoggedIn) {
                                statusClass = 'status-admin-lotado';
                                textoStatus = `LOTADO (${vagasOcupadas}) <span>Reservas: ${reservas.join(', ')}</span>`;
                                dataAttributes += ` data-reservas="${reservas.join(', ')}"`;
                            }
                        }
                    } else {
                        statusClass = 'status-indisponivel';
                        textoStatus = 'Indisponível';
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
}


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
    
    // Passa os dados necessários para o Apps Script
    const params = new URLSearchParams({
        action: 'book',
        id_linha: agendamentoAtual.id,
        matricula: matricula
    });
    const requestUrl = `${apiUrl}?${params.toString()}`;

    try {
        const response = await fetch(requestUrl);
        const result = await response.json();

        if (result.status === "success") {
            modalMensagem.textContent = result.message;
            modalMensagem.style.color = 'var(--verde-moinhos)';
            
            setTimeout(async () => {
                await carregarAgenda(); 
                fecharModalAgendamento();
            }, 1000); 

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

// --- Funções de Modal Usuário ---

function abrirModalAgendamento(detalhes) {
    agendamentoAtual = detalhes;
    modalDetalhes.innerHTML = `
        <li><strong>Data:</strong> ${detalhes.data}</li>
        <li><strong>Horário:</strong> ${detalhes.horario}</li>
        <li><strong>Atividade:</strong> ${detalhes.atividade}</li>
        <li><strong>Profissional:</strong> ${detalhes.profissional}</li>
        <li><strong>Vagas Disponíveis:</strong> ${detalhes.vagasDisponiveis}</li>
    `;
    inputMatricula.value = '';
    modalMensagem.innerHTML = '';
    btnConfirmar.disabled = false;
    modalAgendamento.classList.remove('hidden');
}

function fecharModalAgendamento() {
    modalAgendamento.classList.add('hidden');
}

function fecharModalConsulta() {
    modalConsulta.classList.add('hidden');
}


// --- Funções de Login e Gerenciamento Admin (Requisito 1) ---

function abrirModalAdminLogin() {
    inputAdminPassword.value = '';
    adminLoginMensagem.textContent = '';
    modalAdminLogin.classList.remove('hidden');
}

function fecharModalAdminLogin() {
    modalAdminLogin.classList.add('hidden');
}

function abrirModalAdminGerenciar() {
    modalAdminGerenciar.classList.remove('hidden');
}

function fecharModalAdminGerenciar() {
    modalAdminGerenciar.classList.add('hidden');
}

function adminLogin() {
    const password = inputAdminPassword.value;
    adminLoginMensagem.textContent = '';

    if (password === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;
        fecharModalAdminLogin();
        
        container.dataset.adminMode = 'true';
        btnAdminLogin.textContent = 'Logout Admin';
        btnGerenciarAgenda.classList.remove('hidden');
        
        // Inicializa a data no modal de adição para hoje
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        adminSelectData.value = hoje.toISOString().slice(0, 10);

        carregarAgenda(); 
        
    } else {
        adminLoginMensagem.textContent = 'Senha incorreta.';
        adminLoginMensagem.style.color = 'red';
        isAdminLoggedIn = false;
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    container.dataset.adminMode = 'false';
    btnAdminLogin.textContent = 'Login Admin';
    btnGerenciarAgenda.classList.add('hidden');
    fecharModalAdminGerenciar(); 
    fecharModalAdminAdicionar(); 
    carregarAgenda(); 
}

// --- Funções do Modal de Adição Admin (Requisito 2) ---

function abrirModalAdminAdicionar() {
    if (!isAdminLoggedIn) return; // Garante que só abre se estiver logado
    
    // Limpar estados
    formAdicionarHorario.reset();
    adminAddMensagem.innerHTML = '';
    adminSelectAtividade.disabled = true;
    btnConfirmarAdicionar.disabled = true;
    quickMassageContainer.classList.add('hidden');
    horarioUnicoContainer.classList.add('hidden');
    vagasContainer.classList.add('hidden');
    
    // Garante que a data está preenchida
    if (!adminSelectData.value) {
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        adminSelectData.value = hoje.toISOString().slice(0, 10);
    }

    modalAdminAdicionar.classList.remove('hidden');
    fecharModalAdminGerenciar();
}

function fecharModalAdminAdicionar() {
    modalAdminAdicionar.classList.add('hidden');
}


/**
 * Popula o select de Modalidades baseado no Profissional (Requisito 2)
 */
function renderizarModalidades() {
    const profissional = adminSelectProfissional.value;
    const atividades = MODALIDADES_POR_PROFISSIONAL[profissional] || [];

    adminSelectAtividade.innerHTML = '<option value="" disabled selected>Selecione a Modalidade</option>';
    
    if (atividades.length > 0) {
        adminSelectAtividade.disabled = false;
        atividades.forEach(atividade => {
            const option = document.createElement('option');
            option.value = atividade;
            option.textContent = atividade;
            adminSelectAtividade.appendChild(option);
        });
    } else {
        adminSelectAtividade.disabled = true;
    }
    
    // Limpar e ocultar configurações de horário/vagas
    quickMassageContainer.classList.add('hidden');
    horarioUnicoContainer.classList.add('hidden');
    vagasContainer.classList.add('hidden');
    btnConfirmarAdicionar.disabled = true;
}

/**
 * Configura o formulário de Adição baseado na Modalidade (Requisito 2)
 */
function configurarOpcoesHorario() {
    const atividade = adminSelectAtividade.value;
    
    quickMassageContainer.classList.add('hidden');
    horarioUnicoContainer.classList.add('hidden');
    vagasContainer.classList.add('hidden');
    btnConfirmarAdicionar.disabled = true;

    if (atividade === 'Quick Massage' || atividade === 'Reiki') {
        // Quick Massage e Reiki usam a grade de 15 em 15 minutos
        renderizarHorariosQuickMassage();
        quickMassageContainer.classList.remove('hidden');
        vagasContainer.classList.remove('hidden');
        adminInputVagas.value = 1; // 1 vaga por slot
        adminInputVagas.readOnly = true; // Força 1 vaga
        btnConfirmarAdicionar.disabled = false;
    } else if (atividade) {
        // Outras modalidades usam horário único
        horarioUnicoContainer.classList.remove('hidden');
        vagasContainer.classList.remove('hidden');
        adminInputVagas.value = 10; // Valor padrão para aulas
        adminInputVagas.readOnly = false; // Permite alterar vagas
        btnConfirmarAdicionar.disabled = false;
    }
}

/**
 * Gera o grid de horários de 15 em 15 minutos (08:15 a 18:45) (Requisito 2)
 */
function renderizarHorariosQuickMassage() {
    quickMassageHorarios.innerHTML = '';
    const horarios = [];
    // Gerar horários de 08:15 a 18:45
    for (let h = 8; h <= 18; h++) {
        for (let m = 0; m < 60; m += 15) {
            const horarioStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            // Filtro exato de 08:15 a 18:45
            if (horarioStr >= '08:15' && horarioStr <= '18:45') {
                 horarios.push(horarioStr);
            }
        }
    }

    horarios.forEach(horario => {
        const item = document.createElement('div');
        item.className = 'horario-item';
        
        // Checkbox para selecionar disponibilidade
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'horarios-quick-massage';
        checkbox.value = horario;
        checkbox.id = `horario-${horario.replace(':', '-')}`;
        
        // Input de texto para marcar "Indisponivel" (Requisito 2)
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.placeholder = 'Indisponível?';
        textInput.className = 'admin-input-indisponivel';
        textInput.style.maxWidth = '100px';
        textInput.style.marginLeft = '5px';
        textInput.dataset.horario = horario;

        item.innerHTML = `<label for="horario-${horario.replace(':', '-')}">${horario}</label>`;
        item.prepend(checkbox);
        item.appendChild(textInput);

        quickMassageHorarios.appendChild(item);
    });
}


/**
 * Envia um ou múltiplos horários para o Apps Script
 */
async function adicionarNovoHorario(event) {
    event.preventDefault();

    const data = adminSelectData.value;
    const profissional = adminSelectProfissional.value;
    const atividade = adminSelectAtividade.value;
    const vagas = parseInt(adminInputVagas.value);

    let novosHorarios = [];

    if (atividade === 'Quick Massage' || atividade === 'Reiki') {
        // Lógica para Quick Massage: Processar horários checados e campos "Indisponível"
        const itensHorario = quickMassageHorarios.querySelectorAll('.horario-item');
        
        itensHorario.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const inputIndisponivel = item.querySelector('.admin-input-indisponivel');
            const horario = checkbox.value;

            if (checkbox.checked) {
                // Se marcado, pega o status de "Indisponível" se o admin digitou (Requisito 2)
                const reservaStatus = inputIndisponivel.value.trim().toLowerCase() === 'indisponivel' ? 'Indisponivel' : '';
                
                novosHorarios.push({
                    Horario: horario,
                    Vagas: vagas,
                    Reserva: reservaStatus
                });
            }
        });

    } else {
        // Lógica para modalidades com horário único
        const horario = adminInputHorario.value.trim();
        if (!horario || isNaN(vagas) || vagas < 1) {
            adminAddMensagem.textContent = 'Preencha o horário e o número de vagas corretamente.';
            adminAddMensagem.className = 'mensagem-modal error';
            return;
        }
        novosHorarios.push({
            Horario: horario,
            Vagas: vagas,
            Reserva: ''
        });
    }

    if (novosHorarios.length === 0) {
        adminAddMensagem.textContent = 'Selecione pelo menos um horário para adicionar.';
        adminAddMensagem.className = 'mensagem-modal error';
        return;
    }
    
    adminAddMensagem.textContent = 'Enviando horários para o Apps Script...';
    adminAddMensagem.className = 'mensagem-modal';
    btnConfirmarAdicionar.disabled = true;

    // Prepara os dados para o Apps Script (passando um array de objetos)
    const params = new URLSearchParams({
        action: 'addMultiple',
        data: data,
        profissional: profissional,
        atividade: atividade,
        horariosJson: JSON.stringify(novosHorarios)
    });
    const requestUrl = `${apiUrl}?${params.toString()}`;

    try {
        const response = await fetch(requestUrl);
        const result = await response.json();

        if (result.status === "success") {
            adminAddMensagem.textContent = `✅ ${result.message}`;
            adminAddMensagem.className = 'mensagem-modal success';
            formAdicionarHorario.reset(); // Limpa o formulário após o sucesso
            
            // Recarrega a agenda principal
            setTimeout(() => {
                carregarAgenda();
                fecharModalAdminAdicionar();
            }, 1500);

        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Erro ao adicionar horário:', error);
        adminAddMensagem.textContent = `❌ Erro: ${error.message || 'Falha de comunicação.'}`;
        adminAddMensagem.className = 'mensagem-modal error';
    } finally {
        btnConfirmarAdicionar.disabled = false;
    }
}


// --- Funções de Admin (Exclusão/Indisponibilização) ---

async function adminDeleteSchedule(idLinha) {
    if (!isAdminLoggedIn) return;

    adminAddMensagem.textContent = 'Enviando comando de exclusão...';
    adminAddMensagem.className = 'mensagem-modal';
    
    const params = new URLSearchParams({
        action: 'deleteSchedule',
        id_linha: idLinha
    });
    const requestUrl = `${apiUrl}?${params.toString()}`;

    try {
        const response = await fetch(requestUrl);
        const result = await response.json();

        if (result.status === "success") {
            alert(`✅ Sucesso: ${result.message}`);
            carregarAgenda(); 
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Erro ao excluir horário:', error);
        alert(`❌ Erro ao excluir: ${error.message || 'Falha de comunicação.'}`);
    }
}

// --- Funções Auxiliares ---

function processarDadosParaGrade(dataSelecionada) {
    const dadosFiltrados = todosOsAgendamentos.filter(item => item.Data === dataSelecionada);
    const atividades = {};
    const dadosPorAtividade = dadosFiltrados.reduce((acc, item) => {
        (acc[item.Atividade] = acc[item.Atividade] || []).push(item);
        return acc;
    }, {});

    for (const nomeAtividade in dadosPorAtividade) {
        const agendamentos = dadosPorAtividade[nomeAtividade];
        const horarios = [...new Set(agendamentos.map(item => item.Horario))].sort();
        const profissionais = [...new Set(agendamentos.map(item => item.Profissional))].sort();
        const grade = {};

        horarios.forEach(horario => {
            grade[horario] = {};
            profissionais.forEach(profissional => {
                const agendamento = agendamentos.find(item => item.Horario === horario && item.Profissional === profissional);
                grade[horario][profissional] = agendamento; 
            });
        });
        atividades[nomeAtividade] = { horarios, profissionais, grade };
    }
    return atividades;
}

function atualizarDiaDaSemana(dataCalendario) {
    const dataObj = new Date(dataCalendario + 'T00:00:00');
    let diaDaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    diaDaSemana = diaDaSemana.replace('-feira', '');
    diaSemanaSpan.textContent = diaDaSemana;
}


// --- Event Listeners Globais ---
container.addEventListener('click', function(event) {
    const target = event.target.closest('.status-disponivel, .titulo-atividade, .status-admin-excluir, .status-admin-lotado');
    if (!target) return;
    
    // Toggle Acordeão
    if (target.classList.contains('titulo-atividade')) {
        target.classList.toggle('ativo');
        const painel = target.nextElementSibling;
        if (painel.style.maxHeight) {
            painel.style.maxHeight = null;
            painel.style.padding = "0 10px";
        } else {
            painel.style.padding = "10px";
            // Adiciona 40px de buffer para garantir que caiba com o padding
            painel.style.maxHeight = (painel.scrollHeight + 40) + "px"; 
        }
        return;
    }
    
    // Agendamento Usuário (Requisito 2: Apenas se não for admin)
    if (target.classList.contains('status-disponivel') && !isAdminLoggedIn) {
        celulaClicada = target;
        abrirModalAgendamento(target.dataset);
        return;
    }
    
    // Exclusão/Indisponibilização somente pelo Admin (Requisito 2)
    if (isAdminLoggedIn) {
        if (target.classList.contains('status-admin-excluir')) {
            if (confirm(`ADMIN: Tem certeza que deseja EXCLUIR permanentemente o horário ${target.dataset.horario} (${target.dataset.atividade}) do dia ${target.dataset.data}?`)) {
                adminDeleteSchedule(target.dataset.id);
            }
        } else if (target.classList.contains('status-admin-lotado')) {
             // Apenas mostra as reservas
             alert(`ADMIN: Horário Lotado. Reservas (Matrículas): ${target.dataset.reservas || 'Nenhuma'}`);
        }
        return;
    }
});

// Event Listeners Usuário
btnCancelarAgendamento.addEventListener('click', fecharModalAgendamento);
btnConfirmar.addEventListener('click', confirmarAgendamento);
btnConsultarReservas.addEventListener('click', () => {
    // Reabre o modal de consulta no estado inicial
    consultaViewInicial.classList.remove('hidden');
    consultaViewResultados.classList.add('hidden');
    inputConsultaMatricula.value = '';
    consultaMensagem.textContent = '';
    modalConsulta.classList.remove('hidden');
});
btnFecharConsulta.addEventListener('click', fecharModalConsulta);
btnVoltarConsulta.addEventListener('click', () => {
    consultaViewInicial.classList.remove('hidden');
    consultaViewResultados.classList.add('hidden');
    consultaMensagem.textContent = '';
});
btnBuscarReservas.addEventListener('click', buscarReservas);
listaAgendamentos.addEventListener('click', cancelarReserva);


// Event Listeners Admin (Login e Gerenciamento)
btnAdminLogin.addEventListener('click', () => {
    if (isAdminLoggedIn) {
        adminLogout();
    } else {
        abrirModalAdminLogin();
    }
});
btnCancelarAdminLogin.addEventListener('click', fecharModalAdminLogin);
btnConfirmarAdminLogin.addEventListener('click', adminLogin);
btnGerenciarAgenda.addEventListener('click', abrirModalAdminGerenciar);
btnFecharAdminGerenciar.addEventListener('click', fecharModalAdminGerenciar);
btnAdminLogout.addEventListener('click', adminLogout);


// Event Listeners Admin (Adição de Horários - Requisito 2)
btnAdminAdicionar.addEventListener('click', abrirModalAdminAdicionar); 
adminSelectProfissional.addEventListener('change', renderizarModalidades);
adminSelectAtividade.addEventListener('change', configurarOpcoesHorario);
btnCancelarAdicionar.addEventListener('click', fecharModalAdminAdicionar);
formAdicionarHorario.addEventListener('submit', adicionarNovoHorario);

// --- Funções de Consulta e Cancelamento (Manter) ---

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
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        consultaMensagem.textContent = error.message || 'Erro ao buscar reservas.';
        consultaMensagem.style.color = 'red';
    }
}

function renderizarListaReservas(reservas) {
    listaAgendamentos.innerHTML = '';
    if (reservas.length === 0) {
        listaAgendamentos.innerHTML = '<p>Nenhum agendamento futuro encontrado para esta matrícula.</p>';
        consultaMensagem.textContent = '';
        return;
    }
    consultaMensagem.textContent = '';
    reservas.forEach(reserva => {
        const item = document.createElement('div');
        item.className = 'item-agendamento';
        item.innerHTML = `
            <div class="detalhes-agendamento">
                <strong>${reserva.atividade}</strong>
                <span>${reserva.data} às ${reserva.horario} com ${reserva.profissional}</span>
            </div>
            <button class="btn-cancelar-item" data-id="${reserva.id}" data-matricula="${inputConsultaMatricula.value.trim()}">Cancelar</button>
        `;
        listaAgendamentos.appendChild(item);
    });
}

async function cancelarReserva(event) {
    if (!event.target.classList.contains('btn-cancelar-item')) return;
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    
    const { id, matricula } = event.target.dataset;
    
    consultaMensagem.textContent = 'Cancelando...';
    consultaMensagem.style.color = 'var(--cinza-texto)';
    
    const params = new URLSearchParams({ action: 'cancelBooking', bookingId: id, matricula });
    const requestUrl = `${apiUrl}?${params.toString()}`;
    
    try {
        const response = await fetch(requestUrl);
        const result = await response.json();
        
        if (result.status === "success") {
            consultaMensagem.textContent = result.message;
            consultaMensagem.style.color = 'var(--verde-moinhos)';
            event.target.closest('.item-agendamento').remove();
            carregarAgenda(); 
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        consultaMensagem.textContent = error.message || 'Erro ao cancelar reserva.';
        consultaMensagem.style.color = 'red';
    }
}


// Inicia o carregamento da agenda
carregarAgenda();

