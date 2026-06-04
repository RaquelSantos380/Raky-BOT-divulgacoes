import { PREFIX } from "../../config.js";

export default {
    name: "divulgar",
    description: "Sistema de divulgação em grupos",
    commands: ["divulgar", "d"],
    usage: `${PREFIX}divulgar [subcomando]`,

    handle: async ({ sendReply, fullArgs, db, socket, remoteJid }) => {
        const args = fullArgs.trim().toLowerCase();
        
        if (!args || args === "ajuda") {
            const msg = `
📢 *SISTEMA DE DIVULGAÇÃO*

┌─── 💬 ENVIO ───────────────┐
│ ${PREFIX}divulgar enviar | ID | msg
│ ${PREFIX}divulgar imagem | ID | legenda
├─── ⏰ AGENDAR ──────────────┤
│ ${PREFIX}divulgar agendar | min | ID | msg
│ ${PREFIX}divulgar cancelar | ID
├─── 📝 TEMPLATES ────────────┤
│ ${PREFIX}divulgar salvar | nome | msg
│ ${PREFIX}divulgar usar | nome | ID
│ ${PREFIX}divulgar templates
├─── 🚫 BLACKLIST ────────────┤
│ ${PREFIX}divulgar blacklist add | @user
│ ${PREFIX}divulgar blacklist remove | @user
│ ${PREFIX}divulgar blacklist list
├─── 📊 INFO ─────────────────┤
│ ${PREFIX}divulgar stats
│ ${PREFIX}divulgar limite
└─────────────────────────────┘
`;
            await sendReply(msg);
            return;
        }
        
        // ESTATÍSTICAS
        if (args === "stats") {
            const stats = db.get("divulgar_stats") || { total: 0, hoje: 0 };
            await sendReply(`📊 *ESTATÍSTICAS*\n📨 Total: ${stats.total}\n📅 Hoje: ${stats.hoje}`);
            return;
        }
        
        // ENVIO SIMPLES
        if (args.startsWith("enviar")) {
            const parts = fullArgs.replace("enviar", "").split("|");
            if (parts.length < 2) {
                return sendReply(`⚠️ Use: ${PREFIX}divulgar enviar | ID | mensagem`);
            }
            const grupoId = parts[0].trim();
            const msg = parts.slice(1).join("|").trim();
            await socket.sendMessage(grupoId, { text: msg });
            await sendReply(`✅ Mensagem enviada para ${grupoId}`);
            
            const stats = db.get("divulgar_stats") || { total: 0, hoje: 0 };
            stats.total++;
            stats.hoje++;
            db.set("divulgar_stats", stats);
            return;
        }
        
        await sendReply(`⚠️ Subcomando não reconhecido.\nUse: ${PREFIX}divulgar ajuda`);
    }
};
