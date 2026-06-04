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
    errorLog(`Erro crítico não capturado: ${error.message}`);
    errorLog(error.stack);
    if (!error.message.includes("ENOTFOUND") && !error.message.includes("timeout")) {
        process.exit(1);
    }
});

process.on("unhandledRejection", (reason) => {
    if (badMacHandler.handleError(reason, "unhandledRejection")) {
        return;
    }
    errorLog(`Promessa rejeitada não tratada:`, reason);
});

async function setupAutoReplyListener(socket) {
    infoLog("📝 Sistema de auto-respostas ativado!");
    
    socket.ev.on("messages.upsert", async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg || !msg.message) return;
            if (msg.key.remoteJid?.includes("@status")) return;
            
            const isGroup = msg.key.remoteJid?.includes("@g.us");
            const isPrivate = !isGroup;
            const from = msg.key.remoteJid;
            
            const messageText = msg.message.conversation || 
                               msg.message.extendedTextMessage?.text || 
                               msg.message.imageMessage?.caption ||
                               msg.message.videoMessage?.caption;
            
            if (!messageText) return;
            if (messageText.startsWith("?")) return;
            
            if (isPrivate) {
                const lowerText = messageText.toLowerCase();
                const autoReplies = global.autoReplies || {};
                
                for (const [palavra, resposta] of Object.entries(autoReplies)) {
                    if (lowerText.includes(palavra.toLowerCase())) {
                        await socket.sendMessage(from, { text: resposta });
                        infoLog(`🤖 Auto-resposta: "${palavra}" -> ${from}`);
                        break;
                    }
                }
            }
        } catch (err) {
            errorLog(`Erro no auto-resposta: ${err.message}`);
        }
    });
}

async function startBot() {
    try {
        process.setMaxListeners(1500);
        bannerLog();
        infoLog("Iniciando meus componentes internos...");
        
        const stats = badMacHandler.getStats();
        if (stats.errorCount > 0) {
            warningLog(`BadMacHandler stats: ${stats.errorCount}/${stats.maxRetries} erros`);
        }
        
        const socket = await connect();
        
        await setupAutoReplyListener(socket);
        
        load(socket);
        startGroupScheduler(socket);
        
        setInterval(() => {
            const currentStats = badMacHandler.getStats();
            if (currentStats.errorCount > 0) {
                warningLog(`BadMacHandler stats: ${currentStats.errorCount}/${currentStats.maxRetries} erros`);
            }
        }, 300_000);
        
    } catch (error) {
        if (badMacHandler.handleError(error, "bot-startup")) {
            warningLog("Erro Bad MAC durante inicialização, tentando novamente...");
            setTimeout(() => { startBot(); }, 5000);
            return;
        }
        errorLog(`Erro ao iniciar o bot: ${error.message}`);
        errorLog(error.stack);
        process.exit(1);
    }
}

startBot();

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Raky BOT online!");
}).listen(PORT, () => {
    console.log(`[RENDER] Servidor HTTP rodando na porta ${PORT}`);
});
