/**
 * pedido.js
 * Sistema de Pedidos - Telecom
 *
 * Dois perfis de acesso com menus distintos:
 *   - Técnico  : cria pedidos, adiciona itens, verifica status, confirma retirada
 *   - Estoquista: visualiza todos os pedidos, edita itens, marca pedido como pronto
 *
 * Fluxo principal:
 *   1. Sistema exibe tela de login (escolha de perfil)
 *   2. Usuário acessa o menu correspondente ao seu perfil
 *   3. Ao sair do menu, volta para a tela de login
 */

const readline = require("readline");

// =====================
// CATÁLOGO DE ITENS
// =====================
// Equipamentos disponíveis para pedido. Cada item tem um ID único e um nome.
const itens = [
  { id: 1, nome: "ONU Fiber" },
  { id: 2, nome: "Roteador Wi-Fi" },
  { id: 3, nome: "Cabo Drop 100m" }
];

// =====================
// CLASSE: Usuario
// =====================
/**
 * Representa um usuário do sistema.
 * O campo "tipo" determina qual menu será exibido após o login.
 *
 * @param {string} nome - Nome de exibição do usuário
 * @param {string} tipo - Perfil de acesso: "Tecnico" ou "Estoquista"
 */
class Usuario {
  constructor(nome, tipo) {
    this.nome = nome;
    this.tipo = tipo; // "Tecnico" | "Estoquista"
  }
}

// =====================
// CLASSE: Pedido
// =====================
/**
 * Representa um pedido de equipamentos criado por um técnico.
 * Ciclo de vida do status:
 *   EM_SEPARACAO → PRONTO_PARA_RETIRADA → (removido ao confirmar retirada)
 *
 * @param {number}  id      - Identificador único gerado automaticamente
 * @param {Usuario} tecnico - Técnico que originou o pedido
 */
class Pedido {
  constructor(id, tecnico) {
    this.id = id;
    this.tecnico = tecnico;
    this.itens = [];               // Itens adicionados ao pedido
    this.status = "EM_SEPARACAO"; // Status inicial
  }

  /**
   * Adiciona um item ao pedido.
   * Rejeita itens nulos ou quantidades inválidas (zero ou negativo).
   *
   * @param {Object} item       - Item do catálogo a adicionar
   * @param {number} quantidade - Quantidade solicitada
   * @returns {boolean} true se adicionado, false se inválido
   */
  adicionarItem(item, quantidade) {
    if (!item || quantidade <= 0) {
      return false;
    }
    this.itens.push({ item, quantidade });
    return true;
  }

  /**
   * Remove um item do pedido pelo índice na lista (base 0).
   * Usado pelo estoquista para ajustar o pedido antes de liberar.
   *
   * @param {number} indice - Posição do item na lista (começa em 0)
   * @returns {boolean} true se removido, false se índice inválido
   */
  removerItem(indice) {
    if (indice < 0 || indice >= this.itens.length) {
      return false;
    }
    this.itens.splice(indice, 1);
    return true;
  }

  /**
   * Marca o pedido como pronto para retirada.
   * Ação exclusiva do estoquista após separar os materiais.
   */
  liberarParaRetirada() {
    this.status = "PRONTO_PARA_RETIRADA";
  }
}

// =====================
// CLASSE: SistemaPedidos
// =====================
/**
 * Gerencia todos os pedidos ativos no sistema.
 * Centraliza as operações de CRUD sobre os pedidos.
 *
 * CRUD mapeado:
 *   Create → criarPedido
 *   Read   → buscarPedido, consultarPedido, listarItensPedido, listarTodosPedidos
 *   Update → atualizarStatusPedido
 *   Delete → confirmarRetirada
 */
class SistemaPedidos {
  constructor() {
    this.pedidos = [];    // Lista de pedidos ativos
    this.proximoId = 1;   // Autoincremento de ID
  }

  // ── CREATE ────────────────────────────────────────────
  /**
   * Cria um novo pedido para o técnico informado.
   *
   * @param {Usuario} tecnico - Técnico que está fazendo o pedido
   * @returns {Pedido} O pedido criado e registrado no sistema
   */
  criarPedido(tecnico) {
    const pedido = new Pedido(this.proximoId++, tecnico);
    this.pedidos.push(pedido);
    return pedido;
  }

  // ── READ ──────────────────────────────────────────────
  /**
   * Busca um pedido pelo ID.
   *
   * @param {number} id - ID do pedido
   * @returns {Pedido|undefined} Pedido encontrado ou undefined
   */
  buscarPedido(id) {
    return this.pedidos.find(pedido => pedido.id === id);
  }

