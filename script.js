// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbxY1VsWmQB_4FDolmaMNnmSbyyXMDKjxeQ9RBP_qX8kcmoATHl1h3g-w8NsUfuXlf8B/exec';

// --- REFERÊNCIAS DE DOM (ESCOPO GLOBAL) ---
// Elementos Principais
const body = document.body;
const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modais
const modalAgendamento = document.getElementById('modal-agendamento');
const modalConsulta = document.getElementById('modal-consulta');
const modalAdminLogin = document.getElementById('modal-admin-login');
const modalMensagemOverlay = document.getElementById('modal-mensagem-overlay'); // Usado para mensagens gerais (substitui modalMensagem)

// Botões Ação Principal
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');
const btnAdminLogin = document.getElementById('btn-admin-login');
// const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda'); // Comentado, pois a função não está no código

// Modal Agendamento (Usuário)
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnConfirmar = document.getElementById('btn-confirmar');
const btnCancelarAgendamento = document.getElementById('btn-cancelar-agendamento'); // Botão de fechar

// Modal Admin Login
const inputAdminUsuario = document.getElementById('input-admin-usuario');
const inputAdminSenha = document.getElementById('input-admin-senha');
const btnAdminLogar = document.getElementById('btn-admin-logar');
const btnAdminCancelar = document.getElementById('btn-admin-cancelar'); // Botão de fechar

// Modal Consulta (Minhas Reservas)
const inputConsultaMatricula = document.getElementById('input-consulta-matricula');
const consultaViewInicial = document.getElementById('consulta-view-inicial');
const consultaViewResultados = document.getElementById('consulta-view-resultados');
const consultaMensagem = document.getElementById('consulta-mensagem');
const btnBuscarReservas = document.getElementById('btn-buscar-reservas');
const btnVoltarConsulta = document.getElementById('btn-voltar-consulta');
const listaAgendamentos = document.getElementById('lista-agendamentos');
const btnFecharConsulta = document.getElementById('btn-fechar-consulta'); // Botão de fechar

// Variáveis de Estado
let isAdmin = false;
const ADMIN_USER = 'admin'; // Substitua por sua lógica real
const ADMIN_PASS = '12345'; // Substitua por sua lógica real


// --- FUNÇÕES DE UTILIDADE (MODAIS E FORMATAÇÃO) ---

/**
 * Abre um modal específico e bloqueia o scroll do body.
 * Adiciona transição de opacidade.
 * @param {HTMLElement} modalElement O elemento modal a ser aberto.
 */
function abrirModal(modalElement) {
    if (modalElement) {
        body.style.overflow = 'hidden';
        modalElement.classList.remove('hidden');
        // Pequeno timeout para garantir a aplicação da classe antes da transição
        setTimeout(() => modalElement.style.opacity = 1, 10);
    }
}

/**
 * Fecha um modal específico e restaura o scroll do body.
 * Adiciona transição de opacidade.
 * @param {HTMLElement} modalElement O elemento modal a ser fechado.
 */
function fecharModal(modalElement) {
    if (modalElement) {
        modalElement.style.opacity = 0;
        setTimeout(() => {
            modalElement.classList.add('hidden');
            // Só restaura o scroll se nenhum outro modal estiver aberto
            const activeModals = [modalAgendamento, modalConsulta, modalAdminLogin, modalMensagemOverlay].some(m => m && !m.classList.contains('hidden'));
            if (!activeModals) {
                body.style.overflow = 'auto';
            }
        }, 300);
    }
}

/**
 * Exibe o modal de mensagem (overlay) com um título e texto personalizados.
 * @param {string} titulo O título da mensagem.
 * @param {string} texto O corpo da mensagem.
 * @param {boolean} isSuccess Indica se é uma mensagem de sucesso.
 */
function mostrarMensagem(titulo, texto, isSuccess = false) {
    if (modalMensagemOverlay) {
        modalMensagemOverlay.querySelector('#modal-mensagem-titulo').textContent = titulo;
        modalMensagemOverlay.querySelector('#modal-mensagem-texto').textContent = texto;
        
        const content = modalMensagemOverlay.querySelector('.modal-content');
        if (content) {
            content.classList.toggle('success-message', isSuccess);
            content.classList.toggle('error-message', !isSuccess);
        }
        abrirModal(modalMensagemOverlay);
    } else {
        alert(`${titulo}\n\n${texto}`); // Fallback
    }
}

