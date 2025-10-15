// COLE AQUI O URL DO SEU APP DA WEB GERADO PELO GOOGLE APPS SCRIPT
const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';

// --- REFERÊNCIAS DE DOM (ESCOPO GLOBAL CORRIGIDO) ---
// Estas variáveis são acessíveis por todas as funções do arquivo, resolvendo o problema do modal admin.

const container = document.getElementById('agenda-container');
const seletorData = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');

// Modais de Agendamento (Usuário)
const modalAgendamento = document.getElementById('modal-agendamento');
// CORRIGIDO: Certifique-se de que o ID no HTML é 'modal-agendamento-detalhes'
const modalDetalhes = document.getElementById('modal-agendamento-detalhes'); 
const inputMatricula = document.getElementById('input-matricula');
const btnConfirmar = document.getElementById('btn-confirmar');

// Botões Ação Principal
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnConsultarReservas = document.getElementById('btn-consultar-reservas');

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
const adminDataErroMensagem = document.getElementById('admin-data-erro-mensagem');

const modalMensagem = document.getElementById('modal-mensagem');


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


// --- FUNÇÕES DE UTILIDADE ---

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

function formatarDataParaDisplay(dataISO) {
    if (!dataISO) return '';
    const [year, month, day] = dataISO.split('-');
    return `${day}/${month}/${year}`;
}

function getDayOfWeek(dataISO) {
    // Adiciona T00:00:00 para garantir que a data seja interpretada no fuso horário local como início do dia.
    const data = new Date(dataISO + 'T00:00:00'); 
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[data.getDay()];
}

