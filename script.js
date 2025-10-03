const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

// --- VARIÁVEL DE ESTADO GLOBAL ---
let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;
let isAdminMode = false; // NOVO: Estado para rastrear o modo administrador
const SENHA_ADMIN_CORRETA = "admin123";

// --- Seletores de Elementos (CONSOLIDADOS) ---
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

// Elementos do Administrador (NOVO)
const btnAdminLogin = document.getElementById('btn-admin-login');
const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnAdminFechar = document.getElementById('btn-admin-fechar');
const btnAdminAdicionar = document.getElementById('btn-admin-adicionar');
const inputAdminData = document.getElementById('input-admin-data');
const inputAdminHora = document.getElementById('input-admin-hora');
const inputAdminVagas = document.getElementById('input-admin-vagas');
const adminMensagemAdicao = document.getElementById('admin-mensagem-adicao');


// ----------------------------------------------------
// --- FUNÇÕES PRINCIPAIS DA AGENDA ---
// ----------------------------------------------------

async function carregarAgenda() {
    try {
        container.innerHTML = `<p class="loading">Carregando agenda...</p>`; // Mudar para o estado de carregamento
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Erro ao carregar os dados da API.');
        todosOsAgendamentos = await response.json();
        
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const hojeFormatado = hoje.toISOString().slice(0, 10);
        
        // Inicialização da data e listener, se ainda não estiver configurado
        if (seletorData && !seletorData.value) {
            seletorData.value = hojeFormatado;
            seletorData.addEventListener('change', () => renderizarAgendaParaData(seletorData.value));
        }

        renderizarAgendaParaData(seletorData ? seletorData.value : hojeFormatado);

    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `<p class="loading">Erro ao carregar a agenda: ${error.message}</p>`;
    }
}

function renderizarAgendaParaData(dataCalendario) {
    const [ano, mes, dia] = dataCalendario.split('-');
    const dataFormatoPlanilha = `${dia}/${mes}/${ano}`;
    atualizarDiaDaSemana(dataCalendario);
    
    const dadosProcessados = processarDadosParaGrade(dataFormatoPlanilha);
    container.innerHTML = '';

    // NOVO: Aviso de modo Admin
    if (isAdminMode) {
        container.insertAdjacentHTML('afterbegin', '<p class="aviso-admin">Modo ADMIN: Clique em uma célula disponível para EXCLUIR, ou use o botão Gerenciar.</p>');
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
                    let dataAttributes = '';
                    
                    dataAttributes = `data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}" data-idapi="${agendamento.ID}"`;
                    
                    if (vagasDisponiveis > 0) {
                        statusClass = isAdminMode ? 'status-admin-excluir' : 'status-disponivel';
                    } else {
                        statusClass = isAdminMode ? 'status-admin-lotado' : 'status-lotado';
                    }
                    
                    statusHtml = `<div class="status-cell ${statusClass}" ${dataAttributes}>${vagasDisponiveis} <span>Vaga(s)</span></div>`;
                }
                tabelaHtml += `<td>${statusHtml}</td>`;
            });
            tabelaHtml += `</tr>`;
        });
        tabelaHtml += `</tbody></table></div>`;
        titulo.insertAdjacentHTML('afterend', tabelaHtml);
    }
}


// ----------------------------------------------------
// --- FUNÇÕES DO ADMINISTRADOR (INTEGRADAS) ---
// ----------------------------------------------------

