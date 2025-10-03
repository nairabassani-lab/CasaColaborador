const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

// --- Seletores de Elementos ---
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

let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;

// --- Funções Principais ---

/**
 * Carrega a agenda da API de forma robusta, usando AbortController para timeout.
 */
async function carregarAgenda() {
    // Exibe um estado de carregamento inicial
    if (container && container.innerHTML === '') {
        container.innerHTML = '<p class="loading">Carregando agenda...</p>';
    }

    const TIMEOUT_MS = 10000; // 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            cache: 'no-cache', // Importante para Google Scripts
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Lança um erro se o status HTTP não for 200 (OK)
            throw new Error(`Erro ao carregar dados: Status ${response.status}. Verifique o URL da API.`);
        }

        // Se a resposta for OK, tenta ler o JSON
        todosOsAgendamentos = await response.json();
        
        // Lógica de inicialização de data e renderização (mantida)
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const hojeFormatado = hoje.toISOString().slice(0, 10);
        
        if (seletorData) {
            // Evita adicionar o event listener mais de uma vez (caso carregarAgenda seja chamada novamente)
            seletorData.value = hojeFormatado;
            // Seletor de data pode precisar ser removido e adicionado se já tiver um listener
            // Mas, para simplicidade, se está sendo chamado aqui, é a primeira vez.
            if (!seletorData.dataset.listenerAdded) {
                 seletorData.addEventListener('change', () => renderizarAgendaParaData(seletorData.value));
                 seletorData.dataset.listenerAdded = 'true';
            }
            renderizarAgendaParaData(hojeFormatado);

        } else {
            renderizarAgendaParaData(hojeFormatado);
        }

    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Erro ao carregar a agenda:', error);
        
        let msg = 'Erro de comunicação com a API.';
        if (error.name === 'AbortError') {
             msg = 'A requisição expirou (Timeout). Tente novamente.';
        } else if (error.message.includes('JSON')) {
             msg = 'Formato de dados inválido. A API não retornou JSON corretamente.';
        } else {
             msg = error.message;
        }

        // Garante que a mensagem de erro seja visível
        if (container) {
            container.innerHTML = `<p class="loading error-message">⚠️ ${msg}</p>`;
        }
    }
}

function renderizarAgendaParaData(dataCalendario) {
    // ... (Esta função não precisava de revisão, a lógica está correta) ...
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
                    const reservas = agendamento.Reserva ? agendamento.Reserva.split(',').filter(Boolean) : [];
                    const vagasOcupadas = reservas.length;
                    const vagasDisponiveis = vagasTotais - vagasOcupadas;
                    let statusClass = '';
                    let dataAttributes = '';
                    if (vagasDisponiveis > 0) {
                        statusClass = 'status-disponivel';
                        dataAttributes = `data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}"`;
                    } else {
                        statusClass = 'status-lotado';
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
    
    // **Ajuste:** Usar o método POST com 'Content-Type': 'application/x-www-form-urlencoded'
    // ou 'Content-Type': 'application/json' é mais robusto para APIs,
    // mas o Google Apps Script (GAS) geralmente espera parâmetros na URL para 'doGet'
    // e no corpo da requisição para 'doPost'.
    // Manteremos o GET por enquanto, pois seu código GAS provavelmente usa doGet.

    const params = new URLSearchParams({
        action: 'book',
        ...agendamentoAtual,
        matricula: matricula
    });
    const requestUrl = `${apiUrl}?${params.toString()}`;

    // Adicionando AbortController para Timeout também no agendamento
    const TIMEOUT_MS = 15000; 
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(requestUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
             throw new Error(`Erro ao agendar: Status ${response.status}.`);
        }
        
        const result = await response.json();

        if (result.status === "success") {
            modalMensagem.textContent = result.message;
            modalMensagem.style.color = 'var(--verde-moinhos)';
            
            // Recarrega a agenda
            await carregarAgenda();
            
            // Re-renderiza para a data correta
            const [dia, mes, ano] = agendamentoAtual.data.split('/');
            if (seletorData) seletorData.value = `${ano}-${mes}-${dia}`;
            
            setTimeout(fecharModalAgendamento, 2000);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Erro ao enviar agendamento:', error);
        
        let msg = error.message;
        if (error.name === 'AbortError') {
             msg = 'A requisição de agendamento expirou (Timeout).';
        }

        modalMensagem.textContent = msg || 'Erro de comunicação. Tente novamente.';
        modalMensagem.style.color = 'red';
    } finally {
        btnConfirmar.disabled = false;
    }
}

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

    const TIMEOUT_MS = 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(requestUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
             throw new Error(`Erro ao consultar: Status ${response.status}.`);
        }

        const result = await response.json();
        
        if (result.status === "success") {
            renderizarListaReservas(result.data);
            consultaViewInicial.classList.add('hidden');
            consultaViewResultados.classList.remove('hidden');
            consultaMensagem.textContent = ''; // Limpa a mensagem após sucesso
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        clearTimeout(timeoutId);
        let msg = error.message;
        if (error.name === 'AbortError') {
             msg = 'A requisição de busca expirou (Timeout).';
        }

        consultaMensagem.textContent = msg || 'Erro de comunicação. Tente novamente.';
        consultaMensagem.style.color = 'red';
    }
}

function renderizarListaReservas(reservas) {
    // ... (Esta função não precisava de revisão, a lógica está correta) ...
    listaAgendamentos.innerHTML = '';
    if (reservas.length === 0) {
        listaAgendamentos.innerHTML = '<p>Nenhum agendamento futuro encontrado para esta matrícula.</p>';
        return;
    }
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
    
    const targetButton = event.target;
    const originalText = targetButton.textContent;
    targetButton.textContent = 'Cancelando...';
    targetButton.disabled = true;

    const { id, matricula } = targetButton.dataset;
    consultaMensagem.textContent = 'Cancelando...';
    consultaMensagem.style.color = 'var(--cinza-texto)';
    
    const params = new URLSearchParams({ action: 'cancelBooking', bookingId: id, matricula });
    const requestUrl = `${apiUrl}?${params.toString()}`;

    const TIMEOUT_MS = 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(requestUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
             throw new Error(`Erro ao cancelar: Status ${response.status}.`);
        }

        const result = await response.json();
        
        if (result.status === "success") {
            consultaMensagem.textContent = result.message;
            consultaMensagem.style.color = 'var(--verde-moinhos)';
            targetButton.closest('.item-agendamento').remove();
            carregarAgenda(); // Recarrega a agenda principal
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        clearTimeout(timeoutId);
        targetButton.textContent = originalText;
        targetButton.disabled = false;

        let msg = error.message;
        if (error.name === 'AbortError') {
             msg = 'A requisição de cancelamento expirou (Timeout).';
        }

        consultaMensagem.textContent = msg || 'Erro de comunicação. Tente novamente.';
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
        if (painel.style.maxHeight) {
            painel.style.maxHeight = null;
            painel.style.padding = "0 10px";
        } else {
            painel.style.padding = "10px";
            painel.style.maxHeight = painel.scrollHeight + "px";
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
btnVoltarConsulta.addEventListener('click', () => {
    consultaViewInicial.classList.remove('hidden');
    consultaViewResultados.classList.add('hidden');
    consultaMensagem.textContent = '';
});
btnBuscarReservas.addEventListener
