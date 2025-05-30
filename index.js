const { Client, LocalAuth } = require("whatsapp-web.js");

const dedent = (str) => str.replace(/^[ \t]+/gm, "");
const messageQueue = [];
const joinedUsers = new Set();
const welcomedUsers = new Set(); // Controla quem já recebeu mensagem para evitar duplicidade
let welcomeTimeout = null;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("ready", () => {
  console.log("🤖 Bot está pronto!");
});

// Adiciona mensagens na fila
client.on("message", async (message) => {
  messageQueue.push(message);
});

// Processa mensagens da fila com intervalo (evita travamento)
setInterval(async () => {
  if (messageQueue.length === 0) return;

  const message = messageQueue.shift();
  const chat = await message.getChat();

  // 📌 Detecta se é mensagem de novo membro via sistema (ex: "foi adicionado", "entrou usando o link de convite")
  const systemJoinMessages = [
    "entrou usando o link de convite",
    "foi adicionado",
    "adicionou",
  ];

  if (
    chat.isGroup &&
    systemJoinMessages.some((t) => message.body.toLowerCase().includes(t))
  ) {
    // Pega o usuário autor da mensagem (quem entrou)
    const userId = message.author || message.from;

    // Se o usuário já recebeu boas-vindas, ignora
    if (welcomedUsers.has(userId)) {
      return;
    }

    welcomedUsers.add(userId);

    // Monta a lista de menções com o usuário que entrou
    const mentions = [await client.getContactById(userId)];

    const tags = mentions.map((user) => `@${user.number}\n`);

    const welcomeMessageTemplate2 = dedent(`
      Seja bem-vindo(a) ao Bond!

      ${tags.join("")}

      ⚠️ Lê isso pra não se perder:

      🔸 Foto de perfil = obrigatória
      •⁠  ⁠Coloca uma foto sua, de frente (nada de emoji, costas, bicho ou logo)
      •⁠  ⁠Ativa em: WhatsApp > Privacidade > Foto do perfil > Todos

      🔸 Tem muita mensagem? Relaxa.
      •⁠  ⁠Não precisa acompanhar tudo
      •⁠  ⁠Só ficar no grupo de Avisos já resolve
      •⁠  ⁠Dúvidas? Chama um ADM!

      🔸 Temos vários grupos!
      •⁠  ⁠Pode entrar e sair quando quiser
      •⁠  ⁠Alguns demoram pra liberar, tenha paciência

      🔸 Tem eventos rolando!
      •⁠  ⁠A lista sai no grupo de Avisos
      •⁠  ⁠Todo mundo pode participar
      •⁠  ⁠Todo mundo pode criar e sugerir

      🔸 Grupo de Avisos = obrigatório
      •⁠  ⁠Lá vai tudo que importa
      •⁠  ⁠Se não ler, vai ficar perdido(a)

      🔸 Leia as regras!
      •⁠  ⁠Estão na descrição dos grupos
      •⁠  ⁠Evita ser banido à toa

      🔸 Se apresenta aí!
      Copia e cola no grupo:

      •⁠  ⁠Nome
      •⁠  ⁠Idade
      •⁠  ⁠Cidade/região
      •⁠  ⁠Signo
      •⁠  ⁠Estado civil
    `);

    const welcomeMessage = dedent(`
      👋 Boas-vindas ao novo membro!

      ${tags.join("")}

      Apresenta-se com:
      •⁠  ⁠Nome
      •⁠  ⁠Idade
      •⁠  ⁠Cidade
      •⁠  ⁠Signo
      •⁠  ⁠Estado civil
    `);

    if (chat.name.toLocaleLowerCase().includes("bem vindo")) {
      await chat.sendMessage(welcomeMessageTemplate2, { mentions });
    } else {
      await chat.sendMessage(welcomeMessage, { mentions });
    }

    console.log("👥 Mensagem de boas-vindas enviada via mensagem de sistema");
    return;
  }

  // 📌 Comando simples "ping"
  if (message.body.toLowerCase() === "ping") {
    await message.reply("Pong! 🏓");
    console.log("Respondido Pong!");
  }
}, 500);

// Detecta quando alguém é adicionado ao grupo (evento oficial, funciona melhor para grupos)
client.on("group_join", async (notification) => {
  try {
    const chat = await notification.getChat();

    if (notification.recipientIds && notification.recipientIds.length > 0) {
      // Filtra só usuários que ainda não foram recebidos
      const newUsers = notification.recipientIds.filter(
        (id) => !welcomedUsers.has(id)
      );

      // Se não tem usuário novo, ignora
      if (newUsers.length === 0) return;

      // Adiciona os novos usuários no Set global
      newUsers.forEach((id) => welcomedUsers.add(id));
      newUsers.forEach((id) => joinedUsers.add(id));

      // Se já tem timeout rodando, ignora
      if (welcomeTimeout) return;

      // Aguarda 1 min para dar boas-vindas em lote
      welcomeTimeout = setTimeout(async () => {
        const mentions = [];
        const tags = [];

        for (const userId of joinedUsers) {
          const user = await client.getContactById(userId);
          mentions.push(user);
          tags.push(`@${user.number}\n`);
        }

        joinedUsers.clear();
        welcomeTimeout = null;

        const welcomeMessageTemplate2 = dedent(`
          Seja bem-vindo(a) ao Bond!

          ${tags.join("")}

          ⚠️ Lê isso pra não se perder:

          🔸 Foto de perfil = obrigatória
          •⁠  ⁠Coloca uma foto sua, de frente (nada de emoji, costas, bicho ou logo)
          •⁠  ⁠Ativa em: WhatsApp > Privacidade > Foto do perfil > Todos

          🔸 Tem muita mensagem? Relaxa.
          •⁠  ⁠Não precisa acompanhar tudo
          •⁠  ⁠Só ficar no grupo de Avisos já resolve
          •⁠  ⁠Dúvidas? Chama um ADM!

          🔸 Temos vários grupos!
          •⁠  ⁠Pode entrar e sair quando quiser
          •⁠  ⁠Alguns demoram pra liberar, tenha paciência

          🔸 Tem eventos rolando!
          •⁠  ⁠A lista sai no grupo de Avisos
          •⁠  ⁠Todo mundo pode participar
          •⁠  ⁠Todo mundo pode criar e sugerir

          🔸 Grupo de Avisos = obrigatório
          •⁠  ⁠Lá vai tudo que importa
          •⁠  ⁠Se não ler, vai ficar perdido(a)

          🔸 Leia as regras!
          •⁠  ⁠Estão na descrição dos grupos
          •⁠  ⁠Evita ser banido à toa

          🔸 Se apresenta aí!
          Copia e cola no grupo:

          •⁠  ⁠Nome
          •⁠  ⁠Idade
          •⁠  ⁠Cidade/região
          •⁠  ⁠Signo
          •⁠  ⁠Estado civil
        `);

        const welcomeMessage = dedent(`
          👋 Boas-vindas aos novos membros!

          ${tags.join("")}

          Apresentem-se com:
          •⁠  ⁠Nome
          •⁠  ⁠Idade
          •⁠  ⁠Cidade
          •⁠  ⁠Signo
          •⁠  ⁠Estado civil
        `);

        if (chat.name.toLocaleLowerCase().includes("bem vindo")) {
          await chat.sendMessage(welcomeMessageTemplate2, { mentions });
        } else {
          await chat.sendMessage(welcomeMessage, { mentions });
        }

        console.log("👥 Mensagem de boas-vindas enviada via group_join");
      }, 60000);
    }
  } catch (error) {
    console.error("❌ Erro ao processar entrada no grupo:", error);
  }
});

client.initialize();
