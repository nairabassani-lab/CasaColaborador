// --- CONFIGURAÇÃO GLOBAL ---
// Estrutura de dados simulada para agendamentos, atividades e profissionais
const DATA_STORE = {
    // Exemplo de agendamentos: [data, hora, atividade, profissional, matricula]
    agendamentos: [
        { data: '2025-10-06', hora: '10:00', atividade: 'Quick Massage', profissional: 'Ana', matricula: '999999' }
    ],
    // Senha de Admin (simulada)
    adminPassword: 'admin', 
    // Dados mestres das atividades
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
    },
    // Horários fixos para Quick Massage / Reiki (Admin precisa gerenciar)
    horariosFixos: [
        // Exemplo: { data: '2025-10-06', profissional: 'Ana', atividade: 'Quick Massage', hora: '10:30' }
    ]
};

// Variável de estado para o login do administrador
let isAdminLoggedIn = false; 

// --- ELEMENTOS DO DOM ---
const dataInput = document.getElementById('seletor-data');
const diaSemanaSpan = document.getElementById('dia-semana');
const agendaContainer = document.getElementById('agenda-container');

const modalAgendamento = document.getElementById('modal-agendamento');
const modalConsulta = document.getElementById('modal-consulta');
const modalAdminLogin = document.getElementById('modal-admin-login');
const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');

const btnAdminLogin = document.getElementById('btn-admin-login');
const btnGerenciarAgenda = document.getElementById('btn-gerenciar-agenda');

// --- UTILIDADES ---

/**
 * Formata a data para exibir o dia da semana.
 * @param {string} dateString - Data no formato YYYY-MM-DD.
 * @returns {string} Dia da semana por extenso.
 */
