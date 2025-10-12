// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

// Mova todas as definições de variáveis de elemento DOM e Event Listeners
// para dentro do 'DOMContentLoaded' para garantir que os elementos existam.
document.addEventListener('DOMContentLoaded', (event) => {
    
    // --- Referências de Elementos DOM ---
    // (TODAS as constantes document.getElementById devem estar aqui dentro)

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

    // --- REFERÊNCIAS DE MODAIS (ADMIN E CONSULTA) ---
    const modalAdminLogin = document.getElementById('modal-admin-login');
    const inputAdminPassword = document.getElementById('input-admin-password');
    const adminLoginMensagem = document.getElementById('admin-login-mensagem');
    const btnConfirmarAdminLogin = document.getElementById('btn-confirmar-admin-login');
    const btnCancelarAdminLogin = document.getElementById('btn-cancelar-admin-login');
    const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
    const modalAdminAdicionar = document.getElementById('modal-admin-adicionar');
    const btnConfirmarAdicionarFinal = document.getElementById('btn-confirmar-adicionar-final');
    const btnCancelarAdicionarFinal = document.getElementById('btn-cancelar-adicionar-final');

    // Inputs e Containers do Modal Adicionar Horários
    const adminSelectProfissional = document.getElementById('admin-select-profissional');
    const adminSelectAtividade = document.getElementById('admin-select-atividade');
    const adminSelectData = document.getElementById('admin-select-data'); // Input de data
    const adminInputHorario = document.getElementById('admin-input-horario');
    const adminInputVagas = document.getElementById('admin-input-vagas');
    const quickMassageContainer = document.getElementById('quick-massage-container');
    const horarioUnicoContainer = document.getElementById('horario-unico-container');
    const vagasContainerUnico = document.getElementById('vagas-container-unico');
    const adminAddMensagem = document.getElementById('admin-add-mensagem');

    // NOVO: Referência para a mensagem de erro de data
    const adminDataErroMensagem = document.getElementById('admin-data-erro-mensagem');

    // Variaveis de Estado Global
    let isAdmin = false;
    let agendaData = {};
    let celulaClicada = null;
    let currentDeleteId = null;

    // Regras de Profissionais (Exemplo: Ajuste conforme seu back-end)
    const professionalRules = {
        'Profissional A': { activities: ['Quick Massage'], type: 'quick-massage' },
        'Profissional B': { activities: ['Reiki', 'Quick Massage'], type: 'mista' },
        'Fisioterapeuta C': { activities: ['Reiki', 'Aula Postural'], type: 'aula' }
    };

    // Horários Padrão para Quick Massage (grade)
    const quickMassageDefaultTimes = [
        '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
        '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
        '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    // --- FUNÇÕES DE UTILIDADE ---

    // ... (Mantenha as funções 'abrirModal', 'fecharModal', 'formatarDataParaDisplay', 'getDayOfWeek', 'validarDataMinimaEAtualizarUI', 'toggleAdminInputs' e outras que não dependem das variáveis globais) ...

    function abrirModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('hidden');
            setTimeout(() => modalElement.style.opacity = '1', 10);
        }
    }

    function fecharModal(modalElement) {
        if (modalElement) {
            modalElement.style.opacity = '0';
            setTimeout(() => modalElement.classList.add('hidden'), 300);
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

    // --- FUNÇÃO PRINCIPAL DE VALIDAÇÃO DE DATA (NOVO) ---
    function validarDataMinimaEAtualizarUI() {
        // Retorna true se os elementos não existirem ou para evitar erros no início
        if (!adminSelectData || !btnConfirmarAdicionarFinal || !adminDataErroMensagem) return true;

        const dataSelecionadaString = adminSelectData.value;

        // 1. Obtém a data de hoje no formato YYYY-MM-DD (sem considerar horas)
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const yyyy = hoje.getFullYear();
        const mm = String(hoje.getMonth() + 1).padStart(2, '0');
        const dd = String(hoje.getDate()).padStart(2, '0');
        const hojeString = `${yyyy}-${mm}-${dd}`;

        // Define o atributo 'min' nativo do input HTML (melhora UX)
        adminSelectData.min = hojeString;

        // Se a data não foi selecionada ou for válida (igual ou maior que hoje)
        if (!dataSelecionadaString || dataSelecionadaString >= hojeString) {
            // Data válida: Esconde a mensagem
            adminDataErroMensagem.classList.add('hidden');
            return true;
        }

        // Se a data selecionada for menor que a data de hoje (INVÁLIDA)
        else {
            adminDataErroMensagem.textContent = 'Erro: A data selecionada não pode ser anterior ao dia de hoje.';
            adminDataErroMensagem.classList.remove('hidden');
            btnConfirmarAdicionarFinal.disabled = true; // Garante que o botão está bloqueado
            return false;
        }
    }


    // --- LÓGICA DO ADMIN ---

    // Função que habilita/desabilita o botão de submissão do formulário de adicionar (MUDANÇA AQUI)
    function toggleAdminInputs() {
        const profissional = adminSelectProfissional.value;
        const atividade = adminSelectAtividade.value;
        const data = adminSelectData.value;
        const rule = professionalRules[profissional];

        // 1. CHECAGEM CRUCIAL: DATA MÍNIMA
        const dataValida = validarDataMinimaEAtualizarUI();

        // Esconde todos os containers por padrão
        quickMassageContainer.classList.add('hidden');
        horarioUnicoContainer.classList.add('hidden');
        vagasContainerUnico.classList.add('hidden');

        // Desabilita o botão por padrão
        btnConfirmarAdicionarFinal.disabled = true;

        if (!profissional || !atividade || !data) return; // Saída rápida se campos essenciais estiverem vazios

        const isQuickMassage = atividade === 'Quick Massage';
        const isReiki = atividade === 'Reiki';
        const isAula = rule && rule.type === 'aula';

        // Se a data for inválida, sai da função com o botão desabilitado
        if (!dataValida) return;

        // Habilita o botão se a data for válida e profissional/atividade estiverem preenchidos
        btnConfirmarAdicionarFinal.disabled = false;

        // 2. Lógica de exibição dos campos adicionais
        if (isQuickMassage) {
            quickMassageContainer.classList.remove('hidden');
            horarioUnicoContainer.classList.add('hidden');
            adminInputHorario.required = false;
            // renderQuickMassageGrid(profissional, data); // Esta função precisa estar definida no seu código completo

            btnConfirmarAdicionarFinal.disabled = true; // Desabilita até selecionar horários
        } else {
            quickMassageContainer.classList.add('hidden');
            horarioUnicoContainer.classList.remove('hidden');
            adminInputHorario.required = true;

            if (isAula) {
                vagasContainerUnico.classList.add('hidden');
            } else {
                vagasContainerUnico.classList.remove('hidden');
            }
        }
    }
    
    // As funções 'renderQuickMassageGrid' e 'updateActivitySelector' também devem ser definidas aqui dentro ou como variáveis globais (se não precisarem do DOM).

    // --- Event Listeners (adicionados ou modificados) ---

    // Listener para o input de data
    if (adminSelectData) {
        adminSelectData.addEventListener('change', toggleAdminInputs);
        // Chama a função no load para configurar o atributo 'min'
        validarDataMinimaEAtualizarUI();
    }

    if (adminSelectProfissional) {
        adminSelectProfissional.addEventListener('change', () => {
            // updateActivitySelector(adminSelectProfissional.value); // Esta função precisa estar definida
            toggleAdminInputs();
        });
    }

    if (adminSelectAtividade) {
        adminSelectAtividade.addEventListener('change', toggleAdminInputs);
    }
    
    // ... outros listeners
    
}); // Fim do bloco DOMContentLoaded
