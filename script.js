// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

// Variáveis de Estado Global (mantidas)
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


// --- FUNÇÕES DE UTILIDADE (Mantidas e Movidas para o escopo global) ---

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

// --- FUNÇÃO PRINCIPAL DE VALIDAÇÃO DE DATA (Mantida) ---
function validarDataMinimaEAtualizarUI(adminSelectData, btnConfirmarAdicionarFinal, adminDataErroMensagem) {
    if (!adminSelectData || !btnConfirmarAdicionarFinal || !adminDataErroMensagem) return true;

    const dataSelecionadaString = adminSelectData.value;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const dd = String(hoje.getDate()).padStart(2, '0');
    const hojeString = `${yyyy}-${mm}-${dd}`;

    adminSelectData.min = hojeString;

    if (!dataSelecionadaString || dataSelecionadaString >= hojeString) {
        adminDataErroMensagem.classList.add('hidden');
        return true;
    } else {
        adminDataErroMensagem.textContent = 'Erro: A data selecionada não pode ser anterior ao dia de hoje.';
        adminDataErroMensagem.classList.remove('hidden');
        btnConfirmarAdicionarFinal.disabled = true;
        return false;
    }
}

// --- FUNÇÃO ADICIONADA: RENDERIZAÇÃO DA AGENDA ---
function renderAgenda(data, container) {
    container.innerHTML = ''; // Limpa a mensagem "Carregando..."
    
    // Se não houver dados, exibe uma mensagem
    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = '<p class="loading-text">Nenhum horário disponível ou agendado para esta data.</p>';
        container.classList.remove('loading');
        return;
    }
    
    // Itera sobre as atividades no objeto de dados
    for (const atividade in data) {
        const agendamentos = data[atividade];
        
        // 1. Título do Acordeão
        const titulo = document.createElement('h2');
        titulo.className = 'titulo-atividade';
        titulo.textContent = atividade;
        titulo.onclick = () => {
            titulo.classList.toggle('ativo');
            tabelaContainer.style.maxHeight = titulo.classList.contains('ativo') ? tabelaContainer.scrollHeight + "px" : "0";
        };
        
        // 2. Container da Tabela (Acordeão)
        const tabelaContainer = document.createElement('div');
        tabelaContainer.className = 'tabela-container';
        
        const tabela = document.createElement('table');
        tabela.className = 'tabela-agenda';
        
        // 3. Cabeçalho da Tabela
        const thead = tabela.createTHead();
        let profissionais = [];
        
        // Coleta todos os profissionais que têm horários nesta atividade
        for (const horario in agendamentos) {
            for (const profissional in agendamentos[horario]) {
                if (!profissionais.includes(profissional)) {
                    profissionais.push(profissional);
                }
            }
        }
        
        // Cria a linha de cabeçalho
        let headerRow = thead.insertRow();
        let thHorario = document.createElement('th');
        thHorario.textContent = 'Horário';
        headerRow.appendChild(thHorario);
        
        profissionais.forEach(p => {
            let th = document.createElement('th');
            th.textContent = p;
            headerRow.appendChild(th);
        });
        
        // 4. Corpo da Tabela
        const tbody = tabela.createTBody();
        const horariosUnicos = Object.keys(agendamentos).sort();
        
        horariosUnicos.forEach(horario => {
            let row = tbody.insertRow();
            let tdHorario = row.insertCell();
            tdHorario.className = 'horario-col';
            tdHorario.textContent = horario;
            
            profissionais.forEach(profissional => {
                let cell = row.insertCell();
                cell.className = 'status-cell';
                
                const slot = agendamentos[horario][profissional];
                
                if (slot) {
                    // Slot Existe (Disponível, Lotado ou Reservado)
                    const vagasOcupadas = slot.reservas ? slot.reservas.length : 0;
                    const vagasRestantes = slot.vagas - vagasOcupadas;

                    if (vagasRestantes > 0) {
                        cell.classList.add('status-disponivel');
                        cell.innerHTML = `Disponível <span>(${vagasRestantes} vagas)</span>`;
                        // Adicionar lógica de clique para agendar (usuário)
                        cell.onclick = () => { /* Chamar função de Agendamento */ };
                    } else {
                        cell.classList.add('status-lotado');
                        cell.textContent = 'Lotado';
                    }
                } else {
                    // Slot Não Existe (Fechado ou Indisponível)
                    cell.classList.add('status-indisponivel');
                    cell.textContent = 'Fechado';
                }

                // Adicionar lógica de Admin (se isAdmin for true)
                if (isAdmin) {
                    // Lógica para mudar a classe para .status-admin-excluir ou .status-admin-adicionar
                    // ... (Aqui ficaria a lógica de ADMIN) ...
                }
            });
        });
        
        tabelaContainer.appendChild(tabela);
        container.appendChild(titulo);
        container.appendChild(tabelaContainer);
    }
    
    container.classList.remove('loading');
}

// --- FUNÇÃO ADICIONADA: BUSCA DE DADOS (CRÍTICO PARA O CARREGAMENTO) ---
async function fetchAgenda(dataISO, container) {
    if (!dataISO) return;

    container.classList.add('loading');
    container.innerHTML = '<p class="loading-text">Carregando a agenda...</p>';

    try {
        const urlComData = `${apiUrl}?action=getAgenda&date=${dataISO}`;
        const response = await fetch(urlComData);
        
        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Salva os dados para uso global
        agendaData = data.agenda || {};
        
        renderAgenda(agendaData, container);
        
    } catch (error) {
        console.error('Erro ao buscar a agenda:', error);
        container.innerHTML = '<p class="loading-text" style="color: red;">Erro ao carregar a agenda. Verifique sua conexão ou a URL da API.</p>';
        container.classList.remove('loading');
    }
}