function getDiaDaSemana(dateString) {
    const data = new Date(dateString + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário
    return data.toLocaleDateString('pt-BR', { weekday: 'long' });
}

/**
 * Filtra e organiza os horários disponíveis para a data e atividade selecionadas.
 * @param {string} dataSelecionada - Data no formato YYYY-MM-DD.
 * @returns {Object} Estrutura de atividades com os horários disponíveis e status.
 */
function construirAgenda(dataSelecionada) {
    const agenda = {};

    // 1. Coleta e agrupa todos os horários (fixos e dinâmicos)
    const horariosDisponiveis = {};

    // Adiciona horários fixos (gerenciados pelo admin)
    DATA_STORE.horariosFixos.filter(h => h.data === dataSelecionada).forEach(horario => {
        const key = `${horario.profissional}-${horario.atividade}`;
        if (!horariosDisponiveis[key]) {
            horariosDisponiveis[key] = [];
        }
        horariosDisponiveis[key].push({
            hora: horario.hora,
            profissional: horario.profissional,
            atividade: horario.atividade,
            vagasMaximas: DATA_STORE.atividades[horario.profissional][horario.atividade].vagas
        });
    });

    // 2. Cria a estrutura da agenda, agrupando por atividade
    for (const [profissional, atividadesDoProfissional] of Object.entries(DATA_STORE.atividades)) {
        for (const [nomeAtividade, config] of Object.entries(atividadesDoProfissional)) {
            const key = `${profissional} - ${nomeAtividade}`;

            if (!agenda[key]) {
                agenda[key] = {
                    profissional: profissional,
                    atividade: nomeAtividade,
                    config: config,
                    horarios: []
                };
            }
            
            // Adiciona horários fixos já coletados
            const horariosFixosParaAtividade = horariosDisponiveis[`${profissional}-${nomeAtividade}`] || [];
            agenda[key].horarios.push(...horariosFixosParaAtividade);
        }
    }

    // 3. Verifica o status e conta as vagas
    for (const atividadeKey in agenda) {
        agenda[atividadeKey].horarios.forEach(horario => {
            const reservasExistentes = DATA_STORE.agendamentos.filter(a => 
                a.data === dataSelecionada && 
                a.hora === horario.hora && 
                a.atividade === horario.atividade && 
                a.profissional === horario.profissional
            ).length;

            const vagas = horario.vagasMaximas - reservasExistentes;

            horario.vagas = vagas;
            horario.status = vagas > 0 ? 'disponivel' : 'lotado';
        });
        // Remove atividades que não possuem horários fixos definidos
        if (agenda[atividadeKey].horarios.length === 0) {
             delete agenda[atividadeKey];
        }
    }
    
    return agenda;
}

/**
 * Renderiza a agenda na tela.
 */
function renderizarAgenda() {
    const dataSelecionada = dataInput.value;
    if (!dataSelecionada) {
        agendaContainer.innerHTML = '<p class="loading">Selecione uma data para ver os horários disponíveis.</p>';
        return;
    }

    const diaSemana = getDiaDaSemana(dataSelecionada);
    diaSemanaSpan.textContent = `(${diaSemana})`;

    const agenda = construirAgenda(dataSelecionada);
    let html = '';
    const horariosProcessados = {}; // Para evitar duplicidade de horários na coluna fixa

    // Coleta todos os horários únicos (para a primeira coluna)
    for (const key in agenda) {
        agenda[key].horarios.forEach(h => {
            horariosProcessados[h.hora] = true;
        });
    }

    const horariosUnicos = Object.keys(horariosProcessados).sort();

    if (horariosUnicos.length === 0) {
        html = `<p class="loading">Não há horários disponíveis para a data ${dataSelecionada}.</p>`;
    } else {
        const atividadesKeys = Object.keys(agenda);

        html += `<div class="aviso-admin ${isAdminLoggedIn ? '' : 'hidden'}">⚠️ MODO ADMIN: Clique em um horário com vaga para removê-lo.</div>`;
        
        // Estrutura do Acordeão
        for (const [i, key] of atividadesKeys.entries()) {
            const item = agenda[key];
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
                let matricula = '';
                
                if (horarioInfo) {
                    statusClass = `status-${horarioInfo.status}`;
                    vagasTexto = horarioInfo.vagas > 0 ? `${horarioInfo.vagas} vagas` : 'Lotado';
                    
                    if (isAdminLoggedIn) {
                         // Adiciona classe para permitir exclusão no modo Admin se a vaga NÃO estiver lotada
                        statusClass += horarioInfo.status === 'disponivel' ? ' status-admin-maintenance' : '';
                        
                        // No modo Admin, se estiver lotado, mostramos a matrícula (exemplo simplificado: deveria vir do DATA_STORE)
                        if (horarioInfo.status === 'lotado') {
                            const reserva = DATA_STORE.agendamentos.find(a => 
                                a.data === dataSelecionada && 
                                a.hora === hora && 
                                a.atividade === horarioInfo.atividade && 
                                a.profissional === horarioInfo.profissional
                            );
                            matricula = reserva ? `Matrícula: ${reserva.matricula}` : 'Reservado';
                        }
                    }
                }

                html += `<tr data-atividade="${item.atividade}" data-profissional="${item.profissional}" data-hora="${hora}" data-data="${dataSelecionada}" class="${horarioInfo ? '' : 'oculto-admin'}">`;
                html += `<td class="horario-col">${hora}</td>`;
                html += `<td class="${statusClass}" data-status="${horarioInfo ? horarioInfo.status : 'indisponivel'}">`;
                html += `<span>${vagasTexto}</span>`;
                if (matricula) {
                    html += `<span class="matricula-admin">${matricula}</span>`;
                }
                html += `</td>`;
                html += `</tr>`;
            });

            html += `</tbody>`;
            html += `</table>`;
            html += `</div>`;
        }
    }

    agendaContainer.innerHTML = html;
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

            // Lógica de abertura/fechamento com transição
            if (isAtivo) {
                // Abre
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                // Fecha
                content.style.maxHeight = "0";
            }
        });
    });
}

/** Adiciona os listeners de clique para as células de agendamento */
function adicionarListenersCelulas() {
    document.querySelectorAll('.tabela-agenda tbody td:not(.horario-col)').forEach(cell => {
        cell.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            const row = this.closest('tr');
            const data = row.getAttribute('data-data');
            const hora = row.getAttribute('data-hora');
            const atividade = row.getAttribute('data-atividade');
            const profissional = row.getAttribute('data-profissional');
            
            // Lógica para o modo Administrador
            if (isAdminLoggedIn) {
                // Se a célula estiver no modo de manutenção (vaga disponível)
                if (this.classList.contains('status-admin-maintenance')) {
                    // Confirmação para exclusão de um horário fixo
                    if (confirm(`ADMIN: Deseja remover o horário fixo de ${atividade} com ${profissional} às ${hora} do dia ${data}? Isso liberará todas as vagas futuras.`)) {
                        removerHorarioFixo(data, hora, atividade, profissional);
                    }
                }
                // Se estiver lotado, poderia ter uma lógica de "cancelamento admin"
                return; 
            }

            // Lógica para o usuário normal (agendamento)
            if (status === 'disponivel') {
                abrirModalAgendamento(data, hora, atividade, profissional);
            } else {
                // status 'lotado' ou 'indisponivel' - não faz nada
            }
        });
    });
}

