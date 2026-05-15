const handler = async (m, { conn, participants, groupMetadata, usedPrefix }) => {
  // Sicurezza per il database delle chat
  const chat = global.db.data?.chats?.[m.chat] || {};
  
  const pp = await conn.profilePictureUrl(m.chat, 'image').catch((_) => null) || 'https://i.ibb.co/N25rgPrX/Gaara.jpg';
  
  // Usiamo l'oggetto 'chat' sicuro creato sopra
  const { antiToxic, antidelete, antiver, antiLink2, welcome, detect, antiLink, reaction } = chat;
  
  const groupAdmins = participants.filter((p) => p.admin);
  const listAdmin = groupAdmins.map((v, i) => `│ 『 *${i + 1}* 』 @${v.id.split('@')[0]}`).join('\n');
  const owner = groupMetadata.owner || groupAdmins.find((p) => p.admin === 'superadmin')?.id || m.chat.split`-`[0] + '@s.whatsapp.net';

  const status = (val) => {
    val = Boolean(val)
    return val ? '『 ✅ 』' : '『 ❌ 』'
  }

  const formatRow = (nome, val) => {
    return `│ ${status(val)}- ${nome.trim()}`
  }

  const funzioni = [
    ['Welcome', Boolean(welcome)],
    ['Rilevamento', Boolean(detect)],
    ['Antilink', Boolean(antiLink)],
    ['Antilink 2', Boolean(antiLink2)],
    ['Reazioni', Boolean(reaction)],
    ['Eliminazione', Boolean(antidelete)],
    ['Antitoxic', Boolean(antiToxic)]
  ]

  const statoFunzioni = funzioni
    .map(([nome, val]) => formatRow(nome, val))
    .join('\n')

  const text = `
    ⋆｡˚『 ╭ \`INFO ✧ GRUPPO\` ╯ 』˚｡⋆
╭
│ 『 📛 』 \`Nome:\` *${groupMetadata.subject}*
│ 『 👑 』 \`Creatore:\` *@${owner.split('@')[0]}*
│ 『 ✨ 』 \`Amministratori:\`
${listAdmin}
│ 『 📢 』 \`Descrizione:\` ${groupMetadata.desc?.toString() || 'Nessuna descrizione'}
│
│『 ⚙️ 』  *\`Configurazione:\`*
${statoFunzioni}
*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`.trim();

  await conn.reply(m.chat, text, m, {
    mentions: [...groupAdmins.map((v) => v.id), owner],
    contextInfo: {
      // Se global.fake esiste prende il contextInfo, altrimenti usa un oggetto vuoto ed evita il crash
      ...(global.fake?.contextInfo || {}), 
      externalAdReply: {
        title: `${groupMetadata.subject}`,
        body: `『 👥 』 Membri: ${participants.length}`,
        thumbnailUrl: pp,
        sourceUrl: null,
        mediaType: 1,
        renderLargerThumbnail: false
      }
    }
  });
};

handler.help = ['infogruppo'];
handler.tags = ['gruppo'];
handler.command = ['infogruppo', 'gp', 'infogp', 'gruppo'];
handler.group = true;
handler.admin = true;

export default handler;
