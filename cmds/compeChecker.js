import db from "#db"

export function iniciarCompeChecker(sock) {
  console.log('🎲 [COMPE CHECKER] Sistema de avisos iniciado (20 min antes).');

  setInterval(async () => {
    try {
      const ahora = new Date();
      const todosLosChats = await db.getChat();
      
      for (const chatData of todosLosChats) {
        const compesProgramadas = chatData.compes_programadas || [];
        if (compesProgramadas.length === 0) continue;

        let huboCambios = false;
        const compesRestantes = [];

        for (const compe of compesProgramadas) {
          const horaAviso = new Date(compe.horaAviso);
          const horaCompe = new Date(compe.horaCompe);
          const diffAviso = (horaAviso - ahora) / 1000 / 60;
          const diffCompe = (horaCompe - ahora) / 1000 / 60;

          // Eliminamos las que ya pasaron
          if (diffCompe < -5) {
            huboCambios = true;
            continue;
          }

          // Si es la hora del aviso
          if (diffAviso <= 0 && diffAviso > -1) {
            console.log(`🔔 [COMPE] Enviando aviso para ${chatData.id}`);

            const mentionsFinal = compe.jugadoras.map(j => j + '@s.whatsapp.net');
            const listaJugadoras = compe.jugadoras.map(j => `@${j}`).join('\n');
            
            const horaMostrar = compe.horaLocal || horaCompe.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const zonaMostrar = compe.zonaEmoji || '';
            const zonaNombre = compe.zonaNombre || '';

            // ✅ Mensaje actualizado a 20 minutos
            const mensajeAviso = `🔔 *¡COMPETENCIA EN 20 MINUTOS!*

> ⏰ *Hora:* ${horaMostrar} ${zonaMostrar} ${zonaNombre ? `(${zonaNombre})` : ''}
> 👥 *Jugadoras:*
${listaJugadoras}

> 🎮 ¡Preparadas para la competencia!`;

            try {
              await sock.sendMessage(chatData.id, {
                text: mensajeAviso,
                mentions: mentionsFinal
              });
            } catch (err) {
              console.error(`❌ Error enviando aviso:`, err.message);
            }
          }

          compesRestantes.push(compe);
        }

        if (huboCambios) {
          await db.updateChat(chatData.id, 'compes_programadas', compesRestantes);
        }
      }
    } catch (e) {
      console.error('❌ [COMPE CHECKER] Error:', e.message);
    }
  }, 60 * 1000);
}
