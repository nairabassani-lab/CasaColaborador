const apiUrl = 'https://script.google.com/macros/s/AKfycbzzShDDLK89kO3fgMNNconr-5Y3-PbtkwMacSPwERieNXKEisp3mZxzqfIXA1arv8ZJ/exec';


// --- Seletores de Elementos ---
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

let todosOsAgendamentos = [];
let agendamentoAtual = {};
let celulaClicada = null;

// --- Funções Principais ---
async function carregarAgenda() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Erro ao carregar os dados da API.');
        todosOsAgendamentos = await response.json();
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        const hojeFormatado = hoje.toISOString().slice(0, 10);
        
        // Verifica se o seletor de data ainda existe antes de manipulá-lo
        if (seletorData) {
            seletorData.value = hojeFormatado;
            renderizarAgendaParaData(hojeFormatado);
            seletorData.addEventListener('change', () => renderizarAgendaParaData(seletorData.value));
        } else {
             renderizarAgendaParaData(hojeFormatado); // Renderiza mesmo sem o seletor
        }

    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `<p class="loading">${error.message}</p>`;
    }
}

function renderizarAgendaParaData(dataCalendario) {
    const [ano, mes, dia] = dataCalendario.split('-');
    const dataFormatoPlanilha = `${dia}/${mes}/${ano}`;
    atualizarDiaDaSemana(dataCalendario);
    const dadosProcessados = processarDadosParaGrade(dataFormatoPlanilha);
    container.innerHTML = '';
    if (Object.keys(dadosProcessados).length === 0) {
        container.innerHTML = `<p class="loading">Nenhum horário encontrado para a data ${dataFormatoPlanilha}.</p>`;
        return;
    }
    for (const nomeAtividade in dadosProcessados) {
        const { horarios, profissionais, grade } = dadosProcessados[nomeAtividade];
        const titulo = document.createElement('h2');
        titulo.className = 'titulo-atividade';
        titulo.textContent = nomeAtividade;
        container.appendChild(titulo);
        let tabelaHtml = `<div class="tabela-container"><table class="tabela-agenda"><thead><tr><th>Horário</th>${profissionais.map(p => `<th>${p}</th>`).join('')}</tr></thead><tbody>`;
        horarios.forEach(horario => {
            tabelaHtml += `<tr><td class="horario-col">${horario}</td>`;
            profissionais.forEach(profissional => {
                const agendamento = grade[horario][profissional];
                let statusHtml = '<div class="status-indisponivel">-</div>';
                if (agendamento) {
                    const vagasTotais = parseInt(agendamento.Vagas) || 0;
                    const reservas = agendamento.Reserva ? agendamento.Reserva.split(',').filter(Boolean) : [];
                    const vagasOcupadas = reservas.length;
                    const vagasDisponiveis = vagasTotais - vagasOcupadas;
                    let statusClass = '';
                    let dataAttributes = '';
                    if (vagasDisponiveis > 0) {
                        statusClass = 'status-disponivel';
                        dataAttributes = `data-atividade="${nomeAtividade}" data-profissional="${profissional}" data-horario="${horario}" data-data="${dataFormatoPlanilha}"`;
                    } else {
                        statusClass = 'status-lotado';
                    }
                    statusHtml = `<div class="status-cell ${statusClass}" ${dataAttributes}>${vagasDisponiveis} <span>Vaga(s)</span></div>`;
                }
                tabelaHtml += `<td>${statusHtml}</td>`;
            });
            tabelaHtml += `</tr>`;
        });
        tabelaHtml += `</tbody></table></div>`;
        titulo.insertAdjacentHTML('afterend', tabelaHtml);
    }
}