function validarDataMinimaEAtualizarUI() {
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

function mostrarMensagem(titulo, texto) {
    document.getElementById('modal-mensagem-titulo').textContent = titulo;
    document.getElementById('modal-mensagem-texto').textContent = texto;
    abrirModal(modalMensagem);
}

// --- LÓGICA DE ADMIN ---

function toggleAdminView(loggedIn) {
    isAdmin = loggedIn;

    if (loggedIn) {
        btnAdminLogin.textContent = 'Logout Admin';
        btnAdminLogin.classList.remove('btn-cinza');
        btnAdminLogin.classList.add('btn-vermelho'); 
        if (!document.querySelector('.aviso-admin')) {
             container.insertAdjacentHTML('beforebegin', '<p class="aviso-admin">MODO ADMIN ATIVADO. Clique nos slots para GEREENCIAR (Excluir/Ver).</p>');
        }
    } else {
        btnAdminLogin.textContent = 'Login Admin';
        btnAdminLogin.classList.remove('btn-vermelho');
        btnAdminLogin.classList.add('btn-cinza');
        const aviso = document.querySelector('.aviso-admin');
        if (aviso) aviso.remove();
    }
    carregarAgenda();
}

function updateActivitySelector(profissional) {
    const rule = professionalRules[profissional];
    adminSelectAtividade.innerHTML = '<option value="" disabled selected>Selecione a Modalidade</option>';
    adminSelectAtividade.disabled = false;
    
    if (rule) {
        rule.activities.forEach(activity => {
            const option = document.createElement('option');
            option.value = activity;
            option.textContent = activity;
            adminSelectAtividade.appendChild(option);
        });
    }
}

function renderQuickMassageGrid() {
    quickMassageHorariosGrid.innerHTML = '';
    quickMassageHours.forEach(horario => {
        const inputId = `qm-${horario.replace(':', '-')}`;
        
        quickMassageHorariosGrid.innerHTML += `
            <div class="horario-item">
                <label for="${inputId}" class="horario-label">${horario}</label>
                <input type="checkbox" id="${inputId}" data-horario="${horario}" class="qm-checkbox">
                
                <label for="indisp-${inputId}" class="label-indisponivel">Indisp.</label>
                <input type="checkbox" id="indisp-${inputId}" data-horario="${horario}" class="qm-indisp-checkbox">
            </div>
        `;
    });
}

function toggleAdminInputs() {
    const profissional = adminSelectProfissional.value;
    const atividade = adminSelectAtividade.value;
    const rule = professionalRules[profissional];
    
    quickMassageContainer.classList.add('hidden');
    horarioUnicoContainer.classList.add('hidden');
    vagasContainerUnico.classList.add('hidden');
    btnConfirmarAdicionarFinal.disabled = true;

    if (!validarDataMinimaEAtualizarUI()) return;

    if (!profissional || !atividade || !adminSelectData.value) return;

    const isQuickMassage = atividade === 'Quick Massage';
    const isReiki = atividade === 'Reiki';
    const isAula = rule && rule.type === 'aula';
    
    btnConfirmarAdicionarFinal.disabled = false;

    if (isQuickMassage) {
        quickMassageContainer.classList.remove('hidden');
        renderQuickMassageGrid(); 
        adminInputHorario.required = false;
        adminInputVagas.required = false;
    } 
    else if (isAula || isReiki) {
        horarioUnicoContainer.classList.remove('hidden');
        adminInputHorario.required = true;
        
        const defaultVagas = isReiki ? 1 : rule.defaultVagas;
        adminInputVagas.value = defaultVagas;
        
        if (isReiki) {
            vagasContainerUnico.classList.add('hidden');
            adminInputVagas.required = false;
        } else {
            vagasContainerUnico.classList.remove('hidden');
            adminInputVagas.required = true;
        }
    }
}

function handleAdminAction(cell) {
    const data = cell.dataset;
    
    // Admin: Adicionar Slot Vazio
    if (cell.classList.contains('status-admin-adicionar')) {
        // Pré-preenche o modal de adição
        adminSelectData.value = data.data;
        adminSelectProfissional.value = data.profissional;
        
        updateActivitySelector(data.profissional);
        // Não preenche a atividade se for 'mixed' (ex: Rafael), força a seleção
        if (professionalRules[data.profissional].activities.length === 1) {
             adminSelectAtividade.value = data.atividade;
        } else {
             adminSelectAtividade.value = '';
        }
        
        toggleAdminInputs();
        
        if (data.atividade !== 'Quick Massage' && adminInputHorario) {
            adminInputHorario.value = data.horario;
        }
        
        abrirModal(modalAdminAdicionar);

    // Admin: Gerenciar/Excluir Slot Existente
    } else if (cell.classList.contains('status-admin-excluir') || cell.classList.contains('status-admin-lotado')) {
        if (confirm(`Tem certeza que deseja EXCLUIR o horário de ${data.atividade} com ${data.profissional} em ${formatarDataParaDisplay(data.data)} às ${data.horario}?`)) {
             handleAdminDelete(data.id);
        }
    }
}

async function handleAdminAdicionar(e) {
    e.preventDefault();
    adminAddMensagem.textContent = 'Processando...';
    adminAddMensagem.classList.remove('hidden');
    
    // Lógica para enviar o comando de adição via API
    try {
        const profissional = adminSelectProfissional.value;
        const atividade = adminSelectAtividade.value;
        const data = adminSelectData.value;
        const rule = professionalRules[profissional];
        
        let slots = [];

        if (atividade === 'Quick Massage') {
            document.querySelectorAll('.qm-checkbox:checked').forEach(checkbox => {
                const horario = checkbox.dataset.horario;
                // Vagas padrão para quick massage é sempre 1 (ou use a regra default)
                slots.push({ horario, vagas: rule.defaultVagas });
            });
            document.querySelectorAll('.qm-indisp-checkbox:checked').forEach(checkbox => {
                const horario = checkbox.dataset.horario;
                slots.push({ horario, vagas: 0 }); // Vagas 0 significa slot fechado/indisponível
            });

        } else if (atividade) {
            const horario = adminInputHorario.value;
            const vagas = parseInt(adminInputVagas.value, 10) || (atividade === 'Reiki' ? 1 : rule.defaultVagas);
            slots.push({ horario, vagas });
        }

        if (slots.length === 0) {
            adminAddMensagem.textContent = 'Selecione pelo menos um horário ou preencha o horário/vagas.';
            return;
        }

        const payload = {
            action: 'addSlot',
            profissional,
            atividade,
            data,
            slots
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.status === 'SUCCESS') {
            mostrarMensagem('Sucesso!', `Horário(s) adicionado(s) com sucesso para ${profissional} em ${formatarDataParaDisplay(data)}.`);
            fecharModal(modalAdminAdicionar);
            carregarAgenda();
        } else {
            mostrarMensagem('Erro', `Falha ao adicionar horário: ${result.message}`);
        }
    } catch (error) {
        mostrarMensagem('Erro de Conexão', 'Não foi possível conectar com o servidor para adicionar o horário.');
        console.error('Erro ao adicionar horário:', error);
    } finally {
        adminAddMensagem.classList.add('hidden');
    }
}

async function handleAdminDelete(slotId) {
    // Lógica para excluir o slot via API
    try {
        const payload = {
            action: 'deleteSlot',
            id: slotId
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.status === 'SUCCESS') {
            mostrarMensagem('Sucesso!', 'Slot de agendamento excluído com sucesso.');
            carregarAgenda();
        } else {
            mostrarMensagem('Erro', `Falha ao excluir o slot: ${result.message}`);
        }
    } catch (error) {
        mostrarMensagem('Erro de Conexão', 'Não foi possível conectar com o servidor para excluir o slot.');
        console.error('Erro ao excluir slot:', error);
    }
}


// --- FUNÇÕES DE CARREGAMENTO E RENDERIZAÇÃO (CRÍTICO) ---

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
        
        agendaData = data.agenda || {};
        renderAgenda(agendaData, container);
        
    } catch (error) {
        console.error('Erro ao buscar a agenda:', error);
        container.innerHTML = '<p class="loading-text" style="color: red;">Erro ao carregar a agenda. Verifique sua conexão ou a URL da API.</p>';
        container.classList.remove('loading');
    }
}

