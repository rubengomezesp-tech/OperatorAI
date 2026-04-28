/**
 * Operator Core — Public API
 *
 * Usage from chat route:
 *   import { detectIntent, routeToSubrama } from '@/lib/operator-core';
 *
 *   const intent = detectIntent(userMessage);
 *   if (intent.vertical && intent.subrama) {
 *     const subrama = routeToSubrama(intent.vertical, intent.subrama);
 *     // subrama has required_inputs, questions, workflow_steps, tools
 *   }
 */

export { detectIntent } from './intent-detector';
export { routeToSubrama } from './router';
export type {
  VerticalId,
  SubrameKey,
  IntentDetectionResult,
  VerticalConfig,
  SubramaConfig,
  RequiredInput,
  DynamicQuestion,
  WorkflowStep,
  ToolName,
  WorkflowState,
} from './types';
