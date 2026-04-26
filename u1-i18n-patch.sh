#!/bin/bash
# ════════════════════════════════════════════════════════════════
# PATCH: Add ALL Campaign Brain i18n keys (ES + EN)
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "Patching i18n.tsx — adding Campaign Brain keys"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/lib/i18n.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Anchor: insert before the closing brace of the translations object
new_keys = '''  // ═══════════════════════════════════════════════════════════
  // Campaign Brain V2
  // ═══════════════════════════════════════════════════════════
  'cb.intake.eyebrow': { en: 'New Campaign', es: 'Nueva Campana' },
  'cb.intake.title_a': { en: 'Brief us like an', es: 'Cuentanos como a una' },
  'cb.intake.title_accent': { en: 'agency', es: 'agencia' },
  'cb.intake.subtitle': { en: 'Fill in what you know — Brain handles the rest. Auto-saves.', es: 'Completa lo que sepas — el Brain hace el resto. Guardado automatico.' },
  'cb.intake.section_basics': { en: 'The basics', es: 'Lo basico' },
  'cb.intake.section_basics_sub': { en: 'Required to run the Brain', es: 'Necesario para ejecutar el Brain' },
  'cb.intake.section_strategy': { en: 'Strategy', es: 'Estrategia' },
  'cb.intake.section_strategy_sub': { en: 'Optional — Brain auto-detects if blank', es: 'Opcional — Brain detecta solo si esta vacio' },
  'cb.intake.section_voice': { en: 'Voice & offer', es: 'Tono y oferta' },
  'cb.intake.section_voice_sub': { en: 'Help Brain match your tone', es: 'Ayuda al Brain con tu tono' },
  'cb.intake.label.campaign_name': { en: 'Campaign name', es: 'Nombre de campana' },
  'cb.intake.placeholder.campaign_name': { en: 'Spring Drop Launch', es: 'Lanzamiento Coleccion Primavera' },
  'cb.intake.label.product': { en: 'Product / Service', es: 'Producto / Servicio' },
  'cb.intake.label.description': { en: 'What is it?', es: 'En que consiste?' },
  'cb.intake.placeholder.description': { en: 'An AI-powered brand and campaign system that turns your URL into a complete strategic brief in 60 seconds.', es: 'Un sistema de marca y campanas con IA que convierte tu URL en un brief estrategico completo en 60 segundos.' },
  'cb.intake.label.goal': { en: 'Goal of this campaign', es: 'Objetivo de la campana' },
  'cb.intake.placeholder.goal': { en: 'Drive 1000 free trial signups in week 1', es: 'Conseguir 1000 registros de prueba gratis en la primera semana' },
  'cb.intake.label.audience': { en: 'Audience', es: 'Audiencia' },
  'cb.intake.placeholder.audience': { en: 'Founders, marketing leads at startups, agency owners. They juggle Canva + ChatGPT + Photoshop.', es: 'Fundadores, responsables de marketing en startups, duenos de agencias. Mezclan Canva + ChatGPT + Photoshop.' },
  'cb.intake.label.vertical': { en: 'Vertical (industry)', es: 'Vertical (industria)' },
  'cb.intake.label.type': { en: 'Campaign type', es: 'Tipo de campana' },
  'cb.intake.label.platforms': { en: 'Platforms (where this campaign runs)', es: 'Plataformas (donde corre la campana)' },
  'cb.intake.label.tone': { en: 'Brand tone', es: 'Tono de marca' },
  'cb.intake.placeholder.tone': { en: 'confident, modern, considered', es: 'seguro, moderno, cuidado' },
  'cb.intake.label.cta': { en: 'Preferred CTA', es: 'Llamada a la accion preferida' },
  'cb.intake.placeholder.cta': { en: 'Try free', es: 'Prueba gratis' },
  'cb.intake.label.offer': { en: 'Offer (if any)', es: 'Oferta (si la hay)' },
  'cb.intake.placeholder.offer': { en: '50% off, 14-day trial, free first month', es: '50% descuento, 14 dias prueba, primer mes gratis' },
  'cb.intake.label.avoid': { en: 'Things to avoid', es: 'Cosas a evitar' },
  'cb.intake.placeholder.avoid': { en: "No 'revolutionary'. No countdown timers. No fake testimonials.", es: 'Sin "revolucionario". Sin temporizadores. Sin testimonios falsos.' },
  'cb.intake.option_auto': { en: 'Auto-detect', es: 'Detectar automaticamente' },
  'cb.intake.cta_strategize': { en: 'Generate Strategy →', es: 'Generar Estrategia →' },
  'cb.intake.cta_strategize_loading': { en: 'Brain is thinking…', es: 'El Brain esta pensando…' },
  'cb.intake.cta_disabled_hint': { en: 'Fill product name, description, and goal to enable.', es: 'Completa nombre, descripcion y objetivo para activar.' },
  'cb.intake.save.idle': { en: 'Auto-save on', es: 'Guardado automatico activo' },
  'cb.intake.save.saving': { en: 'Saving…', es: 'Guardando…' },
  'cb.intake.save.saved': { en: 'Saved', es: 'Guardado' },
  'cb.intake.save.error': { en: 'Error', es: 'Error' },
  'cb.intake.save.loading': { en: 'Loading…', es: 'Cargando…' },

  'cb.brief.eyebrow': { en: 'Strategy Brief', es: 'Brief Estrategico' },
  'cb.brief.confidence': { en: 'Confidence', es: 'Confianza' },
  'cb.brief.variants_ready': { en: 'variant briefs prepared', es: 'briefs de variantes listos' },
  'cb.brief.section_diagnostic': { en: 'Diagnostic', es: 'Diagnostico' },
  'cb.brief.diag_pain': { en: 'Pain', es: 'Dolor' },
  'cb.brief.diag_desire': { en: 'Desire', es: 'Deseo' },
  'cb.brief.diag_objection': { en: 'Objection', es: 'Objecion' },
  'cb.brief.diag_hidden': { en: 'Hidden desire', es: 'Deseo oculto' },
  'cb.brief.section_audience': { en: 'Audience', es: 'Audiencia' },
  'cb.brief.audience_primary': { en: 'Primary persona', es: 'Persona principal' },
  'cb.brief.audience_also': { en: 'Also reaches', es: 'Tambien alcanza a' },
  'cb.brief.audience_triggers': { en: 'Triggers', es: 'Detonantes' },
  'cb.brief.audience_barriers': { en: 'Barriers', es: 'Barreras' },
  'cb.brief.section_angles': { en: 'Strategic angles', es: 'Angulos estrategicos' },
  'cb.brief.section_hooks': { en: 'Hooks', es: 'Ganchos' },
  'cb.brief.section_ctas': { en: 'CTAs', es: 'Llamadas a la accion' },
  'cb.brief.section_visual': { en: 'Visual direction', es: 'Direccion visual' },
  'cb.brief.visual_aesthetic': { en: 'Aesthetic', es: 'Estetica' },
  'cb.brief.visual_lighting': { en: 'Lighting', es: 'Iluminacion' },
  'cb.brief.visual_composition': { en: 'Composition', es: 'Composicion' },
  'cb.brief.visual_mood': { en: 'Mood', es: 'Mood' },
  'cb.brief.section_variants': { en: 'variants ready to render', es: 'variantes listas para renderizar' },
  'cb.brief.variants_more': { en: 'more variants', es: 'variantes mas' },
  'cb.brief.section_launch': { en: 'day launch plan', es: 'dias de plan de lanzamiento' },
  'cb.brief.day': { en: 'Day', es: 'Dia' },
  'cb.brief.visual_label': { en: 'Visual', es: 'Visual' },
  'cb.brief.cta_edit': { en: 'Edit brief', es: 'Editar brief' },
  'cb.brief.cta_render': { en: 'Render variants →', es: 'Renderizar variantes →' },
  'cb.brief.thinking_eyebrow': { en: 'Brain is thinking', es: 'El Brain esta pensando' },
  'cb.brief.thinking_title_a': { en: 'Building your', es: 'Construyendo tu' },
  'cb.brief.thinking_title_accent': { en: 'strategy', es: 'estrategia' },
  'cb.brief.thinking_subtitle': { en: 'Diagnosing audience, picking angles, drafting hooks. Usually 30-60 seconds.', es: 'Diagnosticando audiencia, eligiendo angulos, escribiendo ganchos. Normalmente 30-60 segundos.' },

  'cb.assets.eyebrow': { en: 'Step 3 of 4', es: 'Paso 3 de 4' },
  'cb.assets.title': { en: 'Add assets (optional)', es: 'Anade activos (opcional)' },
  'cb.assets.subtitle': { en: 'Upload product photos, logo, or reference images. Skip if you only need AI-generated visuals.', es: 'Sube fotos del producto, logo o imagenes de referencia. Salta este paso si solo quieres visuales generados por IA.' },
  'cb.assets.upload': { en: 'Upload images', es: 'Subir imagenes' },
  'cb.assets.continue': { en: 'Continue to render →', es: 'Continuar a renderizar →' },
  'cb.assets.skip': { en: 'Skip — generate without photos', es: 'Saltar — generar sin fotos' },

  'cb.variants.eyebrow': { en: 'Step 4 of 4', es: 'Paso 4 de 4' },
  'cb.variants.title': { en: 'Your variants', es: 'Tus variantes' },
  'cb.variants.subtitle': { en: 'AI-generated, on-brand. Edit or download below.', es: 'Generadas por IA, fieles a tu marca. Edita o descarga abajo.' },
  'cb.variants.rendering': { en: 'Rendering variants…', es: 'Renderizando variantes…' },
  'cb.variants.regenerate': { en: 'Regenerate', es: 'Regenerar' },
  'cb.variants.download': { en: 'Download', es: 'Descargar' },
  'cb.variants.edit': { en: 'Edit', es: 'Editar' },
  'cb.variants.save_campaign': { en: 'Save campaign', es: 'Guardar campana' },

'''

# Insert before closing }; of translations object
# Find the last entry and insert before "};\n\ntype TranslationKey"
anchor = "};\n\ntype TranslationKey = string;"
if "'cb.intake.eyebrow':" not in content and anchor in content:
    content = content.replace(anchor, new_keys + anchor)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Added all Campaign Brain i18n keys")
else:
    if "'cb.intake.eyebrow':" in content:
        print("  ⚠️  Already has campaign brain keys")
    else:
        print("  ⚠️  Anchor not found — checking alternate")
        # Try alternate anchor
        anchor2 = "};\n"
        last_idx = content.rfind("'wf.delete_confirm':")
        if last_idx > 0:
            # Find the next "};" after this
            next_brace = content.find("};", last_idx)
            if next_brace > 0:
                content = content[:next_brace] + new_keys + content[next_brace:]
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print("  ✅ Added all Campaign Brain i18n keys (alternate anchor)")
PYEOF

echo ""
echo "✅ Done. Run pnpm build to verify."
