const handler = async (m, { conn, participants, groupMetadata, usedPrefix }) => {
  // Sicurezza per il database delle chat
  const chat = global.db.data?.chats?.[m.chat] || {};
  
  const pp = await conn.profilePictureUrl(m.chat, 'image').catch((_) => null) || 'https://qu.ax/STfV.jpg';
  
  // Estrazione configurazioni
  const { antiToxic, antidelete, antiver, antiLink2, welcome, detect, antiLink, reaction } = chat;
  
  const groupAdmins = participants.filter((p) => p.admin);
  const listAdmin = groupAdmins.map((v, i) => `   ┇ ⌬ Admin » @${v.id.split('@')[0]}`).join('\n');
  const owner = groupMetadata.owner || groupAdmins.find((p) => p.admin === 'superadmin')?.id || m.chat.split('-')[0] + '@s.whatsapp.net';

  const status = (val) => {
    return val ? '✅' : '❌'
  }

  const funzioni = [
    ['WELCOME', welcome],
    ['DETECT', detect],
    ['ANTILINK', antiLink],
    ['ANTILINK 2', antiLink2],
    ['REACTIONS', reaction],
    ['ANTIDELETE', antidelete],
    ['ANTITOXIC', antiToxic]
  ]

  const statoFunzioni = funzioni
    .map(([nome, val]) => `   ┇ ⌬ ${nome.padEnd(12)} » ${status(val)}`)
    .join('\n')

  const text = `
   *𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 ꪶ⃬🦂ꫂ*
   ──────────────
   *GROUP:* _${groupMetadata.subject}_
   *MEMBERS:* _${participants.length}_
   *OWNER:* _@${owner.split('@')[0]}_
   ──────────────

   *╒══  👥 𝐀𝐃𝐌𝐈𝐍 𝐋𝐈𝐒𝐓  ══╕*
${listAdmin}
   *╘══════════════╛*

   *╒══  ⚙️ 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒  ══╕*
${statoFunzioni}
   *╘══════════════╛*

   _Scorpion Group Monitor v3.0_`.trim();

  await conn.sendMessage(m.chat, {
    text: text,
    contextInfo: {
      mentionedJid: [...groupAdmins.map((v) => v.id), owner],
      externalAdReply: {
        title: "𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 𝐆𝐑𝐎𝐔𝐏 𝐈𝐍𝐅𝐎 ⚡",
        body: `Soggetto: ${groupMetadata.subject}`,
        thumbnailUrl: pp,
        mediaType: 1,
        renderLargerThumbnail: false,
        sourceUrl: 'https://github.com'
      },
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363232743845068@newsletter',
        newsletterName: "🦂 𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 𝐒𝐘𝐒𝐓𝐄𝐌 🦂"
      }
    }
  }, { quoted: m });
};

handler.help = ['infogruppo'];
handler.tags = ['gruppo'];
handler.command = ['infogruppo', 'gp', 'infogp', 'gruppo'];
handler.group = true;
handler.admin = true;

export default handler;