function renderAgenda(data, container) {
    container.innerHTML = '';
    
    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = '<p class="loading-text">Nenhum horário disponível ou agendado para esta data.</p>';
        container.classList.remove('loading');
        return;
    }
    
    for (const atividade in data) {
        const agendamentos = data[atividade];
        
        const titulo = document.createElement('h2');
        titulo.className = 'titulo-atividade';
        titulo.textContent = atividade;
        
        const tabelaContainer = document.createElement('div');
        tabelaContainer.className = 'tabela-container';
        
        const tabela = document.createElement('table');
        tabela.className = 'tabela-agenda';
        
        const thead = tabela.createTHead();
        let profissionais = [];
        
        for (const horario in agendamentos) {
            for (const profissional in agendamentos[horario]) {
                if (!profissionais.includes(profissional)) {
                    profissionais.push(profissional);
                }
            }
        }
        
        let headerRow = thead.insertRow();
        let thHorario = document.createElement('th');
        thHorario.textContent = 'Horário';
        headerRow.appendChild(thHorario);
        
        profissionais.forEach(p => {
            let th = document.createElement('th');
            th.textContent = p;
            headerRow.appendChild(th);
        });
        
        const tbody = tabela.createTBody();
        const horariosUnicos = Object.keys(agendamentos).sort();
        const dataAtualISO = seletorData.value;
        
        horariosUnicos.forEach(horario => {
            let row = tbody.insertRow();
            let tdHorario = row.insertCell();
            tdHorario.className = 'horario-col';
            tdHorario.textContent = horario;
            
            profissionais.forEach(profissional => {
                let cell = row.insertCell();
                cell.className = 'status-cell';
                
                const slot = agendamentos[horario] ? agendamentos[horario][profissional] : null;
                
                // Dados para o Agendamento/Admin
                cell.dataset.data = dataAtualISO;
                cell.dataset.horario = horario;
                cell.dataset.profissional = profissional;
                cell.dataset.atividade = atividade;

                if (slot) {
                    const vagasOcupadas = slot.reservas ? slot.reservas.length : 0;
                    const vagasRestantes = slot.vagas - vagasOcupadas;
                    cell.dataset.id = slot.id; // ID da linha no Apps Script

                    if (vagasRestantes > 0) {
                        cell.classList.add(isAdmin ? 'status-admin-excluir' : 'status-disponivel');
                        cell.innerHTML = `Disponível <span>(${vagasRestantes} vagas)</span>`;
                    } else {
                        cell.classList.add(isAdmin ? 'status-admin-lotado' : 'status-lotado');
                        cell.textContent = isAdmin ? 'Lotado (Gerenciar)' : 'Lotado';
                    }
                } else {
                    cell.classList.add(isAdmin ? 'status-admin-adicionar' : 'status-indisponivel');
                    cell.textContent = isAdmin ? 'Adicionar Slot' : 'Fechado';
                }
            });
        });
        
        tabelaContainer.appendChild(tabela);
        container.appendChild(titulo);
        container.appendChild(tabelaContainer);
        
        // Comportamento de Acordeão para o título da atividade
        titulo.addEventListener('click', () => {
             titulo.classList.toggle('ativo');
             tabelaContainer.style.maxHeight = titulo.classList.contains('ativo') ? tabelaContainer.scrollHeight + 30 + "px" : "0";
        });
    }
    
    container.classList.remove('loading');
}

