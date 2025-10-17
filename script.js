// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbxY1VsWmQB_4FDolmaMNnmSbyyXMDKjxeQ9RBP_qX8kcmoATHl1h3g-w8NsUfuXlf8B/exec';

// --- REFERÊNCIAS DE DOM (ESCOPO GLOBAL) ---
const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modais de Agendamento (Usuário)
const modalAgendamento = document.getElementById('modal-agendamento');
const modalDetalhes = document.getElementById('modal-detalhes');
const inputMatricula = document.getElementById('input-matricula');
const btnConfirmar = document.getElementById('btn-confirmar');
const modalMensagemOverlay = document.getElementById('modal-mensagem-overlay'); 

// Botões Ação Principal
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda'); 

// --- REFERÊNCIAS DE MODAIS (ADMIN E CONSULTA) ---
// Admin Login (Omitido para brevidade, mantido no código final)

// Admin Gerenciar (Painel de Administração) (Omitido para brevidade)

// Admin Adicionar Horário (Omitido para brevidade)
const modalAdminAdicionar = document.getElementById('modal-admin-adicionar');
const formAdicionarHorario = document.getElementById('form-adicionar-horario');
const adminSelectProfissional = document.getElementById('admin-select-profissional');
const adminSelectAtividade = document.getElementById('admin-select-atividade');
const quickMassageContainer = document.getElementById('quick-massage-container');
const quickMassageHorariosGrid = document.getElementById('quick-massage-horarios');
const quickMassageIndisponivelAll = document.getElementById('qm-indisponivel');
const horarioUnicoContainer = document.getElementById('horario-unico-container');
const adminInputHorario = document.getElementById('admin-input-horario');
const adminInputVagas = document.getElementById('admin-input-vagas');
const btnConfirmarAdicionarFinal = document.getElementById('btn-confirmar-adicionar-final');
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


// --- Variáveis de Estado e Configurações ---
let agendaData = {};
let celulaClicada = null;
let isAdmin = false;
const ADMIN_PASSWORD = 'admin'; 

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


// --- FUNÇÕES DE UTILIDADE (MODAIS E FORMATAÇÃO) ---

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

function atualizarDiaSemanaLabel(dateISO) {
    if (!diaSemanaSpan || !dateISO) return;
    diaSemanaSpan.textContent = `(${getDayOfWeek(dateISO)})`;
}

// --- LÓGICA DE ADMIN E UI (Omitido para brevidade
