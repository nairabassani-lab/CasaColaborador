// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
// **VERIFIQUE ESTE LINK A CADA NOVA IMPLANTAÇÃO!**
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
// Botão Logout no canto superior (fora do modal)
const btnAdminLogoutTop = document.getElementById('btn-admin-logout-top'); 
const modalAdminLogin = document.getElementById('modal-admin-login');
const inputAdminSenha = document.getElementById('input-admin-senha');
const btnConfirmarAdminLogin = document.getElementById('btn-confirmar-admin-login');
const adminLoginMensagem = document.getElementById('admin-login-mensagem');

// Modal Admin Gerenciar
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda');
const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnFecharAdminGerenciar = document.getElementById('btn-fechar-admin-gerenciar');
const btnAdminLogout = document.getElementById('btn-admin-logout'); // Logout interno do modal
const inputAdminData = document.getElementById('input-admin-data');
const inputAdminMatricula = document.getElementById('input-admin-matricula');
const adminFormDinamico = document.getElementById('admin-form-dinamico');
const btnAdicionarHorario = document.getElementById('btn-adicionar-horario');
const adminAdicionarMensagem = document.getElementById('admin-adicionar-mensagem');


// --- CONFIGURAÇÃO GLOBAL ---
const DATA_STORE = {
    // SENHA SIMPLES - APENAS PARA FINS DE DESENVOLVIMENTO NO CLIENTE
    adminPassword: 'admin', 
    // Dados mestres das atividades para o formulário de criação
    // Chave: Atividade | Valor: { profissional: { duracao, vagas } }
    atividades: {
        'Quick Massage': {
            'Ana': { duracao: 30, vagas: 1 },
            'Geral': { duracao: 30, vagas: 1 } // Exemplo de profissional
        },
        'Reiki': {
            'Ana': { duracao: 60, vagas: 1 }
        },
        'Massagem Relaxante': {
            'Carlos': { duracao: 60, vagas: 1 }
        },
        'Ginástica Laboral': {
            'Geral': { duracao: 60, vagas: 20 } 
        },
        'Bate-Papo com Psicólogo': {
            'Geral': { duracao: 60, vagas: 5 }
        }
    }
};

// Variáveis de estado
let isAdminLoggedIn = false; 
let agendaCompleta = []; 
let agendaFiltrada = {}; 


// --- UTILIDADES ---

/**
 * Formata a data para o formato DD/MM/AAAA para exibição.
 */