// --- FUNÇÃO ADICIONADA: INICIALIZAÇÃO DA PÁGINA ---
function initializePage(seletorData, diaSemanaSpan, container) {
    // Define a data atual como padrão no seletor
    const hoje = new Date().toISOString().split('T')[0];
    seletorData.value = hoje;
    
    // Atualiza o dia da semana na inicialização
    diaSemanaSpan.textContent = getDayOfWeek(hoje);

    // Adiciona listener para a mudança de data
    seletorData.addEventListener('change', (e) => {
        const novaData = e.target.value;
        diaSemanaSpan.textContent = getDayOfWeek(novaData);
        fetchAgenda(novaData, container);
    });

    // Inicia o carregamento da agenda com a data atual
    fetchAgenda(hoje, container);
}


// Mova todas as definições de variáveis de elemento DOM e Event Listeners
// para dentro do 'DOMContentLoaded' para garantir que os elementos existam.
document.addEventListener('DOMContentLoaded', (event) => {
    
    // --- Referências de Elementos DOM ---
    const container = document.getElementById('agenda-container');
    const seletorData = document.getElementById('seletor-data');
    const diaSemanaSpan = document.getElementById('dia-semana');

    // ... (restante das referências de DOM mantidas do seu arquivo original)
    const modalAgendamento = document.getElementById('modal-agendamento');
    const modalDetalhes = document.getElementById('modal-detalhes');
    const inputMatricula = document.getElementById('input-matricula');
    const btnCancelar = document.getElementById('btn-cancelar-agendamento');
    const btnConfirmar = document.getElementById('btn-confirmar');
    const modalMensagem = document.getElementById('modal-mensagem');
    const btnAdminLogin = document.getElementById('btn-admin-login');
    const modalAdminLogin = document.getElementById('modal-admin-login');
    const inputAdminPassword = document.getElementById('input-admin-password');
    const adminLoginMensagem = document.getElementById('admin-login-mensagem');
    const btnConfirmarAdminLogin = document.getElementById('btn-confirmar-admin-login');
    const btnCancelarAdminLogin = document.getElementById('btn-cancelar-admin-login');
    const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
    const modalAdminAdicionar = document.getElementById('modal-admin-adicionar');
    const btnConfirmarAdicionarFinal = document.getElementById('btn-confirmar-adicionar-final');
    const btnCancelarAdicionarFinal = document.getElementById('btn-cancelar-adicionar-final');
    const adminSelectProfissional = document.getElementById('admin-select-profissional');
    const adminSelectAtividade = document.getElementById('admin-select-atividade');
    const adminSelectData = document.getElementById('admin-select-data');
    const adminInputHorario = document.getElementById('admin-input-horario');
    const adminInputVagas = document.getElementById('admin-input-vagas');
    const quickMassageContainer = document.getElementById('quick-massage-container');
    const horarioUnicoContainer = document.getElementById('horario-unico-container');
    const vagasContainerUnico = document.getElementById('vagas-container-unico');
    const adminAddMensagem = document.getElementById('admin-add-mensagem');
    const adminDataErroMensagem = document.getElementById('admin-data-erro-mensagem');


    // --- LÓGICA DO ADMIN (função existente, ajustada para usar argumentos do DOM) ---

    function toggleAdminInputs() {
        const profissional = adminSelectProfissional.value;
        const atividade = adminSelectAtividade.value;
        const data = adminSelectData.value;
        const rule = professionalRules[profissional];

        const dataValida = validarDataMinimaEAtualizarUI(adminSelectData, btnConfirmarAdicionarFinal, adminDataErroMensagem);

        quickMassageContainer.classList.add('hidden');
        horarioUnicoContainer.classList.add('hidden');
        vagasContainerUnico.classList.add('hidden');

        btnConfirmarAdicionarFinal.disabled = true;

        if (!profissional || !atividade || !data) return;

        const isQuickMassage = atividade === 'Quick Massage';
        const isAula = rule && rule.type === 'aula';

        if (!dataValida) return;

        btnConfirmarAdicionarFinal.disabled = false;

        if (isQuickMassage) {
            quickMassageContainer.classList.remove('hidden');
            horarioUnicoContainer.classList.add('hidden');
            adminInputHorario.required = false;
            // renderQuickMassageGrid(profissional, data); // Deve ser implementada
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
    
    // --- Event Listeners (existentes, ajustados para a nova função) ---

    if (adminSelectData) {
        adminSelectData.addEventListener('change', toggleAdminInputs);
        // Chama a função no load para configurar o atributo 'min'
        validarDataMinimaEAtualizarUI(adminSelectData, btnConfirmarAdicionarFinal, adminDataErroMensagem);
    }

    if (adminSelectProfissional) {
        adminSelectProfissional.addEventListener('change', () => {
            // updateActivitySelector(adminSelectProfissional.value); // Deve ser implementada
            toggleAdminInputs();
        });
    }

    if (adminSelectAtividade) {
        adminSelectAtividade.addEventListener('change', toggleAdminInputs);
    }
    
    // === CÓDIGO FINAL CRÍTICO: CHAMA A INICIALIZAÇÃO ===
    if (seletorData && container && diaSemanaSpan) {
        initializePage(seletorData, diaSemanaSpan, container);
    }

    // Lógica para modais (fechar com o botão X)
    document.querySelectorAll('.modal-fechar').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-backdrop');
            fecharModal(modal);
        });
    });

    // Adicione mais listeners de cliques e lógica aqui para Login Admin, Agendamento, etc.
    
}); // Fim do bloco DOMContentLoaded
