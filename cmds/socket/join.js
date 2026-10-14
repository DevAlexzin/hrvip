import db from "#db"

export default {
  command: ['join', 'unir'],
  isModeration: true,
  run: async ({ msg, sock, participants }) => {
    try {
      const idBot = sock.user.id.split(':')[0] + '@s.whatsapp.net'
      const config = await db.getSettings(idBot)

      // ✅ Función robusta para extraer el número real del sender
      const getSenderNumber = (sender) => {
        if (!sender) return ''
        return sender.split('@')[0].split(':')[0]
      }

      const senderNumero = getSenderNumber(msg.sender)
      console.log('📱 [JOIN] Sender:', msg.sender, '→ Número:', senderNumero)

      // ✅ Obtenemos TODOS los identificadores del sender en el grupo
      const senderIds = new Set()
      senderIds.add(msg.sender)
      senderIds.add(msg.sender.split(':')[0] + '@s.whatsapp.net')
      senderIds.add(senderNumero + '@s.whatsapp.net')
      senderIds.add(senderNumero)

      // ✅ Buscamos en los participantes del grupo el LID del sender
      if (participants && participants.length > 0) {
        for (const p of participants) {
          const pIds = [
            p.id?.split('@')[0],
            p.id?.split(':')[0],
            p.lid?.split('@')[0],
            p.phoneNumber?.split('@')[0]
          ].filter(Boolean)

          // Si el participant coincide con el sender en cualquier formato, agregamos sus IDs
          if (pIds.includes(senderNumero) || 
              p.id === msg.sender || 
              p.lid === msg.sender) {
            pIds.forEach(id => {
              senderIds.add(id)
              senderIds.add(id + '@s.whatsapp.net')
            })
          }
        }
      }

      console.log('🔍 [JOIN] IDs detectados del sender:', [...senderIds])

      // ✅ Construimos la lista de owners en TODOS los formatos
      const ownersGlobales = (global.owner || []).flatMap(num => [
        num,
        num + '@s.whatsapp.net',
        num + '@lid'
      ])

      const mods = (global.mods || []).flatMap(num => [
        num,
        num + '@s.whatsapp.net',
        num + '@lid'
      ])

      const ownersBot = config.owner ? [
        config.owner,
        config.owner + '@s.whatsapp.net',
        config.owner + '@lid'
      ] : []

      const todosLosOwners = [
        idBot,
        ...ownersBot,
        ...ownersGlobales,
        ...mods
      ]

      console.log('👑 [JOIN] Owners válidos:', todosLosOwners)

      // ✅ Verificamos si ALGUNO de los IDs del sender está en la lista de owners
      const esOwner = [...senderIds].some(id => todosLosOwners.includes(id))

      console.log('✅ [JOIN] ¿Es owner?:', esOwner)

      if (!esOwner) {
        return msg.reply('❌ Este comando solo puede ser ejecutado por un Owner.')
      }

      // Extraemos el enlace
      let textoCompleto = msg.text || msg.body || ''
      const textoLimpio = textoCompleto
        .replace(/^[.\/!#]?(join|unir)\s*/i, '')
        .trim()

      if (!textoLimpio) {
        return msg.reply('《✧》 Ingresa el enlace del grupo para unir el bot.\n\n*Ejemplo:* `.join https://chat.whatsapp.com/xxxxx`')
      }

      const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i
      const match = textoLimpio.match(linkRegex)

      if (!match || !match[1]) {
        return msg.reply('《✧》 El enlace ingresado no es válido o está incompleto.')
      }

      const inviteCode = match[1]
      await sock.groupAcceptInvite(inviteCode)

      await sock.reply(
        msg.chat,
        `❀ ${config.namebot || 'El bot'} se ha unido exitosamente al grupo.`,
        msg
      )

    } catch (e) {
      const errMsg = String(e.message || e)
      console.error('❌ [JOIN ERROR]:', errMsg)

      if (errMsg.includes('not-authorized') || errMsg.includes('requires-admin')) {
        await msg.reply('《✧》 La unión requiere aprobación de administrador.')
      } else if (errMsg.includes('not-in-group') || errMsg.includes('removed')) {
        await msg.reply('《✧》 No se pudo unir al grupo porque el bot fue eliminado recientemente.')
      } else {
        await msg.reply('《✧》 No se pudo unir al grupo, verifica el enlace o los permisos.')
      }
    }
  },
}
