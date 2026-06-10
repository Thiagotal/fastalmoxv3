/**
 * pedido.test.js
 * Testes automatizados - Sistema de Pedidos Telecom
 *
 * Cobre os dois perfis de usuário do sistema:
 *   - Técnico    : criar pedido, consultar status, confirmar retirada
 *   - Estoquista : visualizar pedidos, editar itens, atualizar status
 *
 * Para rodar: npm test
 */

const {
  SistemaPedidos,
  Usuario,
  Pedido,
  itens
} = require("./pedido");

describe("Sistema de Pedidos - Dois Perfis de Usuário", () => {

  // Instâncias reiniciadas antes de cada teste para garantir isolamento
  let sistema;
  let tecnico;
  let estoquista;

  beforeEach(() => {
    sistema     = new SistemaPedidos();
    tecnico     = new Usuario("Thiago", "Tecnico");
    estoquista  = new Usuario("Carlos", "Estoquista");
  });

  // ═══════════════════════════════════════════════════════
  // PERFIL: TÉCNICO
  // ═══════════════════════════════════════════════════════

  // -------------------------------------------------------
  // Teste 1 | CREATE - Criar pedido
  // O técnico cria um pedido; sistema gera ID e status inicial
  // -------------------------------------------------------
  test("[Técnico] Deve criar pedido com ID e status corretos", () => {
    const pedido = sistema.criarPedido(tecnico);

    expect(pedido.id).toBe(1);
    expect(pedido.status).toBe("EM_SEPARACAO");
    expect(pedido.tecnico.nome).toBe("Thiago");
  });

  // -------------------------------------------------------
  // Teste 2 | CREATE - Adicionar item válido ao pedido
  // O técnico seleciona item do catálogo com quantidade positiva
  // -------------------------------------------------------
  test("[Técnico] Deve adicionar item válido ao pedido", () => {
    const pedido = sistema.criarPedido(tecnico);

    expect(pedido.adicionarItem(itens[0], 2)).toBe(true);
    expect(pedido.itens.length).toBe(1);
  });

  // -------------------------------------------------------
  // Teste 3 | Validação - Rejeitar item inválido
  // Item nulo ou quantidade zero/negativa não deve ser aceito
  // -------------------------------------------------------
  test("[Técnico] Não deve adicionar item com dados inválidos", () => {
    const pedido = sistema.criarPedido(tecnico);

    expect(pedido.adicionarItem(null, 1)).toBe(false);      // Item nulo
    expect(pedido.adicionarItem(itens[0], 0)).toBe(false);  // Quantidade zero
    expect(pedido.adicionarItem(itens[0], -3)).toBe(false); // Quantidade negativa
  });

  // -------------------------------------------------------
  // Teste 4 | READ - Consultar status em diferentes fases
  // O técnico verifica o status antes e depois do estoquista liberar
  // -------------------------------------------------------
  test("[Técnico] Deve consultar status em processamento e pronto", () => {
    const pedido = sistema.criarPedido(tecnico);

    // Antes da liberação pelo estoquista
    expect(sistema.consultarPedido(pedido.id)).toBe("EM PROCESSAMENTO");

    // Estoquista libera o pedido
    pedido.liberarParaRetirada();

    // Após a liberação
    expect(sistema.consultarPedido(pedido.id)).toBe("PRONTO PARA RETIRADA");
  });

  // -------------------------------------------------------
  // Teste 5 | READ - Consultar pedido inexistente
  // Garante mensagem adequada para ID que não existe
  // -------------------------------------------------------
  test("[Técnico] Deve retornar erro ao consultar pedido inexistente", () => {
    expect(sistema.consultarPedido(999)).toBe("Nenhum pedido encontrado");
  });

  // -------------------------------------------------------
  // Teste 6 | READ - Buscar pedido por ID
  // -------------------------------------------------------
  test("[Técnico] Deve buscar pedido existente e retornar undefined para inexistente", () => {
    const pedido = sistema.criarPedido(tecnico);

    expect(sistema.buscarPedido(pedido.id)).toBeDefined();
    expect(sistema.buscarPedido(999)).toBeUndefined();
  });

  // -------------------------------------------------------
  // Teste 7 | DELETE - Fluxo completo de retirada
  // O técnico tenta retirar antes e depois do estoquista liberar
  // -------------------------------------------------------
  test("[Técnico] Fluxo completo: tentativa antecipada → liberação → retirada", () => {
    const pedido = sistema.criarPedido(tecnico);

    // Tentativa de retirada antes da liberação deve falhar
    expect(sistema.confirmarRetirada(pedido.id))
      .toBe("ERRO: Pedido ainda em processamento");

    // Estoquista libera o pedido
    pedido.liberarParaRetirada();

    // Técnico confirma retirada com sucesso
    expect(sistema.confirmarRetirada(pedido.id))
      .toBe("Pedido finalizado com sucesso");

    // Pedido deve ser removido do sistema após a retirada
    expect(sistema.buscarPedido(pedido.id)).toBeUndefined();
  });

  // ═══════════════════════════════════════════════════════
  // PERFIL: ESTOQUISTA
  // ═══════════════════════════════════════════════════════

  // -------------------------------------------------------
  // Teste 8 | READ - Listar todos os pedidos ativos
  // O estoquista visualiza o painel geral de pedidos
  // -------------------------------------------------------
  test("[Estoquista] Deve listar todos os pedidos ativos", () => {
    sistema.criarPedido(tecnico);
    sistema.criarPedido(tecnico);

    const lista = sistema.listarTodosPedidos();

    expect(lista).toContain("Pedido #1");
    expect(lista).toContain("Pedido #2");
    expect(lista).toContain("Thiago");
  });

  // -------------------------------------------------------
  // Teste 9 | READ - Listar pedidos quando não há nenhum
  // -------------------------------------------------------
  test("[Estoquista] Deve avisar quando não há pedidos ativos", () => {
    expect(sistema.listarTodosPedidos()).toBe("Nenhum pedido ativo no momento.");
  });

  // -------------------------------------------------------
  // Teste 10 | READ - Listar itens de um pedido com conteúdo
  // -------------------------------------------------------
  test("[Estoquista] Deve listar itens adicionados pelo técnico", () => {
    const pedido = sistema.criarPedido(tecnico);
    pedido.adicionarItem(itens[0], 1); // ONU Fiber
    pedido.adicionarItem(itens[1], 3); // Roteador Wi-Fi

    const lista = sistema.listarItensPedido(pedido.id);

    expect(lista).toContain("ONU Fiber");
    expect(lista).toContain("Roteador Wi-Fi");
    expect(lista).toContain("Thiago"); // Nome do técnico no cabeçalho
  });

  // -------------------------------------------------------
  // Teste 11 | READ - Listar itens de pedido vazio
  // -------------------------------------------------------
  test("[Estoquista] Deve informar que pedido está sem itens", () => {
    const pedido = sistema.criarPedido(tecnico);

    expect(sistema.listarItensPedido(pedido.id)).toBe("Pedido sem itens");
  });

  // -------------------------------------------------------
  // Teste 12 | UPDATE - Adicionar item ao pedido (ajuste do estoquista)
  // O estoquista pode incluir um item que o técnico esqueceu
  // -------------------------------------------------------
  test("[Estoquista] Deve adicionar item ao pedido existente", () => {
    const pedido = sistema.criarPedido(tecnico);

    pedido.adicionarItem(itens[2], 5); // Cabo Drop 100m

    expect(pedido.itens.length).toBe(1);
    expect(pedido.itens[0].item.nome).toBe("Cabo Drop 100m");
    expect(pedido.itens[0].quantidade).toBe(5);
  });

  // -------------------------------------------------------
  // Teste 13 | UPDATE - Remover item do pedido
  // O estoquista remove um item incorreto ou duplicado
  // -------------------------------------------------------
  test("[Estoquista] Deve remover item do pedido pelo índice", () => {
    const pedido = sistema.criarPedido(tecnico);
    pedido.adicionarItem(itens[0], 1); // índice 0
    pedido.adicionarItem(itens[1], 2); // índice 1

    const removido = pedido.removerItem(0); // Remove ONU Fiber

    expect(removido).toBe(true);
    expect(pedido.itens.length).toBe(1);
    expect(pedido.itens[0].item.nome).toBe("Roteador Wi-Fi"); // Só este deve restar
  });

  // -------------------------------------------------------
  // Teste 14 | Validação - Remover item com índice inválido
  // -------------------------------------------------------
  test("[Estoquista] Não deve remover item com índice fora do range", () => {
    const pedido = sistema.criarPedido(tecnico);
    pedido.adicionarItem(itens[0], 1);

    expect(pedido.removerItem(-1)).toBe(false);  // Índice negativo
    expect(pedido.removerItem(5)).toBe(false);   // Índice além da lista
    expect(pedido.itens.length).toBe(1);         // Lista intacta
  });

  // -------------------------------------------------------
  // Teste 15 | UPDATE - Marcar pedido como pronto para retirada
  // Ação principal do estoquista após separar os materiais
  // -------------------------------------------------------
  test("[Estoquista] Deve marcar pedido como PRONTO_PARA_RETIRADA", () => {
    const pedido = sistema.criarPedido(tecnico);

    const resultado = sistema.atualizarStatusPedido(pedido.id, "PRONTO_PARA_RETIRADA");

    expect(resultado).toBe("Status atualizado para: PRONTO_PARA_RETIRADA");
    expect(pedido.status).toBe("PRONTO_PARA_RETIRADA");
  });

  // -------------------------------------------------------
  // Teste 16 | UPDATE - Devolver pedido para processamento
  // O estoquista reverte o status caso precise corrigir o pedido
  // -------------------------------------------------------
  test("[Estoquista] Deve reverter status para EM_SEPARACAO", () => {
    const pedido = sistema.criarPedido(tecnico);
    pedido.liberarParaRetirada(); // Coloca como PRONTO_PARA_RETIRADA

    const resultado = sistema.atualizarStatusPedido(pedido.id, "EM_SEPARACAO");

    expect(resultado).toBe("Status atualizado para: EM_SEPARACAO");
    expect(pedido.status).toBe("EM_SEPARACAO");
  });

  // -------------------------------------------------------
  // Teste 17 | Validação - Status inválido rejeitado
  // -------------------------------------------------------
  test("[Estoquista] Não deve aceitar status desconhecido", () => {
    const pedido = sistema.criarPedido(tecnico);

    expect(sistema.atualizarStatusPedido(pedido.id, "CANCELADO")).toBe("Status inválido");
    expect(pedido.status).toBe("EM_SEPARACAO"); // Status original preservado
  });

  // -------------------------------------------------------
  // Teste 18 | Validação - Atualizar pedido inexistente
  // -------------------------------------------------------
  test("[Estoquista] Não deve atualizar pedido que não existe", () => {
    expect(sistema.atualizarStatusPedido(999, "PRONTO_PARA_RETIRADA"))
      .toBe("Pedido não encontrado");
  });

});
