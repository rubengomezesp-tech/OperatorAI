# Operator Chat-First UI Vision

## Core principle
Chat is the only interface. Full screen. No complex navigation.
User never leaves chat screen. Modals slide up when input needed.

## Vertical system
Each vertical: triggers, knowledge_base, required_inputs,
dynamic_questions, decision_rules, workflow_steps, tools, outputs.

## Example: apparel_design
- triggers: tshirt, hoodie, clothing, logo
- required: product_type, color, fit, style, logo
- workflow: detect missing -> ask 3-4 questions -> upload if needed
  -> generate 2-3 mockups -> iterate

## UX rules
- 1 main action at a time
- Keep responses short and actionable
- Modals slide up from bottom mobile-style
- Background blurred when modal open
- Easy close (tap outside or X)
