// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec'; // Lembre-se de atualizar este link!

const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// --- Elementos do Modal de Usuário ---
const modal = document.getElementById('modal-agendamento');
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnConfirmar = document.getElementById('btn-confirmar');
const modalMensagem = document.getElementById('modal-mensagem');
const btnCancelarAgendamento = document.getElementById('btn-cancelar-agendamento');

// --- Elementos de Ação (MOVIDOS PARA #seletor-container) ---
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');

// --- Elementos de Login e Gerenciamento Admin (NOVOS POSICIONAMENTOS) ---
const btnAdminLogin = document.getElementById('btn-admin-login'); // Botão no topo direito
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda'); // Botão ao lado da data (aparece após login)
const modalAdminLogin = document.getElementById('modal-admin-login');
const inputAdminPassword = document.getElementById('input-admin-password');
const btnConfirmarAdminLogin = document.getElementById('btn-confirmar-admin-login');
const btnCancelarAdminLogin = document.getElementById('btn-cancelar-admin-login');
const adminLoginMensagem = document.getElementById('admin-login-mensagem');

// --- Elementos do Painel Admin (Geral) ---
const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnAdminAdicionar = document.getElementById('btn-admin-adicionar');
const btnAdminLogout = document.getElementById('btn-admin-logout');
const btnFecharAdminGerenciar = document.getElementById('btn-fechar-admin-gerenciar');

// --- Elementos do Modal Admin (Adicionar Horários) ---
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
const btnConfirmarAdicionar = document.getElementById('btn-confirmar-adicionar');
const adminAddMensagem = document.getElementById('admin-add-mensagem');


// --- Modal Consulta ---
const modalConsulta = document.getElementById('modal-consulta');
const inputConsultaMatricula = document.getElementById('input-consulta-matricula');
const btnBuscarReservas = document.getElementById('btn-buscar-reservas');
const listaAgendamentos = document.getElementById('lista-agendamentos');
const consultaViewInicial = document.getElementById('consulta-view-inicial');
const consultaViewResultados = document.getElementById('consulta-view-resultados');
const consultaMensagem = document.getElementById('consulta-mensagem');
const btnFecharConsulta = document.getElementById('btn-fechar-consulta');
const btnVoltarConsulta = document.getElementById('btn-voltar-consulta');

// --- Variáveis de Estado ---
let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;
let isAdmin = false;

// --- Configurações de Atividades ---
const ProfissionaisAtividades = {
    'Ana': ['Quick Massage', 'Massagem Terapêutica'],
    'Carlos': ['Quick Massage', 'Massagem Relaxante'],
    'Luis': ['Massagem Terapêutica'],
    'Maria Eduarda': ['Massagem Relaxante'],
    'Rafael': ['Quick Massage', 'Massagem Terapêutica', 'Massagem Relaxante']
};

const HorariosQuickMassage = [
    '08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45',
    '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45'
];


// --- FUNÇÕES DE UTILIDADE ---

function formatarDataParaAppsScript(dataISO) {
    if (!dataISO) return '';
    const [year, month, day] = dataISO.split('-');
    return `${day}/${month}/${year}`;
}

function dataAtualFormatada() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function atualizarDiaDaSemana(dataCalendario) {
    if (!dataCalendario) {
        diaSemanaSpan.textContent = '';
        return;
    }
    const dataObj = new Date(dataCalendario + 'T00:00:00');
    let diaDaSemana = dataObj.getDay();
    const nomesDias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    diaSemanaSpan.textContent = `(${nomesDias[diaDaSemana]})`;
}

// --- FUNÇÃO DE CARREGAMENTO E RENDERIZAÇÃO DA AGENDA ---

async function carregarAgenda() {
    const dataSelecionadaISO = seletorData.value;
    if (!dataSelecionadaISO) return;
    
    // Atualiza o dia da semana imediatamente
    atualizarDiaDaSemana(dataSelecionadaISO);
    
    const dataFormatada = formatarDataParaAppsScript(dataSelecionadaISO);
    container.innerHTML = '<p class="loading">Carregando agenda...</p>';
    
    try {
        const url = `${apiUrl}?action=loadData`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.status === 'error') {
            container.innerHTML = `<p class="loading" style="color: red;">Erro ao carregar dados: ${data.message}</p>`;
            return;
        }

        todosOsAgendamentos = data || [];
        renderizarAgenda(dataFormatada);

    } catch (error) {
        console.error('Erro ao carregar agenda:', error);
        container.innerHTML = '<p class="loading" style="color: red;">Erro de conexão. Tente novamente.</p>';
    }
}

