const { Client, LocalAuth } = require("whatsapp-web.js");

const dedent = (str) => str.replace(/^[ \t]+/gm, "");
const messageQueue = [];
const joinedUsers = new Set();
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

  // 📌 Detecta se é mensagem de novo membro via sistema
  const systemJoinMessages = [
    "entrou usando o link de convite",
    "foi adicionado",
    "adicionou",
  ];

  if (
    chat.isGroup &&
    systemJoinMessages.some((t) => message.body.toLowerCase().includes(t))
  ) {
    const mentions = [
      message.author ? await client.getContactById(message.author) : null,
    ].filter(Boolean);

    const welcomeMsg = dedent(`
      👋 Bem-vindo(a)!

      Copia, cola e se apresenta:
      •⁠  ⁠Nome
      •⁠  ⁠Idade
      •⁠  ⁠Cidade
      •⁠  ⁠Signo
      •⁠  ⁠Estado civil
    `);

    await chat.sendMessage(welcomeMsg, { mentions });
    console.log("👤 Mensagem de boas-vindas enviada via mensagem de sistema");
    return;
  }

  // 📌 Comando simples "ping"
  if (message.body.toLowerCase() === "ping") {
    await message.reply("Pong! 🏓");
    console.log("Respondido Pong!");
  }
}, 500); // A cada 500ms

// Detecta quando alguém é adicionado ao grupo (funciona para algumas entradas)
client.on("group_join", async (notification) => {
  try {
    const chat = await notification.getChat();

    if (notification.recipientIds && notification.recipientIds.length > 0) {
      for (const recipientId of notification.recipientIds) {
        joinedUsers.add(recipientId);
      }
    }

    // Se já tem timeout rodando, ignora
    if (welcomeTimeout) return;

    // Aguarda 1 min para dar boas-vindas em lote
    welcomeTimeout = setTimeout(async () => {
      const mentions = [];
      const tags = [];

      for (const userId of joinedUsers) {
        const user = await client.getContactById(userId);
        mentions.push(user);
        tags.push(`@${user.number}`);
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

      if (chat.name.toLocaleLowerCase().includes("bot")) {
        await chat.sendMessage(welcomeMessageTemplate2, { mentions });
      } else {
        await chat.sendMessage(welcomeMessage, { mentions });
      }

      // await chat.sendMessage(welcomeMessage, { mentions });
      console.log("👥 Mensagem de boas-vindas enviada via group_join");
    }, 60000);
  } catch (error) {
    console.error("❌ Erro ao processar entrada no grupo:", error);
  }
});

client.initialize();

// const { Client, LocalAuth } = require("whatsapp-web.js");

// const dedent = (str) => str.replace(/^[ \t]+/gm, "");

// const WELCOME_DELAY = 100 * 1000;

// const client = new Client({
//   authStrategy: new LocalAuth(),
//   puppeteer: { headless: false },
// });

// client.on("ready", () => {
//   console.log("🤖 Bot está pronto!");
// });

// client.on("message", async (message) => {
//   try {
//     console.log("Mensagem recebida:", message.body);

//     if (message.body.toLowerCase() === "ping") {
//       await message.reply("Pong! 🏓");
//       console.log("Respondido Pong!");
//     }
//   } catch (error) {
//     console.error("Erro no listener de mensagem:", error);
//   }
// });

// const joinedUsers = new Set();
// let welcomeTimeout = null;

// client.on("group_join", async (notification) => {
//   try {
//     const chat = await notification.getChat();
//     const botId = null; // Sem getMe(), vamos ignorar a verificação do bot aqui

//     // Adiciona cada novo participante na fila
//     if (notification.recipientIds && notification.recipientIds.length > 0) {
//       for (const recipientId of notification.recipientIds) {
//         joinedUsers.add(recipientId);
//       }
//     }

//     // Se já tiver timeout agendado, não faz nada
//     if (welcomeTimeout) return;

//     // Aguarda 1 minuto para enviar mensagem única
//     welcomeTimeout = setTimeout(async () => {
//       const mentions = [];
//       const tags = [];

//       for (const userId of joinedUsers) {
//         const user = await client.getContactById(userId);
//         mentions.push(user);
//         tags.push(`@${user.number}\n`);
//       }

//       joinedUsers.clear();
//       welcomeTimeout = null;

//       const welcomeMessageTemplate1 = dedent(`
//           Seja bem-vindo(a) ao Bond!

//           @${newMember.id.user}

//           ⚠️ Lê isso pra não se perder:

//           🔸 Foto de perfil = obrigatória
//           •⁠  ⁠Coloca uma foto sua, de frente (nada de emoji, costas, bicho ou logo)
//           •⁠  ⁠Ativa em: WhatsApp > Privacidade > Foto do perfil > Todos

//           🔸 Tem muita mensagem? Relaxa.
//           •⁠  ⁠Não precisa acompanhar tudo
//           •⁠  ⁠Só ficar no grupo de Avisos já resolve
//           •⁠  ⁠Dúvidas? Chama um ADM!

//           🔸 Temos vários grupos!
//           •⁠  ⁠Pode entrar e sair quando quiser
//           •⁠  ⁠Alguns demoram pra liberar, tenha paciência

//           🔸 Tem eventos rolando!
//           •⁠  ⁠A lista sai no grupo de Avisos
//           •⁠  ⁠Todo mundo pode participar
//           •⁠  ⁠Todo mundo pode criar e sugerir

//           🔸 Grupo de Avisos = obrigatório
//           •⁠  ⁠Lá vai tudo que importa
//           •⁠  ⁠Se não ler, vai ficar perdido(a)

//           🔸 Leia as regras!
//           •⁠  ⁠Estão na descrição dos grupos
//           •⁠  ⁠Evita ser banido à toa

//           🔸 Se apresenta aí!
//           Copia e cola no grupo:

//           •⁠  ⁠Nome
//           •⁠  ⁠Idade
//           •⁠  ⁠Cidade/região
//           •⁠  ⁠Signo
//           •⁠  ⁠Estado civil
//       `);

//       const welcomeMessageTemplate2 = dedent(`
//           Bem vindos pessoal!

//           Bora se conhecer? 🗣️

//           •⁠  ⁠Nome
//           •⁠  ⁠Idade
//           •⁠  ⁠Cidade
//           •⁠  ⁠Signo
//           •⁠  ⁠Estado civil
//       `);

//       if (groupChat.name.toLocaleLowerCase().includes("bem vindo ao bond")) {
//         await chat.sendMessage(welcomeMessageTemplate1, { mentions });
//       } else {
//         await chat.sendMessage(welcomeMessageTemplate2, { mentions });
//       }
//       console.log(`✅ Mensagem de boas-vindas enviada no grupo ${chat.name}!`);
//     }, 60000);
//   } catch (error) {
//     console.error("❌ Erro ao processar entrada no grupo:", error);
//   }
// });

// client.initialize();


//other

// const { Client, LocalAuth } = require("whatsapp-web.js");

// const dedent = (str) => str.replace(/^[ \t]+/gm, "");
// const messageQueue = [];
// const joinedUsers = new Set();
// let welcomeTimeout = null;

// const client = new Client({
//   authStrategy: new LocalAuth(),
//   puppeteer: {
//     headless: false,
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   },
// });

