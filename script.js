// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

// --- REFERÊNCIAS DE DOM (ESCOPO GLOBAL) ---
// Estas variáveis são acessíveis por todas as funções do arquivo.

const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modais de Agendamento (Usuário)
const modalAgendamento = document.getElementById('modal-agendamento');
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnCancelarAgendamento = document.getElementById('btn-cancelar-agendamento');
const btnConfirmar = document.getElementById('btn-confirmar');
// Referência ao novo modal de mensagem (overlay global)
const modalMensagemOverlay = document.getElementById('modal-mensagem-overlay'); 

// Botões Ação Principal
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda'); 

// --- REFERÊNCIAS DE MODAIS (ADMIN E CONSULTA) ---
// Admin Login
const modalAdminLogin = document.getElementById('modal-admin-login');
const inputAdminPassword = document.getElementById('input-admin-password');
const adminLoginMensagem = document.getElementById('admin-login-mensagem');
const btnConfirmarAdminLogin = document.getElementById('btn-confirmar-admin-login');
const btnCancelarAdminLogin = document.getElementById('btn-cancelar-admin-login');

// Admin Gerenciar (Painel de Administração)
const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnAdminAdicionar = document.getElementById('btn-admin-adicionar');
const btnAdminLogout = document.getElementById('btn-admin-logout');
const btnFecharAdminGerenciar = document.getElementById('btn-fechar-admin-gerenciar');

// Admin Adicionar Horário
const modalAdminAdicionar = document.getElementById('modal-admin-adicionar');
const formAdicionarHorario = document.getElementById('form-adicionar-horario');
const adminSelectProfissional = document.getElementById('admin-select-profissional');
const adminSelectAtividade = document.getElementById('admin-select-atividade');
const quickMassageContainer = document.getElementById('quick-massage-container');
const quickMassageHorariosGrid = document.getElementById('quick-massage-horarios');
const horarioUnicoContainer = document.getElementById('horario-unico-container');
const adminInputHorario = document.getElementById('admin-input-horario');
const adminInputVagas = document.getElementById('admin-input-vagas');
const btnConfirmarAdicionarFinal = document.getElementById('btn-confirmar-adicionar-final');
const btnCancelarAdicionarFinal = document.getElementById('btn-cancelar-adicionar-final');
const adminAddMensagem = document.getElementById('admin-add-mensagem');
const adminSelectData = document.getElementById('admin-select-data');

// Consulta (Minhas Reservas)
const modalConsulta = document.getElementById('modal-consulta'); 
const inputConsultaMatricula = document.getElementById('input-consulta-matricula');
const consultaViewInicial = document.getElementById('consulta-view-inicial');
const consultaViewResultados = document.getElementById('consulta-view-resultados');
const consultaMensagem = document.getElementById('consulta-mensagem');
const btnBuscarReservas = document.getElementById('btn-buscar-reservas');
const btnVoltarConsulta = document.getElementById('btn-voltar-consulta');
const listaAgendamentos = document.getElementById('lista-agendamentos');
const btnFecharConsulta = document.getElementById('btn-fechar-consulta');


// --- Variáveis de Estado e Configurações ---
let agendaData = {};
let celulaClicada = null;
let isAdmin = false;
const ADMIN_PASSWORD = 'admin'; // Senha simples para demonstração

// --- MAPA DE ATIVIDADES E REGRAS ---
const professionalRules = {
    'Ana': { activities: ['Fit Class (Ballet Fit)', 'Funcional Dance', 'Power Gap'], type: 'aula', defaultVagas: 15 },
    'Carlos': { activities: ['Funcional', 'Mat Pilates', 'Ritmos / Zumba', 'Jump'], type: 'aula', defaultVagas: 15 },
    'Luis': { activities: ['Quick Massage'], type: 'quick_massage', defaultVagas: 1 },
    'Maria Eduarda': { activities: ['Quick Massage'], type: 'quick_massage', defaultVagas: 1 },
    'Rafael': { activities: ['Quick Massage', 'Reiki'], type: 'mixed', defaultVagas: 1 }
};

const quickMassageHours = [
    '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', 
    '10:30', '10:45', '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', 
    '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', 
    '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', 
    '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45'
];


// --- FUNÇÕES DE UTILIDADE (MODAIS) ---

function abrirModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('hidden');
        setTimeout(() => modalElement.style.opacity = 1, 10); 
    }
}

function fecharModal(modalElement) {
    if (modalElement) {
        modalElement.style.opacity = 0;
        setTimeout(() => modalElement.classList.add('hidden'), 300);
    }
}

