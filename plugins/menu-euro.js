import { promises as fs } from 'fs'

const defaultMenu = {
  testoInizio: `
*𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 ꪶ⃬🦂ꫂ*
┌───────────────────
│ 👤 *User:* %name%
│ 🕒 *Uptime:* %uptime%
│ 👥 *Users:* %totalreg%
└───────────────────
`,

  testoFine: `_Scorpion System Terminal v3.0_`
}

const localImg = './menu-principale.jpeg'

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

    let totalreg = global.db?.data?.users
      ? Object.keys(global.db.data.users).length
      : 0

let text = (defaultMenu.testoInizio + '\n' + defaultMenu.testoFine)
  .replace(/%name%/g, name)
  .replace(/%uptime%/g, uptime)
  .replace(/%totalreg%/g, totalreg)

    const buttons = bldButtons.map(btn => ({
      buttonId: _p + btn.command,
      buttonText: { displayText: btn.title },
      type: 1
    }))

    let imageBuffer = null
    try {
      imageBuffer = await fs.readFile(localImg)
    } catch (e) {
      console.log("⚠️ Immagine non trovata, invio testo.")
    }

    let messageContent = {
      footer: "𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 ꪶ⃬🦂ꫂ SYSTEM",
      buttons,
      viewOnce: true
    }

    if (imageBuffer) {
      messageContent.image = imageBuffer
      messageContent.caption = text.trim()
    } else {
      messageContent.text = text.trim()
    }

    await conn.sendMessage(m.chat, messageContent, { quoted: m })
    await m.react('🦂')

  } catch (e) {
    console.error(e)
    m.reply("❌ Errore nel menu")
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
