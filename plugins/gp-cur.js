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

// ================= FILE SYSTEM =================
function loadUsers() { return JSON.parse(fs.readFileSync(USERS_FILE)) }
function saveUsers(data) { fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2)) }
function loadLikes() { return JSON.parse(fs.readFileSync(LIKES_FILE)) }
function saveLikes(data) { fs.writeFileSync(LIKES_FILE, JSON.stringify(data, null, 2)) }

function getLastfmUsername(id) { return loadUsers()[id] || null }
function setLastfmUsername(id, username) {
  const users = loadUsers()
  users[id] = username
  saveUsers(users)
}

function generateSongId(username, artist, track) {
  return `${username}_${artist}_${track}`
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

function addLike(songId, userId) {
  const likes = loadLikes()
  if (!likes[songId]) likes[songId] = { likes: 0, users: [] }

  if (likes[songId].users.includes(userId)) {
    return { already: true, total: likes[songId].likes }
  }

  likes[songId].likes++
  likes[songId].users.push(userId)
  saveLikes(likes)

  return { already: false, total: likes[songId].likes }
}

function getLikesReceived(username) {
  const likes = loadLikes()
  let total = 0

  for (const id in likes) {
    if (id.startsWith(username.toLowerCase())) total += likes[id].likes
  }

  return total
}

// ================= API =================
async function fetchJson(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function getRecentTrack(username) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
  const data = await fetchJson(url)
  return data?.recenttracks?.track?.[0]
}

async function getTrackInfo(username, artist, track) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=track.getinfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&username=${username}&format=json`
  const data = await fetchJson(url)
  return data?.track
}

async function getUserInfo(username) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${LASTFM_API_KEY}&format=json`
  const data = await fetchJson(url)
  return data?.user
}

async function getTopArtists(username) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&api_key=${LASTFM_API_KEY}&format=json&period=7day&limit=10`
  const data = await fetchJson(url)
  return data?.topartists?.artist || []
}

// ================= HANDLER =================
const handler = async (m, { conn, usedPrefix, text, command }) => {

  if (command === 'setuser') {
    if (!text) return m.reply(`💡 Usa: ${usedPrefix}setuser nome_utente`)
    setLastfmUsername(m.sender, text.trim())
    return m.reply(`✅ Profilo Last.fm collegato!`)
  }

  let username = text ? text.trim() : getLastfmUsername(m.sender)
  if (!username) return m.reply(`❌ Username non impostato.\nUsa: ${usedPrefix}setuser nome`)

  // ===== CUR =====
  if (command === 'cur') {
    await conn.sendMessage(m.chat, { react: { text: "🎧", key: m.key } })

    const track = await getRecentTrack(username)
    if (!track) return m.reply('⚠️ Nessun ascolto trovato.')

    const nowPlaying = track['@attr']?.nowplaying === 'true'
    const artist = track.artist?.['#text']
    const title = track.name
    const album = track.album?.['#text'] || 'Singolo'
    const image = track.image?.pop()?.['#text']

    const info = await getTrackInfo(username, artist, title)
    const userInfo = await getUserInfo(username)
    const likes = getLikesReceived(username)

    let infoMsg =
`┏━━━━━━━━━━━━━━━━━━━━┓
   𝐒𝐂𝚯𝐑𝐏𝐈𝚯𝚴
┗━━━━━━━━━━━━━━━━━━━━┛

◈ 👤 Utente: ${username}
◈ 📀 Stato: ${nowPlaying ? '🔥 In riproduzione' : '🕒 Ultimo ascolto'}

◈ 📌 Titolo: ${title}
◈ 🎤 Artista: ${artist}
◈ 💿 Album: ${album}

◈ 📊 Dati:
├ 📈 Scrobble brano: ${info?.userplaycount || 0}
├ 🌍 Scrobble totali: ${userInfo?.playcount || 0}
└ ❤️ Like ricevuti: ${likes}

Seleziona un'opzione:`

    const buttons = [
      { buttonId: `${usedPrefix}playaud ${artist} ${title}`, buttonText: { displayText: '🎵 Scarica Audio' }, type: 1 },
      { buttonId: `${usedPrefix}like ${username}`, buttonText: { displayText: '❤️ Like' }, type: 1 },
      { buttonId: `${usedPrefix}topartists ${username}`, buttonText: { displayText: '👑 Top Artists' }, type: 1 }
    ]

    return await conn.sendMessage(m.chat, {
      image: { url: image || 'https://cdn-icons-png.flaticon.com/512/174/174858.png' },
      caption: infoMsg,
      footer: 'SCORPION • 2026',
      buttons,
      headerType: 4
    }, { quoted: m })
  }

  // ===== LIKE =====
  if (command === 'like') {
    const track = await getRecentTrack(username)
    if (!track) return m.reply('⚠️ Nessun brano trovato.')

    const songId = generateSongId(username, track.artist?.['#text'], track.name)
    const result = addLike(songId, m.sender)

    if (result.already)
      return m.reply(`💔 Hai già messo like a questo brano.`)

    return m.reply(`🔥 Like aggiunto!\n🎵 ${track.name}\n❤️ Totale: ${result.total}`)
  }

  // ===== TOP ARTISTS =====
  if (command === 'topartists') {
    const artists = await getTopArtists(username)
    if (!artists.length) return m.reply('❌ Nessun dato.')

    const list = artists
      .map((a, i) => `*${i + 1}.* ${a.name} (${a.playcount})`)
      .join('\n')

    return m.reply(`👑 TOP ARTISTI (7 giorni)\n\n${list}`)
  }

  // ===== TESTO =====
  if (command === 'testo') {
    const track = await getRecentTrack(username)
    if (!track) return m.reply('⚠️ Nessun brano.')

    try {
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(track.artist?.['#text'])}/${encodeURIComponent(track.name)}`)
      const data = await res.json()

      if (!data.lyrics) return m.reply('❌ Testo non trovato.')

      return m.reply(`📝 ${track.name}\n\n${data.lyrics}`)
    } catch {
      return m.reply('⚠️ Errore API lyrics.')
    }
  }
}

handler.command = ['setuser', 'cur', 'like', 'testo', 'topartists']
handler.group = false
handler.tags = ['fun']

export default handler
