# Pendientes Día 4 (post-sesión brand assets)

## CONTEXTO
Sesión Día 4 cerró con:
- Limpieza repo post Claude Code merge
- 4 fixes producción (skeleton, system prompt, CSP, image-proxy)
- Brand assets fully wired (sidebar, topbar, chat avatar, bg)
- 4 nav icons custom configurables desde admin
- Texto sidebar "⏵ Operator AI" techy
- Avatar usuario con foto/inicial

## PENDIENTES

### A — Eliminar barra menú vieja móvil
- Hay UNA barra antigua que conv con el BottomNav nuevo
- Localizar: probablemente en AppShell o un drawer-mobile.tsx viejo
- Eliminar completamente (BottomNav v5 ya cubre la nav)

### B — Footer + background no premium
- Footer "soporte/privacidad" texto poco visible
- Background actual: azul marino (no negro puro)
- Cambiar a negro real (#0a0a0a o #000) para premium
- Subir contraste del footer

### C — Topbar: unificar 2 hamburguesas en 1
- Hay 2 botones de menú (3 rayas):
  * MobileMenuButton del layout
  * ChatDrawer dentro del chat-view
- Unificar en UNO solo
- Estructura propuesta:
  * Botón único arriba izquierda
  * Click → drawer con SECCIONES:
    - Herramientas (sidebar items)
    - Chats (lista de conversaciones)
  * Tabs o secciones colapsables
- Maximizar área de input chat
- Diseño minimalista — no cargar más

### D — ChatTopbar duplicado
- Componente <ChatTopbar /> dentro de chat-view
- Probablemente redundante con el Topbar del layout
- Revisar si se puede eliminar o simplificar

## SIGUIENTE SPRINT
Atacar A → B → C → D en orden.
Tiempo estimado: ~2-3h con cabeza fresca.