function processarDadosParaGrade(dataSelecionada) {
    const dadosFiltrados = todosOsAgendamentos.filter(item => item.Data === dataSelecionada);
    const atividades = {};

    dadosFiltrados.forEach(item => {
        const chave = `${item.Atividade}|${item.Profissional}`;
        if (!atividades[chave]) {
            atividades[chave] = {
                Atividade: item.Atividade,
                Profissional: item.Profissional,
                horarios: [],
                grade: {}
            };
        }
        
        // Separa a lista de matriculas
        const matriculas = (item.Reserva || '').split(',').map(m => m.trim()).filter(Boolean);
        const vagasRestantes = item.Vagas - matriculas.length;

        // Adiciona o horário
        if (!atividades[chave].horarios.includes(item.Horário)) {
            atividades[chave].horarios.push(item.Horário);
        }

        // Adiciona os detalhes do slot
        atividades[chave].grade[item.Horário] = {
            ID_LINHA: item.ID_LINHA, // ID da linha na planilha
            Vagas: parseInt(item.Vagas),
            Matriculas: matriculas,
            VagasRestantes: vagasRestantes,
            Status: matriculas.length >= item.Vagas ? 'Lotado' : (item.Reserva.toLowerCase().includes('indisponivel') ? 'Indisponível' : 'Disponível'),
            ReservaCompleta: item.Reserva // Texto completo da coluna Reserva
        };
    });
    
    // Converte o objeto para um array para fácil iteração e ordenação
    return Object.values(atividades).sort((a, b) => a.Atividade.localeCompare(b.Atividade));
}


function renderizarAgenda(dataSelecionada) {
    const dadosProcessados = processarDadosParaGrade(dataSelecionada);
    container.innerHTML = ''; // Limpa o container
    
    if (isAdmin) {
        container.innerHTML += '<div class="aviso-admin">MODO ADMIN ATIVO: Clique em qualquer slot para excluir.</div>';
    }

    if (dadosProcessados.length === 0) {
        container.innerHTML += `<p class="loading">Nenhum agendamento encontrado para ${dataSelecionada}.</p>`;
        return;
    }

    dadosProcessados.forEach(atividadeDetalhes => {
        const { Atividade, Profissional, horarios, grade } = atividadeDetalhes;

        const tituloDiv = document.createElement('div');
        tituloDiv.className = 'titulo-atividade';
        tituloDiv.textContent = `${Atividade} (${Profissional})`;
        tituloDiv.setAttribute('data-target', `tabela-${Atividade.replace(/\s/g, '-')}-${Profissional.replace(/\s/g, '-')}`);
        
        // Adiciona ícone de gerenciamento/consulta ao lado da data
        const iconContainer = document.createElement('span');
        iconContainer.innerHTML = isAdmin 
            ? '<img src="img/icon-admin.png" alt="Admin" style="height: 1.2em; margin-left: 10px;">' // Exemplo de ícone, ajuste conforme necessário
            : ''; 
        tituloDiv.appendChild(iconContainer);

        const tabelaContainer = document.createElement('div');
        tabelaContainer.id = `tabela-${Atividade.replace(/\s/g, '-')}-${Profissional.replace(/\s/g, '-')}`;
        tabelaContainer.className = 'tabela-container';

        const tabela = document.createElement('table');
        tabela.className = 'tabela-agenda';
        tabela.innerHTML = `
            <thead>
                <tr>
                    <th class="horario-col">Horário</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = tabela.querySelector('tbody');

        horarios.sort().forEach(horario => {
            const slot = grade[horario];
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="horario-col">${horario}</td>`;
            
            const tdStatus = document.createElement('td');
            tdStatus.classList.add('status-cell');
            tdStatus.dataset.idLinha = slot.ID_LINHA;
            tdStatus.dataset.data = dataSelecionada;
            tdStatus.dataset.horario = horario;
            tdStatus.dataset.profissional = Profissional;
            tdStatus.dataset.atividade = Atividade;
            tdStatus.dataset.vagas = slot.Vagas;
            tdStatus.dataset.matriculas = slot.Matriculas.join(',');
            tdStatus.dataset.reservaCompleta = slot.ReservaCompleta;

            let statusClass;
            let statusText;
            
            if (isAdmin) {
                // Modo Admin: Célula clicável para EXCLUSÃO/MANUTENÇÃO
                statusClass = 'status-admin-excluir';
                statusText = `ID: ${slot.ID_LINHA} - ${slot.VagasRestantes}/${slot.Vagas} Vagas`;
                tdStatus.addEventListener('click', () => handleAdminAction(tdStatus, 'delete'));
            } else {
                // Modo Usuário: Reserva normal
                if (slot.Status === 'Disponível') {
                    statusClass = 'status-disponivel';
                    statusText = `Disponível (${slot.VagasRestantes} vagas)`;
                    tdStatus.addEventListener('click', () => abrirModalAgendamento(tdStatus));
                } else if (slot.Status === 'Lotado') {
                    statusClass = 'status-lotado';
                    statusText = 'Lotado';
                } else { // Indisponível (Vagas = 0 ou marcado no Reserva)
                    statusClass = 'status-indisponivel';
                    statusText = 'Indisponível';
                }
            }

            tdStatus.classList.add(statusClass);
            tdStatus.innerHTML = statusText;
            tr.appendChild(tdStatus);
            tbody.appendChild(tr);
        });

        tabelaContainer.appendChild(tabela);
        container.appendChild(tituloDiv);
        container.appendChild(tabelaContainer);
        
        // Lógica para o Acordeão
        tituloDiv.addEventListener('click', () => {
            const isActive = tituloDiv.classList.toggle('ativo');
            tabelaContainer.style.maxHeight = isActive ? `${tabelaContainer.scrollHeight}px` : '0';
        });

        // Abre o primeiro item por padrão
        if (dadosProcessados.length === 1 || (Atividade === 'Quick Massage' && Profissional === 'Ana')) {
             tituloDiv.classList.add('ativo');
             tabelaContainer.style.maxHeight = `${tabelaContainer.scrollHeight}px`;
        }
    });
}