function formatarDataParaDisplay(dataISO) {
    if (!dataISO) return '';
    const [year, month, day] = dataISO.split('-');
    return `${day}/${month}/${year}`;
}

function getDayOfWeek(dataISO) {
    const data = new Date(dataISO + 'T00:00:00'); 
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[data.getDay()];
}

function hojeISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function configurarDataInicial() {
    if (!seletorData) return;
    
    // Define a data mínima como o próximo dia
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 1); 
    const amanha = hoje.toISOString().split('T')[0];
    seletorData.setAttribute('min', amanha);
    
    // Define o valor inicial para amanhã (ou a data já selecionada, se houver)
    if (!seletorData.value || seletorData.value < amanha) {
        seletorData.value = amanha;
    }
    
    atualizarDiaSemanaLabel(seletorData.value);
}


function atualizarDiaSemanaLabel(dateISO) {
    if (!diaSemanaSpan || !dateISO) return;
    diaSemanaSpan.textContent = `(${getDayOfWeek(dateISO)})`;
}

/**
 * Abre o modal de confirmação preenchendo os detalhes do slot selecionado.
 */
function abrirModalReserva(dataset) {
    if (!dataset || !modalDetalhes || !modalAgendamento) return;
    
    // Atualiza os detalhes no modal
    modalDetalhes.innerHTML = `
        <li><strong>Profissional:</strong> ${dataset.profissional}</li>
        <li><strong>Atividade:</strong> ${dataset.atividade}</li>
        <li><strong>Data:</strong> ${formatarDataParaDisplay(dataset.data)}</li>
        <li><strong>Horário:</strong> ${dataset.horario}</li>
        <li><strong>Vagas disponíveis:</strong> ${dataset.vagasDisp}</li>
    `;
    
    // Guarda o rowId para a confirmação
    modalAgendamento.dataset.slotData = JSON.stringify({ rowId: dataset.rowId });
    
    // Limpa input e desabilita botão
    inputMatricula.value = '';
    if (btnConfirmar) btnConfirmar.disabled = true;
    
    abrirModal(modalAgendamento);
}

// --- LÓGICA DE ADMIN ---

function realizarLoginAdmin() {
    const usuario = inputAdminUsuario?.value.trim();
    const senha = inputAdminSenha?.value.trim();

    if (usuario === ADMIN_USER && senha === ADMIN_PASS) {
        isAdmin = true;
        fecharModal(modalAdminLogin);
        mostrarMensagem('Login Bem-Sucedido', 'Bem-vindo, Administrador! A visualização foi alterada para o modo de gestão.', true);
        carregarAgenda(); // Recarrega a agenda no modo Admin
        // toggleAdminView(true); // Se houver um painel de admin, chame a função aqui
    } else {
        mostrarMensagem('Erro de Login', 'Usuário ou senha incorretos.');
        if (inputAdminSenha) inputAdminSenha.value = '';
    }
}


// --- FUNÇÕES DE INTERAÇÃO COM API (APPS SCRIPT) ---

/**
 * Renderiza a agenda na interface principal, adaptando a visualização para Admin.
 */
