// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modais de Agendamento (Usuário)
const modal = document.getElementById('modal-agendamento');
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnCancelar = document.getElementById('btn-cancelar-agendamento'); // Corrigido o ID
const btnConfirmar = document.getElementById('btn-confirmar');
const modalMensagem = document.getElementById('modal-mensagem');

// Botões Admin (Novos Elementos)
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda');

let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;

// Variáveis de Estado
let isAdmin = false; 
const ADMIN_PASSWORD = 'admin'; // Senha simples para demonstração

// --- LÓGICA DE ADMIN (NOVA) ---

function toggleAdminView(loggedIn) {
    isAdmin = loggedIn;
    if (loggedIn) {
        btnAdminLogin.textContent = 'Logout Admin';
        btnAdminLogin.classList.remove('btn-acao');
        btnAdminLogin.classList.add('btn-cinza');
        btnGerenciarAgenda.classList.remove('hidden');
        // Você pode adicionar um aviso visual aqui se estiver no modo admin
        if (!document.querySelector('.aviso-admin')) {
             container.insertAdjacentHTML('beforebegin', '<p class="aviso-admin">MODO ADMIN ATIVADO. Clique nos slots para GEREENCIAR.</p>');
        }
    } else {
        btnAdminLogin.textContent = 'Login Admin';
        btnAdminLogin.classList.remove('btn-cinza');
        btnAdminLogin.classList.add('btn-acao');
        btnGerenciarAgenda.classList.add('hidden');
        const aviso = document.querySelector('.aviso-admin');
        if (aviso) aviso.remove();
    }
    // Re-renderiza a agenda para aplicar estilos de admin, se necessário
    renderizarAgendaParaData(seletorData.value);
}

function handleAdminLogin() {
    if (isAdmin) {
        toggleAdminView(false); // Logout
        return;
    }

    const password = prompt("Insira a senha de administrador:");
    if (password === ADMIN_PASSWORD) {
        toggleAdminView(true);
        alert("Login de administrador bem-sucedido!");
    } else if (password !== null) {
        alert("Senha incorreta.");
    }
}

// --- FUNÇÃO DE CARREGAMENTO (CORRIGIDA) ---
async function carregarAgenda() {
    container.innerHTML = '<p class="loading">Carregando agenda...</p>';
    try {
        // CORREÇÃO: Passar action=loadData explicitamente
        const response = await fetch(`${apiUrl}?action=loadData`); 
        
        // A API do Apps Script pode retornar um HTML de erro ou status 200 com JSON
        if (!response.ok) {
            // Se o status HTTP não for 2xx (ex: 404, 500)
            throw new Error(`Erro HTTP ${response.status}: Falha ao buscar dados.`);
        }
        
        // A resposta do Apps Script é tipicamente text/html ou text/plain, 
        // mesmo que o conteúdo seja JSON. O método .json() é mais robusto
        // se o Content-Type estiver correto no Apps Script.
        const data = await response.json(); 
        
        if (data.status === 'error') {
             throw new Error(data.message || 'Erro desconhecido retornado pelo script.');
        }

        todosOsAgendamentos = data;

        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const hojeFormatado = hoje.toISOString().slice(0, 10);

        seletorData.value = hojeFormatado;
        renderizarAgendaParaData(hojeFormatado);
        seletorData.addEventListener('change', () => renderizarAgendaParaData(seletorData.value));

    } catch (error) {
        console.error('Erro no Carregamento:', error);
        container.innerHTML = `<p class="loading" style="color: #dc3545;">
            &#9888; Erro ao carregar: ${error.message}. Verifique o URL do Apps Script ou a Planilha.
        </p>`;
    }
}