// --- FUNÇÕES DE AÇÃO DO USUÁRIO ---

function abrirModalAgendamento(celula) {
    if (celula.classList.contains('status-lotado') || celula.classList.contains('status-indisponivel')) {
        return;
    }

    // Armazena o agendamento atual e a célula para atualização pós-reserva
    agendamentoAtual = {
        data: celula.dataset.data,
        horario: celula.dataset.horario,
        profissional: celula.dataset.profissional,
        atividade: celula.dataset.atividade
    };
    celulaClicada = celula;

    modalDetalhes.innerHTML = `
        <li><strong>Data:</strong> ${agendamentoAtual.data}</li>
        <li><strong>Horário:</strong> ${agendamentoAtual.horario}</li>
        <li><strong>Atividade:</strong> ${agendamentoAtual.atividade}</li>
        <li><strong>Profissional:</strong> ${agendamentoAtual.profissional}</li>
        <li><strong>Vagas Disponíveis:</strong> ${celula.dataset.vagas - celula.dataset.matriculas.split(',').filter(Boolean).length}</li>
    `;

    inputMatricula.value = localStorage.getItem('last_matricula') || '';
    modalMensagem.textContent = 'A matrícula deve ter apenas números.';
    modalMensagem.style.color = 'var(--cinza-texto)';
    btnConfirmar.disabled = false;
    modal.classList.remove('hidden');
}

