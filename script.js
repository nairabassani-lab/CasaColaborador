// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

// --- REFERÊNCIAS DE DOM (ESCOPO GLOBAL CORRIGIDO) ---
// Estas variáveis são acessíveis por todas as funções do arquivo.

const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modais de Agendamento (Usuário)
const modalAgendamento = document.getElementById('modal-agendamento');
// CORRIGIDO: O ID no seu HTML é 'modal-detalhes' (o UL dentro do modal)
const modalDetalhes = document.getElementById('modal-detalhes'); 
const inputMatricula = document.getElementById('input-matricula');
const btnConfirmar = document.getElementById('btn-confirmar');
// O ID do modal principal de mensagem deve ser referenciado se for um overlay, 
// mas o seu HTML atual só tem um div com ID 'modal-mensagem' DENTRO do modalAgendamento. 
// Vamos criar uma referência para o modal de mensagem (que deve ser um overlay).
const modalMensagemOverlay = document.getElementById('modal-mensagem-overlay'); 

// Botões Ação Principal
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');
// ADICIONADO: Elemento que estava faltando e existe no seu HTML
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda'); 

// --- REFERÊNCIAS DE MODAIS (ADMIN E CONSULTA) ---
const modalAdminLogin = document.getElementById('modal-admin-login');
const inputAdminPassword = document.getElementById('input-admin-password');
const adminLoginMensagem = document.getElementById('admin-login-mensagem');
const btnConfirmarAdminLogin = document.getElementById('btn-confirmar-admin-login');
const btnCancelarAdminLogin = document.getElementById('btn-cancelar-admin-login');

const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
const btnAdminAdicionar = document.getElementById('btn-admin-adicionar');
const modalAdminAdicionar = document.getElementById('modal-admin-adicionar');
const formAdicionarHorario = document.getElementById('form-adicionar-horario');

const modalConsulta = document.getElementById('modal-consulta'); 
const inputConsultaMatricula = document.getElementById('input-consulta-matricula');
const consultaViewInicial = document.getElementById('consulta-view-inicial');
const consultaViewResultados = document.getElementById('consulta-view-resultados');
const consultaMensagem = document.getElementById('consulta-mensagem');
const btnBuscarReservas = document.getElementById('btn-buscar-reservas');
const btnVoltarConsulta = document.getElementById('btn-voltar-consulta');

// --- REFERÊNCIAS ESPECÍFICAS DO MODAL ADICIONAR ---
const adminSelectProfissional = document.getElementById('admin-select-profissional');
const adminSelectAtividade = document.getElementById('admin-select-atividade');
const quickMassageContainer = document.getElementById('quick-massage-container');
const quickMassageHorariosGrid = document.getElementById('quick-massage-horarios');
const horarioUnicoContainer = document.getElementById('horario-unico-container');
const vagasContainerUnico = document.getElementById('vagas-container-unico');
const adminInputVagas = document.getElementById('admin-input-vagas');
const adminInputHorario = document.getElementById('admin-input-horario');
const btnConfirmarAdicionarFinal = document.getElementById('btn-confirmar-adicionar-final');
const btnCancelarAdicionarFinal = document.getElementById('btn-cancelar-adicionar-final');
const adminAddMensagem = document.getElementById('admin-add-mensagem');
const adminSelectData = document.getElementById('admin-select-data');
// Vamos usar a mesma mensagem de erro para a data
const adminDataErroMensagem = adminAddMensagem;


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

function mostrarMensagem(titulo, texto) {
    // Para simplificar, vamos usar o modalAgendamento (que tem um espaço para mensagem)
    // ou você pode adicionar um modal de mensagem global como um overlay.
    // Assumindo que você ADICIONOU um modal de mensagem global com ID 'modal-mensagem-overlay'
    const modal = modalMensagemOverlay || modalAgendamento; 

    if (modal.querySelector('#modal-mensagem-titulo')) {
        modal.querySelector('#modal-mensagem-titulo').textContent = titulo;
        modal.querySelector('#modal-mensagem-texto').textContent = texto;
        abrirModal(modal);
    } else {
        // Se o modal de mensagem global não existir, usa um alerta simples (fallback)
        alert(`${titulo}\n\n${texto}`);
    }
}


// --- FUNÇÕES DE LÓGICA DE NEGÓCIO ---

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

