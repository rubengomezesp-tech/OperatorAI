# Fallos y mejoras pendientes — OperatorAI

## 1. Recuperación de errores en chat
Cuando el chat falle tras muchos mensajes y el usuario diga que no
le llegan respuestas, el agente debe encontrar ruta alternativa
(push notification, modal/submódulo) avisando del problema.
Reporte automático al admin.

## 2. Zoom y scroll en chat
Pantalla fija sin scrollear. Al hacer click en input o recibir
documento, NO debe hacer zoom ni mover el viewport.
Todo accesible desde un punto fijo.

## 3. GPT image generation
GPT no genera imágenes — dice que no puede.
Actualizar a versión de API que entienda imágenes de referencia
y consiga objetivos específicos.

## 4. Gemini error con system_instruction
Gemini rechaza con: "Invalid value at 'system_instruction'"
fieldViolations en system_instruction.
Necesita formato Content correcto, no string concatenado largo.

## 5. Floating UI / Glass design
- Background semi-transparente con backdrop-blur 20px
- Sin cajas duras, bordes inexistentes o muy suaves
- Sombras ligeras, no pesadas
- Botones tipo pill, flotantes
- Input chat flotante inferior estilo ChatGPT, redondeado completo
- Mucho espacio negativo, elementos que respiran
- Transiciones 150-250ms, micro animaciones suaves
- Inspiración: ChatGPT, Apple Vision Pro, iOS Control Center, Linear
- Estilo: rgba(255,255,255,0.05), backdrop-filter blur 20px,
  border 1px solid rgba(255,255,255,0.08)

## 6. Tipografía premium
- Inter como principal (pesos 400-500, evitar bold)
- Alternativa moderna: SF Pro o Geist
- Serif elegante para títulos clave: Playfair Display o Cormorant Garamond
- line-height amplio, letter-spacing ligero
- Textos cortos, jerarquía clara
- Estilo editorial tipo revista de lujo o Apple

REGLAS (puntos 5-6):
- NO rediseñar app desde cero
- NO romper componentes existentes
- NO cambiar lógica ni backend
- Aplicar SOBRE código actual
- Decir qué archivos modificar antes
- Implementar paso a paso

## 8. Orquestación integral del sistema
Sistema coherente cubriendo:
- generación imágenes / texto / análisis docs
- uso logos y assets del usuario
- campañas, mockups, chat
- UI floating glass
- outputs listos para redes

ARQUITECTURA:
AGENT (cerebro) → decide tools → ejecuta

TOOLS NECESARIAS:
- generateImage()
- generateText()
- analyzeDocument()
- getBrandAssets()
- composeAd()

CASOS A CUBRIR:
1. Campaña → copy + imagen + logo + brand → piezas listas
2. Documento → extraer + usar como contexto → generar
3. Marca → usar colores/tipos/logos automáticamente
4. Mockup → integrar imagen + texto correctamente
5. Solo imagen → generar y guardar en sistema
6. Ideas → solo texto sin romper nada

REGLAS:
- No romper existente
- No duplicar lógica
- Reutilizar rutas actuales (/api/images, /api/chat)
- Añadir capa de orquestación encima

OUTPUT REQUERIDO:
1. Diagnóstico sistema actual
2. Mapa arquitectura ideal
3. Archivos a tocar
4. Nuevos módulos/tools
5. Flujo ejecución del agente
6. Plan implementación por fases
7. Tests manuales para cada caso