function mostrarMensagem(titulo, texto, isSuccess = false) {
    if (modalMensagemOverlay) {
        modalMensagemOverlay.querySelector('#modal-mensagem-titulo').textContent = titulo;
        modalMensagemOverlay.querySelector('#modal-mensagem-texto').textContent = texto;
        abrirModal(modalMensagemOverlay);

        // Aplica classe de cor (necessita de estilos no CSS para .success-message/modal)
        const content = modalMensagemOverlay.querySelector('.modal-content');
        if (content) {
            if (isSuccess) {
                content.classList.add('success-message');
                content.classList.remove('error-message');
            } else {
                content.classList.add('error-message');
                content.classList.remove('success-message');
            }
        }
    } else {
        alert(`${titulo}\n\n${texto}`); // Fallback
    }
}


// --- FUNÇÕES DE LÓGICA DE NEGÓCIO E UI ---

function formatarDataParaDisplay(dataISO) {
    if (!dataISO) return '';
    const [year, month, day] = dataISO.split('-');
    return `${day}/${month}/${year}`;
}

function getDayOfWeek(dataISO) {
    // Adiciona 'T00:00:00' para evitar problemas de fuso horário
    const data = new Date(dataISO + 'T00:00:00'); 
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[data.getDay()];
}

/**
 * Corrige o fluxo de Login/Logout e a visibilidade dos elementos Admin.
 */
function toggleAdminView(loggedIn) {
    isAdmin = loggedIn;

    if (loggedIn) {
        btnAdminLogin.textContent = 'Logout Admin';
        btnAdminLogin.classList.remove('btn-cinza');
        btnAdminLogin.classList.add('btn-vermelho'); 
        // CORREÇÃO: MOSTRA o botão de Gerenciar Agenda
        btnGerenciarAgenda.classList.remove('hidden'); 
        
        // Adiciona aviso visual de Admin
        if (!document.querySelector('.aviso-admin')) {
             container.insertAdjacentHTML('beforebegin', '<p class="aviso-admin">MODO ADMIN ATIVADO. Clique nos slots para GEREENCIAR (Excluir/Ver).</p>');
        }
    } else {
        btnAdminLogin.textContent = 'Login Admin';
        btnAdminLogin.classList.remove('btn-vermelho');
        btnAdminLogin.classList.add('btn-cinza');
        // CORREÇÃO: ESCONDE o botão de Gerenciar Agenda
        btnGerenciarAgenda.classList.add('hidden'); 
        
        // Remove aviso visual de Admin
        const aviso = document.querySelector('.aviso-admin');
        if (aviso) aviso.remove();
    }
    carregarAgenda(); // Recarrega a agenda para aplicar o modo Admin (se aplicável)
}


function abrirModalReserva(data) {
    if (modalDetalhes) {
        modalDetalhes.innerHTML = `
            <li><strong>Atividade:</strong> ${data.atividade}</li>
            <li><strong>Profissional:</strong> ${data.profissional}</li>
            <li><strong>Data:</strong> ${formatarDataParaDisplay(data.data)}</li>
            <li><strong>Horário:</strong> ${data.horario}</li>
        `;
    }
    inputMatricula.value = '';
    btnConfirmar.disabled = true;
    abrirModal(modalAgendamento);
    // Salva os dados do slot no modal para uso posterior
    modalAgendamento.dataset.slotData = JSON.stringify(data); 
}

// --- Funções de interação com API (Google Apps Script) - APENAS PLACEHOLDERS ---

function carregarAgenda() {
    if (seletorData && container) {
        // fetchAgenda(seletorData.value); // Esta função precisa ser implementada
        container.innerHTML = '<p class="loading">Carregando agenda...</p>';
    }
}

// function fetchAgenda(data) { ... implementação da chamada fetch para apiUrl ... }
// function renderAgenda(dados) { ... implementação da renderização ... }
// function handleConfirmarReserva() { ... implementação da reserva no Apps Script ... }
// function handleAdminDelete(idLinha) { ... implementação da exclusão no Apps Script ... }
// function handleAdminAddHorario(formData) { ... implementação da adição no Apps Script ... }
// function handleBuscarReservas(matricula) { ... implementação da busca no Apps Script ... }

// --- FUNÇÕES ESPECÍFICAS DO ADMIN ADICIONAR ---