  /**
   * Retorna o status legível de um pedido.
   *
   * @param {number} id - ID do pedido
   * @returns {string} Mensagem de status
   */
  consultarPedido(id) {
    const pedido = this.buscarPedido(id);
    if (!pedido) return "Nenhum pedido encontrado";

    return pedido.status === "PRONTO_PARA_RETIRADA"
      ? "PRONTO PARA RETIRADA"
      : "EM PROCESSAMENTO";
  }

  /**
   * Retorna uma string formatada com os itens de um pedido.
   *
   * @param {number} id - ID do pedido
   * @returns {string} Lista de itens ou mensagem de erro
   */
  listarItensPedido(id) {
    const pedido = this.buscarPedido(id);
    if (!pedido) return "Nenhum pedido encontrado";
    if (pedido.itens.length === 0) return "Pedido sem itens";

    let resultado = `\nItens do Pedido #${pedido.id} (Técnico: ${pedido.tecnico.nome})\n`;
    resultado += "--------------------------------------------\n";
    pedido.itens.forEach((itemPedido, index) => {
      resultado += `  ${index + 1}. ${itemPedido.item.nome} - Qtd: ${itemPedido.quantidade}\n`;
    });
    return resultado;
  }

  /**
   * Retorna uma string com o resumo de todos os pedidos ativos.
   * Usado pelo estoquista para ter visão geral do estoque a separar.
   *
   * @returns {string} Listagem de todos os pedidos ou aviso de lista vazia
   */
  listarTodosPedidos() {
    if (this.pedidos.length === 0) {
      return "Nenhum pedido ativo no momento.";
    }

    let resultado = "\n=== PEDIDOS ATIVOS ===\n";
    this.pedidos.forEach(pedido => {
      resultado += `\nPedido #${pedido.id}`;
      resultado += ` | Técnico: ${pedido.tecnico.nome}`;
      resultado += ` | Status: ${pedido.status}`;
      resultado += ` | Itens: ${pedido.itens.length}\n`;
    });
    return resultado;
  }

  // ── UPDATE ────────────────────────────────────────────
  /**
   * Atualiza o status de um pedido.
   * Apenas o estoquista chama este método via menu.
   * Status aceitos: "EM_SEPARACAO" ou "PRONTO_PARA_RETIRADA".
   *
   * @param {number} id         - ID do pedido
   * @param {string} novoStatus - Novo status a aplicar
   * @returns {string} Confirmação ou mensagem de erro
   */
  atualizarStatusPedido(id, novoStatus) {
    const statusValidos = ["EM_SEPARACAO", "PRONTO_PARA_RETIRADA"];
    if (!statusValidos.includes(novoStatus)) return "Status inválido";

    const pedido = this.buscarPedido(id);
    if (!pedido) return "Pedido não encontrado";

    pedido.status = novoStatus;
    return `Status atualizado para: ${novoStatus}`;
  }

  // ── DELETE ────────────────────────────────────────────
  /**
   * Confirma a retirada de um pedido, removendo-o do sistema.
   * Só funciona se o pedido estiver com status "PRONTO_PARA_RETIRADA".
   * Ação executada pelo técnico após buscar os materiais no estoque.
   *
   * @param {number} id - ID do pedido
   * @returns {string} Confirmação ou mensagem de erro
   */
  confirmarRetirada(id) {
    const indice = this.pedidos.findIndex(pedido => pedido.id === id);
    if (indice === -1) return "Pedido não encontrado";

    const pedido = this.pedidos[indice];
    if (pedido.status !== "PRONTO_PARA_RETIRADA") {
      return "ERRO: Pedido ainda em processamento";
    }

    this.pedidos.splice(indice, 1); // Remove o pedido da lista
    return "Pedido finalizado com sucesso";
  }
}

// =====================
// INSTÂNCIAS GLOBAIS
// =====================
// Sistema compartilhado entre os dois perfis — ambos operam sobre os mesmos pedidos.
const sistema = new SistemaPedidos();

// Usuários pré-cadastrados que aparecem na tela de login
const usuarioTecnico    = new Usuario("Thiago", "Tecnico");
const usuarioEstoquista = new Usuario("Carlos", "Estoquista");

// =====================
// INTERFACE DE TERMINAL
// =====================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// =====================
// MENU DO TÉCNICO
// =====================
/**
 * Menu exclusivo do perfil Técnico.
 * Permite: criar pedidos, verificar status dos próprios pedidos e confirmar retirada.
 * O técnico NÃO pode alterar status nem editar itens — isso é função do estoquista.
 */