// --- FUNÇÕES DE AGENDAMENTO (MODAL) ---

function abrirModalAgendamento(data, hora, atividade, profissional) {
    document.getElementById('modal-detalhes').innerHTML = `
        <li>**Atividade:** ${atividade}</li>
        <li>**Profissional:** ${profissional}</li>
        <li>**Data:** ${data}</li>
        <li>**Hora:** ${hora}</li>
    `;
    modalAgendamento.setAttribute('data-data', data);
    modalAgendamento.setAttribute('data-hora', hora);
    modalAgendamento.setAttribute('data-atividade', atividade);
    modalAgendamento.setAttribute('data-profissional', profissional);
    
    document.getElementById('input-matricula').value = '';
    document.getElementById('modal-mensagem').textContent = '';
    modalAgendamento.classList.remove('hidden');
}

function fecharModalAgendamento() {
    modalAgendamento.classList.add('hidden');
}

document.getElementById('btn-cancelar-agendamento').addEventListener('click', fecharModalAgendamento);

document.getElementById('btn-confirmar').addEventListener('click', function() {
    const matricula = document.getElementById('input-matricula').value.trim();
    const data = modalAgendamento.getAttribute('data-data');
    const hora = modalAgendamento.getAttribute('data-hora');
    const atividade = modalAgendamento.getAttribute('data-atividade');
    const profissional = modalAgendamento.getAttribute('data-profissional');
    const mensagemElement = document.getElementById('modal-mensagem');

    if (matricula.length < 6 || isNaN(matricula)) {
        mensagemElement.textContent = 'Por favor, insira uma matrícula válida (somente números, min 6 dígitos).';
        return;
    }

    // 1. Verificar se o horário ainda está disponível
    const agendaAtual = construirAgenda(data);
    const atividadeKey = `${profissional} - ${atividade}`;
    const horarioAtual = agendaAtual[atividadeKey]?.horarios.find(h => h.hora === hora);

    if (!horarioAtual || horarioAtual.vagas <= 0) {
         mensagemElement.textContent = 'Erro: Este horário não está mais disponível.';
         // Opcional: Recarregar a agenda para o usuário ver a mudança
         setTimeout(() => { fecharModalAgendamento(); renderizarAgenda(); }, 1500);
         return;
    }

    // 2. Verificar se o colaborador já tem uma reserva na mesma data/atividade
    const jaReservou = DATA_STORE.agendamentos.some(a => 
        a.data === data && 
        a.matricula === matricula && 
        a.atividade === atividade
    );

    if (jaReservou) {
        mensagemElement.textContent = `Você já tem uma reserva de ${atividade} para o dia ${data}.`;
        return;
    }

    // 3. Realizar Agendamento (simulação)
    DATA_STORE.agendamentos.push({
        data, hora, atividade, profissional, matricula
    });

    mensagemElement.style.color = 'green';
    mensagemElement.textContent = 'Agendamento confirmado com sucesso!';
    
    // Fecha o modal e recarrega a agenda
    setTimeout(() => {
        fecharModalAgendamento();
        renderizarAgenda();
    }, 1500);
});


// --- FUNÇÕES DE CONSULTA/CANCELAMENTO (MODAL) ---

document.getElementById('btn-consultar-reservas').addEventListener('click', () => {
    document.getElementById('input-consulta-matricula').value = '';
    document.getElementById('consulta-mensagem').textContent = '';
    document.getElementById('consulta-view-resultados').classList.add('hidden');
    document.getElementById('consulta-view-inicial').classList.remove('hidden');
    modalConsulta.classList.remove('hidden');
});

document.getElementById('btn-fechar-consulta').addEventListener('click', () => {
    modalConsulta.classList.add('hidden');
});

document.getElementById('btn-voltar-consulta').addEventListener('click', () => {
    document.getElementById('consulta-view-resultados').classList.add('hidden');
    document.getElementById('consulta-view-inicial').classList.remove('hidden');
    document.getElementById('consulta-mensagem').textContent = '';
});

document.getElementById('btn-buscar-reservas').addEventListener('click', buscarReservas);

