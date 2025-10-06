// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modais de Agendamento (Usuário) - Já existentes
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

// --- NOVAS REFERÊNCIAS DE MODAIS (ADMIN E CONSULTA) ---

// Modal Login Admin
const modalAdminLogin = document.getElementById('modal-admin-login');
const inputAdminPassword = document.getElementById('input-admin-password');
const btnConfirmarAdminLogin = document.getElementById('btn-confirmar-admin-login');
const btnCancelarAdminLogin = document.getElementById('btn-cancelar-admin-login');
const adminLoginMensagem = document.getElementById('admin-login-mensagem');

// Modal Gerenciar Agenda
const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnAdminLogout = document.getElementById('btn-admin-logout');
const btnFecharAdminGerenciar = document.getElementById('btn-fechar-admin-gerenciar');
const btnAdminAdicionar = document.getElementById('btn-admin-adicionar');

// Modal Adicionar Horário Admin
const modalAdminAdicionar = document.getElementById('modal-admin-adicionar');
const btnCancelarAdicionar = document.getElementById('btn-cancelar-adicionar');
const btnConfirmarAdicionar = document.getElementById('btn-confirmar-adicionar');
const formAdicionarHorario = document.getElementById('form-adicionar-horario');

// Modal Consulta (Minhas Reservas)
const modalConsulta = document.getElementById('modal-consulta');
const inputConsultaMatricula = document.getElementById('input-consulta-matricula');
const btnBuscarReservas = document.getElementById('btn-buscar-reservas');
const btnFecharConsulta = document.getElementById('btn-fechar-consulta');
const btnVoltarConsulta = document.getElementById('btn-voltar-consulta');
const consultaViewInicial = document.getElementById('consulta-view-inicial');
const consultaViewResultados = document.getElementById('consulta-view-resultados');
const consultaMensagem = document.getElementById('consulta-mensagem');
// Fim das novas referências

let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;

// Variáveis de Estado
let isAdmin = false;
const ADMIN_PASSWORD = 'admin'; // Senha simples para demonstração

// --- FUNÇÕES DE UTILIDADE (MODAIS) ---

function abrirModal(modalElement) {
    modalElement.classList.remove('hidden');
    // Adicione um delay para a transição de opacidade
    setTimeout(() => modalElement.style.opacity = 1, 10); 
}

function fecharModal(modalElement) {
    modalElement.style.opacity = 0;
    setTimeout(() => modalElement.classList.add('hidden'), 300); // 300ms = tempo da transição no CSS
}

// --- LÓGICA DE ADMIN ---

