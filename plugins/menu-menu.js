import { promises as fs } from 'fs'
import { join } from 'path'

const emojicategoria = {
  info: '📂',
  main: '⚡',
  sicurezza: '🛡️'
}

let tags = {
  main: '𝐒𝐘𝐒𝐓𝐄𝐌 𝐂𝐎𝐑𝐄',
  sicurezza: '𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘',
  info: '𝐃𝐀𝐓𝐀𝐁𝐀𝐒𝐄'
}

const defaultMenu = {
  testoInizio: `
 *𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 ꪶ⃬🦂ꫂ*
┌───────────────────
│ 👤 *User:* %name
│ 🕒 *Uptime:* %uptime
│ 👥 *Users:* %totalreg
└───────────────────

*📋 ᴇʟᴇɴᴄᴏ ᴍᴏᴅᴜʟɪ ᴅɪꜱᴘᴏɴɪʙɪʟɪ:*
`.trimStart(),

  header: '┏━━━〔 %category 〕━━━┓',
  body: '┃ ⌬ %emoji %cmd',
  footer: '┗━━━━━━━━━━━━━━━──┛\n',
  testoFine: `_Scorpion System Terminal v3.0_`,
}

const localImg = './menu-principale.jpeg'

// Rimosso Giochi ed Euro come richiesto
const bldButtons = [
  { title: "🛡️ SICUREZZA", command: "attiva" },
  { title: "👥 GRUPPO", command: "menugruppo" },
  { title: "🛠️ STRUMENTI", command: "menustrumenti" },
  { title: "⭐ PREMIUM", command: "menupremium" }
]

let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    await conn.sendPresenceUpdate('composing', m.chat)

    let name = await conn.getName(m.sender) || 'User'
    let uptime = clockString(process.uptime() * 1000)
    let totalreg = Object.keys(global.db.data.users).length

    let help = Object.values(global.plugins).filter(p => !p.disabled).map(p => ({
      help: Array.isArray(p.help) ? p.help : [p.help],
      tags: Array.isArray(p.tags) ? p.tags : [p.tags],
      prefix: 'customPrefix' in p
    }))

    let menuTags = Object.keys(tags)

    let _text = [
      defaultMenu.testoInizio,
      ...menuTags.map(tag => {
        return defaultMenu.header.replace(/%category/g, tags[tag]) + '\n' + [
          ...help
            .filter(menu => menu.tags.includes(tag))
            .map(menu => menu.help.map(h => 
              defaultMenu.body
                .replace(/%cmd/g, menu.prefix ? h : _p + h)
                .replace(/%emoji/g, emojicategoria[tag])
            ).join('\n')),
          defaultMenu.footer
        ].join('\n')
      }),
      defaultMenu.testoFine
    ].join('\n')

    let text = _text.replace(/%name/g, name)
                    .replace(/%uptime/g, uptime)
                    .replace(/%totalreg/g, totalreg)

    const buttons = bldButtons.map(btn => ({
      buttonId: _p + btn.command,
      buttonText: { displayText: btn.title },
      type: 1
    }))

    let imageBuffer = null
    try {
      imageBuffer = await fs.readFile(localImg)
    } catch (e) {
      // Se l'immagine non esiste, imageBuffer rimane null e non crasha
      console.log("⚠️ Menu Image not found, sending text only.")
    }

    // Configurazione messaggio (con o senza immagine)
    let messageContent = {
      caption: text.trim(),
      footer: "𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 ꪶ⃬🦂ꫂ 𝐒𝐘𝐒𝐓𝐄𝐌",
      buttons: buttons,
      headerType: imageBuffer ? 4 : 1,
      viewOnce: true
    }

    if (imageBuffer) {
      messageContent.image = imageBuffer
    } else {
      messageContent.text = text.trim()
      delete messageContent.caption // Rimuovo caption se invio come testo semplice
    }

    await conn.sendMessage(m.chat, messageContent, { quoted: m })
    await m.react('🦂')

  } catch (e) {
    console.error(e)
  }
}

handler.help = ['menu']
handler.command = ['menu', 'help']

export default handler

function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}
