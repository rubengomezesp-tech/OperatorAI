# Pendientes Día 4 (post-cierre noche)

## SESIÓN COMPLETADA
17 sprints en un día. Repo estable, Vercel verde.

## PENDIENTES PRIORITARIOS

### Sprint 1 — Topbar unificado (1h)
- 2 botones hamburguesa actualmente (layout + ChatDrawer)
- Unificar en uno solo
- Drawer con secciones: Herramientas | Chats
- Maximizar área de input chat
- Diseño minimalista (ver brief usuario)

### Sprint 2 — Migración GPT-5 (1h)
- Probar gpt-5-mini en trial (key nueva ya generada)
- API endpoint: /v1/responses (shape distinto)
- Adaptar cliente OpenAI en /api/chat/route.ts
- Beneficio: más rápido + más barato

### Sprint 3 — Reference images con Claude (45 min)
- Hoy hecho para GPT-4o → gpt-image-1
- Replicar flujo en Claude tool 'image'
- Para que cualquier provider pueda usar refs

### Sprint 4 — Lápiz azul inpainting (3-4h)
- Funcionalidad avanzada de edición
- Canvas drawable encima de imagen
- Generar máscara binaria
- Endpoint que acepte (image + mask + prompt)
- Sprint dedicado con cabeza fresca

## PENDIENTES SECUNDARIOS

### UI polish
- ChatTopbar dentro de chat-view (revisar si redundante)
- Verificar todas las páginas en mobile vs desktop
- Test de flujos completos

### Optimizaciones
- Imágenes pesadas en repo (revisar si quitar)
- Migración Next 14 → Next 15 (planeada)
- Limpiar ramas obsoletas (claude/cleanup-repo, backup-*)

## CONTEXTO PARA SIGUIENTE SESIÓN
Ver:
- docs/vision/01-ai-operating-system.md
- docs/vision/02-chat-first-ui.md
- docs/vision/03-fallos-y-mejoras-pendientes.md
- /mnt/transcripts/ (transcripts día por día)
