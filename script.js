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
const quickMassageIndisponivelAll = document.getElementById('qm-indisponivel'); // NOVO ELEMENTO
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
             container.insertAdjacentHTML('beforebegin', '<p class="aviso-admin">MODO ADMIN ATIVADO. Clique nos slots para GERENCIAR (Excluir/Ver).</p>');
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

// function fetchAgenda(data) { ... }
// function renderAgenda(dados) { ... }
// function handleConfirmarReserva() { ... }
// function handleAdminDelete(idLinha) { ... }
// function handleBuscarReservas(matricula) { ... }

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

// Função para controlar a visibilidade e estado do botão de submissão
function toggleAdminInputs() {
    const profissional = adminSelectProfissional.value;
    const atividade = adminSelectAtividade.value;
    const rule = professionalRules[profissional];
    
    // Reseta visibilidade
    quickMassageContainer.classList.add('hidden');
    horarioUnicoContainer.classList.add('hidden');
    adminInputHorario.required = false;
    // Garante que o botão esteja desabilitado por padrão
    btnConfirmarAdicionarFinal.disabled = true;

    if (!rule || !atividade) {
        return; 
    }

    const isQuickMassage = (rule.type === 'quick_massage' && atividade === 'Quick Massage');

    if (isQuickMassage) {
        quickMassageContainer.classList.remove('hidden');
        renderQuickMassageGrid();
        // Habilita o botão imediatamente para Quick Massage.
        btnConfirmarAdicionarFinal.disabled = false; 
    } 
    else {
        horarioUnicoContainer.classList.remove('hidden');
        adminInputHorario.required = true;
        
        btnConfirmarAdicionarFinal.disabled = adminInputHorario.value.trim().length < 5;
        
        // Lógica de vagas para Aulas/Reiki
        const isAula = rule.type === 'aula' || (rule.type === 'mixed' && atividade !== 'Quick Massage');
        if (isAula) {
            adminInputVagas.value = rule.defaultVagas;
            adminInputVagas.parentElement.classList.add('hidden');
        } else {
            adminInputVagas.value = rule.defaultVagas;
            adminInputVagas.parentElement.classList.remove('hidden');
        }
    }
}