// --- FUNÇÃO DE CONFIRMAÇÃO (REMOVIDO NO-CORS) ---
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

    const dadosParaEnviar = { action: 'book', ...agendamentoAtual, matricula };

    try {
        // Usamos GET para Apps Script para simplificar a requisição e evitar CORS complexo
        const query = new URLSearchParams(dadosParaEnviar).toString();
        const response = await fetch(`${apiUrl}?${query}`);
        
        const result = await response.json(); 

        if (result.status === "success") {
            modalMensagem.textContent = result.message;
            modalMensagem.style.color = 'var(--verde-moinhos)';
            
            // Re-renderiza a agenda para refletir a mudança no estado global
            carregarAgenda(); // Recarrega os dados para ter o estado atualizado
            
            setTimeout(fecharModal, 2000);
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

// --- FUNÇÃO DE RENDERIZAÇÃO (ATUALIZADA PARA ADMIN) ---
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
                const slotData = todosOsAgendamentos.find(item => 
                    item.Data === dataFormatoPlanilha && 
                    item.Horario === horario && 
                    item.Profissional === profissional &&
                    item.Atividade === nomeAtividade
                );
                
                const statusRaw = slotData ? slotData.Reserva : undefined;
                const idLinha = slotData ? slotData.ID_LINHA : null;

                let status, statusClass, dataAttributes = '';

                // Lógica de Status
                const isLotado = slotData && slotData.Vagas && statusRaw && statusRaw.split(',').filter(m => m.trim() && m.trim().toLowerCase() !== 'indisponivel').length >= parseInt(slotData.Vagas);
                const isIndisponivel = !slotData || (statusRaw && statusRaw.toLowerCase().includes('indisponivel'));
                const isReservado = slotData && statusRaw && statusRaw.split(',').filter(m => m.trim() && m.trim().toLowerCase() !== 'indisponivel').length > 0 && !isLotado;
                const isDisponivel = !isLotado && !isIndisponivel && !isReservado;


                if (isIndisponivel) {
                    status = 'Indisponível'; statusClass = 'status-indisponivel';
                } else if (isLotado) {
                    status = 'Lotado'; statusClass = 'status-lotado';
                } else if (isDisponivel) {
                    const vagasLivres = slotData.Vagas - (statusRaw ? statusRaw.split(',').filter(m => m.trim()).length : 0);
                    status = `${vagasLivres} Vaga(s)`; statusClass = 'status-disponivel';
                    dataAttributes = `data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}" data-id-linha="${idLinha}"`;
                } else {
                     // Caso o status seja 'Reservado' mas não Lotado (para um slot de múltiplas vagas)
                     const vagasLivres = slotData.Vagas - (statusRaw ? statusRaw.split(',').filter(m => m.trim()).length : 0);
                     status = `${vagasLivres} Vaga(s)`; statusClass = 'status-disponivel'; // Trata como disponível se houver vagas
                     dataAttributes = `data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}" data-id-linha="${idLinha}"`;
                }
                
                // --- AJUSTE DE ESTILO PARA O MODO ADMIN ---
                if (isAdmin && slotData) {
                    // Todos os slots existentes no modo admin podem ser excluídos
                    statusClass = 'status-admin-excluir';
                    dataAttributes += ` data-id-linha="${idLinha}"`;
                    status = (isLotado ? 'Lotado' : status) + ' (Excluir)';
                } else if (isDisponivel) {
                    // Adiciona o Span para Vagas
                    status = `1 Vaga(s)`; // Retorna o texto original
                }


                tabelaHtml += `<td class="status-cell ${statusClass}" ${dataAttributes}>${status}</td>`;
            });
            tabelaHtml += `</tr>`;
        });
        tabelaHtml += `</tbody></table></div>`;
        titulo.insertAdjacentHTML('afterend', tabelaHtml);
    }
}


// --- EVENT LISTENERS (ATUALIZADOS) ---

container.addEventListener('click', function(event) {
    const target = event.target;
    
    // Toggle do Acordeão
    if (target.classList.contains('titulo-atividade')) {
        target.classList.toggle('ativo');
        const painel = target.nextElementSibling;
        if (painel.style.maxHeight) {
            painel.style.maxHeight = null;
            painel.style.padding = "0 10px";
        } else {
            // Apenas ajusta o padding quando expande
            painel.style.padding = "10px";
            painel.style.maxHeight = painel.scrollHeight + "px";
        }
    }

    // Ação na Célula de Agendamento
    if (isAdmin && target.classList.contains('status-admin-excluir')) {
        // Ação de exclusão no modo Admin
        const idLinha = target.dataset.idLinha;
        if (idLinha && confirm(`Tem certeza que deseja EXCLUIR permanentemente o slot da linha ${idLinha}?`)) {
            // Lógica para excluir (A ser implementada com o endpoint deleteSchedule)
            // handleAdminDelete(idLinha);
            alert("Exclusão de agendamento (WIP): linha " + idLinha);
        }
    } else if (target.classList.contains('status-disponivel') && !isAdmin) {
        // Ação de reserva do Usuário
        celulaClicada = target;
        abrirModal(target.dataset);
    }
});

btnCancelar.addEventListener('click', fecharModal);
btnConfirmar.addEventListener('click', confirmarAgendamento);
btnAdminLogin.addEventListener('click', handleAdminLogin); // Adiciona o evento de login

// Inicialização
carregarAgenda();


// ... As funções processarDadosParaGrade, abrirModal, fecharModal, atualizarDiaDaSemana permanecem inalteradas
// ... Lembre-se de corrigir o ID no index.html: 
//     <button id="btn-cancelar-agendamento" class="btn-modal btn-cinza" type="button">Cancelar</button>
//     Para que a linha: const btnCancelar = document.getElementById('btn-cancelar-agendamento'); funcione