// client.on("ready", () => {
//   console.log("🤖 Bot está pronto!");
// });

// // Adiciona mensagens na fila
// client.on("message", async (message) => {
//   messageQueue.push(message);
// });

// // Processa mensagens da fila com intervalo (evita travamento)
// setInterval(async () => {
//   if (messageQueue.length === 0) return;

//   const message = messageQueue.shift();
//   const chat = await message.getChat();

//   // 📌 Detecta se é mensagem de novo membro via sistema
//   const systemJoinMessages = [
//     "entrou usando o link de convite",
//     "foi adicionado",
//     "adicionou",
//   ];

//   if (
//     chat.isGroup &&
//     systemJoinMessages.some((t) => message.body.toLowerCase().includes(t))
//   ) {
//     var mentions = [];
//     mentions = [
//       message.author ? await client.getContactById(message.author) : null,
//     ].filter(Boolean);

//     const tags = [];

//     for (const userId of joinedUsers) {
//       const user = await client.getContactById(userId);
//       mentions.push(user);
//       tags.push(`@${user.number}\n`);
//     }

//     joinedUsers.clear();

//     const welcomeMessageTemplate2 = dedent(`
//           Seja bem-vindo(a) ao Bond!

//           ${tags.join("")}

//           ⚠️ Lê isso pra não se perder:

//           🔸 Foto de perfil = obrigatória
//           •⁠  ⁠Coloca uma foto sua, de frente (nada de emoji, costas, bicho ou logo)
//           •⁠  ⁠Ativa em: WhatsApp > Privacidade > Foto do perfil > Todos

//           🔸 Tem muita mensagem? Relaxa.
//           •⁠  ⁠Não precisa acompanhar tudo
//           •⁠  ⁠Só ficar no grupo de Avisos já resolve
//           •⁠  ⁠Dúvidas? Chama um ADM!

//           🔸 Temos vários grupos!
//           •⁠  ⁠Pode entrar e sair quando quiser
//           •⁠  ⁠Alguns demoram pra liberar, tenha paciência

//           🔸 Tem eventos rolando!
//           •⁠  ⁠A lista sai no grupo de Avisos
//           •⁠  ⁠Todo mundo pode participar
//           •⁠  ⁠Todo mundo pode criar e sugerir

//           🔸 Grupo de Avisos = obrigatório
//           •⁠  ⁠Lá vai tudo que importa
//           •⁠  ⁠Se não ler, vai ficar perdido(a)