function updateActivitySelector(profissional) {
    const rule = professionalRules[profissional];
    if (!rule) {
        adminSelectAtividade.innerHTML = '<option value="" disabled selected>Selecione o Profissional primeiro</option>';
        adminSelectAtividade.disabled = true;
        return;
    }

    let options = '<option value="" disabled selected>Selecione a Modalidade</option>';
    rule.activities.forEach(activity => {
        options += `<option value="${activity}">${activity}</option>`;
    });
    adminSelectAtividade.innerHTML = options;
    adminSelectAtividade.disabled = false;
}

function renderQuickMassageGrid() {
    quickMassageHorariosGrid.innerHTML = '';
    quickMassageHours.forEach(horario => {
        quickMassageHorariosGrid.innerHTML += `
            <div class="quick-slot">
                <input type="checkbox" id="qm-${horario}" name="quick-horario" value="${horario}">
                <label for="qm-${horario}">${horario}</label>
            </div>
        `;
    });
}

function toggleAdminInputs() {
    const profissional = adminSelectProfissional.value;
    const atividade = adminSelectAtividade.value;
    const rule = professionalRules[profissional];
    
    // Reseta visibilidade
    quickMassageContainer.classList.add('hidden');
    horarioUnicoContainer.classList.add('hidden');
    adminInputHorario.required = false;
    btnConfirmarAdicionarFinal.disabled = true;

    if (!rule || !atividade) {
        return; // Não faz nada se Profissional ou Atividade não estiverem selecionados
    }

    const isQuickMassage = (rule.type === 'quick_massage' && atividade === 'Quick Massage');
    const isAula = rule.type === 'aula' || (rule.type === 'mixed' && atividade !== 'Quick Massage');

    // 1. Lógica Quick Massage (seleção múltipla)
    if (isQuickMassage) {
        quickMassageContainer.classList.remove('hidden');
        renderQuickMassageGrid();
        // Habilita o botão de confirmar se a grade estiver visível (o usuário selecionará depois)
        btnConfirmarAdicionarFinal.disabled = false;
    } 
    // 2. Lógica Aulas e Reiki (horário único)
    else {
        horarioUnicoContainer.classList.remove('hidden');
        adminInputHorario.required = true;
        btnConfirmarAdicionarFinal.disabled = !adminInputHorario.value;

        if (isAula) {
            adminInputVagas.value = rule.defaultVagas;
            adminInputVagas.parentElement.classList.add('hidden');
        } else {
            adminInputVagas.value = rule.defaultVagas;
            adminInputVagas.parentElement.classList.remove('hidden');
        }
    }
}