function buscarReservas() {
    const matricula = document.getElementById('input-consulta-matricula').value.trim();
    const mensagemElement = document.getElementById('consulta-mensagem');
    const listaAgendamentos = document.getElementById('lista-agendamentos');
    
    if (matricula.length < 6 || isNaN(matricula)) {
        mensagemElement.textContent = 'Por favor, insira uma matrícula válida.';
        return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    
    // Filtra reservas futuras (simulação)
    const reservas = DATA_STORE.agendamentos.filter(a => 
        a.matricula === matricula && a.data >= hoje
    ).sort((a, b) => new Date(a.data) - new Date(b.data));

    listaAgendamentos.innerHTML = '';
    mensagemElement.textContent = '';

    if (reservas.length === 0) {
        mensagemElement.textContent = 'Nenhuma reserva futura encontrada para esta matrícula.';
        document.getElementById('consulta-view-resultados').classList.remove('hidden');
        document.getElementById('consulta-view-inicial').classList.add('hidden');
        return;
    }

    reservas.forEach((reserva, index) => {
        const item = document.createElement('div');
        item.classList.add('item-agendamento');
        item.innerHTML = `
            <div class="detalhes-agendamento">
                <strong>${reserva.atividade}</strong> com ${reserva.profissional}
                <span>${new Date(reserva.data).toLocaleDateString('pt-BR')} às ${reserva.hora}</span>
            </div>
            <button class="btn-cancelar-item" data-index="${index}" type="button">Cancelar</button>
        `;
        listaAgendamentos.appendChild(item);
    });

    document.querySelectorAll('.btn-cancelar-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            cancelarReserva(reservas[index], index);
        });
    });

    document.getElementById('consulta-view-inicial').classList.add('hidden');
    document.getElementById('consulta-view-resultados').classList.remove('hidden');
}

function cancelarReserva(reserva, originalIndex) {
    if (confirm(`Tem certeza que deseja cancelar a reserva de ${reserva.atividade} no dia ${reserva.data} às ${reserva.hora}?`)) {
        // Encontra o índice real no DATA_STORE.agendamentos para remover
        const indexParaRemover = DATA_STORE.agendamentos.findIndex(a => 
            a.data === reserva.data && 
            a.hora === reserva.hora && 
            a.atividade === reserva.atividade && 
            a.profissional === reserva.profissional && 
            a.matricula === reserva.matricula
        );

        if (indexParaRemover !== -1) {
            DATA_STORE.agendamentos.splice(indexParaRemover, 1);
            alert('Reserva cancelada com sucesso!');
            // Recarrega a lista de reservas e a agenda principal
            buscarReservas();
            renderizarAgenda(); 
        } else {
            alert('Erro ao cancelar: Reserva não encontrada.');
        }
    }
}


// --- LÓGICA DE ADMINISTRAÇÃO ---

/**
 * Atualiza o estado visual do painel de administração
 */
function updateAdminUI() {
    if (isAdminLoggedIn) {
        btnAdminLogin.textContent = 'Logout Admin';
        btnGerenciarAgenda.classList.remove('hidden');
        document.querySelector('.aviso-admin')?.classList.remove('hidden');
    } else {
        btnAdminLogin.textContent = 'Login Admin';
        btnGerenciarAgenda.classList.add('hidden');
        document.querySelector('.aviso-admin')?.classList.add('hidden');
    }
}

// 1. Login/Logout
btnAdminLogin.addEventListener('click', () => {
    if (isAdminLoggedIn) {
        // Se já está logado, é um logout
        if (confirm('Deseja realmente sair do modo Administrador?')) {
            isAdminLoggedIn = false;
            updateAdminUI();
            renderizarAgenda(); // Recarrega para sair do modo manutenção
        }
    } else {
        // Abre o modal de login
        document.getElementById('input-admin-password').value = '';
        document.getElementById('admin-login-mensagem').textContent = '';
        modalAdminLogin.classList.remove('hidden');
    }
});

document.getElementById('btn-cancelar-admin-login').addEventListener('click', () => {
    modalAdminLogin.classList.add('hidden');
});

document.getElementById('btn-confirmar-admin-login').addEventListener('click', () => {
    const password = document.getElementById('input-admin-password').value;
    const mensagemElement = document.getElementById('admin-login-mensagem');

    if (password === DATA_STORE.adminPassword) {
        isAdminLoggedIn = true;
        mensagemElement.style.color = 'green';
        mensagemElement.textContent = 'Login realizado com sucesso!';
        
        setTimeout(() => {
            modalAdminLogin.classList.add('hidden');
            updateAdminUI();
            renderizarAgenda(); // Recarrega para entrar no modo manutenção
        }, 800);
    } else {
        mensagemElement.style.color = 'red';
        mensagemElement.textContent = 'Senha incorreta.';
    }
});


