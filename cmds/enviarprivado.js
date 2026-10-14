import db from "#db"

export default {
  command: ['enviarprivado', 'sendpriv', 'enviar', 'sendto'],
  category: 'owner',
  isOwner: true,
  botAdmin: false,
  run: async ({ msg, sock }) => {
    console.log("========================================");
    console.log("🔍 [DEBUG] Comando 'enviarprivado' ejecutado.");
    console.log("📍 [DEBUG] Chat actual:", msg.chat);
    console.log("========================================");

    try {
      // 1. Extraemos el texto
      let textoCompleto = msg.text || msg.body || '';
      const texto = textoCompleto
        .replace(/^[.\/!#]?(enviarprivado|sendpriv|enviar|sendto)\s*/i, '')
        .trim();

      // 2. Si no hay datos, mostramos instrucciones
      if (!texto) {
        const instrucciones = `📤 *Enviar link al privado*

*📋 Formato:*
\`.enviarprivado número | link | mensaje opcional\`

*📌 Ejemplos:*
\`.enviarprivado 51912345678 | https://www.mediafire.com/archivo.exe\`

\`.enviarprivado 51912345678 | https://link.com/archivo.exe | Aquí tienes el exe que pediste 🎁\`

*💡 También puedes enviar a varios números a la vez:*
\`.enviarprivado 51912345678,51987654321 | https://link.com/archivo.exe\`

> ✅ Este comando funciona en grupos y también en el privado del bot.`;

        return msg.reply(instrucciones);
      }

      // 3. Separamos por "|"
      const partes = texto.split('|').map(p => p.trim());

      if (partes.length < 2) {
        return msg.reply('❌ *Formato incorrecto.*\n\nDebes usar:\n`.enviarprivado número | link | mensaje opcional`');
      }

      const numerosTexto = partes[0];
      const link = partes[1];
      const mensajeOpcional = partes[2] || '';

      // 4. Verificamos que el link sea válido
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        return msg.reply('❌ El link no es válido. Debe empezar con `http://` o `https://`');
      }

      // 5. Procesamos los números
      const numerosArray = numerosTexto
        .split(',')
        .map(n => n.replace(/\D/g, '').trim())
        .filter(n => n.length >= 8);

      if (numerosArray.length === 0) {
        return msg.reply('❌ No se detectaron números válidos.\n\n*Ejemplo:* `51912345678` o `51912345678,51987654321`');
      }

      console.log(`📤 [ENVIAR] Enviando a ${numerosArray.length} número(s):`, numerosArray);

      let enviados = 0;
      let fallidos = 0;
      const resultados = [];

      // 6. Enviamos a cada número
      for (const numero of numerosArray) {
        try {
          const jid = numero + '@s.whatsapp.net';

          let mensajeFinal = '';
          
          if (mensajeOpcional) {
            mensajeFinal = `${mensajeOpcional}\n\n📦 *Archivo:*\n${link}`;
          } else {
            mensajeFinal = `📦 *Archivo solicitado:*\n\n${link}\n\n> Enviado por el equipo de soporte.`;
          }

          await sock.sendMessage(jid, {
            text: mensajeFinal
          });

          enviados++;
          resultados.push(`✅ ${numero}`);
          console.log(`✅ [ENVIAR] Enviado a ${numero}`);

          // Pausa anti-bloqueo
          await new Promise(res => setTimeout(res, 1500));

        } catch (err) {
          fallidos++;
          resultados.push(`❌ ${numero} — ${err.message}`);
          console.error(`❌ [ENVIAR] Error con ${numero}:`, err.message);
        }
      }

      // 7. Confirmación al owner
      const confirmacion = `📤 *Envío completado*

> ✅ Enviados: ${enviados}
> ❌ Fallidos: ${fallidos}

*Detalles:*
${resultados.join('\n')}`;

      await msg.reply(confirmacion);

    } catch (e) {
      console.error("❌ [ENVIAR ERROR]:", e.message);
      msg.reply('❌ Ocurrió un error al enviar el mensaje privado.');
    }
  },
};
