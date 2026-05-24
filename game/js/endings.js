// ============================================
// NIGHTMARE TIME - Sistema de Finales
// ============================================

const EndingsSystem = {
  currentEnding: null,
  endingTriggered: false,

  // Evaluar qué final se activa
  evaluateEnding() {
    const d = GameState.decisions;

    // Final Secreto: encontrar todos los símbolos + purificar + ayudar a Finn
    if (d.symbolsFound >= GameState.totalSymbols && d.corePurified && d.finnHelped) {
      return 'secreto';
    }

    // Final Bueno: purificar el núcleo + detener al Rey Hielo
    if (d.corePurified && d.reyHieloStopped) {
      return 'bueno';
    }

    // Final de Sacrificio: purificar sin escapar
    if (d.corePurified && !d.escapedExterior) {
      return 'sacrificio';
    }

    // Final Neutral: escapar sin purificar
    if (d.escapedExterior && !d.corePurified) {
      return 'neutral';
    }

    // Final Malo: no purificar, no escapar, o morir muchas veces
    return 'malo';
  },

  triggerEnding(endingId) {
    if (this.endingTriggered) return;
    this.endingTriggered = true;
    this.currentEnding = endingId || this.evaluateEnding();
    
    // Iniciar cinemática
    CutsceneSystem.play(this.currentEnding);
  },

  getEndingData(id) {
    const endings = {
      bueno: {
        title: 'PURIFICACIÓN',
        description: 'Has purificado el Árbol. La corrupción se desvanece. Finn, Jake, Chicle y el Rey Hielo vuelven a ser ellos mismos. La casa respira de nuevo.',
        color: '#4cff88',
        lines: [
          'El núcleo del Árbol brilla con luz pura.',
          'Las raíces se retraen... la corrupción se disuelve.',
          'Finn abre los ojos. "¿Qué... qué pasó?"',
          'Jake se estira, confundido pero libre.',
          'La Princesa Chicle recupera su forma.',
          'El Rey Hielo... simplemente se sienta y llora.',
          'La casa vuelve a ser un hogar.',
          'Tú sales por la puerta principal.',
          'El sol brilla. Todo ha terminado.',
          '...¿verdad?'
        ]
      },
      malo: {
        title: 'CORRUPCIÓN TOTAL',
        description: 'El Árbol te ha consumido. Ahora eres parte de él. Otro animatrónico más en la casa.',
        color: '#ff0044',
        lines: [
          'Las raíces te envuelven.',
          'Intentas gritar, pero tu voz ya no es tuya.',
          'El Árbol susurra: "Bienvenido a casa."',
          'Finn sonríe. Jake ríe. Chicle gotea.',
          'El Rey Hielo canta una canción de cuna.',
          'Tus ojos se vuelven rojos.',
          'Tu piel se endurece.',
          'Ya no eres un visitante.',
          'Eres parte de la familia.',
          'Para siempre.'
        ]
      },
      neutral: {
        title: 'ESCAPE INCOMPLETO',
        description: 'Has escapado, pero la corrupción sigue dentro. El Árbol sigue vivo. Ellos siguen atrapados.',
        color: '#ffaa00',
        lines: [
          'Corres hacia la puerta.',
          'Las raíces intentan detenerte, pero eres más rápido.',
          'Sales al exterior. El aire frío te golpea.',
          'Miras atrás. La casa te observa.',
          'Los ojos en las ventanas parpadean.',
          'Finn golpea el cristal desde dentro.',
          'Jake aúlla en la distancia.',
          'Te alejas corriendo.',
          'Pero sabes que volverás.',
          'Ellos te esperan.'
        ]
      },
      sacrificio: {
        title: 'SACRIFICIO',
        description: 'Has purificado el Árbol, pero el precio fue tu libertad. Te quedas dentro para siempre, manteniendo la pureza.',
        color: '#aa88ff',
        lines: [
          'El núcleo se purifica... pero necesita un guardián.',
          'Las raíces se envuelven a tu alrededor, suavemente.',
          'No duele. Es... cálido.',
          'Finn despierta libre. Jake también.',
          'Ellos salen de la casa, confundidos.',
          '"¿Quién nos salvó?" pregunta Finn.',
          'Nadie responde.',
          'Dentro del Árbol, tú sonríes.',
          'Eres el nuevo corazón de la casa.',
          'Y la casa, por fin, está en paz.'
        ]
      },
      secreto: {
        title: 'LA VERDAD',
        description: 'Has descubierto todos los secretos. El Árbol no estaba corrupto... estaba pidiendo ayuda.',
        color: '#00ffff',
        lines: [
          'Los cinco símbolos brillan a la vez.',
          'El Árbol habla. No con palabras... con recuerdos.',
          'Ves su historia: fue plantado por los antiguos.',
          'Fue hogar de cientos antes que Finn y Jake.',
          'La "corrupción" era un grito de dolor.',
          'Alguien lo hirió. Alguien que ya no está.',
          'Con la purificación y los símbolos, lo sanas completamente.',
          'El Árbol florece. Flores de luz emergen.',
          'Finn, Jake, Chicle y el Rey Hielo despiertan... y recuerdan.',
          '"Gracias," dice el Árbol. "Gracias por escuchar."',
          'La casa brilla. Tú sonríes.',
          'Y por primera vez en mucho tiempo...',
          '...todo está bien.'
        ]
      }
    };

    return endings[id] || endings.malo;
  }
};