function ativarModoAdmin() {
    isAdminMode = true; 
    
    // 1. Cria o botão "Gerenciar Agenda" se ele não existir
    let btnGerenciar = document.getElementById('btn-gerenciar-agenda');
    if (!btnGerenciar) {
        btnGerenciar = document.createElement('button');
        btnGerenciar.id = 'btn-gerenciar-agenda';
        btnGerenciar.classList.add('btn-acao', 'btn-admin');
        btnGerenciar.textContent = 'Gerenciar Agenda (Admin)';

        const seletorContainer = document.getElementById('seletor-container');
        if (seletorContainer) {
             seletorContainer.appendChild(btnGerenciar);
        }
        
        // Lógica para ABRIR o modal de gerenciamento
        btnGerenciar.addEventListener('click', () => {
             modalAdminGerenciar.classList.remove('hidden');
             // Pré-preencher a data
             if (seletorData) inputAdminData.value = seletorData.value;
        });
        
        btnAdminLogin.disabled = true; 
        btnAdminLogin.textContent = 'Modo Admin Ativo';
    }
    
    // 2. Recarrega a agenda com a nova interface de ADMIN
    renderizarAgendaParaData(seletorData.value);
}

/**
 * Lógica de confirmação e simulação de exclusão de horário para o ADMIN.
 */
function confirmarExclusao(detalhes) {
    const data = detalhes.data;
    const horario = detalhes.horario;
    const profissional = detalhes.profissional;
    const idApi = detalhes.idapi; // ID da API que identifica a linha para exclusão (chave)
    
    if (!idApi) {
        alert("Erro: Este horário não possui um ID de API válido para exclusão.");
        return;
    }

    if (confirm(`Tem certeza que deseja EXCLUIR o slot de: ${horario} com ${profissional} na data ${data}?`)) {
        
        // --- LÓGICA DE EXCLUSÃO (Simulação para backend) ---
        console.log(`[ADMIN] Solicitando exclusão do ID: ${idApi}`);
        
        // Em um sistema real, você enviaria a requisição para o backend:
        // const params = new URLSearchParams({ action: 'deleteSlot', id: idApi });
        // fetch(`${apiUrl}?${params.toString()}`);
        
        alert(`Slot de horário (ID: ${idApi}) EXCLUÍDO com sucesso (SIMULAÇÃO)!`);

        // Recarregar a agenda
        carregarAgenda(); 
    }
}

/**
 * Lógica para ADICIONAR Horário (Admin)
 */