function carregarAgenda() {
    if (seletorData && container) {
        fetchAgenda(seletorData.value, container);
    }
}


// --- FUNÇÕES DE RESERVA/CONSULTA ---

function abrirModalReserva(data) {
    // CORRIGIDO: O elemento modalDetalhes deve existir no DOM
    const detalhes = modalDetalhes || document.getElementById('modal-agendamento-detalhes'); 
    
    detalhes.innerHTML = `
        <ul class="detalhes-agendamento-lista">
            <li><strong>Atividade:</strong> ${data.atividade}</li>
            <li><strong>Profissional:</strong> ${data.profissional}</li>
            <li><strong>Data:</strong> ${formatarDataParaDisplay(data.data)}</li>
            <li><strong>Horário:</strong> ${data.horario}</li>
        </ul>
    `;
    abrirModal(modalAgendamento);
    // Salva os dados do slot no modal para uso posterior
    modalAgendamento.dataset.slotData = JSON.stringify(data); 
}

// Implemente a função de envio de reserva (usando API POST)
async function sendReservation(data) {
    const matricula = inputMatricula.value.trim();
    if (!matricula) return;

    try {
        const payload = {
            action: 'makeReservation',
            id: data.id,
            matricula: matricula,
            // ... outros dados do slot se necessário
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.status === 'SUCCESS') {
            mostrarMensagem('Reserva Confirmada!', `Seu agendamento foi confirmado para ${data.atividade} em ${formatarDataParaDisplay(data.data)}.`);
        } else {
            mostrarMensagem('Erro na Reserva', `Falha: ${result.message || 'Vaga indisponível ou erro de servidor.'}`);
        }
    } catch (error) {
        mostrarMensagem('Erro de Conexão', 'Não foi possível completar a reserva. Verifique a internet.');
        console.error('Erro ao fazer reserva:', error);
    } finally {
        fecharModal(modalAgendamento);
        carregarAgenda(); // Recarrega a agenda para atualizar as vagas
    }
}

// ... Outras funções de Consulta (handleBuscarReservas, voltarConsulta, etc.)
// ... (Estas funções devem ser implementadas com a lógica de consulta da sua API)