async function confirmarAgendamento() {
    const matricula = inputMatricula.value.trim();
    if (!matricula) {
        modalMensagem.textContent = 'Por favor, insira sua matrícula.';
        modalMensagem.style.color = 'red';
        return;
    }
    btnConfirmar.disabled = true;
    modalMensagem.textContent = 'Agendando, aguarde...';
    modalMensagem.style.color = 'var(--cinza-texto)';
    const params = new URLSearchParams({
        action: 'book',
        ...agendamentoAtual,
        matricula: matricula
    });
    const requestUrl = `${apiUrl}?${params.toString()}`;
    try {
        const response = await fetch(requestUrl);
        const result = await response.json();
        if (result.status === "success") {
            modalMensagem.textContent = result.message;
            modalMensagem.style.color = 'var(--verde-moinhos)';
            await carregarAgenda();
            const [dia, mes, ano] = agendamentoAtual.data.split('/');
            seletorData.value = `${ano}-${mes}-${dia}`;
            setTimeout(fecharModalAgendamento, 2000);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Erro ao enviar agendamento:', error);
        modalMensagem.textContent = error.message || 'Erro de comunicação. Tente novamente.';
        modalMensagem.style.color = 'red';
    } finally {
        btnConfirmar.disabled = false;
    }
}

function abrirModalAgendamento(detalhes) {
    agendamentoAtual = detalhes;
    modalDetalhes.innerHTML = `<li><strong>Data:</strong> ${detalhes.data}</li><li><strong>Horário:</strong> ${detalhes.horario}</li><li><strong>Atividade:</strong> ${detalhes.atividade}</li><li><strong>Profissional:</strong> ${detalhes.profissional}</li>`;
    inputMatricula.value = '';
    modalMensagem.innerHTML = '';
    btnConfirmar.disabled = false;
    modalAgendamento.classList.remove('hidden');
}

function fecharModalAgendamento() {
    modalAgendamento.classList.add('hidden');
}

function abrirModalConsulta() {
    consultaViewInicial.classList.remove('hidden');
    consultaViewResultados.classList.add('hidden');
    inputConsultaMatricula.value = '';
    consultaMensagem.textContent = '';
    modalConsulta.classList.remove('hidden');
}

function fecharModalConsulta() {
    modalConsulta.classList.add('hidden');
}

async function buscarReservas() {
    const matricula = inputConsultaMatricula.value.trim();
    if (!matricula) {
        consultaMensagem.textContent = 'Por favor, digite sua matrícula.';
        consultaMensagem.style.color = 'red';
        return;
    }
    consultaMensagem.textContent = 'Buscando...';
    consultaMensagem.style.color = 'var(--cinza-texto)';
    const params = new URLSearchParams({ action: 'getMyBookings', matricula });
    try {
        const response = await fetch(`${apiUrl}?${params.toString()}`);
        const result = await response.json();
        if (result.status === "success") {
            renderizarListaReservas(result.data);
            consultaViewInicial.classList.add('hidden');
            consultaViewResultados.classList.remove('hidden');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        consultaMensagem.textContent = error.message;
        consultaMensagem.style.color = 'red';
    }
}

function renderizarListaReservas(reservas) {
    listaAgendamentos.innerHTML = '';
    if (reservas.length === 0) {
        listaAgendamentos.innerHTML = '<p>Nenhum agendamento futuro encontrado para esta matrícula.</p>';
        return;
    }
    reservas.forEach(reserva => {
        const item = document.createElement('div');
        item.className = 'item-agendamento';
        item.innerHTML = `
            <div class="detalhes-agendamento">
                <strong>${reserva.atividade}</strong>
                <span>${reserva.data} às ${reserva.horario} com ${reserva.profissional}</span>
            </div>
            <button class="btn-cancelar-item" data-id="${reserva.id}" data-matricula="${inputConsultaMatricula.value.trim()}">Cancelar</button>
        `;
        listaAgendamentos.appendChild(item);
    });
}

async function cancelarReserva(event) {
    if (!event.target.classList.contains('btn-cancelar-item')) return;
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    const { id, matricula } = event.target.dataset;
    consultaMensagem.textContent = 'Cancelando...';
    consultaMensagem.style.color = 'var(--cinza-texto)';
    const params = new URLSearchParams({ action: 'cancelBooking', bookingId: id, matricula });
    try {
        const response = await fetch(`${apiUrl}?${params.toString()}`);
        const result = await response.json();
        if (result.status === "success") {
            consultaMensagem.textContent = result.message;
            consultaMensagem.style.color = 'var(--verde-moinhos)';
            event.target.closest('.item-agendamento').remove();
            carregarAgenda();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        consultaMensagem.textContent = error.message;
        consultaMensagem.style.color = 'red';
    }
}

// --- Event Listeners ---
container.addEventListener('click', function(event) {
    const target = event.target.closest('.status-disponivel, .titulo-atividade');
    if (!target) return;
    if (target.classList.contains('titulo-atividade')) {
        target.classList.toggle('ativo');
        const painel = target.nextElementSibling;
        if (painel.style.maxHeight) {
            painel.style.maxHeight = null;
            painel.style.padding = "0 10px";
        } else {
            painel.style.padding = "10px";
            painel.style.maxHeight = painel.scrollHeight + "px";
        }
    }
    if (target.classList.contains('status-disponivel')) {
        celulaClicada = target;
        abrirModalAgendamento(target.dataset);
    }
});
btnCancelarAgendamento.addEventListener('click', fecharModalAgendamento);
btnConfirmar.addEventListener('click', confirmarAgendamento);
btnConsultarReservas.addEventListener('click', abrirModalConsulta);
btnFecharConsulta.addEventListener('click', fecharModalConsulta);
btnVoltarConsulta.addEventListener('click', () => {
    consultaViewInicial.classList.remove('hidden');
    consultaViewResultados.classList.add('hidden');
    consultaMensagem.textContent = '';
});
btnBuscarReservas.addEventListener('click', buscarReservas);
listaAgendamentos.addEventListener('click', cancelarReserva);

// --- Funções Auxiliares ---
function atualizarDiaDaSemana(dataCalendario) {
    const dataObj = new Date(dataCalendario + 'T00:00:00');
    let diaDaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    diaDaSemana = diaDaSemana.replace('-feira', '');
    diaSemanaSpan.textContent = diaDaSemana;
}

function processarDadosParaGrade(dataSelecionada) {
    const dadosFiltrados = todosOsAgendamentos.filter(item => item.Data === dataSelecionada);
    const atividades = {};
    const dadosPorAtividade = dadosFiltrados.reduce((acc, item) => {
        (acc[item.Atividade] = acc[item.Atividade] || []).push(item);
        return acc;
    }, {});
    for (const nomeAtividade in dadosPorAtividade) {
        const agendamentos = dadosPorAtividade[nomeAtividade];
        const horarios = [...new Set(agendamentos.map(item => item.Horario))].sort();
        const profissionais = [...new Set(agendamentos.map(item => item.Profissional))].sort();
        const grade = {};
        horarios.forEach(horario => {
            grade[horario] = {};
            profissionais.forEach(profissional => {
                const agendamento = agendamentos.find(item => item.Horario === horario && item.Profissional === profissional);
                grade[horario][profissional] = agendamento;
            });
        });
        atividades[nomeAtividade] = { horarios, profissionais, grade };
    }
    return atividades;
}
carregarAgenda();

document.addEventListener('DOMContentLoaded', () => {
    // ... (Seu código inicial de captura de botões e a lógica de login do administrador permanece aqui)
    const btnAdminLogin = document.getElementById('btn-admin-login');
    const SENHA_ADMIN_CORRETA = "admin123"; 

    // NOVOS ELEMENTOS DO ADMIN
    const modalAdminGerenciar = document.getElementById('modal-admin-gerenciar');
    const btnAdminFechar = document.getElementById('btn-admin-fechar');
    const btnAdminAdicionar = document.getElementById('btn-admin-adicionar');
    
    // Inputs do formulário de adição
    const inputAdminData = document.getElementById('input-admin-data');
    const inputAdminHora = document.getElementById('input-admin-hora');
    const inputAdminVagas = document.getElementById('input-admin-vagas');
    const adminMensagemAdicao = document.getElementById('admin-mensagem-adicao');

    // ... (Lógica de login Admin)
    btnAdminLogin.addEventListener('click', () => {
        // ... (Verificação da senha aqui)
        const senhaInserida = prompt("Insira a senha de administrador:");
        if (senhaInserida === SENHA_ADMIN_CORRETA) {
            alert("Login de Administrador bem-sucedido!");
            ativarModoAdmin(); 
        } else if (senhaInserida !== null && senhaInserida.trim() !== "") {
            alert("Senha incorreta. Acesso negado.");
        }
    });
    // ... (Fim da lógica de login Admin)


    // ----------------------------------------------------
    // FUNÇÃO PRINCIPAL DO MODO ADMIN
    // ----------------------------------------------------

    function ativarModoAdmin() {
        console.log("Modo Administrador Ativado.");
        
        let btnGerenciar = document.getElementById('btn-gerenciar-agenda');
        if (!btnGerenciar) {
            // Cria o botão "Gerenciar Agenda" se ele não existir
            btnGerenciar = document.createElement('button');
            btnGerenciar.id = 'btn-gerenciar-agenda';
            btnGerenciar.classList.add('btn-acao', 'btn-admin');
            btnGerenciar.textContent = 'Gerenciar Agenda (Admin)';

            const seletorContainer = document.getElementById('seletor-container');
            if (seletorContainer) {
                 // Adiciona o novo botão
                 seletorContainer.appendChild(btnGerenciar);
            }
            
            // Lógica para ABRIR o modal de gerenciamento
            btnGerenciar.addEventListener('click', () => {
                 modalAdminGerenciar.classList.remove('hidden');
            });

            // Opcional: Desabilitar o botão de login após o sucesso
            btnAdminLogin.disabled = true; 
            btnAdminLogin.textContent = 'Modo Admin Ativo';
        }
    }

    // ----------------------------------------------------
    // LÓGICA DO MODAL DE GERENCIAMENTO
    // ----------------------------------------------------

    // Fechar Modal
    btnAdminFechar.addEventListener('click', () => {
        modalAdminGerenciar.classList.add('hidden');
    });

    // Lógica para ADICIONAR Horário
    btnAdminAdicionar.addEventListener('click', () => {
        const data = inputAdminData.value;
        const hora = inputAdminHora.value;
        const vagas = parseInt(inputAdminVagas.value, 10);

        // Validação básica
        if (!data || !hora || isNaN(vagas) || vagas <= 0) {
            adminMensagemAdicao.textContent = "Por favor, preencha todos os campos corretamente.";
            adminMensagemAdicao.style.color = "red";
            return;
        }

        // --- SIMULAÇÃO DA INCLUSÃO DE DADOS ---
        // Em um sistema real, você enviaria esta informação para o backend (servidor)
        // para ser salva em um banco de dados.

        console.log(`Tentando adicionar: Data: ${data}, Horário: ${hora}, Vagas: ${vagas}`);

        // Aqui, você chamaria uma função de backend, por exemplo:
        // salvarNovoHorario({ data, hora, vagas })
        
        // Simulação de sucesso:
        adminMensagemAdicao.textContent = `Horário de ${hora} na data ${data} com ${vagas} vagas ADICIONADO (Simulação).`;
        adminMensagemAdicao.style.color = "green";

        // Limpar campos após sucesso
        inputAdminData.value = '';
        inputAdminHora.value = '';
        inputAdminVagas.value = '1';
        
        // Opcional: Recarregar a agenda principal para mostrar o novo horário
        // carregarAgenda(data); 
    });


    // ----------------------------------------------------
    // (O restante do seu código JavaScript, como a lógica de agendamento e consulta, continua aqui)
    // ----------------------------------------------------
});

document.addEventListener('DOMContentLoaded', () => {
    // VARIÁVEL DE ESTADO GLOBAL PARA O MODO ADMIN
    let isAdminMode = false; 

    // O restante das suas constantes e lógica de captura de elementos...
    // ...

                          function ativarModoAdmin() {
        console.log("Modo Administrador Ativado.");
        
        // **NOVO: Define o estado de administrador**
        isAdminMode = true; 
        
        // Recarregar a agenda para aplicar estilos e eventos de exclusão
        // Você precisará garantir que a função 'carregarAgenda' exista e chame 'renderizarHorarios'.
        const dataSelecionada = document.getElementById('seletor-data').value;
        if (dataSelecionada) {
            // Se houver uma data selecionada, recarrega
            carregarAgenda(dataSelecionada); 
        } else {
            // Se não houver, apenas informa que o modo está ativo
             document.getElementById('agenda-container').innerHTML = 
                 '<p class="aviso-admin">Modo Administrador Ativo. Selecione uma data para gerenciar os horários.</p>';
        }


        // ... (O restante da lógica de criação do botão 'Gerenciar Agenda' permanece o mesmo)
        let btnGerenciar = document.getElementById('btn-gerenciar-agenda');
        if (!btnGerenciar) {
            // ... (Lógica para criar e adicionar o botão 'Gerenciar Agenda' e abrir o modal)
            
            // ... (Continua a lógica de criação do botão)
            btnGerenciar.addEventListener('click', () => {
                 modalAdminGerenciar.classList.remove('hidden');
            });

            btnAdminLogin.disabled = true; 
            btnAdminLogin.textContent = 'Modo Admin Ativo';
        }
    }

    // Exemplo de como sua função de renderização DEVE ser modificada
function renderizarHorario(horario, vagasDisponiveis, container) {
    const horarioElement = document.createElement('div');
    horarioElement.classList.add('horario-slot');
    horarioElement.textContent = `${horario} (${vagasDisponiveis} vagas)`;

    if (isAdminMode) {
        // MODO ADMIN: Permite Exclusão
        horarioElement.classList.add('horario-admin-excluir'); // Para estilização visual
        horarioElement.title = "Clique para EXCLUIR este horário.";

        horarioElement.addEventListener('click', () => {
            confirmarExclusao(horario);
        });

    } else if (vagasDisponiveis > 0) {
        // MODO USUÁRIO NORMAL: Permite Agendamento
        horarioElement.classList.add('disponivel');
        horarioElement.addEventListener('click', () => {
            // Sua lógica original de agendamento aqui
        });

    } else {
        // MODO USUÁRIO NORMAL: Indisponível
        horarioElement.classList.add('indisponivel');
    }
    
    container.appendChild(horarioElement);
}

// ----------------------------------------------------
// NOVA FUNÇÃO DE CONFIRMAÇÃO DE EXCLUSÃO
// ----------------------------------------------------

function confirmarExclusao(horario) {
    const dataSelecionada = document.getElementById('seletor-data').value;
    
    if (confirm(`Tem certeza que deseja excluir o horário: ${horario} na data ${dataSelecionada}? Esta ação é irreversível (simulação).`)) {
        
        // --- LÓGICA DE EXCLUSÃO REAL (SIMULAÇÃO) ---
        
        // Em um sistema real, você enviaria a requisição de exclusão para o backend:
        // excluirHorario({ data: dataSelecionada, hora: horario })
        
        alert(`Horário ${horario} EXCLUÍDO com sucesso (SIMULAÇÃO)!`);

        // Recarregar a agenda para remover o item visualmente
        carregarAgenda(dataSelecionada); 
    }
}

// ----------------------------------------------------
// GARANTIR QUE 'carregarAgenda' FUNCIONE
// ----------------------------------------------------

// Você precisará garantir que sua função 'carregarAgenda' chame 'renderizarHorario'.
function carregarAgenda(data) {
    // 1. Simulação de obtenção de dados (em um sistema real, seria uma chamada fetch/AJAX)
    const agendaContainer = document.getElementById('agenda-container');
    agendaContainer.innerHTML = ''; // Limpa a agenda

    const horariosExemplo = [
        { hora: '09:00', vagas: isAdminMode ? 5 : 2 }, // Exemplo: admin pode ter mais info
        { hora: '10:00', vagas: 0 },
        { hora: '11:00', vagas: 4 },
        // ... outros horários
    ];

    horariosExemplo.forEach(item => {
        renderizarHorario(item.hora, item.vagas, agendaContainer);
    });

    // Se o modo admin estiver ativo, adicione um aviso visual
    if (isAdminMode) {
        agendaContainer.insertAdjacentHTML('afterbegin', '<p class="aviso-admin">Modo ADMIN: Clique em um horário abaixo para EXCLUIR.</p>');
    }
}

// Adiciona um listener para a mudança de data que dispara o carregamento
document.getElementById('seletor-data').addEventListener('change', (e) => {
    carregarAgenda(e.target.value);
});

// Chame carregarAgenda() uma vez no início, se quiser que algo apareça
// ...

                          