// --- INICIALIZAÇÃO E LISTENERS GERAIS (Garantindo o fluxo Admin) ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Configuração inicial da data
    const hoje = new Date().toISOString().split('T')[0];
    if (seletorData) {
        seletorData.value = hoje;
        if (diaSemanaSpan) diaSemanaSpan.textContent = getDayOfWeek(hoje);
    }
    
    // 2. Inicia o carregamento
    carregarAgenda();
    
    // 3. Listeners de Data (agenda principal)
    if (seletorData) {
        seletorData.addEventListener('change', (e) => {
            if (diaSemanaSpan) diaSemanaSpan.textContent = getDayOfWeek(e.target.value);
            carregarAgenda();
        });
    }

    // 4. Fechar Modais (Geral)
    // Fechar Modais genéricos (o modal-mensagem-overlay usa #btn-fechar-mensagem)
    document.querySelectorAll('#btn-cancelar-agendamento, #btn-fechar-consulta, #btn-fechar-admin-gerenciar, #btn-fechar-mensagem').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if (modal) fecharModal(modal);
        });
    });
    
    // --- LÓGICA DE LOGIN ADMIN (CORRIGIDA) ---
    if (btnAdminLogin) btnAdminLogin.addEventListener('click', () => {
        if (isAdmin) {
            toggleAdminView(false); // Faz Logout
            fecharModal(modalAdminGerenciar);
            return;
        }
        abrirModal(modalAdminLogin); // Abre o modal
        inputAdminPassword.value = '';
        adminLoginMensagem.textContent = '';
    });
    
    if (btnAdminLogout) btnAdminLogout.addEventListener('click', () => {
        toggleAdminView(false); // Faz Logout
        fecharModal(modalAdminGerenciar);
    });

    if (btnConfirmarAdminLogin) btnConfirmarAdminLogin.addEventListener('click', () => {
        const password = inputAdminPassword.value.trim();
        if (password === ADMIN_PASSWORD) {
            toggleAdminView(true); // Faz Login e mostra o botão 'Gerenciar Agenda'
            fecharModal(modalAdminLogin);
            
            // CORREÇÃO: Abre o painel de gerenciamento imediatamente após o login
            abrirModal(modalAdminGerenciar); 
        } else {
            adminLoginMensagem.textContent = 'Senha incorreta.';
            adminLoginMensagem.style.color = 'red';
        }
    });

    // CORREÇÃO: Listener para o botão 'Gerenciar Agenda' (agora visível após login)
    if (btnGerenciarAgenda) btnGerenciarAgenda.addEventListener('click', () => {
        if (isAdmin) {
             abrirModal(modalAdminGerenciar);
        }
    });

    // --- ADMIN GERENCIAR / ADICIONAR ---
    if (btnAdminAdicionar) btnAdminAdicionar.addEventListener('click', () => {
        // Limpa e abre o modal de adição
        formAdicionarHorario.reset();
        adminAddMensagem.textContent = '';
        updateActivitySelector(''); // Reseta o seletor de atividade
        toggleAdminInputs(); // Esconde/Mostra containers
        abrirModal(modalAdminAdicionar);
    });
    
    if (btnCancelarAdicionarFinal) btnCancelarAdicionarFinal.addEventListener('click', () => fecharModal(modalAdminAdicionar));

    // Listeners do formulário de Adição
    if (adminSelectProfissional) {
        adminSelectProfissional.addEventListener('change', () => {
            updateActivitySelector(adminSelectProfissional.value);
            toggleAdminInputs();
        });
    }

    if (adminSelectAtividade) {
        adminSelectAtividade.addEventListener('change', toggleAdminInputs);
    }
    
    if (adminInputHorario) {
        adminInputHorario.addEventListener('input', () => {
            // Habilita o botão apenas se for horário único e o campo estiver preenchido
            if (!quickMassageContainer.classList.contains('hidden')) return; // Ignora se for Quick Massage
            btnConfirmarAdicionarFinal.disabled = adminInputHorario.value.trim().length < 5;
        });
    }
    
    // Listener de submissão do formulário de adição (requer a implementação da função handleAdminAddHorario)
    if (formAdicionarHorario) {
        formAdicionarHorario.addEventListener('submit', (e) => {
            e.preventDefault();
            // handleAdminAddHorario(new FormData(formAdicionarHorario));
        });
    }

    // --- LISTENERS DE CONSULTA (USUÁRIO) ---
    if(btnConsultarReservas) btnConsultarReservas.addEventListener('click', () => {
        abrirModal(modalConsulta);
        // Garante que a view inicial está sendo exibida ao abrir
        if (consultaViewInicial) consultaViewInicial.classList.remove('hidden');
        if (consultaViewResultados) consultaViewResultados.classList.add('hidden');
        consultaMensagem.textContent = '';
        inputConsultaMatricula.value = '';
    });
    
    if (btnBuscarReservas) btnBuscarReservas.addEventListener('click', () => {
        // handleBuscarReservas(inputConsultaMatricula.value.trim());
    });
    
    if (btnVoltarConsulta) btnVoltarConsulta.addEventListener('click', () => {
        consultaViewResultados.classList.add('hidden');
        consultaViewInicial.classList.remove('hidden');
        listaAgendamentos.innerHTML = '';
        consultaMensagem.textContent = '';
    });


    // --- LISTENERS DE RESERVA (USUÁRIO) ---
    if (inputMatricula) {
         inputMatricula.addEventListener('input', (e) => {
            if (btnConfirmar) btnConfirmar.disabled = e.target.value.trim().length === 0;
        });
    }
    
    if (btnConfirmar) btnConfirmar.addEventListener('click', () => {
        // handleConfirmarReserva();
    });

    // --- AÇÃO NA CÉLULA DA AGENDA (DELEGAÇÃO DE EVENTOS) ---
    if (container) {
        container.addEventListener('click', function(event) {
            const target = event.target.closest('.status-cell');
            if (!target) return;
            
            if (isAdmin) {
                 // Lógica de Admin (Excluir/Adicionar Slot Vazio) - Precisa da função handleAdminDelete
                // if (target.classList.contains('status-admin-excluir')) { ... }
                // else if (target.classList.contains('status-admin-adicionar')) { ... }

            } else if (target.classList.contains('status-disponivel')) {
                // Lógica de Agendamento do Usuário
                celulaClicada = target;
                abrirModalReserva(target.dataset);
            }
        });
    }
});