function renderAgenda(dados) {
    if (!container) return;

    if (!dados || dados.length === 0) {
        container.innerHTML = `<p class="aviso-agenda">${isAdmin ? 'Nenhum horário cadastrado.' : 'Nenhum horário disponível para agendamento.'}</p>`;
        return;
    }
    
    // Agrupa por Profissional e Atividade para melhor visualização
    const groupedData = dados.reduce((acc, item) => {
        const key = `${item.profissional}-${item.atividade}`;
        if (!acc[key]) {
            acc[key] = {
                profissional: item.profissional,
                atividade: item.atividade,
                slots: []
            };
        }
        acc[key].slots.push(item);
        return acc;
    }, {});

    let html = ''; // Remove a linha de cabeçalho fixa se a estrutura não for de tabela

    Object.values(groupedData).forEach(group => {
        const slotsHtml = group.slots.map(slot => {
            const vagasDisp = slot.vagas_total - slot.agendados;
            const isAvailable = vagasDisp > 0 && slot.status === 'Disponível';
            const statusClass = isAdmin 
                ? 'status-admin-gerenciar' 
                : (isAvailable ? 'status-disponivel' : 'status-lotado');
            
            const statusText = isAvailable ? `${vagasDisp} vaga(s)` : (slot.status === 'Disponível' ? 'Lotado' : slot.status);
            
            const dataAttributes = `
                data-row-id="${slot.id}" 
                data-profissional="${slot.profissional}" 
                data-atividade="${slot.atividade}" 
                data-data="${slot.data}"
                data-horario="${slot.horario}"
                data-vagas-disp="${vagasDisp}"
                data-vagas-total="${slot.vagas_total}"
            `;

            // O elemento clicável deve ser a linha completa para facilitar o clique
            // Para o usuário: clica na linha disponível para abrir o modal
            // Para o admin: a ação é no botão de excluir
            const clickAction = isAdmin ? '' : (isAvailable ? `onclick="handleSlotClick(this)"` : '');
            
            return `
                <div class="agenda-row ${statusClass}" ${dataAttributes} ${clickAction}>
                    <div class="slot-horario">${slot.horario}</div>
                    <div class="slot-status">
                        <span class="${isAvailable ? 'tag-verde' : 'tag-vermelha'}">${statusText}</span>
                    </div>
                    <div class="slot-actions">
                        ${isAdmin 
                            ? `<button class="btn-excluir-slot btn-vermelho" data-row-id="${slot.id}" type="button">Excluir</button>` 
                            : (isAvailable ? `<button class="btn-agendar-slot btn-azul" data-row-id="${slot.id}" type="button">Agendar</button>` : '')
                        }
                    </div>
                </div>
            `;
        }).join('');

        html += `
            <div class="agenda-group">
                <div class="group-header">
                    <span class="prof-name">${group.profissional}</span> - ${group.atividade}
                </div>
                ${slotsHtml}
            </div>
        `;
    });

    container.innerHTML = html;
}

// Função auxiliar para tratar o clique na linha da agenda (se não for admin)
function handleSlotClick(rowElement) {
    if (!isAdmin) {
        abrirModalReserva(rowElement.dataset);
    }
}


/**
 * Busca a agenda na Apps Script API.
 */
