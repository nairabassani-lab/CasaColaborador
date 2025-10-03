
// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzgsx8ccJ67zwCLeuumIeD_b7Im13BGJXO6vNpDcGH9XGB2Y-i9b4g_dhmn5fqUHCfd/exec';

const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');
const modal = document.getElementById('modal-agendamento');
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnCancelar = document.getElementById('btn-cancelar');
const btnConfirmar = document.getElementById('btn-confirmar');
const modalMensagem = document.getElementById('modal-mensagem');
let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;

// --- FUNÇÃO DE CONFIRMAÇÃO ATUALIZADA ---
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

    const dadosParaEnviar = { ...agendamentoAtual, matricula };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            // REMOVEMOS o 'no-cors' para poder ler a resposta
            headers: {
                "Content-Type": "text/plain;charset=utf-8", // Usar text/plain é mais robusto para o Apps Script
            },
            body: JSON.stringify(dadosParaEnviar)
        });
        
        const result = await response.json(); // Lemos a resposta do nosso script

        if (result.status === "success") {
            modalMensagem.textContent = result.message;
            modalMensagem.style.color = 'var(--verde-moinhos)';
            
            // Atualiza a célula na tela
            celulaClicada.textContent = 'Reservado';
            celulaClicada.classList.remove('status-disponivel');
            celulaClicada.classList.add('status-reservado');
            celulaClicada.dataset.matricula = matricula; // Guarda a matrícula no elemento
            
            setTimeout(fecharModal, 2000);
        } else {
            // Se o script do Google retornou um erro, exibe aqui
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Erro ao enviar agendamento:', error);
        modalMensagem.textContent = error.message || 'Erro de comunicação. Tente novamente.';
        modalMensagem.style.color = 'red';
    } finally {
        // Garante que o botão seja reativado no final, mesmo se der erro
        btnConfirmar.disabled = false;
    }
}

// ... (o resto do seu script.js continua exatamente igual)
async function carregarAgenda() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Erro ao carregar os dados da API.');
        todosOsAgendamentos = await response.json();

        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const hojeFormatado = hoje.toISOString().slice(0, 10);

        seletorData.value = hojeFormatado;
        renderizarAgendaParaData(hojeFormatado);
        seletorData.addEventListener('change', () => renderizarAgendaParaData(seletorData.value));

    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `<p class="loading">${error.message}</p>`;
    }
}
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
                const statusRaw = grade[horario][profissional];
                let status, statusClass, dataAttributes = '';

                if (statusRaw === undefined || String(statusRaw).toLowerCase() === 'indisponível') {
                    status = 'Indisponível'; statusClass = 'status-indisponivel';
                } else if (statusRaw === '') {
                    status = 'Disponível'; statusClass = 'status-disponivel';
                    dataAttributes = `data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}"`;
                } else {
                    status = 'Reservado'; statusClass = 'status-reservado';
                }
                tabelaHtml += `<td class="status-cell ${statusClass}" ${dataAttributes}>${status}</td>`;
            });
            tabelaHtml += `</tr>`;
        });
        tabelaHtml += `</tbody></table></div>`;
        titulo.insertAdjacentHTML('afterend', tabelaHtml);
    }
}
function abrirModal(detalhes) {
    agendamentoAtual = detalhes;
    modalDetalhes.innerHTML = `
        <li><strong>Data:</strong> ${detalhes.data}</li>
        <li><strong>Horário:</strong> ${detalhes.horario}</li>
        <li><strong>Atividade:</strong> ${detalhes.atividade}</li>
        <li><strong>Profissional:</strong> ${detalhes.profissional}</li>
    `;
    inputMatricula.value = '';
    modalMensagem.innerHTML = '';
    btnConfirmar.disabled = false;
    modal.classList.remove('hidden');
}
function fecharModal() {
    modal.classList.add('hidden');
}
container.addEventListener('click', function(event) {
    const target = event.target;
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
        abrirModal(target.dataset);
    }
});
btnCancelar.addEventListener('click', fecharModal);
btnConfirmar.addEventListener('click', confirmarAgendamento);
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
                grade[horario][profissional] = agendamento ? agendamento.Reserva : undefined;
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
carregarAgenda();
