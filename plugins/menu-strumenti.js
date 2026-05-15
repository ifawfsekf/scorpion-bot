import { promises } from 'fs'
import { join } from 'path'

const defmenu = {
  before: `
   *𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 ꪶ⃬🦂ꫂ*
   ──────────────
   *USER:* _%name_
   *CATEGORY:* _Strumenti_
   *STATUS:* _Deep Scan_
   ──────────────
`.trimStart(),
  header: '   *╒══  🛠️ %category  ══╕*',
  body: '   ┇ ⌬ %cmd',
  footer: '   *╘══════════════╛*\n',
  after: `_Scorpion System Terminal v3.0_`.trimEnd()
}

let handler = async (m, { conn, usedPrefix: _p }) => {
  let tags = {
    'strumenti': '𝐒𝐓𝐑𝐔𝐌𝐄𝐍𝐓𝐈'
  }

  try {
    await conn.sendPresenceUpdate('composing', m.chat)

    let name = await conn.getName(m.sender) || 'Soggetto Ignoto'

    // Filtro plugin per la categoria strumenti
    let help = Object.values(global.plugins)
      .filter(plugin => !plugin.disabled && plugin.tags && plugin.tags.includes('strumenti'))
      .map(plugin => ({
        help: Array.isArray(plugin.help) ? plugin.help : [plugin.help],
        prefix: 'customPrefix' in plugin,
      }))

    // Costruzione del testo
    let _text = [
      defmenu.before.replace(/%name/g, name),
      defmenu.header.replace(/%category/g, tags['strumenti']),
      help.map(menu => menu.help.map(cmd => 
        defmenu.body.replace(/%cmd/g, menu.prefix ? cmd : _p + cmd)
      ).join('\n')).join('\n'),
      defmenu.footer,
      defmenu.after
    ].join('\n')

    await m.react('🛠️')

    // Invio solo testo con contextInfo avanzato
    await conn.sendMessage(m.chat, {
      text: _text.trim(),
      contextInfo: {
        mentionedJid: [m.sender],
        externalAdReply: {
          title: "𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 𝐔𝐓𝐈𝐋𝐈𝐓𝐘 ⚡",
          body: "Toolbox Management Console",
          mediaType: 1,
          previewType: 0,
          sourceUrl: 'https://github.com',
          renderLargerThumbnail: false
        },
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363232743845068@newsletter',
          newsletterName: "🦂 𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 𝐒𝐘𝐒𝐓𝐄𝐌 🦂"
        }
      }
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, '🦂 *ERRORE:* Impossibile caricare il modulo strumenti.', m)
  }
}

handler.help = ['menustrumenti']
handler.tags = ['menu']
handler.command = ['menutools', 'menustrumenti']

export default handler