// --- FUNÇÃO CORRIGIDA PARA ENVIAR DADOS AO APPS SCRIPT (Quick Massage Indisponível) ---
async function handleAdminAddHorario(formData) {
    const profissional = formData.get('admin-select-profissional');
    const atividade = formData.get('admin-select-atividade');
    const dataSelecionada = formData.get('admin-select-data'); 
    const rule = professionalRules[profissional];
    
    // Feedback inicial
    adminAddMensagem.textContent = 'Adicionando horários...';
    adminAddMensagem.style.color = 'orange';

    try {
        let dadosParaEnvio = [];
        
        const isQuickMassage = (rule.type === 'quick_massage' && atividade === 'Quick Massage');

        if (isQuickMassage) {
            // Verifica se o Admin marcou para bloquear TODOS os horários de QM
            const indisponivelAll = quickMassageIndisponivelAll && quickMassageIndisponivelAll.checked;

            if (indisponivelAll) {
                // Caso Indisponível: Envia todos os slots como bloqueados (0 vagas ou 'Indisponível')
                quickMassageHours.forEach(horario => {
                    dadosParaEnvio.push({
                        profissional: profissional,
                        atividade: atividade,
                        data: dataSelecionada,
                        horario: horario,
                        vagas: 0, // 0 vagas = Bloqueado/Indisponível no Apps Script
                        status: 'Indisponível' 
                    });
                });
            } else {
                // Caso Disponível: Envia apenas os slots marcados (disponíveis)
                const selectedHorarios = document.querySelectorAll('input[name="quick-horario"]:checked');
                
                if (selectedHorarios.length === 0) {
                     // Este erro deve ser capturado no listener de submit, mas reforçamos
                     throw new Error('Selecione pelo menos um horário ou marque "Indisponível" para Quick Massage.');
                }
                
                selectedHorarios.forEach(checkbox => {
                    dadosParaEnvio.push({
                        profissional: profissional,
                        atividade: atividade,
                        data: dataSelecionada,
                        horario: checkbox.value,
                        vagas: 1, 
                        status: 'Disponível'
                    });
                });
            }

        } else {
            // Caso Horário Único (Aulas ou Reiki)
            const horario = formData.get('admin-input-horario');
            const vagas = formData.get('admin-input-vagas');

            if (!horario || horario.trim().length < 5) {
                throw new Error('Horário de início inválido.');
            }

            dadosParaEnvio.push({
                profissional: profissional,
                atividade: atividade,
                data: dataSelecionada,
                horario: horario,
                vagas: parseInt(vagas) || rule.defaultVagas,
                status: 'Disponível'
            });
        }
        
        // --- CHAMADA À API DO GOOGLE APPS SCRIPT ---
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'addSchedule', 
                data: dadosParaEnvio
            }),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' 
            }
        });

        if (!response.ok) {
            throw new Error(`Erro de rede ou Apps Script: Status ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success') {
            adminAddMensagem.textContent = `Sucesso! ${result.message}`;
            adminAddMensagem.style.color = 'green';
            formAdicionarHorario.reset();
            toggleAdminInputs();
            carregarAgenda(); // Recarrega a agenda principal
        } else {
            // Se o GSS retornar status: 'error'
            throw new Error(`Erro do Servidor: ${result.message}`);
        }

    } catch (error) {
        console.error('Erro ao adicionar horário:', error);
        adminAddMensagem.textContent = `Falha ao adicionar: ${error.message}`;
        adminAddMensagem.style.color = 'red';
    }
}


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

    // 4. Fechar Modais (Geral)
    document.querySelectorAll('#btn-cancelar-agendamento, #btn-fechar-consulta, #btn-fechar-admin-gerenciar, #btn-fechar-mensagem').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if (modal) fecharModal(modal);
        });
    });
    
    // --- LÓGICA DE LOGIN ADMIN ---
    if (btnAdminLogin) btnAdminLogin.addEventListener('click', () => {
        if (isAdmin) {
            toggleAdminView(false); // Faz Logout
            fecharModal(modalAdminGerenciar);
            return;
        }
        abrirModal(modalAdminLogin); 
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
            toggleAdminView(true); 
            fecharModal(modalAdminLogin);
            abrirModal(modalAdminGerenciar); 
        } else {
            adminLoginMensagem.textContent = 'Senha incorreta.';
            adminLoginMensagem.style.color = 'red';
        }
    });

    if (btnGerenciarAgenda) btnGerenciarAgenda.addEventListener('click', () => {
        if (isAdmin) {
             abrirModal(modalAdminGerenciar);
        }
    });

    // --- ADMIN GERENCIAR / ADICIONAR ---
    if (btnAdminAdicionar) btnAdminAdicionar.addEventListener('click', () => {
        formAdicionarHorario.reset();
        adminAddMensagem.textContent = '';
        adminSelectData.value = seletorData ? seletorData.value : hoje;
        updateActivitySelector(''); 
        toggleAdminInputs(); 
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
            if (!quickMassageContainer.classList.contains('hidden')) return; 
            btnConfirmarAdicionarFinal.disabled = adminInputHorario.value.trim().length < 5;
        });
    }

    // NOVO LISTENER: Lógica de exclusão/seleção de Quick Massage
    if (quickMassageIndisponivelAll) {
        quickMassageIndisponivelAll.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('input[name="quick-horario"]');
            const isChecked = quickMassageIndisponivelAll.checked;

            checkboxes.forEach(checkbox => {
                // Desabilita/habilita e desmarca/marca os horários individuais
                checkbox.disabled = isChecked;
                if (isChecked) {
                    checkbox.checked = false;
                }
            });
            // O botão permanece habilitado (pois há sempre uma ação a ser feita)
        });
    }

    // Listener de submissão do formulário de adição (incluindo validação de Quick Massage)
    if (formAdicionarHorario) {
        formAdicionarHorario.addEventListener('submit', (e) => {
            e.preventDefault();

            const isQuickMassageActive = !quickMassageContainer.classList.contains('hidden');
            const indisponivelAll = quickMassageIndisponivelAll && quickMassageIndisponivelAll.checked;

            if (isQuickMassageActive && !indisponivelAll) {
                const selectedHorarios = document.querySelectorAll('input[name="quick-horario"]:checked');
                if (selectedHorarios.length === 0) {
                    adminAddMensagem.textContent = 'Selecione pelo menos um horário ou marque "Marcar TODOS como Indisponível".';
                    adminAddMensagem.style.color = 'red';
                    return; 
                }
            }
            
            // Se passar nas validações
            adminAddMensagem.textContent = 'Adicionando horários...';
            adminAddMensagem.style.color = 'orange';

            handleAdminAddHorario(new FormData(formAdicionarHorario));
        });
    }

    // --- LISTENERS DE CONSULTA (USUÁRIO) ---
    if(btnConsultarReservas) btnConsultarReservas.addEventListener('click', () => {
        abrirModal(modalConsulta);
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
                 // Lógica de Admin (Excluir/Adicionar Slot Vazio) 
                 // Implementação de exclusão de slots deve ser feita aqui.

            } else if (target.classList.contains('status-disponivel')) {
                // Lógica de Agendamento do Usuário
                celulaClicada = target;
                abrirModalReserva(target.dataset);
            }
        });
    }
});