// 2. Gerenciar Agenda (Abre o Modal)
document.getElementById('btn-gerenciar-agenda').addEventListener('click', () => {
    // 🛑 VERIFICAÇÃO DE SEGURANÇA FINAL PARA ABRIR O MODAL
    if (!isAdminLoggedIn) {
        alert('Acesso negado. Por favor, faça login como administrador.');
        return; 
    }
    
    modalAdminGerenciar.classList.remove('hidden');
    document.getElementById('admin-adicionar-mensagem').textContent = '';
    preencherSelectsAdmin();
    gerarFormularioAdmin();
});

document.getElementById('btn-fechar-admin-gerenciar').addEventListener('click', () => {
    modalAdminGerenciar.classList.add('hidden');
});

document.getElementById('btn-admin-logout').addEventListener('click', () => {
    if (confirm('Deseja realmente sair e fechar o painel de gerenciamento?')) {
        isAdminLoggedIn = false;
        modalAdminGerenciar.classList.add('hidden');
        updateAdminUI();
        renderizarAgenda();
    }
});


// 3. Funções do Painel de Gerenciamento

function preencherSelectsAdmin() {
    const selectProfissional = document.getElementById('select-admin-profissional');
    const selectAtividade = document.getElementById('select-admin-atividade');
    
    selectProfissional.innerHTML = '<option value="">Selecione um profissional</option>';
    selectAtividade.innerHTML = '<option value="">Selecione um profissional primeiro</option>';
    
    Object.keys(DATA_STORE.atividades).forEach(profissional => {
        selectProfissional.innerHTML += `<option value="${profissional}">${profissional}</option>`;
    });

    selectProfissional.onchange = () => {
        const profissional = selectProfissional.value;
        selectAtividade.innerHTML = '<option value="">Selecione uma atividade</option>';
        if (profissional) {
            Object.keys(DATA_STORE.atividades[profissional]).forEach(atividade => {
                 selectAtividade.innerHTML += `<option value="${atividade}">${atividade}</option>`;
            });
        }
    };
    
    selectAtividade.onchange = gerarFormularioAdmin;
}

function gerarFormularioAdmin() {
    const profissional = document.getElementById('select-admin-profissional').value;
    const atividade = document.getElementById('select-admin-atividade').value;
    const formContainer = document.getElementById('admin-form-dinamico');
    
    if (!profissional || !atividade) {
        formContainer.innerHTML = '<p>Selecione um Profissional e Atividade para configurar os horários.</p>';
        return;
    }
    
    const config = DATA_STORE.atividades[profissional][atividade];
    
    if (profissional === 'Geral') {
        // Formulário Simples para atividades com duração longa e vagas altas
        formContainer.innerHTML = `
            <h4>Configuração: ${atividade} (${config.vagas} vagas)</h4>
            <p><strong>Duração:</strong> ${config.duracao} minutos</p>
            <p>Entre com o horário de início (ex: 14:00):</p>
            <div class="form-group grid-admin-simples">
                <div>
                    <label for="input-admin-hora-inicio">Hora Início:</label>
                    <input type="text" id="input-admin-hora-inicio" placeholder="HH:MM">
                </div>
                <div>
                    <label for="input-admin-vagas-override">Vagas (Padrão: ${config.vagas}):</label>
                    <input type="number" id="input-admin-vagas-override" value="${config.vagas}" min="1">
                </div>
            </div>
        `;
    } else {
        // Tabela para horários fixos (Quick Massage / Reiki)
        // Isso permite gerenciar múltiplos horários sequenciais facilmente
        formContainer.innerHTML = `
            <h4>Horários Fixos (Duração: ${config.duracao} min)</h4>
            <p>Defina os horários de início sequenciais para o dia. (Ex: 09:00, 09:30, 10:00...)</p>
            <table class="tabela-horarios-fixos">
                <thead>
                    <tr><th>Hora Início</th><th>Vagas (Padrão: ${config.vagas})</th></tr>
                </thead>
                <tbody id="admin-tabela-horarios">
                    </tbody>
            </table>
            <button id="btn-add-linha-horario" class="btn-acao" type="button" style="margin-top: 10px; width: 100%;">Adicionar Mais Horário</button>
        `;
        adicionarLinhaHorarioAdmin(); // Adiciona a primeira linha

        document.getElementById('btn-add-linha-horario').addEventListener('click', adicionarLinhaHorarioAdmin);
    }
}

