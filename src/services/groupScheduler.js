import { getAllActiveSchedules } from "../utils/database.js";
import { errorLog, infoLog } from "../utils/logger.js";
import fs from "fs";
import path from "path";

const SCHEDULE_MSGS_FILE = path.resolve("database", "schedule-messages.json");

function lerMensagens() {
  try {
    if (fs.existsSync(SCHEDULE_MSGS_FILE)) return JSON.parse(fs.readFileSync(SCHEDULE_MSGS_FILE, "utf8"));
  } catch (e) {}
  return {};
}

let intervalId = null;

export function startGroupScheduler(socket) {
  if (intervalId) clearInterval(intervalId);

  infoLog("⏰ Agendador de grupos iniciado!");

  intervalId = setInterval(async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, "0");
      const currentMinute = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${currentHour}:${currentMinute}`;

      const schedules = getAllActiveSchedules();
      const mensagens = lerMensagens();

      for (const [groupId, schedule] of Object.entries(schedules)) {
        try {
          if (schedule.closeTime === currentTime) {
            const config = mensagens[groupId] || {};
            
            if (config.boaNoiteImagem) {
              try {
                await socket.sendMessage(groupId, {
                  image: { url: config.boaNoiteImagem },
                  caption: config.boaNoiteMsg || "🌙 Boa noite! O grupo está fechado agora. Até amanhã!"
                });
              } catch (e) {
                await socket.sendMessage(groupId, {
                  text: config.boaNoiteMsg || "🌙 Boa noite! O grupo está fechado agora. Até amanhã!"
                });
              }
            } else {
              await socket.sendMessage(groupId, {
                text: config.boaNoiteMsg || "🌙 Boa noite! O grupo está fechado agora. Até amanhã!"
              });
            }

            await socket.groupSettingUpdate(groupId, "announcement");
            infoLog(`🔒 Grupo fechado: ${groupId} às ${currentTime}`);
          }

          if (schedule.openTime === currentTime) {
            await socket.groupSettingUpdate(groupId, "not_announcement");
            
            const config = mensagens[groupId] || {};
            await socket.sendMessage(groupId, {
              text: config.bomDiaMsg || "☀️ Bom dia! O grupo está aberto novamente. Tenham um ótimo dia!"
            });
            
            infoLog(`🔓 Grupo aberto: ${groupId} às ${currentTime}`);
          }
        } catch (groupError) {
          errorLog(`Erro ao processar agendamento do grupo ${groupId}: ${groupError.message}`);
        }
      }
    } catch (error) {
      errorLog(`Erro no agendador: ${error.message}`);
    }
  }, 30000);
}

export function stopGroupScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function setScheduleMessage(groupId, type, message, imageUrl) {
  const mensagens = lerMensagens();
  if (!mensagens[groupId]) mensagens[groupId] = {};
  
  if (type === "boaNoite") {
    mensagens[groupId].boaNoiteMsg = message;
    if (imageUrl) mensagens[groupId].boaNoiteImagem = imageUrl;
  } else if (type === "bomDia") {
    mensagens[groupId].bomDiaMsg = message;
    if (imageUrl) mensagens[groupId].bomDiaImagem = imageUrl;
  }
  
  fs.writeFileSync(SCHEDULE_MSGS_FILE, JSON.stringify(mensagens, null, 2));
}