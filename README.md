# 🌑 Nightmare Time

**Survival Horror 2D** basado en Adventure Time corrupto.

Explora una versión retorcida de la Casa del Árbol. Finn, Jake, Chicle y el Rey Hielo han sido corrompidos. Sobrevive, descubre la verdad y decide el destino del Árbol.

## 🎮 Controles

| Tecla | Acción |
|-------|--------|
| A / D | Moverse |
| Shift | Correr (atrae enemigos) |
| Ctrl | Caminar en silencio |
| Q | Contener respiración |
| C | Esconderse / Salir |
| F | Linterna ON/OFF |
| X | Cambiar modo linterna |
| R | Cambiar pila |
| E | Interactuar |
| 1 | Señuelo sonoro |
| 2 | Cerrar compuerta |
| 3 | Calefactor |
| 4 | Runa purificadora |
| G | Golpear hielo |
| H | Activar calefactor (zona fría) |

## 🧠 Mecánicas

- **Linterna con 3 modos**: Normal, UV (revela secretos), Parpadeo (ahuyenta enemigos)
- **Sigilo avanzado**: Correr genera ruido, caminar en silencio no
- **Esconderse**: Contener respiración, espiar por rendija, riesgo de descubrimiento
- **4 Animatrónicos con IA única**: Cada uno detecta y persigue de forma diferente
- **Eventos aleatorios**: Cada partida es diferente
- **5 Finales**: Bueno, Malo, Neutral, Sacrificio y Secreto
- **Puzzles ambientales**: Runas, huellas UV, patrones de luz

## 🏗️ Compilar

```bash
npm install
npm run build
```

El ejecutable se genera en `dist/Nightmare Time-win32-x64/Nightmare Time.exe`

## 🚀 Desarrollo

```bash
npm run dev
```

## 📁 Estructura

```
game/
├── index.html
├── style.css
└── js/
    ├── main.js          # Game loop principal
    ├── utils.js         # Utilidades y estado global
    ├── audio.js         # Audio dinámico procedural
    ├── map.js           # Sistema de mapa y zonas
    ├── player.js        # Jugador y controles
    ├── flashlight.js    # Linterna con modos
    ├── hiding.js        # Sistema de esconderse
    ├── tutorial.js      # Tutorial inicial
    ├── stress.js        # Estrés visual
    ├── events.js        # Eventos aleatorios
    ├── puzzles.js       # Puzzles ambientales
    ├── ai_finn.js       # IA Finn Corrupto
    ├── ai_jake.js       # IA Jake Retorcido
    ├── ai_chicle.js     # IA Princesa Chicle
    ├── ai_reyhielo.js   # IA Rey Hielo
    ├── endings.js       # Sistema de finales
    └── cutscenes.js     # Cinemáticas
```
