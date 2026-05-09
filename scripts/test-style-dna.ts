import { detectMultiVariantIntent } from '../src/lib/ads/style-dna';

const prompts = [
  'Hazme un ad estilo Wes Anderson para Operator AI',
  'Quiero 3 ads: minimalista apple, brutalismo, y memphis 80s',
  'Genera 2 versiones: estilo Yamamoto y Studio Ghibli',
  'Hazme 3 anuncios genéricos',
  'Ad con vibras Royal Tenenbaums',
];

for (const prompt of prompts) {
  console.log('\n═══════════════════════════════════════════');
  console.log('PROMPT:', prompt);
  console.log('═══════════════════════════════════════════');
  const intent = detectMultiVariantIntent(prompt);
  console.log('  detected:', intent.detected);
  console.log('  variantCount:', intent.variantCount);
  console.log('  styleDNAs:', intent.styleDNAs.map(d => d.id));
  console.log('  remainingSlots:', intent.remainingSlots);
  console.log('  matchedPhrases:', intent.matchedPhrases);
}
