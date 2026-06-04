import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import {
  setGroupSchedule,
  getGroupSchedule,
  removeGroupSchedule,
} from "../../utils/database.js";
import { setScheduleMessage } from "../../services/groupScheduler.js";

export default {
  name: "agendar-grupo",
  description: "Agenda fechamento e abertura do grupo.",
  commands: ["agendar-grupo", "agendargrupo", "schedulegroup"],
  usage: `${PREFIX}agendar-grupo fechar | 22:00\n${PREFIX}agendar-grupo abrir | 08:00\n${PREFIX}agendar-grupo ver\n${PREFIX}agendar-grupo cancelar\n${PREFIX}agendar-grupo mensagem | boaNoite | texto`,

  handle: async ({
    args,
    remoteJid,
    socket,
    sendReply,
    sendSuccessReply,
    sendErrorReply,
    sendSuccessReact,
  }) => {
    try {
      if (!args.length) {
        return sendReply(
          `⏰ *Agendar Fechamento/Abertura*\n\n` +
          `• ${PREFIX}agendar-grupo fechar | 22:00\n` +
          `• ${PREFIX}agendar-grupo abrir | 08:00\n` +
          `• ${PREFIX}agendar-grupo ver\n` +
          `• ${PREFIX}agendar-grupo cancelar\n` +
          `• ${PREFIX}agendar-grupo mensagem | boaNoite | texto\n` +
          `• ${PREFIX}agendar-grupo mensagem | bomDia | texto\n` +
          `⚠️ Formato: HH:MM (24h)`
        );
      }

      const action = args[0].toLowerCase();

      if (action === "mensagem" || action === "msg") {
        const tipo = args[1]?.toLowerCase();
        const texto = args.slice(2).join(" ").trim();

        if (!tipo || (tipo !== "boanoite" && tipo !== "bomdia")) {
          return sendReply("Use: `/agendar-grupo mensagem | boaNoite | texto` ou `bomDia`");
        }
        if (!texto) return sendReply("Digite a mensagem!");

        setScheduleMessage(remoteJid, tipo === "boanoite" ? "boaNoite" : "bomDia", texto);
        await sendSuccessReact();
        return sendReply(`✅ Mensagem de ${tipo} definida!`);
      }

      if (action === "fechar" || action === "close") {
        const horario = args[1];
        if (!horario || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(horario)) {
          throw new InvalidParameterError("Horário inválido!\nFormato 24h: HH:MM\nEx: 22:00");
        }

        const schedule = getGroupSchedule(remoteJid) || {};
        schedule.closeTime = horario;
        schedule.active = true;
        setGroupSchedule(remoteJid, schedule);

        await sendSuccessReact();
        return sendReply(`🔒 *Fechamento agendado para ${horario}!*\nUse \`/agendar-grupo mensagem | boaNoite | texto\` para personalizar.`);
      }

      if (action === "abrir" || action === "open") {
        const horario = args[1];
        if (!horario || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(horario)) {
          throw new InvalidParameterError("Horário inválido!\nFormato 24h: HH:MM\nEx: 08:00");
        }

        const schedule = getGroupSchedule(remoteJid) || {};
        schedule.openTime = horario;
        schedule.active = true;
        setGroupSchedule(remoteJid, schedule);

        await sendSuccessReact();
        return sendReply(`🔓 *Abertura agendada para ${horario}!*\nUse \`/agendar-grupo mensagem | bomDia | texto\` para personalizar.`);
      }

      if (action === "ver" || action === "view") {
        const schedule = getGroupSchedule(remoteJid);
        if (!schedule || !schedule.active) return sendReply("Nenhum agendamento.");
        let msg = "📋 *Agendamento*\n\n";
        if (schedule.closeTime) msg += `🔒 Fechar: ${schedule.closeTime}\n`;
        if (schedule.openTime) msg += `🔓 Abrir: ${schedule.openTime}\n`;
        return sendReply(msg);
      }

      if (action === "cancelar" || action === "cancel") {
        removeGroupSchedule(remoteJid);
        await sendSuccessReact();
        return sendReply("✅ Cancelado!");
      }

    } catch (error) {
      await sendErrorReply(`${error.message}`);
    }
  },
};