async function confirmarAgendamento() {
    const matricula = inputMatricula.value.trim();
    if (!matricula || isNaN(matricula) || matricula.length < 3) {
        modalMensagem.textContent = 'Por favor, insira uma matrícula válida (apenas números).';
        modalMensagem.style.color = 'red';
        return;
    }

    // Salvando a matrícula no armazenamento local
    localStorage.setItem('last_matricula', matricula);

    btnConfirmar.disabled = true;
    modalMensagem.textContent = 'Processando reserva...';
    modalMensagem.style.color = 'orange';

    try {
        const url = `${apiUrl}?action=book&matricula=${matricula}&data=${agendamentoAtual.data}&horario=${agendamentoAtual.horario}&profissional=${agendamentoAtual.profissional}&atividade=${agendamentoAtual.atividade}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === 'success') {
            modalMensagem.textContent = result.message;
            modalMensagem.style.color = 'var(--verde-moinhos)';
            // Recarrega a agenda após a confirmação para refletir o novo status
            setTimeout(() => {
                modal.classList.add('hidden');
                carregarAgenda();
            }, 1500);
        } else {
            modalMensagem.textContent = result.message;
            modalMensagem.style.color = 'red';
            btnConfirmar.disabled = false;
        }

    } catch (error) {
        console.error('Erro ao confirmar agendamento:', error);
        modalMensagem.textContent = 'Erro de conexão ou serviço. Tente novamente.';
        modalMensagem.style.color = 'red';
        btnConfirmar.disabled = false;
    }
}

// --- FUNÇÕES DE CONSULTA DO USUÁRIO ---

function buscarReservasUsuario() {
    consultaMensagem.textContent = '';
    const matricula = inputConsultaMatricula.value.trim();
    if (!matricula || isNaN(matricula)) {
        consultaMensagem.textContent = 'Por favor, insira uma matrícula válida.';
        consultaMensagem.style.color = 'red';
        return;
    }
    localStorage.setItem('last_matricula', matricula);
    btnBuscarReservas.disabled = true;

    fetch(`${apiUrl}?action=getMyBookings&matricula=${matricula}`)
        .then(res => res.json())
        .then(result => {
            btnBuscarReservas.disabled = false;
            listaAgendamentos.innerHTML = '';
            
            if (result.status === 'success') {
                if (result.data.length > 0) {
                    result.data.forEach(booking => {
                        const item = document.createElement('div');
                        item.className = 'item-agendamento';
                        item.innerHTML = `
                            <div class="detalhes-agendamento">
                                <strong>${booking.Atividade}</strong>
                                <span>Dia: ${booking.Data} - Hora: ${booking.Horário}</span>
                                <span>Profissional: ${booking.Profissional}</span>
                            </div>
                            <button class="btn-acao btn-cancelar-item" data-id-linha="${booking.ID}">Cancelar</button>
                        `;
                        listaAgendamentos.appendChild(item);
                    });
                    
                    document.querySelectorAll('.btn-cancelar-item').forEach(btn => {
                        btn.addEventListener('click', (e) => cancelarReservaUsuario(e.target.dataset.idLinha, matricula));
                    });
                    
                    consultaViewInicial.classList.add('hidden');
                    consultaViewResultados.classList.remove('hidden');
                } else {
                    consultaMensagem.textContent = 'Nenhuma reserva futura encontrada para esta matrícula.';
                    consultaMensagem.style.color = 'var(--azul-moinhos)';
                }
            } else {
                consultaMensagem.textContent = result.message || 'Erro ao buscar reservas.';
                consultaMensagem.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Erro ao buscar reservas:', error);
            btnBuscarReservas.disabled = false;
            consultaMensagem.textContent = 'Erro de conexão. Tente novamente.';
            consultaMensagem.style.color = 'red';
        });
}

function cancelarReservaUsuario(idLinha, matricula) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
        return;
    }
    
    consultaMensagem.textContent = 'Cancelando...';
    consultaMensagem.style.color = 'orange';

    fetch(`${apiUrl}?action=cancelBooking&id=${idLinha}&matricula=${matricula}`)
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success') {
                consultaMensagem.textContent = result.message;
                consultaMensagem.style.color = 'var(--verde-moinhos)';
                // Recarrega a lista e a agenda
                setTimeout(() => {
                    buscarReservasUsuario();
                    carregarAgenda();
                }, 1000);
            } else {
                consultaMensagem.textContent = result.message || 'Erro ao cancelar reserva.';
                consultaMensagem.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Erro ao cancelar:', error);
            consultaMensagem.textContent = 'Erro de conexão. Tente novamente.';
            consultaMensagem.style.color = 'red';
        });
}


// --- FUNÇÕES DE ADMINISTRAÇÃO ---

function updateAdminState(isLoggedIn) {
    isAdmin = isLoggedIn;
    if (isAdmin) {
        btnAdminLogin.textContent = 'Admin Logado';
        btnAdminLogin.disabled = true;
        btnAdminLogin.classList.add('hidden');
        btnGerenciarAgenda.classList.remove('hidden');
    } else {
        btnAdminLogin.textContent = 'Login Admin';
        btnAdminLogin.disabled = false;
        btnAdminLogin.classList.remove('hidden');
        btnGerenciarAgenda.classList.add('hidden');
    }
    // Recarrega a agenda para aplicar estilos e eventos de admin
    carregarAgenda();
}

// Simulação de login simples (Ajuste a senha conforme necessário)
function handleAdminLogin() {
    const password = inputAdminPassword.value;
    adminLoginMensagem.textContent = '';
    
    // ATENÇÃO: Troque 'senhaadmin123' pela senha real!
    if (password === 'senhaadmin123') { 
        adminLoginMensagem.textContent = 'Login bem-sucedido!';
        adminLoginMensagem.style.color = 'var(--verde-moinhos)';
        
        setTimeout(() => {
            modalAdminLogin.classList.add('hidden');
            inputAdminPassword.value = '';
            updateAdminState(true);
            modalAdminGerenciar.classList.remove('hidden'); // Abre o painel admin
        }, 800);
    } else {
        adminLoginMensagem.textContent = 'Senha incorreta.';
        adminLoginMensagem.style.color = 'red';
    }
}

function handleAdminLogout() {
    modalAdminGerenciar.classList.add('hidden');
    updateAdminState(false);
}

// Ação de administrador (excluir slot permanentemente)
function handleAdminAction(celula, actionType) {
    const idLinha = celula.dataset.idLinha;
    const horario = celula.dataset.horario;
    const atividade = celula.dataset.atividade;
    const reservaCompleta = celula.dataset.reservaCompleta;

    if (!idLinha) {
        alert('Erro: ID da linha não encontrado.');
        return;
    }
    
    // Se a célula não está vazia, o admin pode querer remover reservas ou excluir a linha
    if (reservaCompleta && reservaCompleta.trim() !== '') {
        const confirmRemover = confirm(`O slot de ${horario} para ${atividade} tem reservas: ${reservaCompleta}. Você pode excluir a linha permanentemente (OK) ou definir Vagas=0 (CANCELAR)?`);
        
        // Se confirmar, tenta a exclusão permanente
        if (confirmRemover) {
            if (!confirm(`Confirme a EXCLUSÃO PERMANENTE do slot ID ${idLinha}? Isso não pode ser desfeito.`)) return;
            actionType = 'deletePermanent';
        } else {
            // Se cancelar, faz a exclusão lógica (Vagas=0)
            if (!confirm(`Confirme a exclusão LÓGICA (Vagas=0) do slot ID ${idLinha}?`)) return;
            actionType = 'disableSlot';
        }
    } else {
        // Se a célula está vazia, confirma a exclusão permanente
        if (!confirm(`Confirme a EXCLUSÃO PERMANENTE do slot ID ${idLinha}?`)) return;
        actionType = 'deletePermanent';
    }

    
    let url;
    
    if (actionType === 'deletePermanent') {
        // Ação de exclusão permanente (função deleteSchedule no GS)
        url = `${apiUrl}?action=deleteSchedule&id_linha=${idLinha}`;
    } else if (actionType === 'disableSlot') {
        // Ação de desabilitar slot (manutenção, Vagas=0)
        url = `${apiUrl}?action=adminUpdate&id=${idLinha}&vagas=0`;
    }

    if (url) {
        fetch(url)
            .then(res => res.json())
            .then(result => {
                if (result.status === 'success') {
                    alert('Ação de admin concluída: ' + result.message);
                    carregarAgenda();
                } else {
                    alert('Erro na ação de admin: ' + result.message);
                }
            })
            .catch(error => {
                console.error('Erro na requisição admin:', error);
                alert('Erro de comunicação com o servidor.');
            });
    }
}


// --- LÓGICA DO MODAL ADMIN (Adicionar Horários) ---

// Atualiza as opções de atividades com base no profissional
function atualizarOpcoesAtividade() {
    const profissional = adminSelectProfissional.value;
    adminSelectAtividade.innerHTML = '<option value="" disabled selected>Selecione a Modalidade</option>';
    if (profissional) {
        ProfissionaisAtividades[profissional].forEach(atividade => {
            const option = document.createElement('option');
            option.value = atividade;
            option.textContent = atividade;
            adminSelectAtividade.appendChild(option);
        });
        adminSelectAtividade.disabled = false;
    } else {
        adminSelectAtividade.disabled = true;
    }
    
    // Reseta a visualização
    quickMassageContainer.classList.add('hidden');
    horarioUnicoContainer.classList.add('hidden');
    vagasContainer.classList.add('hidden');
    btnConfirmarAdicionar.disabled = true;
    adminSelectAtividade.value = ""; 
}

// Habilita/desabilita campos dependendo da atividade (Quick Massage vs Outras)
function configurarModalidade() {
    const atividade = adminSelectAtividade.value;
    quickMassageContainer.classList.add('hidden');
    horarioUnicoContainer.classList.add('hidden');
    vagasContainer.classList.add('hidden');

    if (!atividade) return;
    
    if (atividade === 'Quick Massage') {
        quickMassageContainer.classList.remove('hidden');
        vagasContainer.classList.remove('hidden');
        renderizarHorariosQuickMassage();
        adminInputVagas.value = '1'; // Padrão 1 para Quick Massage
    } else {
        horarioUnicoContainer.classList.remove('hidden');
        vagasContainer.classList.remove('hidden');
        adminInputVagas.value = '1'; // Padrão 1 para Massagens
    }
    btnConfirmarAdicionar.disabled = false;
}

function renderizarHorariosQuickMassage() {
    quickMassageHorarios.innerHTML = '';
    HorariosQuickMassage.forEach(horario => {
        const item = document.createElement('div');
        item.className = 'horario-item';
        item.innerHTML = `
            <input type="checkbox" id="check-${horario}" name="horario" value="${horario}">
            <label for="check-${horario}">${horario}</label>
            <input type="text" class="admin-input-indisponivel" data-horario="${horario}" placeholder="Indisponível">
        `;
        quickMassageHorarios.appendChild(item);
    });
}

function adicionarHorarios(event) {
    event.preventDefault();
    adminAddMensagem.innerHTML = '';
    
    const data = formatarDataParaAppsScript(adminSelectData.value);
    const profissional = adminSelectProfissional.value;
    const atividade = adminSelectAtividade.value;
    let horariosParaCriar = [];
    
    if (!data || !profissional || !atividade) {
        adminAddMensagem.innerHTML = '<span class="mensagem-modal error">Preencha todos os campos obrigatórios.</span>';
        return;
    }
    
    // Coleta dos dados do formulário
    if (atividade === 'Quick Massage') {
        const checkedHorarios = quickMassageHorarios.querySelectorAll('input[type="checkbox"]:checked');
        if (checkedHorarios.length === 0) {
            adminAddMensagem.innerHTML = '<span class="mensagem-modal error">Selecione pelo menos um horário.</span>';
            return;
        }

        checkedHorarios.forEach(checkbox => {
            const horario = checkbox.value;
            const inputIndisponivel = quickMassageHorarios.querySelector(`.admin-input-indisponivel[data-horario="${horario}"]`);
            const vagas = parseInt(adminInputVagas.value);
            const reserva = inputIndisponivel && inputIndisponivel.value.trim() !== '' ? inputIndisponivel.value.trim() : '';
            
            horariosParaCriar.push({ Horario: horario, Vagas: vagas, Reserva: reserva });
        });

    } else { // Modalidades de horário único
        const horario = adminInputHorario.value.trim();
        const vagas = parseInt(adminInputVagas.value);
        if (!horario.match(/[0-9]{2}:[0-9]{2}/) || isNaN(vagas) || vagas <= 0) {
            adminAddMensagem.innerHTML = '<span class="mensagem-modal error">Verifique o formato do Horário (HH:MM) e Vagas (>0).</span>';
            return;
        }
        // Para massagens individuais, sempre criamos o slot como disponível, sem o campo "Indisponível"
        horariosParaCriar.push({ Horario: horario, Vagas: vagas, Reserva: '' }); 
    }
    
    // Envio para o Apps Script
    const params = new URLSearchParams();
    params.append('action', 'addMultiple');
    params.append('data', data);
    params.append('profissional', profissional);
    params.append('atividade', atividade);
    params.append('horariosJson', JSON.stringify(horariosParaCriar)); // JSON string com a lista de horários
    
    btnConfirmarAdicionar.disabled = true;
    adminAddMensagem.innerHTML = '<span class="mensagem-modal">Adicionando horários...</span>';

    fetch(`${apiUrl}?${params.toString()}`)
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success') {
                adminAddMensagem.innerHTML = `<span class="mensagem-modal success">${result.message}</span>`;
                // Recarrega a agenda principal e fecha o modal após um tempo
                setTimeout(() => {
                    modalAdminAdicionar.classList.add('hidden');
                    carregarAgenda();
                }, 1500);
            } else {
                adminAddMensagem.innerHTML = `<span class="mensagem-modal error">Erro: ${result.message}</span>`;
                btnConfirmarAdicionar.disabled = false;
            }
        })
        .catch(error => {
            console.error('Erro ao adicionar horários:', error);
            adminAddMensagem.innerHTML = '<span class="mensagem-modal error">Erro de comunicação com o servidor.</span>';
            btnConfirmarAdicionar.disabled = false;
        });
}


// --- INICIALIZAÇÃO E EVENT LISTENERS ---

// 1. Define a data atual como padrão no carregamento
const todayISO = dataAtualFormatada();
seletorData.value = todayISO;
adminSelectData.value = todayISO; // Define no modal Admin também
carregarAgenda();

// 2. Event Listeners para a Agenda
seletorData.addEventListener('change', carregarAgenda);
btnConfirmar.addEventListener('click', confirmarAgendamento);
btnCancelarAgendamento.addEventListener('click', () => modal.classList.add('hidden'));

// 3. Event Listeners para Consulta do Usuário
btnConsultarReservas.addEventListener('click', () => {
    inputConsultaMatricula.value = localStorage.getItem('last_matricula') || '';
    consultaViewResultados.classList.add('hidden');
    consultaViewInicial.classList.remove('hidden');
    consultaMensagem.textContent = '';
    listaAgendamentos.innerHTML = '';
    modalConsulta.classList.remove('hidden');
});
btnFecharConsulta.addEventListener('click', () => modalConsulta.classList.add('hidden'));
btnVoltarConsulta.addEventListener('click', () => {
    consultaViewResultados.classList.add('hidden');
    consultaViewInicial.classList.remove('hidden');
    consultaMensagem.textContent = '';
});
btnBuscarReservas.addEventListener('click', buscarReservasUsuario);
inputConsultaMatricula.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarReservasUsuario();
});


// 4. Event Listeners para Admin
btnAdminLogin.addEventListener('click', () => {
    modalAdminLogin.classList.remove('hidden');
    inputAdminPassword.focus();
    adminLoginMensagem.textContent = '';
});
btnCancelarAdminLogin.addEventListener('click', () => modalAdminLogin.classList.add('hidden'));
btnConfirmarAdminLogin.addEventListener('click', handleAdminLogin);
inputAdminPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAdminLogin();
});

btnGerenciarAgenda.addEventListener('click', () => modalAdminGerenciar.classList.remove('hidden'));
btnFecharAdminGerenciar.addEventListener('click', () => modalAdminGerenciar.classList.add('hidden'));
btnAdminLogout.addEventListener('click', handleAdminLogout);

// 5. Event Listeners para Adicionar Horários Admin
btnAdminAdicionar.addEventListener('click', () => {
    // Inicializa o modal de adicionar e fecha o painel geral
    modalAdminGerenciar.classList.add('hidden');
    modalAdminAdicionar.classList.remove('hidden');
    // Reseta o formulário
    formAdicionarHorario.reset();
    adminSelectAtividade.innerHTML = '<option value="" disabled selected>Selecione o Profissional primeiro</option>';
    adminSelectAtividade.disabled = true;
    quickMassageContainer.classList.add('hidden');
    horarioUnicoContainer.classList.add('hidden');
    vagasContainer.classList.add('hidden');
    btnConfirmarAdicionar.disabled = true;
    adminAddMensagem.innerHTML = '';
});

document.getElementById('btn-cancelar-adicionar').addEventListener('click', () => {
    modalAdminAdicionar.classList.add('hidden');
    // Volta para o painel geral
    modalAdminGerenciar.classList.remove('hidden'); 
});

adminSelectProfissional.addEventListener('change', atualizarOpcoesAtividade);
adminSelectAtividade.addEventListener('change', configurarModalidade);
formAdicionarHorario.addEventListener('submit', adicionarHorarios);
