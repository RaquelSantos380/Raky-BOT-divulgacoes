import { PREFIX } from "../../config.js";

export default {
    name: "menu",
    description: "Mostra o menu principal do bot",
    commands: ["menu", "m", "ajuda", "help"],
    usage: `${PREFIX}menu`,

    handle: async ({ sendReply, prefix }) => {
        const menuText = `
━━─「📢 SISTEMA DE DIVULGAÇÃO」─━━

╭━━⪩ ENVIO ⪨━━
▢ • ${prefix}divulgar enviar | ID | msg
▢ • ${prefix}divulgar imagem | ID | legenda

╭━━⪩ AGENDAR ⪨━━
▢ • ${prefix}divulgar agendar | min | ID | msg
▢ • ${prefix}divulgar cancelar | ID

╭━━⪩ TEMPLATES ⪨━━
▢ • ${prefix}divulgar salvar | nome | msg
▢ • ${prefix}divulgar usar | nome | ID
▢ • ${prefix}divulgar templates

╭━━⪩ BLACKLIST ⪨━━
▢ • ${prefix}divulgar blacklist add | @user
▢ • ${prefix}divulgar blacklist remove | @user
▢ • ${prefix}divulgar blacklist list

╭━━⪩ INFO ⪨━━
▢ • ${prefix}divulgar stats
▢ • ${prefix}divulgar limite
▢ • ${prefix}divulgar ajuda

━━─「⚙️」─━━
`;
        await sendReply(menuText);
    }
};