function formatarData(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Formata a data para exibir o dia da semana.
 */
function getDiaDaSemana(dateString) {
    const data = new Date(dateString + 'T00:00:00'); 
    return data.toLocaleDateString('pt-BR', { weekday: 'long' });
}

/**
 * Carrega a agenda completa do Apps Script (doGet sem parâmetros de ação).
 */
async function carregarAgendaCompleta() {
    // Mantido o conteúdo de carregamento...
    container.innerHTML = '<p class="loading">Carregando agenda...</p>';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.status} (Verifique a URL e CORS).`);
        }
        const data = await response.json();
        
        if (data.status === "error") {
             throw new Error(`Erro da API: ${data.message} (Verifique o log de execução do Apps Script).`);
        }
        
        agendaCompleta = data; 
        
        const dataParaRenderizar = seletorData.value;
        if (dataParaRenderizar) {
            renderizarAgenda();
        } else {
            container.innerHTML = '<p class="loading">Selecione uma data para ver os horários disponíveis.</p>';
        }

    } catch (error) {
        console.error("Erro ao carregar a agenda:", error);
        container.innerHTML = `<p class="loading" style="color: red;">
            **ERRO CRÍTICO**: Falha ao carregar a agenda. 
            Verifique o **URL** da sua API no código JS e a **Implantação** do Apps Script (acesso: Qualquer Pessoa).
            Detalhes: ${error.message}
        </p>`;
    }
}

/**
 * NOVO: Filtra e agrupa a agenda por Atividade.
 */
function construirAgenda(dataSelecionada) {
    const agenda = {};

    const agendamentosDoDia = agendaCompleta.filter(item => {
        const dataItem = item.Data; // Item.Data está em DD/MM/AAAA
        
        const [day, month, year] = dataItem.split('/');
        const dataObjeto = new Date(year, month - 1, day);
        dataObjeto.setHours(0, 0, 0, 0);

        const [y, m, d] = dataSelecionada.split('-');
        const dataSelecionadaObjeto = new Date(y, m - 1, d);
        dataSelecionadaObjeto.setHours(0, 0, 0, 0);

        return dataObjeto.getTime() === dataSelecionadaObjeto.getTime();
    });

    agendamentosDoDia.forEach(item => {
        const atividade = item.Atividade;
        
        if (!agenda[atividade]) {
            agenda[atividade] = {
                atividade: atividade,
                horarios: {} // { 'HH:MM': { 'Profissional1': {dados}, 'Profissional2': {dados} } }
            };
        }
        
        const hora = item.Horário;
        const profissional = item.Profissional;

        if (!agenda[atividade].horarios[hora]) {
            agenda[atividade].horarios[hora] = {};
        }

        const reservas = (item.Reserva || '').split(',').map(m => m.trim()).filter(Boolean);
        const vagas = parseInt(item.Vagas);

        agenda[atividade].horarios[hora][profissional] = {
            id: item.ID,
            profissional: profissional,
            vagasMaximas: vagas,
            reservas: reservas,
            vagas: vagas - reservas.length,
            status: (vagas > 0 && reservas.length < vagas) ? 'disponivel' : (vagas > 0 ? 'lotado' : 'indisponivel'),
            adminMatricula: item['Matricula Admin'] || 'N/A', 
            timestamp: item['Timestamp'] || 'N/A'
        };
    });

    return agenda;
}


/**
 * NOVO: Renderiza a agenda na tela no formato de grade (Hora x Profissional).
 */
function renderizarAgenda() {
    const dataSelecionada = seletorData.value;
    if (!dataSelecionada) {
        return;
    }

    const diaSemana = getDiaDaSemana(dataSelecionada);
    diaSemanaSpan.textContent = `(${diaSemana})`;

    agendaFiltrada = construirAgenda(dataSelecionada);
    let html = '';
    
    // 1. Obter todas as atividades válidas (chaves do objeto agendaFiltrada)
    const atividadesKeys = Object.keys(agendaFiltrada);

    if (atividadesKeys.length === 0) {
        html = `<p class="loading">Não há horários disponíveis para a data ${formatarData(dataSelecionada)}.</p>`;
    } else {
        html += `<div class="aviso-admin ${isAdminLoggedIn ? '' : 'hidden'}">⚠️ MODO ADMIN: Clique em um horário com vaga para torná-lo indisponível (Vagas=0) ou clique em um horário lotado para remover matrículas.</div>`;
        
        for (const [i, atividade] of atividadesKeys.entries()) {
            const item = agendaFiltrada[atividade];
            const idAcordeao = `acordeao-${i}`;

            // NOVO TÍTULO: Apenas a atividade (ex: Quick Massage)
            html += `<h2 class="titulo-atividade" data-target="#${idAcordeao}">${atividade}</h2>`;
            html += `<div class="tabela-container" id="${idAcordeao}">`;
            
            const horariosData = item.horarios;
            const horariosUnicos = Object.keys(horariosData).sort();

            // 2. Obter todos os profissionais que trabalham nesta atividade neste dia
            const profissionaisUnicos = Array.from(new Set(
                Object.values(horariosData).flatMap(horaSlots => Object.keys(horaSlots))
            )).sort();
            
            if (profissionaisUnicos.length === 0 || horariosUnicos.length === 0) {
                 html += `<p style="padding: 15px; text-align: center;">Nenhum horário definido para esta atividade no dia.</p>`;
            } else {
                html += `<table class="tabela-agenda grade-agenda">`; // Classe grade-agenda para CSS
                
                // Cabeçalho da Tabela: Horário + Nomes dos Profissionais
                html += `<thead><tr><th class="horario-col">Horário</th>`;
                profissionaisUnicos.forEach(profissional => {
                    html += `<th class="cabecalho-profissional">${profissional}</th>`;
                });
                html += `</tr></thead>`;
                
                // Corpo da Tabela
                html += `<tbody>`;
                horariosUnicos.forEach(hora => {
                    html += `<tr>`;
                    html += `<td class="horario-col">${hora}</td>`;

                    profissionaisUnicos.forEach(profissional => {
                        const slotInfo = horariosData[hora][profissional];
                        
                        let statusClass = 'status-indisponivel';
                        let vagasTexto = 'Indisponível';
                        let reservasInfo = '';
                        let dataId = '';
                        let dataStatus = 'indisponivel';
                        let dataVagasMax = 0;
                        let dataReservas = '';

                        if (slotInfo) {
                            dataId = slotInfo.id;
                            dataStatus = slotInfo.status;
                            dataVagasMax = slotInfo.vagasMaximas;
                            dataReservas = slotInfo.reservas.join(',');

                            statusClass = `status-${slotInfo.status}`;
                            vagasTexto = slotInfo.vagasMaximas === 0 ? 'Indisponível (0 vagas)' : 
                                         slotInfo.vagas > 0 ? `${slotInfo.vagas} vagas` : 
                                         'Lotado';
                            
                            if (isAdminLoggedIn) {
                                if (slotInfo.vagasMaximas > 0) {
                                     statusClass += ' status-admin-maintenance';
                                }
                                
                                if (slotInfo.reservas.length > 0) {
                                    reservasInfo = `Reservas: ${slotInfo.reservas.join(', ')}`;
                                }
                                if (slotInfo.vagasMaximas === 0) {
                                    // Manutenção Admin em slot com Vagas=0
                                    statusClass = 'status-admin-maintenance status-admin-excluir';
                                    vagasTexto = `Vagas: ${slotInfo.vagasMaximas}`;
                                }
                            } else if (slotInfo.vagasMaximas === 0) {
                                 statusClass = 'status-indisponivel';
                            }
                        }

                        // Célula do Horário
                        html += `<td class="${statusClass} status-cell"
                                    data-id="${dataId}" 
                                    data-atividade="${atividade}" 
                                    data-profissional="${profissional}" 
                                    data-hora="${hora}" 
                                    data-data="${dataSelecionada}" 
                                    data-status="${dataStatus}"
                                    data-reservas="${dataReservas}"
                                    data-vagasmax="${dataVagasMax}">`; 
                        html += `<span>${vagasTexto}</span>`;
                        if (isAdminLoggedIn && reservasInfo) {
                            html += `<span class="matricula-admin">${reservasInfo}</span>`;
                        }
                        html += `</td>`;
                    });

                    html += `</tr>`;
                });

                html += `</tbody>`;
                html += `</table>`;
            }

            html += `</div>`;
        }
    }

    container.innerHTML = html;
    adicionarListenersAcordeao();
    adicionarListenersCelulas();
}


// --- LÓGICA DE ADMIN (CRIAÇÃO DE AGENDA) ---

// Função de Gerenciamento de Agenda (Criação) - AJUSTADA para novo DATA_STORE
function renderizarFormularioAdmin() {
    // Pegar todas as atividades únicas do DATA_STORE
    const atividadesUnicas = Object.keys(DATA_STORE.atividades);

    let html = `
        <div class="grid-admin-simples">
            <div>
                <label for="select-admin-atividade">Atividade:</label>
                <select id="select-admin-atividade">
                    <option value="">Selecione uma Atividade</option>
                    ${atividadesUnicas.map(a => `<option value="${a}">${a}</option>`).join('')}
                </select>
            </div>
            <div>
                 <label for="select-admin-profissional">Profissional:</label>
                <select id="select-admin-profissional">
                    <option value="">Selecione um Profissional</option>
                </select>
            </div>
        </div>
        <div id="admin-lista-horarios" style="margin-top: 20px;">
            <p>Selecione uma Atividade e Profissional.</p>
        </div>
    `;
    adminFormDinamico.innerHTML = html;
    
    const selectAtividade = document.getElementById('select-admin-atividade');
    const selectProfissional = document.getElementById('select-admin-profissional');
    
    selectAtividade.addEventListener('change', () => {
        const atividade = selectAtividade.value;
        selectProfissional.innerHTML = '<option value="">Selecione um Profissional</option>';
        document.getElementById('admin-lista-horarios').innerHTML = '';

        if (atividade && DATA_STORE.atividades[atividade]) {
            const profissionais = DATA_STORE.atividades[atividade];
            for (const profissional in profissionais) {
                const vagas = profissionais[profissional].vagas;
                selectProfissional.innerHTML += `<option value="${profissional}" data-vagas="${vagas}">${profissional} (Vagas: ${vagas})</option>`;
            }
        }
    });

    selectProfissional.addEventListener('change', () => {
        const profissional = selectProfissional.value;
        const atividade = selectAtividade.value;
        const listaHorariosDiv = document.getElementById('admin-lista-horarios');
        const vagasElement = selectProfissional.options[selectProfissional.selectedIndex];
        const vagasMax = vagasElement ? vagasElement.getAttribute('data-vagas') : 0;


        if (profissional && atividade) {
             listaHorariosDiv.innerHTML = `
                <p>Adicione horários (formato HH:MM) para **${atividade}** com **${profissional}** (Vagas: ${vagasMax}):</p>
                <div id="horarios-grid" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                    <input type="text" class="input-horario-admin" placeholder="09:00">
                    <input type="text" class="input-horario-admin" placeholder="10:00">
                    <input type="text" class="input-horario-admin" placeholder="11:00">
                    <button id="btn-add-horario-input" type="button">+</button>
                </div>
             `;
             document.getElementById('btn-add-horario-input').addEventListener('click', () => {
                 const newSlot = document.createElement('input');
                 newSlot.type = 'text';
                 newSlot.className = 'input-horario-admin';
                 newSlot.placeholder = 'HH:MM';
                 document.getElementById('horarios-grid').insertBefore(newSlot, document.getElementById('btn-add-horario-input'));
             });
        } else {
             listaHorariosDiv.innerHTML = '<p>Selecione uma Atividade e Profissional.</p>';
        }
    });
}

btnAdicionarHorario.addEventListener('click', () => {
    const data = inputAdminData.value;
    const selectAtividade = document.getElementById('select-admin-atividade');
    const selectProfissional = document.getElementById('select-admin-profissional');

    const atividade = selectAtividade.value;
    const profissional = selectProfissional.value;
    const matriculaAdmin = inputAdminMatricula.value.trim();
    
    // Obter Vagas Máximas dinamicamente do atributo data-vagas
    const vagasElement = selectProfissional.options[selectProfissional.selectedIndex];
    const vagasMax = vagasElement ? vagasElement.getAttribute('data-vagas') : null;


    if (!data || !profissional || !atividade || vagasMax === null) {
        adminAdicionarMensagem.textContent = 'Por favor, preencha Data, Atividade e Profissional (e certifique-se que o profissional tenha vagas definidas).';
        adminAdicionarMensagem.style.color = 'red';
        return;
    }

    const horariosInput = document.querySelectorAll('.input-horario-admin');
    const bookingsData = [];
    const regexHora = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM

    horariosInput.forEach(input => {
        const hora = input.value.trim();
        if (regexHora.test(hora)) {
            // Envia a hora e a vaga máxima associada ao profissional
            bookingsData.push({ horario: hora, vagas: parseInt(vagasMax) }); 
        }
    });

    if (bookingsData.length === 0) {
        adminAdicionarMensagem.textContent = 'Por favor, insira pelo menos um horário válido no formato HH:MM.';
        adminAdicionarMensagem.style.color = 'red';
        return;
    }
    
    adminAdicionarMensagem.textContent = 'Adicionando horários...';
    adminAdicionarMensagem.style.color = 'var(--azul-moinhos)';
    
    criarHorarios(data, profissional, atividade, matriculaAdmin, bookingsData);
});

// Mantive o restante do script.js, incluindo listeners, Modais de Login/Logout, etc.
// Certifique-se de substituir a função 'renderizarAgenda', 'construirAgenda', 'renderizarFormularioAdmin' e a lógica de 'btnAdicionarHorario' com o código acima.
// A estrutura do DATA_STORE também foi alterada.
// ... (restante do script.js)

// --- Estrutura atualizada do DATA_STORE ---
/*
const DATA_STORE = {
    // ...
    atividades: {
        'Quick Massage': {
            'Ana': { duracao: 30, vagas: 1 },
            'Geral': { duracao: 30, vagas: 1 } 
        },
        'Reiki': {
            'Ana': { duracao: 60, vagas: 1 }
        },
        // ...
    }
};
*/
