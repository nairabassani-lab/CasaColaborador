// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';


// --- Seletores de Elementos (Corrigidos e Completos) ---
const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modal de Agendamento
const modalAgendamento = document.getElementById('modal-agendamento'); // Nome corrigido
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnCancelarAgendamento = document.getElementById('btn-cancelar-agendamento'); // Nome corrigido
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


let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;


// --- Funções Principais ---

/**
 * Carrega a agenda da API (doGet)
 */
async function carregarAgenda() {
    try {
        const response = await fetch(apiUrl, { cache: 'no-cache' }); // Adicionado no-cache
        
        if (!response.ok) {
             throw new Error(`Erro de rede: Status ${response.status}. Verifique o URL da API.`);
        }
        
        todosOsAgendamentos = await response.json();
        
        // Inicialização de data e renderização
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const hojeFormatado = hoje.toISOString().slice(0, 10);
        
        // Verifica se o seletor de data existe
        if (seletorData) {
            seletorData.value = hojeFormatado;
            renderizarAgendaParaData(hojeFormatado);
            
            // Adiciona o listener apenas uma vez
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
    
    if (Object.keys(dadosProcessados).length === 0) {
        container.innerHTML = `<p class="loading">Nenhum horário encontrado para a data ${dataFormatoPlanilha}.</p>`;
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
                    // Filtra para remover valores vazios caso haja vírgulas extras
                    const reservas = agendamento.Reserva ? agendamento.Reserva.split(',').filter(Boolean) : [];
                    const vagasOcupadas = reservas.length;
                    const vagasDisponiveis = vagasTotais - vagasOcupadas;
                    
                    let statusClass = '';
                    let dataAttributes = '';
                    let textoStatus = '';
                    
                    if (vagasTotais === 0) {
                         // Se Vagas = 0, indisponível
                         statusClass = 'status-indisponivel';
                         textoStatus = '-';
                    } else if (vagasDisponiveis > 0) {
                        statusClass = 'status-disponivel';
                        textoStatus = `${vagasDisponiveis} <span>Vaga(s)</span>`;
                        dataAttributes = `data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}"`;
                    } else {
                        statusClass = 'status-lotado';
                        textoStatus = 'Lotado';
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
    
    // **USANDO GET COM PARÂMETROS NA URL para o Apps Script (mais fácil)**
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
            
            // Recarrega a agenda para atualizar o status da célula
            await carregarAgenda(); 
            
            // Re-renderiza para a data correta
            const [dia, mes, ano] = agendamentoAtual.data.split('/');
            if (seletorData) seletorData.value = `${ano}-${mes}-${dia}`;
            renderizarAgendaParaData(seletorData.value); // Força a atualização da grade
            
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

// --- Funções de Modal ---
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
        return;
    }
    reservas.forEach(reserva => {
        const item = document.createElement('div');
        item.className = 'item-agendamento';
        // A API deve retornar 'id' para que o cancelamento funcione
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

/**
 * Cancela a reserva (doGet com action=cancelBooking)
 */
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
            carregarAgenda(); // Recarrega a agenda principal
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        consultaMensagem.textContent = error.message || 'Erro ao cancelar reserva.';
        consultaMensagem.style.color = 'red';
    }
}


// --- Event Listeners ---
container.addEventListener('click', function(event) {
    const target = event.target.closest('.status-disponivel, .titulo-atividade');
    if (!target) return;
    
    if (target.classList.contains('titulo-atividade')) {
        target.classList.toggle('ativo');
        const painel = target.nextElementSibling;
        // Lógica de acordeão
        if (painel.style.maxHeight && painel.style.maxHeight !== "0px") {
            painel.style.maxHeight = null;
            painel.style.padding = "0 10px";
        } else {
            painel.style.padding = "10px";
            // Usa scrollHeight + um buffer para garantir que o conteúdo caiba
            painel.style.maxHeight = (painel.scrollHeight + 40) + "px"; 
        }
    }
    
    if (target.classList.contains('status-disponivel')) {
        celulaClicada = target;
        abrirModalAgendamento(target.dataset);
    }
});

btnCancelarAgendamento.addEventListener('click', fecharModalAgendamento);
btnConfirmar.addEventListener('click', confirmarAgendamento);
btnConsultarReservas.addEventListener('click', abrirModalConsulta);
btnFecharConsulta.addEventListener('click', fecharModalConsulta);

// Voltar na tela de consulta
btnVoltarConsulta.addEventListener('click', () => {
    consultaViewInicial.classList.remove('hidden');
    consultaViewResultados.classList.add('hidden');
    consultaMensagem.textContent = '';
});

btnBuscarReservas.addEventListener('click', buscarReservas);
listaAgendamentos.addEventListener('click', cancelarReserva);


// --- Funções Auxiliares ---

function atualizarDiaDaSemana(dataCalendario) {
    const dataObj = new Date(dataCalendario + 'T00:00:00');
    let diaDaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    diaDaSemana = diaDaSemana.replace('-feira', '');
    diaSemanaSpan.textContent = diaDaSemana;
}

/**
 * Transforma a lista plana de dados da API em uma estrutura de grade.
 * **CORRIGIDA PARA USAR VAGAS E RESERVAS.**
 */
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
                // Armazena o objeto de agendamento completo
                grade[horario][profissional] = agendamento; 
            });
        });
        atividades[nomeAtividade] = { horarios, profissionais, grade };
    }
    return atividades;
}

// Inicia o carregamento da agenda
carregarAgenda();