async function fetchAgenda(data) {
    if (!data) return;

    if (container) {
        container.innerHTML = '<p class="loading">Carregando agenda...</p>';
    }

    try {
        const response = await fetch(`${apiUrl}?action=getSchedule&date=${encodeURIComponent(data)}`);
        if (!response.ok) {
            throw new Error('Erro na requisição da agenda.');
        }

        const result = await response.json();

        if (result.status === 'success') {
            renderAgenda(result.data);
        } else {
            container.innerHTML = `<p class="aviso-agenda">Erro: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Erro na requisição da agenda:', error);
        container.innerHTML = '<p class="aviso-agenda">Falha na comunicação com o servidor.</p>';
    }
}

/**
 * Confirma a reserva na Apps Script API.
 */
async function handleConfirmarReserva() {
    const matricula = inputMatricula?.value.trim();
    const slotData = JSON.parse(modalAgendamento?.dataset.slotData || '{}');

    if (!matricula || !slotData.rowId) {
        mostrarMensagem('Erro', 'Dados de reserva incompletos. Tente novamente.');
        return;
    }
    
    // Validação básica da matrícula
    if (matricula.length < 5 || isNaN(matricula)) {
        mostrarMensagem('Matrícula Inválida', 'Por favor, digite uma matrícula válida (apenas números, mínimo de 5 dígitos).');
        return;
    }

    fecharModal(modalAgendamento);
    mostrarMensagem('Processando', 'Confirmando sua reserva...');
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'bookSlot',
                rowId: slotData.rowId,
                matricula: matricula
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();

        if (result.status === 'success') {
            mostrarMensagem('Agendamento Confirmado', result.message, true);
            carregarAgenda(); 
        } else {
            mostrarMensagem('Falha no Agendamento', result.message);
        }
    } catch (error) {
        console.error('Erro ao confirmar reserva:', error);
        mostrarMensagem('Erro de Conexão', 'Não foi possível se comunicar com o servidor.');
    }
}

/**
 * Exclui um horário na Apps Script API (Função Admin).
 */
async function handleAdminDelete(rowId) {
    if (!isAdmin || !rowId || !confirm('Tem certeza que deseja EXCLUIR este horário e todos os seus agendamentos? Esta ação é irreversível.')) {
        return;
    }

    mostrarMensagem('Processando', 'Excluindo horário da agenda...');

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'deleteSchedule',
                rowId: rowId
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();

        if (result.status === 'success') {
            mostrarMensagem('Exclusão Concluída', result.message, true);
            carregarAgenda(); 
        } else {
            mostrarMensagem('Falha na Exclusão', result.message);
        }
    } catch (error) {
        console.error('Erro ao excluir horário:', error);
        mostrarMensagem('Erro de Conexão', 'Não foi possível se comunicar com o servidor.');
    }
}


/**
 * Busca as reservas de um usuário pela matrícula na Apps Script API.
 */
async function handleBuscarReservas(matricula) {
    if (!consultaMensagem || !listaAgendamentos || !consultaViewInicial || !consultaViewResultados) return;

    if (matricula.trim() === '') {
        consultaMensagem.textContent = 'Insira sua matrícula.';
        consultaMensagem.style.color = 'red';
        return;
    }
    
    consultaMensagem.textContent = 'Buscando reservas...';
    consultaMensagem.style.color = 'orange';
    listaAgendamentos.innerHTML = '';
    
    try {
        const response = await fetch(`${apiUrl}?action=getReservations&matricula=${encodeURIComponent(matricula)}`);
        const result = await response.json();

        if (result.status === 'success' && result.data.length > 0) {
            renderReservations(result.data);
            consultaViewInicial.classList.add('hidden');
            consultaViewResultados.classList.remove('hidden');
            consultaMensagem.textContent = '';
        } else {
            consultaMensagem.textContent = result.message || 'Nenhuma reserva ativa encontrada.';
            consultaMensagem.style.color = 'red';
            consultaViewInicial.classList.remove('hidden');
            consultaViewResultados.classList.add('hidden');
        }

    } catch (error) {
        console.error('Erro ao buscar reservas:', error);
        consultaMensagem.textContent = 'Falha na comunicação com o servidor.';
        consultaMensagem.style.color = 'red';
    }
}

/**
 * Renderiza a lista de reservas encontradas no modal de consulta.
 */
function renderReservations(reservas) {
    if (!listaAgendamentos) return;
    let html = '';
    reservas.forEach(reserva => {
        html += `
            <li class="agendamento-item">
                <div class="item-info">
                    <strong>${reserva.atividade}</strong> com ${reserva.profissional}
                    <p>${formatarDataParaDisplay(reserva.data)} às ${reserva.horario}</p>
                    <span class="tag-tipo">${reserva.tipo === 'Aula' ? 'Aula/Reiki' : 'Quick Massage'}</span>
                </div>
                <button class="btn-cancelar-reserva btn-vermelho" 
                        data-row-id="${reserva.id}" 
                        data-slot-id="${reserva.slotId}" 
                        data-atividade="${reserva.atividade}">
                    Cancelar
                </button>
            </li>
        `;
    });
    listaAgendamentos.innerHTML = html;
}

/**
 * Cancela uma reserva específica na Apps Script API.
 */
async function handleCancelamentoReserva(rowId, slotId, atividade, matricula) {
    if (!confirm(`Tem certeza que deseja cancelar sua reserva para ${atividade}?`)) {
        return;
    }

    fecharModal(modalConsulta);
    mostrarMensagem('Processando', 'Cancelando sua reserva...');

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'cancelReservation',
                rowId: rowId, 
                slotId: slotId, 
                matricula: (matricula || '').trim()
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();

        if (result.status === 'success') {
            mostrarMensagem('Cancelamento Concluído', result.message, true);
            carregarAgenda();
        } else {
            mostrarMensagem('Falha no Cancelamento', result.message);
        }
    } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        mostrarMensagem('Erro de Conexão', 'Não foi possível cancelar a reserva.');
    }
}


// --- INICIALIZAÇÃO E LISTENERS GERAIS ---
function carregarAgenda() {
    if (seletorData) {
        fetchAgenda(seletorData.value);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    configurarDataInicial(); // Define data min/inicial
    carregarAgenda(); // Carrega agenda inicial
    
    // --- Listeners de Modais (Abrir/Fechar) ---
    if (btnConsultarReservas) btnConsultarReservas.addEventListener('click', () => {
        abrirModal(modalConsulta);
        // Reseta o modal de consulta ao abrir
        consultaViewInicial.classList.remove('hidden');
        consultaViewResultados.classList.add('hidden');
        consultaMensagem.textContent = '';
        if (inputConsultaMatricula) inputConsultaMatricula.value = '';
        if (listaAgendamentos) listaAgendamentos.innerHTML = '';
    });
    
    if (btnAdminLogin) btnAdminLogin.addEventListener('click', () => abrirModal(modalAdminLogin));

    // Listeners de Fechamento de Modais (Botões Cancelar/Fechar)
    if (btnCancelarAgendamento) btnCancelarAgendamento.addEventListener('click', () => fecharModal(modalAgendamento));
    if (btnFecharConsulta) btnFecharConsulta.addEventListener('click', () => fecharModal(modalConsulta));
    if (btnAdminCancelar) btnAdminCancelar.addEventListener('click', () => fecharModal(modalAdminLogin));
    if (modalMensagemOverlay) modalMensagemOverlay.querySelector('.btn-fechar').addEventListener('click', () => fecharModal(modalMensagemOverlay));

    // Lógica de Fechamento ao Clicar Fora (Overlay)
    [modalAgendamento, modalConsulta, modalAdminLogin, modalMensagemOverlay].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    fecharModal(modal);
                }
            });
        }
    });

    // --- Listeners de Data ---
    if (seletorData) {
        seletorData.addEventListener('change', () => {
            atualizarDiaSemanaLabel(seletorData.value);
            carregarAgenda();
        });
    }

    // --- Listeners de Login Admin ---
    if (btnAdminLogar) btnAdminLogar.addEventListener('click', realizarLoginAdmin);
    if (inputAdminSenha) {
        inputAdminSenha.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                realizarLoginAdmin();
            }
        });
    }

    // --- Listeners de Agendamento ---
    if (inputMatricula) {
        inputMatricula.addEventListener('input', (e) => {
            if (btnConfirmar) btnConfirmar.disabled = e.target.value.trim().length === 0;
        });
    }
    if (btnConfirmar) btnConfirmar.addEventListener('click', handleConfirmarReserva);

    // --- Listeners de Consulta (Usuário) ---
    if (btnBuscarReservas) btnBuscarReservas.addEventListener('click', () => {
        handleBuscarReservas(inputConsultaMatricula?.value.trim() || '');
    });
    if (btnVoltarConsulta) btnVoltarConsulta.addEventListener('click', () => {
        consultaViewResultados.classList.add('hidden');
        consultaViewInicial.classList.remove('hidden');
        listaAgendamentos.innerHTML = '';
        consultaMensagem.textContent = '';
    });
    
    // Permite buscar também com a tecla Enter no input da consulta
    if (inputConsultaMatricula) {
        inputConsultaMatricula.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleBuscarReservas(inputConsultaMatricula?.value.trim() || '');
            }
        });
    }


    // --- DELEGAÇÃO DE EVENTOS (Agenda e Cancelamento) ---
    if (container) {
        container.addEventListener('click', function(event) {
            const target = event.target;
            
            // Ação de AGENDAMENTO (Botão)
            const btnAgendar = target.closest('.btn-agendar-slot');
            if (btnAgendar && !isAdmin) {
                const row = btnAgendar.closest('.agenda-row');
                if (row) {
                    abrirModalReserva(row.dataset);
                }
                return;
            }
            
            // Ação de EXCLUSÃO (Botão Admin)
            const btnExcluir = target.closest('.btn-excluir-slot');
            if (btnExcluir && isAdmin) {
                const rowId = btnExcluir.dataset.rowId;
                handleAdminDelete(rowId);
                return;
            }
        });
    }
    
    if (listaAgendamentos) {
        listaAgendamentos.addEventListener('click', function(event) {
            const btnCancelar = event.target.closest('.btn-cancelar-reserva');
            if (btnCancelar) {
                const rowId = btnCancelar.dataset.rowId; 
                const slotId = btnCancelar.dataset.slotId; 
                const atividade = btnCancelar.dataset.atividade;
                const matricula = (inputConsultaMatricula?.value || '').trim();
                handleCancelamentoReserva(rowId, slotId, atividade, matricula);
            }
        });
    }
});
