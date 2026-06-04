import { connect } from "./connection.js";
import { load } from "./loader.js";
import { badMacHandler } from "./utils/badMacHandler.js";
import { bannerLog, errorLog, infoLog, warningLog } from "./utils/logger.js";
import { startGroupScheduler } from "./services/groupScheduler.js";
import http from "node:http";

global.autoReplies = global.autoReplies || {};

process.on("uncaughtException", (error) => {
    if (badMacHandler.handleError(error, "uncaughtException")) {
        return;
    }
    errorLog(`Erro crítico: ${error.message}`);
    if (!error.message.includes("ENOTFOUND") && !error.message.includes("timeout")) {
        process.exit(1);
    }
});

process.on("unhandledRejection", (reason) => {
    if (badMacHandler.handleError(reason, "unhandledRejection")) {
        return;
    }
    errorLog(`Promessa rejeitada:`, reason);
});

async function startBot() {
    try {
        process.setMaxListeners(1500);
        bannerLog();
        infoLog("Iniciando...");
        
        const socket = await connect();
        
        // ============================================
        // LISTENER DE AUTO-RESPOSTAS (PRIVADO)
        // ============================================
        infoLog("📝 Ativando sistema de auto-respostas...");
        
        socket.ev.on("messages.upsert", async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg || !msg.message) return;
                if (msg.key.remoteJid?.includes("@status")) return;
                
                const isGroup = msg.key.remoteJid?.includes("@g.us");
                const from = msg.key.remoteJid;
                
                const messageText = msg.message.conversation || 
                                   msg.message.extendedTextMessage?.text;
                
                if (!messageText) return;
                if (messageText.startsWith("?")) return;
                
                // Só responde no privado
                if (!isGroup) {
                    const autoReplies = global.autoReplies || {};
                    const lowerText = messageText.toLowerCase();
                    
                    for (const [palavra, resposta] of Object.entries(autoReplies)) {
                        if (lowerText.includes(palavra.toLowerCase())) {
                            await socket.sendMessage(from, { text: resposta });
                            infoLog(`🤖 Respondeu "${palavra}" para ${from}`);
                            break;
                        }
                    }
                }
            } catch (err) {
                errorLog(`Erro no auto-resposta: ${err.message}`);
            }
        });
        
        infoLog("✅ Sistema de auto-respostas ativo!");
        
        load(socket);
        startGroupScheduler(socket);
        
    } catch (error) {
        errorLog(`Erro ao iniciar: ${error.message}`);
        setTimeout(() => { startBot(); }, 5000);
    }
}

startBot();

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Raky BOT online!");
}).listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Auto-ping
const AUTOPING_URL = process.env.RENDER_EXTERNAL_URL || "https://raky-bot-divulgacoes.onrender.com";
setInterval(async () => {
    try {
        await fetch(AUTOPING_URL);
        console.log(`[PING] ✅`);
    } catch(e) {}
}, 5 * 60 * 1000);
