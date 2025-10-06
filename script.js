// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';


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

// Modal Admin Login
const btnAdminLogin = document.getElementById('btn-admin-login');
const modalAdminLogin = document.getElementById('modal-admin-login');
const inputAdminSenha = document.getElementById('input-admin-senha');
const btnConfirmarAdminLogin = document.getElementById('btn-confirmar-admin-login');
const adminLoginMensagem = document.getElementById('admin-login-mensagem');

// Modal Admin Gerenciar
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda');
const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnFecharAdminGerenciar = document.getElementById('btn-fechar-admin-gerenciar');
const btnAdminLogout = document.getElementById('btn-admin-logout');
const inputAdminData = document.getElementById('input-admin-data');
const inputAdminMatricula = document.getElementById('input-admin-matricula');
const adminFormDinamico = document.getElementById('admin-form-dinamico');
const btnAdicionarHorario = document.getElementById('btn-adicionar-horario');
const adminAdicionarMensagem = document.getElementById('admin-adicionar-mensagem');


// --- CONFIGURAÇÃO GLOBAL ---
// Estrutura de dados SIMULADA. Estes dados devem ser buscados do Apps Script.
// O frontend usará uma estrutura real baseada na resposta da API.
const DATA_STORE = {
    // A senha de Admin deve ser tratada com cautela!
    adminPassword: 'admin', 
    // Dados mestres das atividades para o formulário de criação
    atividades: {
        'Ana': {
            'Quick Massage': { duracao: 30, vagas: 1 },
            'Reiki': { duracao: 60, vagas: 1 }
        },
        'Carlos': {
            'Massagem Relaxante': { duracao: 60, vagas: 1 }
        },
        'Geral': {
            'Ginástica Laboral': { duracao: 60, vagas: 20 },
            'Bate-Papo com Psicólogo': { duracao: 60, vagas: 5 }
        }
    }
};

// Variáveis de estado
let isAdminLoggedIn = false; 
let agendaCompleta = []; // Armazena a agenda completa (todos os dias)
let agendaFiltrada = {}; // Agenda filtrada para o dia selecionado


// --- UTILIDADES ---

/**
 * Formata a data para o formato DD/MM/AAAA para exibição.
 * @param {string} dateString - Data no formato YYYY-MM-DD.
 * @returns {string} Data no formato DD/MM/AAAA.
 */