//           🔸 Leia as regras!
//           •⁠  ⁠Estão na descrição dos grupos
//           •⁠  ⁠Evita ser banido à toa

//           🔸 Se apresenta aí!
//           Copia e cola no grupo:

//           •⁠  ⁠Nome
//           •⁠  ⁠Idade
//           •⁠  ⁠Cidade/região
//           •⁠  ⁠Signo
//           •⁠  ⁠Estado civil
//       `);

//     const welcomeMessage = dedent(`
//         👋 Boas-vindas aos novos membros!

//         ${tags.join("")}

//         Apresentem-se com:
//         •⁠  ⁠Nome
//         •⁠  ⁠Idade
//         •⁠  ⁠Cidade
//         •⁠  ⁠Signo
//         •⁠  ⁠Estado civil
//       `);

//     if (chat.name.toLocaleLowerCase().includes("bot")) {
//       await chat.sendMessage(welcomeMessageTemplate2, { mentions });
//     } else {
//       await chat.sendMessage(welcomeMessage, { mentions });
//     }

//     console.log("👥 Mensagem de boas-vindas enviada via group_join");

//     await chat.sendMessage(welcomeMsg, { mentions });
//     console.log("👤 Mensagem de boas-vindas enviada via mensagem de sistema");
//     return;
//   }

//   // 📌 Comando simples "ping"
//   if (message.body.toLowerCase() === "ping") {
//     await message.reply("Pong! 🏓");
//     console.log("Respondido Pong!");
//   }
// }, 500);

// // Detecta quando alguém é adicionado ao grupo (funciona para algumas entradas)
// client.on("group_join", async (notification) => {
//   try {
//     const chat = await notification.getChat();

//     if (notification.recipientIds && notification.recipientIds.length > 0) {
//       for (const recipientId of notification.recipientIds) {
//         joinedUsers.add(recipientId);
//       }
//     }

//     // Se já tem timeout rodando, ignora
//     if (welcomeTimeout) return;

//     // Aguarda 1 min para dar boas-vindas em lote
//     welcomeTimeout = setTimeout(async () => {
//       const mentions = [];
//       const tags = [];

//       for (const userId of joinedUsers) {
//         const user = await client.getContactById(userId);
//         mentions.push(user);
//         tags.push(`@${user.number}\n`);
//       }

//       joinedUsers.clear();
//       welcomeTimeout = null;

//       const welcomeMessageTemplate2 = dedent(`
//           Seja bem-vindo(a) ao Bond!

//           ${tags.join("")}

//           ⚠️ Lê isso pra não se perder:

//           🔸 Foto de perfil = obrigatória
//           •⁠  ⁠Coloca uma foto sua, de frente (nada de emoji, costas, bicho ou logo)
//           •⁠  ⁠Ativa em: WhatsApp > Privacidade > Foto do perfil > Todos

//           🔸 Tem muita mensagem? Relaxa.
//           •⁠  ⁠Não precisa acompanhar tudo
//           •⁠  ⁠Só ficar no grupo de Avisos já resolve
//           •⁠  ⁠Dúvidas? Chama um ADM!

//           🔸 Temos vários grupos!
//           •⁠  ⁠Pode entrar e sair quando quiser
//           •⁠  ⁠Alguns demoram pra liberar, tenha paciência

//           🔸 Tem eventos rolando!
//           •⁠  ⁠A lista sai no grupo de Avisos
//           •⁠  ⁠Todo mundo pode participar
//           •⁠  ⁠Todo mundo pode criar e sugerir

//           🔸 Grupo de Avisos = obrigatório
//           •⁠  ⁠Lá vai tudo que importa
//           •⁠  ⁠Se não ler, vai ficar perdido(a)

//           🔸 Leia as regras!
//           •⁠  ⁠Estão na descrição dos grupos
//           •⁠  ⁠Evita ser banido à toa

//           🔸 Se apresenta aí!
//           Copia e cola no grupo:

//           •⁠  ⁠Nome
//           •⁠  ⁠Idade
//           •⁠  ⁠Cidade/região
//           •⁠  ⁠Signo
//           •⁠  ⁠Estado civil
//       `);

//       const welcomeMessage = dedent(`
//         👋 Boas-vindas aos novos membros!

//         ${tags.join("")}

//         Apresentem-se com:
//         •⁠  ⁠Nome
//         •⁠  ⁠Idade
//         •⁠  ⁠Cidade
//         •⁠  ⁠Signo
//         •⁠  ⁠Estado civil
//       `);

//       if (chat.name.toLocaleLowerCase().includes("bot")) {
//         await chat.sendMessage(welcomeMessageTemplate2, { mentions });
//       } else {
//         await chat.sendMessage(welcomeMessage, { mentions });
//       }

//       console.log("👥 Mensagem de boas-vindas enviada via group_join");
//     }, 60000);
//   } catch (error) {
//     console.error("❌ Erro ao processar entrada no grupo:", error);
//   }
// });

// client.initialize();
