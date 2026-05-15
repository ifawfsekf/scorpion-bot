import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix: _p, command, args, isOwner, isAdmin }) => {
  const userName = m.pushName || 'Utente'

  global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {}
  global.db.data.settings[conn.user.jid] = global.db.data.settings[conn.user.jid] || {}
  let chat = global.db.data.chats[m.chat]
  let bot = global.db.data.settings[conn.user.jid]

  const securityFeatures = [
    { key: 'antigore', name: 'ANTIGORE', icon: '☣️' },
    { key: 'modoadmin', name: 'SOLO ADMIN', icon: '👮' },
    { key: 'antivoip', name: 'ANTIVOIP', icon: '📵' },
    { key: 'antilink', name: 'ANTILINK', icon: '🔗' },
    { key: 'antilinksocial', name: 'SOCIAL LINK', icon: '🌐' },
    { key: 'antitrava', name: 'ANTITRAVA', icon: '🧱' },
    { key: 'antinuke', name: 'ANTINUKE', icon: '☢️' },
    { key: 'antiviewonce', name: 'ANTIVIEW', icon: '👁️' },
    { key: 'antispam', name: 'ANTISPAM', icon: '🛑' }
  ]

  const automationFeatures = [
    { key: 'ai', name: 'INTELLIGENZA IA', icon: '🧠' },
    { key: 'vocali', name: 'VOCALI SIRI', icon: '🎤' },
    { key: 'reaction', name: 'REAZIONI', icon: '⚡' },
    { key: 'autolevelup', name: 'AUTOLEVEL', icon: '🆙' },
    { key: 'welcome', name: 'BENVENUTO', icon: '👋' }
  ]

  if (!args.length || /menu|help/i.test(args[0])) {
    let text = `
───  𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 ꪶ⃬🦂ꫂ  ───
｢ 𝐂𝐎𝐍𝐓𝐑𝐎𝐋 𝐏𝐀𝐍𝐄𝐋 𝐕𝟑.𝟎 ｣

👤 *OPERATORE:* ${userName}
📟 *SISTEMA:* Online
🌐 *NODO:* Cluster-01

*｢ ⚙️ COMANDI RAPIDI ｣*
> Per gestire i moduli scrivi:
> *${_p}attiva* <nome> | *${_p}disattiva* <nome>

*┏━━━  🛡️  𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘  ━━━┓*
${securityFeatures.map(f => `┃ ${f.icon} ${f.name.padEnd(14)} ➛ *${f.key}*`).join('\n')}
*┗━━━━━━━━━━━━━━━━━━┛*

*┏━━━  🤖  𝐀𝐔𝐓𝐎𝐌𝐀𝐓𝐈𝐎𝐍  ━━━┓*
${automationFeatures.map(f => `┃ ${f.icon} ${f.name.padEnd(14)} ➛ *${f.key}*`).join('\n')}
*┗━━━━━━━━━━━━━━━━━━┛*

*┏━━━  👑  𝐎𝐖𝐍𝐄𝐑 𝐎𝐍𝐋𝐘  ━━━┓*
┃ 📵 ANTICALL      ➛ *anticall*
┃ 🔒 ANTIPRIVATE   ➛ *antiprivate*
┃ 👑 SOLO OWNER    ➛ *solocreatore*
*┗━━━━━━━━━━━━━━━━━━┛*

  _Design by Scorpion 2026_`

    await conn.sendMessage(m.chat, { 
      text: text.trim(),
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
          title: "𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 𝐒𝐘𝐒𝐓𝐄𝐌 ⚡",
          body: "Configurazione Moduli Attiva",
          mediaType: 1,
          previewType: 0,
          renderLargerThumbnail: false,
          sourceUrl: 'https://tinyurl.com/scorpion-bot'
        }
      }
    }, { quoted: m })
    return
  }

  // --- LOGICA DI ATTIVAZIONE ---
  let isEnable = !/disattiva|off|0/i.test(command)
  let type = args[0].toLowerCase()
  let status = isEnable ? 'ＡＴＴＩＶＯ ✅' : 'ＤＩＳＡＴＴＩＶＯ ❌'

  let dbKey = type
  if (type === 'antilink') dbKey = 'antiLink'
  if (type === 'antilinksocial') dbKey = 'antiLink2'
  if (type === 'antiviewonce') dbKey = 'antioneview'
  if (type === 'antiprivate') dbKey = 'antiPrivate'
  if (type === 'solocreatore') dbKey = 'soloCreatore'

  const isSecurity = securityFeatures.some(f => f.key.toLowerCase() === type)
  const isAuto = automationFeatures.some(f => f.key.toLowerCase() === type)
  const isOwnerKey = ['anticall', 'antiprivate', 'solocreatore'].includes(type)

  if (isSecurity || isAuto) {
    if (!m.isGroup && !isOwner) return m.reply('❌ Funzione disponibile solo nei gruppi.')
    if (m.isGroup && !isAdmin && !isOwner) return m.reply('🛡️ Accesso negato: richiesti permessi Admin.')
    chat[dbKey] = isEnable
  } else if (isOwnerKey) {
    if (!isOwner) return m.reply('👑 Funzione riservata allo Sviluppatore.')
    bot[dbKey] = isEnable
  } else {
    return m.reply('❓ Modulo inserito non valido.')
  }

  await m.react(isEnable ? '⚡' : '💀')
  m.reply(`
┏━━━━━━━━━━━━━━━━━━┓
┃ 𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 𝐒𝐓𝐀𝐓𝐔𝐒
┃ 
┃ ⚙️ 𝗠𝗼𝗱𝘂𝗹𝗼: ${type.toUpperCase()}
┃ 📊 𝗦𝘁𝗮𝘁𝗼: ${status}
┗━━━━━━━━━━━━━━━━━━┛`)
}

handler.command = ['attiva', 'disattiva', 'on', 'off', 'enable', 'disable']
export default handler