function formatarData(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Formata a data para exibir o dia da semana.
 * @param {string} dateString - Data no formato YYYY-MM-DD.
 * @returns {string} Dia da semana por extenso.
 */
function getDiaDaSemana(dateString) {
    const data = new Date(dateString + 'T00:00:00'); 
    return data.toLocaleDateString('pt-BR', { weekday: 'long' });
}

/**
 * Carrega a agenda completa do Apps Script (doGet sem parâmetros de ação).
 */
async function carregarAgendaCompleta() {
    container.innerHTML = '<p class="loading">Carregando agenda...</p>';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.status}`);
        }
        const data = await response.json();
        
        // Se a API retornar um erro (status: "error")
        if (data.status === "error") {
             throw new Error(`Erro da API: ${data.message}`);
        }
        
        // O resultado da API é a lista completa de agendamentos.
        agendaCompleta = data; 
        
        // Filtra para o dia atual ou a data selecionada e renderiza
        const dataParaRenderizar = seletorData.value;
        if (dataParaRenderizar) {
            renderizarAgenda();
        } else {
            container.innerHTML = '<p class="loading">Selecione uma data para ver os horários disponíveis.</p>';
        }

    } catch (error) {
        console.error("Erro ao carregar a agenda:", error);
        container.innerHTML = `<p class="loading" style="color: red;">Erro ao carregar a agenda: ${error.message}. Verifique a URL e a implantação do Apps Script.</p>`;
    }
}

/**
 * Filtra a agenda para o dia selecionado e a estrutura para renderização.
 * @param {string} dataSelecionada - Data no formato YYYY-MM-DD.
 * @returns {Object} Estrutura de atividades com os horários disponíveis e status.
 */
function construirAgenda(dataSelecionada) {
    const agenda = {};
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // 1. Filtra os agendamentos futuros para o dia selecionado
    const agendamentosDoDia = agendaCompleta.filter(item => {
        const dataItem = item.Data; // Item.Data está em DD/MM/AAAA
        
        // Converte DD/MM/AAAA para Date para comparação com o futuro
        const [day, month, year] = dataItem.split('/');
        const dataObjeto = new Date(year, month - 1, day);
        dataObjeto.setHours(0, 0, 0, 0);

        // Compara com a data selecionada (YYYY-MM-DD)
        const [y, m, d] = dataSelecionada.split('-');
        const dataSelecionadaObjeto = new Date(y, m - 1, d);
        dataSelecionadaObjeto.setHours(0, 0, 0, 0);

        return dataObjeto.getTime() === dataSelecionadaObjeto.getTime();
    });

    // 2. Agrupa por Profissional e Atividade
    agendamentosDoDia.forEach(item => {
        const key = `${item.Profissional} - ${item.Atividade}`;
        
        if (!agenda[key]) {
            agenda[key] = {
                profissional: item.Profissional,
                atividade: item.Atividade,
                horarios: []
            };
        }
        
        // Converte a string de reservas para um array de matrículas
        const reservas = (item.Reserva || '').split(',').map(m => m.trim()).filter(Boolean);
        const vagas = parseInt(item.Vagas);

        agenda[key].horarios.push({
            id: item.ID,
            hora: item.Horário,
            vagasMaximas: vagas,
            reservas: reservas,
            vagas: vagas - reservas.length,
            status: (vagas > 0 && reservas.length < vagas) ? 'disponivel' : (vagas > 0 ? 'lotado' : 'indisponivel'),
            // Informações de auditoria para o admin
            adminMatricula: item['Matricula Admin'] || 'N/A', 
            timestamp: item['Timestamp'] || 'N/A'
        });
    });

    return agenda;
}

/**
 * Renderiza a agenda na tela.
 */
function renderizarAgenda() {
    const dataSelecionada = seletorData.value;
    if (!dataSelecionada) {
        // Já tratado em carregarAgendaCompleta
        return;
    }

    const diaSemana = getDiaDaSemana(dataSelecionada);
    diaSemanaSpan.textContent = `(${diaSemana})`;

    agendaFiltrada = construirAgenda(dataSelecionada);
    let html = '';
    const horariosProcessados = {}; // Para coletar todos os horários únicos do dia

    // Coleta todos os horários únicos para a coluna de tempo
    for (const key in agendaFiltrada) {
        agendaFiltrada[key].horarios.forEach(h => {
            horariosProcessados[h.hora] = true;
        });
    }

    const horariosUnicos = Object.keys(horariosProcessados).sort();

    if (horariosUnicos.length === 0) {
        html = `<p class="loading">Não há horários disponíveis para a data ${formatarData(dataSelecionada)}. Adicione horários pelo Gerenciamento Admin.</p>`;
    } else {
        const atividadesKeys = Object.keys(agendaFiltrada);

        html += `<div class="aviso-admin ${isAdminLoggedIn ? '' : 'hidden'}">⚠️ MODO ADMIN: Clique em um horário com vaga para torná-lo indisponível (Vagas=0) ou clique em um horário lotado para remover matrículas.</div>`;
        
        // Estrutura do Acordeão
        for (const [i, key] of atividadesKeys.entries()) {
            const item = agendaFiltrada[key];
            const titulo = `${item.atividade} com ${item.profissional}`;
            const idAcordeao = `acordeao-${i}`;

            html += `<h2 class="titulo-atividade" data-target="#${idAcordeao}">${titulo}</h2>`;
            html += `<div class="tabela-container" id="${idAcordeao}">`;
            html += `<table class="tabela-agenda">`;

            // CABEÇALHO DA TABELA
            html += `<thead><tr><th class="horario-col">Horário</th><th class="cabecalho-atividade">${item.atividade}</th></tr></thead>`;
            
            // CORPO DA TABELA
            html += `<tbody>`;

            horariosUnicos.forEach(hora => {
                const horarioInfo = item.horarios.find(h => h.hora === hora);
                let statusClass = 'status-indisponivel';
                let vagasTexto = 'Indisponível';
                let reservasInfo = '';
                
                if (horarioInfo) {
                    statusClass = `status-${horarioInfo.status}`;
                    vagasTexto = horarioInfo.vagasMaximas === 0 ? 'Indisponível (0 vagas)' : 
                                 horarioInfo.vagas > 0 ? `${horarioInfo.vagas} vagas` : 
                                 'Lotado';
                    
                    if (isAdminLoggedIn) {
                         // Se tiver vagas ou estiver lotado, o admin pode interagir
                        if (horarioInfo.vagasMaximas > 0) {
                             statusClass += ' status-admin-maintenance';
                        }
                        
                        // Exibir matrículas no modo Admin
                        if (horarioInfo.reservas.length > 0) {
                            reservasInfo = `Reservas: ${horarioInfo.reservas.join(', ')}`;
                        }
                        if (horarioInfo.vagasMaximas === 0) {
                            statusClass = 'status-admin-maintenance status-admin-excluir';
                            vagasTexto = `Vagas: ${horarioInfo.vagasMaximas}`;
                        }
                    } else if (horarioInfo.vagasMaximas === 0) {
                         // Para o usuário normal, 0 vagas é indisponível
                         statusClass = 'status-indisponivel';
                    }
                }

                html += `<tr data-id="${horarioInfo ? horarioInfo.id : ''}" 
                            data-atividade="${item.atividade}" 
                            data-profissional="${item.profissional}" 
                            data-hora="${hora}" 
                            data-data="${dataSelecionada}" 
                            data-status="${horarioInfo ? horarioInfo.status : 'indisponivel'}"
                            data-reservas="${horarioInfo ? horarioInfo.reservas.join(',') : ''}"
                            data-vagasmax="${horarioInfo ? horarioInfo.vagasMaximas : 0}"
                            class="${horarioInfo ? '' : 'oculto-admin'}">`; // Se não houver info, não é um slot válido
                html += `<td class="horario-col">${hora}</td>`;
                html += `<td class="${statusClass} status-cell">`;
                html += `<span>${vagasTexto}</span>`;
                if (isAdminLoggedIn && reservasInfo) {
                    html += `<span class="matricula-admin">${reservasInfo}</span>`;
                }
                html += `</td>`;
                html += `</tr>`;
            });

            html += `</tbody>`;
            html += `</table>`;
            html += `</div>`;
        }
    }

    container.innerHTML = html;
    adicionarListenersAcordeao();
    adicionarListenersCelulas();
}

// --- LÓGICA DO ACORDEÃO E LISTENERS ---

/** Adiciona a lógica de abrir/fechar o acordeão */
function adicionarListenersAcordeao() {
    document.querySelectorAll('.titulo-atividade').forEach(titulo => {
        titulo.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const content = document.querySelector(targetId);
            const isAtivo = this.classList.toggle('ativo');

            if (isAtivo) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = "0";
            }
        });
    });
}

/** Adiciona os listeners de clique para as células de agendamento */
function adicionarListenersCelulas() {
    document.querySelectorAll('.tabela-agenda tbody td.status-cell').forEach(cell => {
        cell.addEventListener('click', function() {
            const row = this.closest('tr');
            const data = row.getAttribute('data-data');
            const hora = row.getAttribute('data-hora');
            const atividade = row.getAttribute('data-atividade');
            const profissional = row.getAttribute('data-profissional');
            const status = row.getAttribute('data-status');
            const id = row.getAttribute('data-id');
            const vagasMax = parseInt(row.getAttribute('data-vagasmax'));
            const reservas = row.getAttribute('data-reservas');

            // Lógica para o modo Administrador
            if (isAdminLoggedIn && this.classList.contains('status-admin-maintenance')) {
                // Se a vaga está disponível ou lotada, o admin pode intervir
                if (vagasMax > 0 && status === 'disponivel') {
                    // Mudar vagas para 0 (exclusão lógica)
                    if (confirm(`ADMIN: Deseja tornar o horário de ${atividade} às ${hora} INDISPONÍVEL (Vagas=0)?`)) {
                        adminUpdateVagas(id, 0);
                    }
                } else if (status === 'lotado' || vagasMax === 0) {
                     // Se estiver lotado ou indisponível, abre o modal de manutenção
                    abrirModalManutencaoAdmin(id, data, hora, atividade, profissional, vagasMax, reservas);
                }
                return;
            } 
            
            // Lógica para o usuário normal (agendamento)
            if (status === 'disponivel' && vagasMax > 0) {
                abrirModalAgendamento(data, hora, atividade, profissional);
            }
        });
    });
}

// --- FUNÇÕES DE INTERAÇÃO COM A API ---

/**
 * Agendamento: Envia a requisição de reserva (doGet com action=book).
 */
async function realizarAgendamento(data, hora, atividade, profissional, matricula) {
    const params = new URLSearchParams({ 
        action: 'book', 
        data: formatarData(data), // Envia DD/MM/AAAA para o Apps Script
        horario: hora, 
        atividade,
        profissional,
        matricula
    });
    const requestUrl = `${apiUrl}?${params.toString()}`;
    
    try {
        const response = await fetch(requestUrl);
        const result = await response.json();
        
        modalMensagem.style.color = result.status === 'success' ? 'green' : 'red';
        modalMensagem.textContent = result.message;

        if (result.status === 'success') {
            await carregarAgendaCompleta(); // Recarrega a agenda
            // Fecha o modal após um pequeno delay
            setTimeout(fecharModalAgendamento, 1500); 
        }
    } catch (error) {
        modalMensagem.style.color = 'red';
        modalMensagem.textContent = `Erro de comunicação: ${error.message}`;
    }
}

/**
 * Cancelamento: Envia a requisição de cancelamento (doGet com action=cancel).
 */
async function cancelarReserva(id, matricula) {
    if (!confirm(`Tem certeza que deseja cancelar sua reserva (Matrícula: ${matricula}, ID: ${id})?`)) {
        return;
    }

    const params = new URLSearchParams({ action: 'cancel', id, matricula });
    const requestUrl = `${apiUrl}?${params.toString()}`;
    
    consultaMensagem.textContent = 'Cancelando...';
    consultaMensagem.style.color = 'var(--cinza-texto)';

    try {
        const response = await fetch(requestUrl);
        const result = await response.json();
        
        consultaMensagem.style.color = result.status === 'success' ? 'green' : 'red';
        consultaMensagem.textContent = result.message;

        if (result.status === 'success') {
            // Se o cancelamento for bem-sucedido, refaz a busca
            await buscarReservas();
            await carregarAgendaCompleta(); // Atualiza a agenda principal também
        }
    } catch (error) {
        consultaMensagem.style.color = 'red';
        consultaMensagem.textContent = `Erro de comunicação: ${error.message}`;
    }
}

/**
 * Criação: Envia a requisição de criação (doGet com action=create).
 */
async function criarHorarios(data, profissional, atividade, matriculaAdmin, bookingsData) {
    const formData = new URLSearchParams();
    formData.append('action', 'create');
    formData.append('data', formatarData(data)); // Envia DD/MM/AAAA
    formData.append('profissional', profissional);
    formData.append('atividade', atividade);
    formData.append('matriculaAdmin', matriculaAdmin);
    formData.append('bookingsData', JSON.stringify(bookingsData));
    
    const requestUrl = `${apiUrl}?${formData.toString()}`;
    
    try {
        const response = await fetch(requestUrl);
        const result = await response.json();
        
        adminAdicionarMensagem.style.color = result.status === 'success' ? 'green' : 'red';
        adminAdicionarMensagem.textContent = result.message;

        if (result.status === 'success') {
            await carregarAgendaCompleta(); // Recarrega a agenda
            // Limpa o formulário (menos a data e matrícula admin)
            document.getElementById('select-admin-profissional').value = '';
            document.getElementById('select-admin-atividade').innerHTML = '<option value="">Selecione uma Atividade</option>';
            document.getElementById('admin-lista-horarios').innerHTML = '';

            setTimeout(() => {
                 adminAdicionarMensagem.textContent = '';
            }, 3000);
        }
    } catch (error) {
        adminAdicionarMensagem.style.color = 'red';
        adminAdicionarMensagem.textContent = `Erro de comunicação: ${error.message}`;
    }
}

/**
 * Manutenção Admin: Envia requisição de update (doGet com action=adminUpdate)
 */
async function adminUpdateVagas(id, vagas) {
    const params = new URLSearchParams({ action: 'adminUpdate', id, vagas });
    const requestUrl = `${apiUrl}?${params.toString()}`;
    
    try {
        const response = await fetch(requestUrl);
        const result = await response.json();
        
        if (result.status === 'success') {
            alert(result.message);
            await carregarAgendaCompleta();
        } else {
            alert(`Erro na manutenção: ${result.message}`);
        }
    } catch (error) {
        alert(`Erro de comunicação: ${error.message}`);
    }
}


// --- LÓGICA MODAIS E EVENTOS ---

// Modal de Agendamento
function abrirModalAgendamento(data, hora, atividade, profissional) {
    modalDetalhes.innerHTML = `
        <li>**Atividade:** ${atividade}</li>
        <li>**Profissional:** ${profissional}</li>
        <li>**Data:** ${formatarData(data)}</li>
        <li>**Hora:** ${hora}</li>
    `;
    modalAgendamento.setAttribute('data-data', data);
    modalAgendamento.setAttribute('data-hora', hora);
    modalAgendamento.setAttribute('data-atividade', atividade);
    modalAgendamento.setAttribute('data-profissional', profissional);
    inputMatricula.value = '';
    modalMensagem.textContent = '';
    modalAgendamento.classList.remove('hidden');
}
function fecharModalAgendamento() {
    modalAgendamento.classList.add('hidden');
}
btnCancelarAgendamento.addEventListener('click', fecharModalAgendamento);
btnConfirmar.addEventListener('click', function() {
    const matricula = inputMatricula.value.trim();
    const data = modalAgendamento.getAttribute('data-data');
    const hora = modalAgendamento.getAttribute('data-hora');
    const atividade = modalAgendamento.getAttribute('data-atividade');
    const profissional = modalAgendamento.getAttribute('data-profissional');
    
    if (matricula.length < 3 || isNaN(matricula)) {
        modalMensagem.textContent = 'Por favor, insira uma matrícula válida.';
        modalMensagem.style.color = 'red';
        return;
    }
    modalMensagem.textContent = 'Confirmando agendamento...';
    modalMensagem.style.color = 'var(--azul-moinhos)';
    
    realizarAgendamento(data, hora, atividade, profissional, matricula);
});

// Modal de Consulta
btnConsultarReservas.addEventListener('click', abrirModalConsulta);
function abrirModalConsulta() {
    consultaViewInicial.classList.remove('hidden');
    consultaViewResultados.classList.add('hidden');
    inputConsultaMatricula.value = '';
    consultaMensagem.textContent = '';
    modalConsulta.classList.remove('hidden');
}
btnFecharConsulta.addEventListener('click', fecharModalConsulta);
btnVoltarConsulta.addEventListener('click', abrirModalConsulta);
function fecharModalConsulta() {
    modalConsulta.classList.add('hidden');
}
btnBuscarReservas.addEventListener('click', buscarReservas);

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
            renderizarListaReservas(result.data, matricula);
            consultaViewInicial.classList.add('hidden');
            consultaViewResultados.classList.remove('hidden');
            consultaMensagem.textContent = '';
        } else {
            throw new Error(result.message || "Erro ao buscar reservas.");
        }
    } catch (error) {
        consultaMensagem.style.color = 'red';
        consultaMensagem.textContent = `Erro: ${error.message}`;
    }
}

function renderizarListaReservas(reservas, matricula) {
    if (reservas.length === 0) {
        listaAgendamentos.innerHTML = '<p>Você não tem reservas futuras.</p>';
        return;
    }
    
    let html = '<ul>';
    reservas.forEach(reserva => {
        html += `
            <li data-id="${reserva.ID}" data-matricula="${matricula}">
                **${reserva.Atividade}** com ${reserva.Profissional} | Dia: ${reserva.Data} às ${reserva.Horário}
                <button class="btn-cancelar-reserva btn-modal btn-vermelho" data-id="${reserva.ID}" data-matricula="${matricula}">
                    Cancelar
                </button>
            </li>
        `;
    });
    html += '</ul>';
    listaAgendamentos.innerHTML = html;

    // Adiciona listener para os botões de cancelar
    document.querySelectorAll('.btn-cancelar-reserva').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const mat = this.getAttribute('data-matricula');
            cancelarReserva(id, mat);
        });
    });
}

// Modal de Manutenção Admin (Abre quando clica em slot lotado/indisponível)
function abrirModalManutencaoAdmin(id, data, hora, atividade, profissional, vagasMax, reservasString) {
    const reservas = reservasString ? reservasString.split(',').map(m => m.trim()).filter(Boolean) : [];

    let htmlReservas = '<h4>Reservas Atuais:</h4>';
    if (reservas.length === 0) {
        htmlReservas += '<p>Não há matrículas reservadas neste horário.</p>';
    } else {
        htmlReservas += '<ul>';
        reservas.forEach(mat => {
            htmlReservas += `
                <li>
                    Matrícula: **${mat}**
                    <button class="btn-admin-remover-reserva btn-modal btn-vermelho" 
                        data-id="${id}" 
                        data-matricula="${mat}" 
                        type="button">
                        Remover
                    </button>
                </li>
            `;
        });
        htmlReservas += '</ul>';
    }

    // Modal reutilizado para visualização de reservas/vagas
    modalAgendamento.classList.remove('hidden');
    modalAgendamento.querySelector('.modal-content h2').textContent = 'Manutenção de Horário (ADMIN)';
    modalDetalhes.innerHTML = `
        <li>**ID:** ${id}</li>
        <li>**Atividade:** ${atividade}</li>
        <li>**Profissional:** ${profissional}</li>
        <li>**Data:** ${formatarData(data)}</li>
        <li>**Hora:** ${hora}</li>
        <li>**Vagas Máximas:** <input type="number" id="input-admin-vagas-max" value="${vagasMax}" min="0" style="width: 60px;"></li>
    `;
    modalAgendamento.querySelector('.form-group').innerHTML = htmlReservas;
    modalMensagem.textContent = '';
    modalMensagem.style.color = 'red';

    // Esconde/Altera botões
    btnConfirmar.textContent = 'Salvar Vagas';
    btnConfirmar.onclick = () => {
        const novasVagas = parseInt(document.getElementById('input-admin-vagas-max').value);
        if (!isNaN(novasVagas) && novasVagas >= 0) {
            adminUpdateVagas(id, novasVagas);
            fecharModalAgendamento();
        } else {
            modalMensagem.textContent = 'Valor de Vagas Máximas inválido.';
        }
    };
    
    btnCancelarAgendamento.textContent = 'Fechar';

    // Adiciona listeners para os botões de remover reserva
    document.querySelectorAll('.btn-admin-remover-reserva').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const mat = this.getAttribute('data-matricula');
            if (confirm(`ADMIN: Deseja remover a reserva da matrícula ${mat} deste horário?`)) {
                 // Reutiliza a função de cancelamento, mas do ponto de vista admin
                adminUpdateMatricula(id, mat); 
            }
        });
    });
}


async function adminUpdateMatricula(id, matriculaToRemove) {
    const params = new URLSearchParams({ action: 'adminUpdate', id, matriculaToRemove });
    const requestUrl = `${apiUrl}?${params.toString()}`;
    
    try {
        const response = await fetch(requestUrl);
        const result = await response.json();
        
        if (result.status === 'success') {
            alert(result.message);
            // Reabre o modal de manutenção com dados atualizados
            await carregarAgendaCompleta(); 
            fecharModalAgendamento();
            // Tenta forçar a reabertura do modal de manutenção (requer dados de agendamento)
            const rowData = agendaCompleta.find(a => a.ID == id);
            if(rowData) {
                abrirModalManutencaoAdmin(id, seletorData.value, rowData.Horário, rowData.Atividade, rowData.Profissional, parseInt(rowData.Vagas), rowData.Reserva);
            } else {
                 renderizarAgenda();
            }
        } else {
            alert(`Erro na manutenção: ${result.message}`);
        }
    } catch (error) {
        alert(`Erro de comunicação: ${error.message}`);
    }
}


// --- Lógica Admin Login e Gerenciamento ---

btnAdminLogin.addEventListener('click', () => {
    adminLoginMensagem.textContent = '';
    inputAdminSenha.value = '';
    modalAdminLogin.classList.remove('hidden');
});

document.getElementById('btn-cancelar-admin-login').addEventListener('click', () => {
    modalAdminLogin.classList.add('hidden');
});

btnConfirmarAdminLogin.addEventListener('click', () => {
    const senha = inputAdminSenha.value;
    if (senha === DATA_STORE.adminPassword) {
        isAdminLoggedIn = true;
        btnAdminLogin.classList.add('hidden');
        btnGerenciarAgenda.classList.remove('hidden');
        modalAdminLogin.classList.add('hidden');
        adminLoginMensagem.textContent = '';
        renderizarAgenda(); // Atualiza a agenda para o modo Admin
    } else {
        adminLoginMensagem.textContent = 'Senha incorreta.';
        adminLoginMensagem.style.color = 'red';
    }
});

btnAdminLogout.addEventListener('click', () => {
    isAdminLoggedIn = false;
    btnAdminLogin.classList.remove('hidden');
    btnGerenciarAgenda.classList.add('hidden');
    modalAdminGerenciar.classList.add('hidden');
    renderizarAgenda(); // Volta para o modo normal
});

// Modal de Gerenciamento Admin
btnGerenciarAgenda.addEventListener('click', () => {
    renderizarFormularioAdmin();
    modalAdminGerenciar.classList.remove('hidden');
});

btnFecharAdminGerenciar.addEventListener('click', () => {
    modalAdminGerenciar.classList.add('hidden');
});


// Funções de Gerenciamento de Agenda (Criação)
function renderizarFormularioAdmin() {
    let html = `
        <div class="grid-admin-simples">
            <div>
                <label for="select-admin-profissional">Profissional:</label>
                <select id="select-admin-profissional">
                    <option value="">Selecione um Profissional</option>
                    ${Object.keys(DATA_STORE.atividades).map(p => `<option value="${p}">${p}</option>`).join('')}