function toggleAdminView(loggedIn) {
    isAdmin = loggedIn;
    if (loggedIn) {
        btnAdminLogin.textContent = 'Logout Admin';
        btnAdminLogin.classList.remove('btn-cinza');
        btnAdminLogin.classList.add('btn-vermelho'); // Destaca o botão de logout
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
    // Re-renderiza a agenda para aplicar estilos de admin
    renderizarAgendaParaData(seletorData.value);
}

function handleAdminLoginClick() {
    if (isAdmin) {
        // Se já está logado, faz logout
        toggleAdminView(false);
        return;
    }
    // Se não está logado, abre o modal de login
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

// Lógica de exclusão (WIP)
async function handleAdminDelete(idLinha) {
    // Implementar a chamada fetch para o Apps Script com action='delete' e idLinha
    alert("Função de Exclusão: Implementar chamada de API para a linha " + idLinha);
    // Após a exclusão, recarregar a agenda: carregarAgenda();
}


// --- LÓGICA DE CONSULTA (MINHAS RESERVAS) ---

function handleBuscarReservas() {
    const matricula = inputConsultaMatricula.value.trim();
    if (!matricula) {
        consultaMensagem.textContent = 'Por favor, insira sua matrícula.';
        consultaMensagem.style.color = 'red';
        return;
    }
    
    // WIP: Lógica para buscar as reservas futuras desta matrícula via API
    consultaMensagem.textContent = 'Buscando reservas...';
    consultaMensagem.style.color = 'var(--cinza-texto)';

    // Simulação de resultados após a busca (trocar por fetch real)
    setTimeout(() => {
        consultaMensagem.textContent = '';
        consultaViewInicial.classList.add('hidden');
        consultaViewResultados.classList.remove('hidden');
        document.getElementById('lista-agendamentos').innerHTML = '<p style="text-align:center;">Nenhuma reserva futura encontrada para ' + matricula + '.</p>';
        
        // Exemplo de como você renderizaria a lista real:
        // document.getElementById('lista-agendamentos').innerHTML = renderizarReservas(resultados);
        
    }, 1000);
}

function voltarConsulta() {
    consultaViewInicial.classList.remove('hidden');
    consultaViewResultados.classList.add('hidden');
    consultaMensagem.textContent = '';
}

// --- LÓGICA DE ADICIONAR HORÁRIO (WIP) ---

function handleAdminAdicionar(event) {
    event.preventDefault();
    // WIP: Lógica de envio do formulário de adição de horário
    alert("Função de Adicionar Horário: Implementar chamada de API");
    // fecharModal(modalAdminAdicionar);
    // carregarAgenda();
}


// --- FUNÇÃO DE CARREGAMENTO DE DADOS PRINCIPAL ---
async function carregarAgenda() {
    container.innerHTML = '<p class="loading">Carregando agenda...</p>';
    try {
        // CORREÇÃO: Passar action=loadData explicitamente para o Apps Script
        const response = await fetch(`${apiUrl}?action=loadData`); 
        
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: Falha ao buscar dados.`);
        }
        
        const data = await response.json(); 
        
        if (data.status === 'error') {
            throw new Error(data.message || 'Erro desconhecido retornado pelo script.');
        }

        todosOsAgendamentos = data;

        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const hojeFormatado = hoje.toISOString().slice(0, 10);

        // Seletor de data
        if (!seletorData.value) {
            seletorData.value = hojeFormatado;
        }
        
        renderizarAgendaParaData(seletorData.value);
        seletorData.addEventListener('change', () => renderizarAgendaParaData(seletorData.value));

    } catch (error) {
        console.error('Erro no Carregamento:', error);
        container.innerHTML = `<p class="loading" style="color: #dc3545;">
            &#9888; Erro ao carregar: ${error.message}. Verifique o URL do Apps Script ou a Planilha.
        </p>`;
    }
}

// --- FUNÇÃO DE CONFIRMAÇÃO DE RESERVA (USUÁRIO) ---
// (Não alterada, mas incluída para completar o código)
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
        const query = new URLSearchParams(dadosParaEnviar).toString();
        const response = await fetch(`${apiUrl}?${query}`);
        
        const result = await response.json(); 

        if (result.status === "success") {
            modalMensagem.textContent = result.message;
            modalMensagem.style.color = 'var(--verde-moinhos)';
            
            // Recarrega os dados para ter o estado atualizado
            // Idealmente, apenas atualize o slot específico:
            // carregarAgenda();
            
            setTimeout(() => fecharModal(modalAgendamento), 2000);
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


// --- FUNÇÕES DE RENDERIZAÇÃO E HELPERS ---

function processarDadosParaGrade(dataFormatoPlanilha) {
    // (Esta função é mantida inalterada)
    const dadosFiltrados = todosOsAgendamentos.filter(item => item.Data === dataFormatoPlanilha);
    const dadosProcessados = {};

    dadosFiltrados.forEach(item => {
        const atividade = item.Atividade;
        if (!dadosProcessados[atividade]) {
            dadosProcessados[atividade] = {
                horarios: new Set(),
                profissionais: new Set(),
                grade: {}
            };
        }
        dadosProcessados[atividade].horarios.add(item.Horario);
        dadosProcessados[atividade].profissionais.add(item.Profissional);
    });

    for (const atividade in dadosProcessados) {
        dadosProcessados[atividade].horarios = Array.from(dadosProcessados[atividade].horarios).sort();
        dadosProcessados[atividade].profissionais = Array.from(dadosProcessados[atividade].profissionais).sort();
    }
    return dadosProcessados;
}

function atualizarDiaDaSemana(dataString) {
    const dataObj = new Date(dataString + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    diaSemanaSpan.textContent = `(${dias[dataObj.getDay()]})`;
}

function renderizarAgendaParaData(dataCalendario) {
    // (Esta função é mantida inalterada, pois já contém a lógica de admin)
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
        const { horarios, profissionais } = dadosProcessados[nomeAtividade];
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
                const vagasTotais = parseInt(slotData?.Vagas) || 1;
                const matriculasReservadas = statusRaw ? statusRaw.split(',').filter(m => m.trim() && m.trim().toLowerCase() !== 'indisponivel') : [];
                const numReservas = matriculasReservadas.length;
                const vagasLivres = vagasTotais - numReservas;

                const isIndisponivel = !slotData || (statusRaw && statusRaw.toLowerCase().includes('indisponivel'));
                const isLotado = !isIndisponivel && vagasLivres <= 0;
                const isDisponivel = !isIndisponivel && vagasLivres > 0;
                const isSlotExistente = !!slotData;

                if (isIndisponivel) {
                    status = 'Indisponível'; statusClass = 'status-indisponivel';
                } else if (isLotado) {
                    status = 'Lotado'; statusClass = 'status-lotado';
                } else if (isDisponivel) {
                    status = `${vagasLivres} Vaga(s)`; statusClass = 'status-disponivel';
                    dataAttributes = `data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}" data-id-linha="${idLinha}"`;
                } else if (isSlotExistente) {
                    // Slot Existe, mas não tem vagas (caso de erro lógico ou indisp. sem status)
                     status = 'Indisponível'; statusClass = 'status-indisponivel';
                } else {
                    // Slot Não Existe na Planilha
                    status = 'Fechado'; statusClass = 'status-fechado'; 
                }
                
                // --- AJUSTE DE ESTILO PARA O MODO ADMIN ---
                if (isAdmin && isSlotExistente) {
                    // Slots existentes (Disponível, Lotado, Indisponível) viram Excluir/Gerenciar
                    statusClass = 'status-admin-excluir'; // Cor de exclusão
                    dataAttributes = `data-id-linha="${idLinha}" data-status-raw="${statusRaw}" data-vagas="${vagasTotais}"`;
                    status = `${status} (Gerenciar)`;
                } else if (isAdmin && !isSlotExistente) {
                     // Adiciona um placeholder no modo Admin para indicar que pode ser adicionado
                    status = 'Adicionar'; statusClass = 'status-admin-adicionar';
                    dataAttributes = `data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}"`;
                }


                tabelaHtml += `<td class="status-cell ${statusClass}" ${dataAttributes}>${status}</td>`;
            });
            tabelaHtml += `</tr>`;
        });
        tabelaHtml += `</tbody></table></div>`;
        titulo.insertAdjacentHTML('afterend', tabelaHtml);
    }
}