function menuTecnico() {
  console.log("\n╔══════════════════════════╗");
  console.log(`║  TÉCNICO: ${usuarioTecnico.nome.padEnd(14)}║`);
  console.log("╠══════════════════════════╣");
  console.log("║ 1 - Criar pedido         ║");
  console.log("║ 2 - Verificar status     ║");
  console.log("║ 3 - Ver itens do pedido  ║");
  console.log("║ 4 - Confirmar retirada   ║");
  console.log("║ 0 - Sair (trocar perfil) ║");
  console.log("╚══════════════════════════╝");

  rl.question("\nEscolha uma opção: ", (opcao) => {
    switch (opcao) {

      // ── Opção 1: Criar novo pedido ──────────────────────
      case "1":
        criarPedidoInterativo();
        break;

      // ── Opção 2: Consultar status de um pedido ──────────
      case "2":
        rl.question("ID do pedido: ", (id) => {
          console.log("\nStatus:", sistema.consultarPedido(Number(id)));
          menuTecnico();
        });
        break;

      // ── Opção 3: Listar itens de um pedido ──────────────
      case "3":
        rl.question("ID do pedido: ", (id) => {
          console.log(sistema.listarItensPedido(Number(id)));
          menuTecnico();
        });
        break;

      // ── Opção 4: Confirmar retirada (DELETE) ─────────────
      case "4":
        rl.question("ID do pedido: ", (id) => {
          console.log(sistema.confirmarRetirada(Number(id)));
          menuTecnico();
        });
        break;

      // ── Opção 0: Voltar à tela de login ─────────────────
      case "0":
        console.log("\nSaindo do perfil Técnico...");
        login();
        break;

      default:
        console.log("Opção inválida.");
        menuTecnico();
    }
  });
}

// =====================
// MENU DO ESTOQUISTA
// =====================
/**
 * Menu exclusivo do perfil Estoquista.
 * Permite: ver todos os pedidos, editar itens de um pedido,
 * marcar pedido como pronto para retirada e devolver ao processamento.
 * O estoquista NÃO cria pedidos — isso é função do técnico.
 */
function menuEstoquista() {
  console.log("\n╔════════════════════════════════╗");
  console.log(`║  ESTOQUISTA: ${usuarioEstoquista.nome.padEnd(18)}║`);
  console.log("╠════════════════════════════════╣");
  console.log("║ 1 - Ver todos os pedidos       ║");
  console.log("║ 2 - Ver itens de um pedido     ║");
  console.log("║ 3 - Adicionar item ao pedido   ║");
  console.log("║ 4 - Remover item do pedido     ║");
  console.log("║ 5 - Marcar como pronto         ║");
  console.log("║ 6 - Devolver para processamento║");
  console.log("║ 0 - Sair (trocar perfil)       ║");
  console.log("╚════════════════════════════════╝");

  rl.question("\nEscolha uma opção: ", (opcao) => {
    switch (opcao) {

      // ── Opção 1: Listar todos os pedidos (READ geral) ────
      case "1":
        console.log(sistema.listarTodosPedidos());
        menuEstoquista();
        break;

      // ── Opção 2: Ver itens de um pedido específico ───────
      case "2":
        rl.question("ID do pedido: ", (id) => {
          console.log(sistema.listarItensPedido(Number(id)));
          menuEstoquista();
        });
        break;

      // ── Opção 3: Adicionar item a um pedido (UPDATE) ─────
      case "3":
        rl.question("ID do pedido: ", (id) => {
          const pedido = sistema.buscarPedido(Number(id));
          if (!pedido) {
            console.log("Pedido não encontrado.");
            return menuEstoquista();
          }

          // Exibe catálogo e pergunta qual item adicionar
          console.log("\nItens disponíveis:");
          itens.forEach(item => console.log(`  ${item.id} - ${item.nome}`));

          rl.question("ID do item a adicionar: ", (itemId) => {
            const item = itens.find(i => i.id === Number(itemId));
            if (!item) {
              console.log("Item não encontrado.");
              return menuEstoquista();
            }

            rl.question("Quantidade: ", (qtd) => {
              const quantidade = Number(qtd);
              if (isNaN(quantidade) || quantidade <= 0) {
                console.log("Quantidade inválida.");
                return menuEstoquista();
              }

              pedido.adicionarItem(item, quantidade);
              console.log(`Item "${item.nome}" adicionado ao pedido #${pedido.id}.`);
              menuEstoquista();
            });
          });
        });
        break;

      // ── Opção 4: Remover item de um pedido (UPDATE) ──────
      case "4":
        rl.question("ID do pedido: ", (id) => {
          const pedido = sistema.buscarPedido(Number(id));
          if (!pedido) {
            console.log("Pedido não encontrado.");
            return menuEstoquista();
          }

          // Mostra os itens com numeração para o estoquista escolher qual remover
          console.log(sistema.listarItensPedido(Number(id)));

          rl.question("Número do item a remover (conforme lista acima): ", (num) => {
            const indice = Number(num) - 1; // Converte para índice base 0
            const removido = pedido.removerItem(indice);
            console.log(removido ? "Item removido com sucesso." : "Número inválido.");
            menuEstoquista();
          });
        });
        break;

      // ── Opção 5: Marcar pedido como pronto (UPDATE) ──────
      case "5":
        rl.question("ID do pedido: ", (id) => {
          console.log(sistema.atualizarStatusPedido(Number(id), "PRONTO_PARA_RETIRADA"));
          menuEstoquista();
        });
        break;

      // ── Opção 6: Devolver pedido ao processamento (UPDATE)
      case "6":
        rl.question("ID do pedido: ", (id) => {
          console.log(sistema.atualizarStatusPedido(Number(id), "EM_SEPARACAO"));
          menuEstoquista();
        });
        break;

      // ── Opção 0: Voltar à tela de login ──────────────────
      case "0":
        console.log("\nSaindo do perfil Estoquista...");
        login();
        break;

      default:
        console.log("Opção inválida.");
        menuEstoquista();
    }
  });
}