// ... (Restante das funções de Admin e Lógica da Agenda - fetchAgenda, renderAgenda, etc. - são mantidas como na resposta anterior) ...
function toggleAdminView(loggedIn) {
    isAdmin = loggedIn;

    if (loggedIn) {
        btnAdminLogin.textContent = 'Logout Admin';
        btnAdminLogin.classList.remove('btn-cinza');
        btnAdminLogin.classList.add('btn-vermelho'); 
        btnGerenciarAgenda.classList.remove('hidden'); // MOSTRA o botão de Gerenciar Agenda
        if (!document.querySelector('.aviso-admin')) {
             container.insertAdjacentHTML('beforebegin', '<p class="aviso-admin">MODO ADMIN ATIVADO. Clique nos slots para GEREENCIAR (Excluir/Ver).</p>');
        }
    } else {
        btnAdminLogin.textContent = 'Login Admin';
        btnAdminLogin.classList.remove('btn-vermelho');
        btnAdminLogin.classList.add('btn-cinza');
        btnGerenciarAgenda.classList.add('hidden'); // ESCONDE o botão de Gerenciar Agenda
        const aviso = document.querySelector('.aviso-admin');
        if (aviso) aviso.remove();
    }
    carregarAgenda();
}


function abrirModalReserva(data) {
    // Agora modalDetalhes aponta corretamente para o <ul> dentro do modalAgendamento
    if (modalDetalhes) {
        modalDetalhes.innerHTML = `
            <li><strong>Atividade:</strong> ${data.atividade}</li>
            <li><strong>Profissional:</strong> ${data.profissional}</li>
            <li><strong>Data:</strong> ${formatarDataParaDisplay(data.data)}</li>
            <li><strong>Horário:</strong> ${data.horario}</li>
        `;
    }
    abrirModal(modalAgendamento);
    // Salva os dados do slot no modal para uso posterior
    modalAgendamento.dataset.slotData = JSON.stringify(data); 
}

// ... (As demais funções de Admin e Agendamento devem ser coladas aqui, mas foram omitidas 
// para não repetir o código extenso da resposta anterior. Garanta que você colou o JS COMPLETO) ...

function carregarAgenda() {
    if (seletorData && container) {
        // A função fetchAgenda deve estar definida no código JS COMPLETO.
        // fetchAgenda(seletorData.value, container);
    }
}


// --- INICIALIZAÇÃO E LISTENERS GERAIS (Foco nos Modais) ---

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
    // Fechar Modais com Botão de Cancelar/Fechar e 'X' (se você tiver um botão de fechar genérico)
    document.querySelectorAll('.modal-fechar, #btn-cancelar-agendamento, #btn-fechar-consulta, #btn-fechar-admin-gerenciar').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if (modal) fecharModal(modal);
        });
    });

    // --- LÓGICA DE LOGIN ADMIN (CORRIGIDA) ---
    if (btnAdminLogin) btnAdminLogin.addEventListener('click', () => {
        if (isAdmin) {
            toggleAdminView(false); // Faz Logout
            return;
        }
        abrirModal(modalAdminLogin); // Abre o modal
        inputAdminPassword.value = '';
        adminLoginMensagem.textContent = '';
    });

    if (btnConfirmarAdminLogin) btnConfirmarAdminLogin.addEventListener('click', () => {
        const password = inputAdminPassword.value.trim();
        if (password === ADMIN_PASSWORD) {
            toggleAdminView(true); // Faz Login
            fecharModal(modalAdminLogin);
            abrirModal(modalAdminGerenciar); // Opcional: abre o painel de gerenciamento após o login
        } else {
            adminLoginMensagem.textContent = 'Senha incorreta.';
            adminLoginMensagem.style.color = 'red';
        }
    });
    
    if (btnCancelarAdminLogin) btnCancelarAdminLogin.addEventListener('click', () => fecharModal(modalAdminLogin));

    if (btnGerenciarAgenda) btnGerenciarAgenda.addEventListener('click', () => {
        if (isAdmin) {
             abrirModal(modalAdminGerenciar);
        }
    });

    // --- LISTENERS DE CONSULTA (USUÁRIO) ---
    if(btnConsultarReservas) btnConsultarReservas.addEventListener('click', () => {
        abrirModal(modalConsulta);
        if (consultaViewInicial) consultaViewInicial.classList.remove('hidden');
        if (consultaViewResultados) consultaViewResultados.classList.add('hidden');
    });

    // --- LISTENERS DE RESERVA (USUÁRIO) ---
    if (inputMatricula) {
         inputMatricula.addEventListener('input', (e) => {
            if (btnConfirmar) btnConfirmar.disabled = e.target.value.trim().length === 0;
        });
    }
    // O listener de confirmação de reserva (btnConfirmar) deve estar aqui
    // ...

    // --- AÇÃO NA CÉLULA DA AGENDA (DELEGAÇÃO DE EVENTOS) ---
    if (container) {
        container.addEventListener('click', function(event) {
            const target = event.target.closest('.status-cell');
            if (!target) return;
            
            if (isAdmin) {
                 // handleAdminAction(target); // Esta função deve ser implementada/incluída
            } else if (target.classList.contains('status-disponivel')) {
                celulaClicada = target;
                abrirModalReserva(target.dataset);
            }
        });
    }
});