function abrirModalReserva(data) {
    // (Função de abertura de modal do usuário)
    agendamentoAtual = {
        data: data.data,
        horario: data.horario,
        profissional: data.profissional,
        atividade: data.atividade,
        idLinha: data.idLinha
    };
    
    modalDetalhes.innerHTML = `
        <li><strong>Profissional:</strong> ${data.profissional}</li>
        <li><strong>Atividade:</strong> ${data.atividade}</li>
        <li><strong>Data:</strong> ${data.data}</li>
        <li><strong>Horário:</strong> ${data.horario}</li>
    `;
    inputMatricula.value = '';
    modalMensagem.textContent = '';
    abrirModal(modalAgendamento);
}


// --- EVENT LISTENERS GERAIS ---

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
            painel.style.padding = "10px";
            painel.style.maxHeight = painel.scrollHeight + "px";
        }
    }

    // Ação na Célula de Agendamento (Usuário / Admin)
    if (isAdmin && target.classList.contains('status-admin-excluir')) {
        const idLinha = target.dataset.idLinha;
        if (idLinha && confirm(`Deseja EXCLUIR o slot da linha ${idLinha}?`)) {
            handleAdminDelete(idLinha);
        }
    } else if (target.classList.contains('status-disponivel') && !isAdmin) {
        // Ação de reserva do Usuário
        celulaClicada = target;
        abrirModalReserva(target.dataset);
    }
    // Adicionar slot vazio (Admin)
    else if (isAdmin && target.classList.contains('status-admin-adicionar')) {
        // Implementar a lógica para abrir o modal de adição pré-preenchido
        alert('Abrir modal de adição pré-preenchido com ' + target.dataset.horario);
        abrirModal(modalAdminAdicionar);
    }
});


// --- LIGAÇÃO DE BOTÕES FINAIS ---

// Modal Agendamento (Usuário)
btnCancelar.addEventListener('click', () => fecharModal(modalAgendamento));
btnConfirmar.addEventListener('click', confirmarAgendamento);

// Admin Login/Logout
btnAdminLogin.addEventListener('click', handleAdminLoginClick); // Novo handle
btnConfirmarAdminLogin.addEventListener('click', confirmarAdminLogin);
btnCancelarAdminLogin.addEventListener('click', () => fecharModal(modalAdminLogin));

// Admin Gerenciamento
btnGerenciarAgenda.addEventListener('click', () => abrirModal(modalAdminGerenciar));
btnFecharAdminGerenciar.addEventListener('click', () => fecharModal(modalAdminGerenciar));
btnAdminLogout.addEventListener('click', handleAdminLoginClick); // Reusa o handle para o Logout

// Admin Adicionar
btnAdminAdicionar.addEventListener('click', () => {
    fecharModal(modalAdminGerenciar);
    abrirModal(modalAdminAdicionar);
});
btnCancelarAdicionar.addEventListener('click', () => fecharModal(modalAdminAdicionar));
formAdicionarHorario.addEventListener('submit', handleAdminAdicionar);

// Consulta (Minhas Reservas)
btnConsultarReservas.addEventListener('click', () => {
    abrirModal(modalConsulta);
    voltarConsulta(); // Reseta a visualização
});
btnBuscarReservas.addEventListener('click', handleBuscarReservas);
btnFecharConsulta.addEventListener('click', () => fecharModal(modalConsulta));
btnVoltarConsulta.addEventListener('click', voltarConsulta);


// Inicialização
carregarAgenda();