// =====================
// FUNÇÃO: criarPedidoInterativo
// =====================
/**
 * Guia o técnico pelo processo de criação de um pedido no terminal.
 * Exibe o catálogo, coleta os itens desejados e encerra ao digitar 0.
 * O pedido é salvo com status EM_SEPARACAO — o estoquista irá processá-lo.
 */
function criarPedidoInterativo() {
  const pedido = sistema.criarPedido(usuarioTecnico);
  console.log(`\nPedido #${pedido.id} criado! Adicione os itens necessários.`);

  // Função interna recursiva: continua pedindo itens até o técnico digitar 0
  function adicionarItens() {
    console.log("\nItens disponíveis:");
    itens.forEach(item => console.log(`  ${item.id} - ${item.nome}`));

    rl.question("\nDigite o ID do item (0 para finalizar): ", (itemId) => {
      // Técnico finalizou — pedido vai para o estoquista separar
      if (itemId === "0") {
        console.log(`\nPedido #${pedido.id} enviado para o estoque!`);
        console.log("Aguarde o estoquista separar os materiais.");
        return menuTecnico();
      }

      const item = itens.find(i => i.id === Number(itemId));
      if (!item) {
        console.log("Item não encontrado.");
        return adicionarItens();
      }

      rl.question("Quantidade: ", (qtd) => {
        const quantidade = Number(qtd);
        if (isNaN(quantidade) || quantidade <= 0) {
          console.log("Quantidade inválida.");
          return adicionarItens();
        }

        pedido.adicionarItem(item, quantidade);
        console.log(`"${item.nome}" adicionado.`);
        adicionarItens(); // Continua para o próximo item
      });
    });
  }

  adicionarItens();
}

// =====================
// TELA DE LOGIN
// =====================
/**
 * Ponto de entrada do sistema. Exibe os perfis disponíveis e direciona
 * o usuário para o menu correspondente ao perfil escolhido.
 * Ao sair de qualquer menu, o sistema retorna aqui.
 */
function login() {
  console.log("\n╔══════════════════════════════╗");
  console.log("║    SISTEMA TELECOM - LOGIN   ║");
  console.log("╠══════════════════════════════╣");
  console.log(`║ 1 - Técnico  (${usuarioTecnico.nome.padEnd(14)})║`);
  console.log(`║ 2 - Estoquista (${usuarioEstoquista.nome.padEnd(12)})║`);
  console.log("║ 0 - Encerrar sistema         ║");
  console.log("╚══════════════════════════════╝");

  rl.question("\nQuem está acessando? ", (opcao) => {
    switch (opcao) {
      case "1":
        // Direciona para o menu com funcionalidades do técnico
        console.log(`\nBem-vindo, ${usuarioTecnico.nome}!`);
        menuTecnico();
        break;

      case "2":
        // Direciona para o menu com funcionalidades do estoquista
        console.log(`\nBem-vindo, ${usuarioEstoquista.nome}!`);
        menuEstoquista();
        break;

      case "0":
        console.log("\nSistema encerrado. Até logo!");
        rl.close();
        break;

      default:
        console.log("Opção inválida.");
        login();
    }
  });
}

// =====================
// PONTO DE ENTRADA
// =====================
// Inicia o sistema pela tela de login ao rodar o arquivo.
login();

// =====================
// EXPORTAÇÕES
// =====================
// Exporta classes e catálogo para os testes automatizados (pedido.test.js).
module.exports = {
  SistemaPedidos,
  Usuario,
  Pedido,
  itens
};