async function adicionarHorarioAdmin() {
    const data = inputAdminData.value;
    const hora = inputAdminHora.value;
    const vagas = parseInt(inputAdminVagas.value, 10);
    const atividade = "ATIVIDADE_PADRAO"; // Você pode adicionar um input para isso

    if (!data || !hora || isNaN(vagas) || vagas <= 0) {
        adminMensagemAdicao.textContent = "Por favor, preencha todos os campos corretamente.";
        adminMensagemAdicao.style.color = "red";
        return;
    }
    
    adminMensagemAdicao.textContent = 'Adicionando, aguarde...';
    adminMensagemAdicao.style.color = 'var(--cinza-texto)';

    // Formatar data para o padrão da planilha (DD/MM/AAAA)
    const [ano, mes, dia] = data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    // --- LÓGICA DE INCLUSÃO REAL (Simulação para backend) ---
    const params = new URLSearchParams({
        action: 'addSlot', // Ação no seu Google Script para adicionar
        data: dataFormatada,
        horario: hora,
        vagas: vagas,
        atividade: atividade, // Necessário que sua API saiba a qual atividade adicionar
        profissional: 'PROFISSIONAL_PADRAO' // Necessário que sua API saiba qual profissional
    });

    try {
        const response = await fetch(`${apiUrl}?${params.toString()}`);
        const result = await response.json();

        if (result.status === "success") {
            adminMensagemAdicao.textContent = `Horário adicionado! ${result.message}`;
            adminMensagemAdicao.style.color = "var(--verde-moinhos)";
            
            // Recarregar a agenda inteira para atualizar os dados e a visualização
            await carregarAgenda();
            
            // Limpar campos
            inputAdminHora.value = '';
            inputAdminVagas.value = '1';
            
            // Mudar o seletor para a data recém-adicionada
            if (seletorData) seletorData.value = data; 
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Erro ao adicionar horário:', error);
        adminMensagemAdicao.textContent = `Erro: ${error.message || 'Erro de comunicação.'}`;
        adminMensagemAdicao.style.color = "red";
    }
}


// ----------------------------------------------------
// --- FUNÇÕES DE USUÁRIO (MANTIDAS) ---
// ----------------------------------------------------

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

async function confirmarAgendamento() {
    // ... (Sua lógica de confirmação original)
    const matricula = inputMatricula.value.trim();
    if (!matricula) {
        modalMensagem.textContent = 'Por favor, insira sua matrícula.';
        modalMensagem.style.color = 'red';
        return;
    }
    btnConfirmar.disabled = true;
    modalMensagem.textContent = 'Agendando, aguarde...';
    modalMensagem.style.color = 'var(--cinza-texto)';
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
            await carregarAgenda();
            const [dia, mes, ano] = agendamentoAtual.data.split('/');
            if (seletorData) seletorData.value = `${ano}-${mes}-${dia}`;
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

// Funções de Consulta de Reserva (Mantidas)
function abrirModalConsulta() { /* ... */ }
function fecharModalConsulta() { /* ... */ }
async function buscarReservas() { /* ... */ }
function renderizarListaReservas(reservas) { /* ... */ }
async function cancelarReserva(event) { /* ... */ }


// --- Funções Auxiliares (Mantidas) ---
function atualizarDiaDaSemana(dataCalendario) { /* ... */ }
function processarDadosParaGrade(dataSelecionada) { /* ... */ }


// ----------------------------------------------------
// --- EVENT LISTENERS (CONSOLIDADOS) ---
// ----------------------------------------------------

// Listener de Clique na Tabela (MODIFICADO para lidar com Admin)
container.addEventListener('click', function(event) {
    const target = event.target.closest('.status-cell, .titulo-atividade');
    if (!target) return;
    
    // Lógica de Acordeão (títulos)
    if (target.classList.contains('titulo-atividade')) {
        target.classList.toggle('ativo');
        const painel = target.nextElementSibling;
        if (painel.style.maxHeight) {
            painel.style.maxHeight = null;
            painel.style.padding = "0 10px";
        } else {
            painel.style.padding = "10px";
            painel.style.maxHeight = painel.scrollHeight + "px";
        }
    }

    // Lógica de Agendamento/Exclusão
    if (target.classList.contains('status-cell')) {
        celulaClicada = target;
        const detalhes = target.dataset;

        if (isAdminMode && target.classList.contains('status-admin-excluir')) {
            // MODO ADMIN: Clica para EXCLUIR
            confirmarExclusao(detalhes);
        } else if (!isAdminMode && target.classList.contains('status-disponivel')) {
            // MODO USUÁRIO: Clica para AGENDAR
            abrirModalAgendamento(detalhes);
        }
    }
});

// Event Listeners do Administrador (NOVO)
btnAdminLogin.addEventListener('click', () => {
    const senhaInserida = prompt("Insira a senha de administrador:");
    if (senhaInserida === SENHA_ADMIN_CORRETA) {
        alert("Login de Administrador bem-sucedido!");
        ativarModoAdmin(); 
    } else if (senhaInserida !== null && senhaInserida.trim() !== "") {
        alert("Senha incorreta. Acesso negado.");
    }
});
btnAdminFechar.addEventListener('click', () => modalAdminGerenciar.classList.add('hidden'));
btnAdminAdicionar.addEventListener('click', adicionarHorarioAdmin);


// Event Listeners do Usuário (Mantidos)
btnCancelarAgendamento.addEventListener('click', fecharModalAgendamento);
btnConfirmar.addEventListener('click', confirmarAgendamento);
btnConsultarReservas.addEventListener('click', abrirModalConsulta);
btnFecharConsulta.addEventListener('click', fecharModalConsulta);
btnVoltarConsulta.addEventListener('click', () => {
    consultaViewInicial.classList.remove('hidden');
    consultaViewResultados.classList.add('hidden');
    consultaMensagem.textContent = '';
});
btnBuscarReservas.addEventListener('click', buscarReservas);
listaAgendamentos.addEventListener('click', cancelarReserva);


// --- INICIALIZAÇÃO ---
carregarAgenda();