function adicionarLinhaHorarioAdmin() {
    const tbody = document.getElementById('admin-tabela-horarios');
    const config = DATA_STORE.atividades[document.getElementById('select-admin-profissional').value][document.getElementById('select-admin-atividade').value];
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="input-hora" placeholder="HH:MM"></td>
        <td><input type="number" class="input-vagas" value="${config.vagas}" min="1"></td>
    `;
    tbody.appendChild(row);
}

document.getElementById('btn-adicionar-horario').addEventListener('click', adicionarHorarios);

function adicionarHorarios() {
    const data = document.getElementById('input-admin-data').value;
    const profissional = document.getElementById('select-admin-profissional').value;
    const atividade = document.getElementById('select-admin-atividade').value;
    const mensagemElement = document.getElementById('admin-adicionar-mensagem');
    
    mensagemElement.style.color = 'red';

    if (!data || !profissional || !atividade) {
        mensagemElement.textContent = 'Por favor, preencha Data, Profissional e Atividade.';
        return;
    }

    const novosHorarios = [];
    const config = DATA_STORE.atividades[profissional][atividade];
    
    if (profissional === 'Geral') {
        // Lógica para atividades Simples
        const hora = document.getElementById('input-admin-hora-inicio').value.trim();
        const vagas = parseInt(document.getElementById('input-admin-vagas-override').value);

        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) {
            mensagemElement.textContent = 'Formato de hora inválido (use HH:MM).';
            return;
        }

        novosHorarios.push({ hora, vagas: vagas > 0 ? vagas : config.vagas });

    } else {
        // Lógica para Tabela de Horários Fixos
        const linhas = document.querySelectorAll('#admin-tabela-horarios tr');
        let isValid = true;

        linhas.forEach(row => {
            const inputHora = row.querySelector('.input-hora').value.trim();
            const inputVagas = parseInt(row.querySelector('.input-vagas').value);
            
            if (inputHora && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(inputHora)) {
                 novosHorarios.push({ hora: inputHora, vagas: inputVagas > 0 ? inputVagas : config.vagas });
            } else if (inputHora) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            mensagemElement.textContent = 'Um ou mais horários na tabela estão em formato inválido (HH:MM).';
            return;
        }
        if (novosHorarios.length === 0) {
            mensagemElement.textContent = 'Adicione pelo menos um horário de início na tabela.';
            return;
        }
    }
    
    // Filtra duplicatas e adiciona ao DATA_STORE.horariosFixos
    let adicionadosComSucesso = 0;
    novosHorarios.forEach(novo => {
        const jaExiste = DATA_STORE.horariosFixos.some(h => 
            h.data === data && h.hora === novo.hora && h.atividade === atividade && h.profissional === profissional
        );
        
        if (!jaExiste) {
            DATA_STORE.horariosFixos.push({
                data,
                hora: novo.hora,
                atividade,
                profissional,
                vagasMaximas: novo.vagas
            });
            adicionadosComSucesso++;
        }
    });

    if (adicionadosComSucesso > 0) {
        mensagemElement.style.color = 'green';
        mensagemElement.textContent = `${adicionadosComSucesso} horário(s) adicionado(s) com sucesso para o dia ${data}.`;
        renderizarAgenda(); // Atualiza a agenda principal
    } else {
        mensagemElement.textContent = 'Nenhum horário novo foi adicionado (possivelmente já existem).';
    }
}


function removerHorarioFixo(data, hora, atividade, profissional) {
    const index = DATA_STORE.horariosFixos.findIndex(h => 
        h.data === data && h.hora === hora && h.atividade === atividade && h.profissional === profissional
    );

    if (index !== -1) {
        // Remove agendamentos associados
        DATA_STORE.agendamentos = DATA_STORE.agendamentos.filter(a =>
             !(a.data === data && a.hora === hora && a.atividade === atividade && a.profissional === profissional)
        );
        
        // Remove o horário fixo
        DATA_STORE.horariosFixos.splice(index, 1);
        
        alert(`Horário de ${atividade} às ${hora} removido com sucesso. Agendamentos associados foram cancelados.`);
        renderizarAgenda();
    } else {
        alert('Erro: Horário fixo não encontrado para remoção.');
    }
}


// --- INICIALIZAÇÃO ---

// Define a data atual como padrão no input
const hoje = new Date().toISOString().split('T')[0];
dataInput.value = hoje;

// Inicializa a agenda e os listeners
renderizarAgenda();
dataInput.addEventListener('change', renderizarAgenda);
