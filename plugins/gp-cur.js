import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const USERS_FILE = path.join(__dirname, '..', 'lastfm_users.json')
const LIKES_FILE = path.join(__dirname, '..', 'song_likes.json')

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}')
if (!fs.existsSync(LIKES_FILE)) fs.writeFileSync(LIKES_FILE, '{}')

const LASTFM_API_KEY = '36f859a1fc4121e7f0e931806507d5f9'

// ================= FILE =================
const loadUsers = () => JSON.parse(fs.readFileSync(USERS_FILE))
const saveUsers = (d) => fs.writeFileSync(USERS_FILE, JSON.stringify(d, null, 2))
const loadLikes = () => JSON.parse(fs.readFileSync(LIKES_FILE))
const saveLikes = (d) => fs.writeFileSync(LIKES_FILE, JSON.stringify(d, null, 2))

const getUser = (id) => loadUsers()[id] || null

const setUser = (id, username) => {
  const u = loadUsers()
  u[id] = username
  saveUsers(u)
}

const songId = (u, a, t) =>
  `${u}_${a}_${t}`.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').toLowerCase()

const addLike = (id, user) => {
  const db = loadLikes()
  if (!db[id]) db[id] = { likes: 0, users: [] }

  if (db[id].users.includes(user))
    return { ok: false, total: db[id].likes }

  db[id].likes++
  db[id].users.push(user)
  saveLikes(db)

  return { ok: true, total: db[id].likes }
}

// ================= API SAFE =================
const fetchJSON = async (url) => {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

const recentTrack = async (u) => {
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${u}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
  const d = await fetchJSON(url)
  return d?.recenttracks?.track?.[0]
}

const trackInfo = async (u, a, t) => {
  const url = `https://ws.audioscrobbler.com/2.0/?method=track.getinfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(a)}&track=${encodeURIComponent(t)}&username=${u}&format=json`
  const d = await fetchJSON(url)
  return d?.track
}

const userInfo = async (u) => {
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${u}&api_key=${LASTFM_API_KEY}&format=json`
  const d = await fetchJSON(url)
  return d?.user
}

const topArtists = async (u) => {
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${u}&api_key=${LASTFM_API_KEY}&format=json&period=7day&limit=10`
  const d = await fetchJSON(url)
  return d?.topartists?.artist || []
}

// ================= HANDLER =================
const handler = async (m, { conn, usedPrefix, text, command }) => {

  // SET USER
  if (command === 'setuser') {
    if (!text) return m.reply(`Usa: ${usedPrefix}setuser username`)
    setUser(m.sender, text.trim())
    return m.reply('✅ Profilo Last.fm salvato')
  }

  let username = text?.trim() || getUser(m.sender)
  if (!username) return m.reply(`❌ Imposta username: ${usedPrefix}setuser nome`)

  // CUR
  if (command === 'cur') {
    await conn.sendMessage(m.chat, { react: { text: "🎧", key: m.key } })

    const t = await recentTrack(username)
    if (!t) return m.reply('Nessun brano trovato')

    const artist = t.artist?.['#text'] || '-'
    const title = t.name || '-'
    const album = t.album?.['#text'] || 'Singolo'
    const img = t.image?.[3]?.['#text']

    const info = await trackInfo(username, artist, title)
    const uinfo = await userInfo(username)

    let msg =
`🎧 *SCORPION MUSIC*

👤 ${username}
🎵 ${title}
🎤 ${artist}
💿 ${album}

📊 Scrobble brano: ${info?.userplaycount || 0}
🌍 Totale: ${uinfo?.playcount || 0}
❤️ Like: ${getUser(m.sender) || 0}`

    const buttons = [
      { buttonId: `${usedPrefix}like ${username}`, buttonText: { displayText: '❤️ Like' }, type: 1 },
      { buttonId: `${usedPrefix}topartists ${username}`, buttonText: { displayText: '👑 Top' }, type: 1 }
    ]

    return conn.sendMessage(m.chat, {
      image: { url: img || 'https://cdn-icons-png.flaticon.com/512/174/174858.png' },
      caption: msg,
      footer: 'SCORPION BOT',
      buttons,
      headerType: 4
    }, { quoted: m })
  }

  // LIKE
  if (command === 'like') {
    const t = await recentTrack(username)
    if (!t) return m.reply('Nessun brano')

    const id = songId(username, t.artist?.['#text'], t.name)
    const r = addLike(id, m.sender)

    if (!r.ok) return m.reply('Hai già messo like')

    return m.reply(`❤️ Like aggiunto!\nTotale: ${r.total}`)
  }

  // TOP ARTISTS
  if (command === 'topartists') {
    const a = await topArtists(username)
    if (!a.length) return m.reply('Nessun dato')

    const list = a.map((x, i) =>
      `${i + 1}. ${x.name} (${x.playcount})`
    ).join('\n')

    return m.reply(`👑 TOP ARTISTS\n\n${list}`)
  }

  // TESTO
  if (command === 'testo') {
    const t = await recentTrack(username)
    if (!t) return m.reply('Nessun brano')

    try {
      const res = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(t.artist?.['#text'])}/${encodeURIComponent(t.name)}`
      )
      const d = await res.json()

      if (!d.lyrics) return m.reply('Testo non trovato')

      return m.reply(`📝 ${t.name}\n\n${d.lyrics}`)
    } catch {
      return m.reply('Errore lyrics API')
    }
  }
}

handler.command = ['setuser', 'cur', 'like', 'testo', 'topartists']
handler.tags = ['fun']
handler.group = false

export default handler