// --- INICIALIZAÇÃO E LISTENERS GERAIS ---

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

    // 4. Listeners de Modais e Botões

    // Fechar Modais com 'X' e Botão de Fechar Mensagem
    document.querySelectorAll('.modal-fechar, #btn-fechar-mensagem').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-backdrop');
            fecharModal(modal);
        });
    });

    // --- LÓGICA DE LOGIN ADMIN (CORRIGIDA) ---
    if (btnAdminLogin) btnAdminLogin.addEventListener('click', () => {
        if (isAdmin) {
            toggleAdminView(false);
            return;
        }
        abrirModal(modalAdminLogin);
        inputAdminPassword.value = '';
        adminLoginMensagem.textContent = '';
    });

    if (btnConfirmarAdminLogin) btnConfirmarAdminLogin.addEventListener('click', () => {
        const password = inputAdminPassword.value.trim();
        if (password === ADMIN_PASSWORD) {
            toggleAdminView(true);
            fecharModal(modalAdminLogin);
        } else {
            adminLoginMensagem.textContent = 'Senha incorreta.';
            adminLoginMensagem.style.color = 'red';
        }
    });
    
    if (btnCancelarAdminLogin) btnCancelarAdminLogin.addEventListener('click', () => fecharModal(modalAdminLogin));


    // --- LISTENERS DE ADMIN ADICIONAR HORÁRIO ---
    if (adminSelectData) adminSelectData.addEventListener('change', toggleAdminInputs);
    if (adminSelectProfissional) {
        adminSelectProfissional.addEventListener('change', (e) => {
            updateActivitySelector(e.target.value);
            toggleAdminInputs();
        });
    }
    if (adminSelectAtividade) adminSelectAtividade.addEventListener('change', toggleAdminInputs);
    if (formAdicionarHorario) formAdicionarHorario.addEventListener('submit', handleAdminAdicionar);
    
    if (btnCancelarAdicionarFinal) btnCancelarAdicionarFinal.addEventListener('click', () => fecharModal(modalAdminAdicionar));


    // --- LISTENERS DE CONSULTA (USUÁRIO) ---
    if(btnConsultarReservas) btnConsultarReservas.addEventListener('click', () => {
        abrirModal(modalConsulta);
        if (consultaViewInicial) consultaViewInicial.classList.remove('hidden');
        if (consultaViewResultados) consultaViewResultados.classList.add('hidden');
    });
    // Adicione os listeners para Buscar Reservas, Voltar e Fechar Consulta quando implementar a lógica
    // if(btnBuscarReservas) btnBuscarReservas.addEventListener('click', handleBuscarReservas);
    // if(btnVoltarConsulta) btnVoltarConsulta.addEventListener('click', voltarConsulta);


    // --- LISTENERS DE RESERVA (USUÁRIO) ---
    if (inputMatricula) {
         inputMatricula.addEventListener('input', (e) => {
            if (btnConfirmar) btnConfirmar.disabled = e.target.value.trim().length === 0;
        });
    }
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => {
            const modal = modalAgendamento;
            const slotData = JSON.parse(modal.dataset.slotData);
            if (inputMatricula.value.trim()) {
                 await sendReservation(slotData);
            }
        });
    }
    if (document.getElementById('btn-cancelar-agendamento')) {
        document.getElementById('btn-cancelar-agendamento').addEventListener('click', () => fecharModal(modalAgendamento));
    }

    // --- AÇÃO NA CÉLULA DA AGENDA (DELEGAÇÃO DE EVENTOS) ---
    if (container) {
        container.addEventListener('click', function(event) {
            const target = event.target.closest('.status-cell');
            if (!target) return;
            
            if (isAdmin) {
                 handleAdminAction(target);
            } else if (target.classList.contains('status-disponivel')) {
                celulaClicada = target;
                abrirModalReserva(target.dataset);
            }
        });
    }
});
