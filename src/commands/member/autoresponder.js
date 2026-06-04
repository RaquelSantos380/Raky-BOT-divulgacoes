import { PREFIX } from "../../config.js";

export default {
    name: "autoresponder",
    description: "Respostas automáticas",
    commands: ["autoresponder", "ar"],
    usage: `${PREFIX}autoresponder add|palavra|resposta`,

    handle: async ({ sendReply, fullArgs, from, isGroup }) => {
        if (isGroup) {
            return sendReply("⚠️ Só funciona no privado!");
        }

        const args = fullArgs.trim();
        
        if (!args) {
            return sendReply(`🤖 *Auto Responder*\n\nComandos:\n${PREFIX}autoresponder add|palavra|resposta\n${PREFIX}autoresponder list\n${PREFIX}autoresponder remove|palavra`);
        }

        if (args.startsWith("add")) {
            // Remove "add" do início
            let rest = args.substring(3).trim();
            
            // Se começar com |, remove também
            if (rest.startsWith("|")) rest = rest.substring(1).trim();
            
            const pipeIndex = rest.indexOf("|");
            if (pipeIndex === -1) {
                return sendReply(`❌ Use: ${PREFIX}autoresponder add|palavra|resposta\nEx: ${PREFIX}autoresponder add|oi|Olá!`);
            }
            
            const palavra = rest.substring(0, pipeIndex).trim().toLowerCase();
            const resposta = rest.substring(pipeIndex + 1).trim();
            
            if (!palavra || !resposta) {
                return sendReply("❌ Palavra e resposta são obrigatórias!");
            }
            
            const autoReplies = global.autoReplies || {};
            autoReplies[palavra] = resposta;
            global.autoReplies = autoReplies;
            
            await sendReply(`✅ *${palavra}* → ${resposta}`);
            return;
        }

        if (args.startsWith("remove")) {
            let palavra = args.substring(6).trim().toLowerCase();
            if (palavra.startsWith("|")) palavra = palavra.substring(1).trim();
            
            if (!palavra) {
                return sendReply(`❌ Use: ${PREFIX}autoresponder remove|palavra`);
            }
            
            const autoReplies = global.autoReplies || {};
            
            if (!autoReplies[palavra]) {
                return sendReply(`❌ "${palavra}" não encontrado!`);
            }
            
            delete autoReplies[palavra];
            global.autoReplies = autoReplies;
            
            await sendReply(`✅ Removido: *${palavra}*`);
            return;
        }

        if (args === "list" || args === "lista") {
            const autoReplies = global.autoReplies || {};
            const keys = Object.keys(autoReplies);
            
            if (keys.length === 0) {
                return sendReply("📭 Nenhuma resposta cadastrada.\n\nUse: `?autoresponder add|oi|Olá!`");
            }
            
            let msg = "📋 *RESPOSTAS AUTOMÁTICAS*\n\n";
            keys.forEach((p, i) => {
                const r = autoReplies[p];
                msg += `${i+1}. *"${p}"* → ${r}\n`;
            });
            await sendReply(msg);
            return;
        }

        await sendReply(`❌ Comando inválido!\nUse: ${PREFIX}autoresponder add|oi|Olá`);
    }
};
