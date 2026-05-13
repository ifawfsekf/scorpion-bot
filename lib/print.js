import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'
import { watchFile } from 'fs'
import { fileURLToPath } from 'url'
import NodeCache from 'node-cache'

const __filename = fileURLToPath(import.meta.url)
const nameCache = new NodeCache({ stdTTL: 600 });
const groupMetaCache = new NodeCache({ stdTTL: 300 });
const errorThrottle = {};
const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g

export default async function (m, conn = { user: {} }) {
  if (!global.messageUpdateListenerSet) {
    conn.ev.on('messages.update', (updates) => {
      for (const update of updates) {
        if (update.update.message?.editedMessage) {
          console.log(chalk.bgYellow.black.bold(' ⚠ EDIT '), chalk.yellowBright('Messaggio modificato in questa chat.'));
        }
      }
    })
    global.messageUpdateListenerSet = true
  }

  if (!m || m.key?.fromMe) return

  try {
    const senderJid = conn.decodeJid(m.sender)
    const chatJid = conn.decodeJid(m.chat || '')
    const botJid = conn.decodeJid(conn.user?.jid)
    if (!chatJid) return;

    let _name = nameCache.get(senderJid) || await conn.getName(senderJid) || '';
    nameCache.set(senderJid, _name);

    const sender = formatPhoneNumber(senderJid, _name)
    let chatName = nameCache.get(chatJid) || await conn.getName(chatJid) || 'Unknown';

    const isOwner = Array.isArray(global.owner) ? global.owner.map(([number]) => number).includes(senderJid.split('@')[0]) : global.owner === senderJid.split('@')[0]
    const isGroup = chatJid.endsWith('@g.us')
    const isAdmin = isGroup ? await checkAdmin(conn, chatJid, senderJid) : false
    const isPremium = global.prems?.includes(senderJid) || false
    const isBanned = global.DATABASE?.data?.users?.[senderJid]?.banned || false

    const user = global.DATABASE?.data?.users?.[senderJid] || { exp: '?', euro: '?' }

    const c = {
      p: chalk.hex('#FFB300').bold,     
      s: chalk.hex('#FFFFFF').bold,     
      t: chalk.hex('#BBBBBB'),          
      g: chalk.hex('#FFCC00'),          
      v: chalk.hex('#FF8F00'),          
      warn: chalk.hex('#FFFF00').bold,  
      err: chalk.hex('#FF0000').bold    
    }

    const top = c.p('◢' + '═'.repeat(16) + '『 ') + c.s('𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴 𝐁𝐎𝐓') + c.p(' 』' + '═'.repeat(16) + '◣')
    const mid = c.p('┃') + c.t('─'.repeat(48)) + c.p('┃')
    const bot = c.p('◥' + '═'.repeat(48) + '◤')
    const L = c.p('┃')

    console.log('\n' + top)
    console.log(`${L} ${c.v('🦂 UTENTE ')} ${c.t('➤')} ${c.s(sender)}`)
    console.log(`${L} ${c.v('📍 CHAT   ')} ${c.t('➤')} ${c.s(chatName)} ${isGroup ? chalk.bgWhite.black(' GRP ') : chalk.bgYellow.black(' PVT ')}`)
    console.log(`${L} ${c.v('🛡️ RANGO  ')} ${c.t('➤')} ${getUserStatus(isOwner, isAdmin, isPremium, isBanned, c)}`)
    console.log(`${L} ${c.v('📥 TIPO   ')} ${c.t('➤')} ${c.s(formatType(m))} ${getMessageFlags(m, c)}`)

    if (m.isCommand) {
      console.log(mid)
      console.log(`${L} ${c.warn('⚡ EXEC    ')} ${c.t('➤')} ${chalk.bgHex('#FFB300').black.bold(' ' + getCommand(m.text) + ' ')}`)
    }

    if (user.exp !== '?') {
      console.log(`${L} ${c.g('💰 ASSETS  ')} ${c.t('➤')} ${c.s(user.exp + ' XP')} ${c.p('|')} ${c.s(user.euro + ' €')}`)
    }

    const logText = await formatText(m, conn)
    if (logText?.trim()) {
      console.log(mid)
      console.log(`${L} ${c.v('💬 MSG    ')} ${c.t('➜')} ${chalk.white.italic(logText)}`)
    }

    logMessageSpecifics(m, c, L)
    console.log(bot)

  } catch (error) {
    throttleError('Log Error:', error.message, 5000);
  }
}

function getUserStatus(isOwner, isAdmin, isPremium, isBanned, c) {
  if (isBanned) return c.err('『 BANNATO 』')
  if (isOwner) return chalk.bgHex('#FFB300').black.bold(' 👑 SCORPION KING ')
  let s = []
  if (isAdmin) s.push(c.p('ADMIN'))
  if (isPremium) s.push(c.g('PREMIUM'))
  return s.length ? s.join(chalk.gray(' | ')) : chalk.gray('USER')
}

function formatPhoneNumber(jid, name) {
  const num = jid.split('@')[0].split(':')[0]
  return name ? `${name} ${chalk.gray('('+num+')')}` : num
}

function formatType(m) {
  return (m.mtype || 'msg').replace(/Message/gi, '').toUpperCase()
}

function getMessageFlags(m, c) {
  let f = []
  if (m.quoted) f.push(c.v('↶ RIELABORA'))
  if (m.forwarded) f.push(c.g('➥ INOLTRATO'))
  return f.length ? chalk.gray('(') + f.join(' ') + chalk.gray(')') : ''
}

function getCommand(text) {
  return text ? text.split(/\s/)[0].toUpperCase() : ''
}

async function checkAdmin(conn, chatId, senderId) {
  try {
    const groupMeta = groupMetaCache.get(chatId) || await conn.groupMetadata(chatId)
    groupMetaCache.set(chatId, groupMeta)
    return groupMeta?.participants?.some(p => conn.decodeJid(p.id) === conn.decodeJid(senderId) && p.admin) || false
  } catch { return false }
}

function logMessageSpecifics(m, c, L) {
  const types = {
    imageMessage: '📷 IMMAGINE',
    videoMessage: '🎬 VIDEO',
    audioMessage: '🎧 AUDIO',
    stickerMessage: '🖼️ STICKER',
    documentMessage: '📂 DOC'
  }
  if (types[m.mtype]) console.log(`${L} ${c.v('📦 ALLEGATO')} ${c.t('➤')} ${c.g(types[m.mtype])}`)
}

async function formatText(m, conn) {
  let text = (m.text || m.caption || '').trim()
  if (!text) return ''
  return text.length > 100 ? text.slice(0, 100) + '...' : text
}

function throttleError(message, error, delay) {
  console.error(chalk.red(message), error)
}

watchFile(__filename, () => {
  console.log(chalk.bgHex('#FFB300').black.bold(" 🦂 SISTEMA SCORPION AGGIORNATO "))
})

