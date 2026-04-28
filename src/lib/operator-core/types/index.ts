/**
 * Operator Core — Type definitions
 *
 * Architecture:
 *   USER INPUT
 *     ↓
 *   CORE (intent detection)
 *     ↓
 *   ROUTER (selects vertical)
 *     ↓
 *   VERTICAL (apparel | product | content | business)
 *     ↓
 *   WORKFLOW (questions → tools → outputs)
 */

export type VerticalId = 'apparel' | 'product' | 'content' | 'business';

export type SubrameKey = string; // ej: 'tshirt_design', 'hoodie_design', 'reel_creation'

export interface IntentDetectionResult {
  vertical: VerticalId | null;
  subrama: SubrameKey | null;
  confidence: number; // 0..1
  matched_triggers: string[];
  fallback_reason?: string;
}

export interface RequiredInput {
  key: string;
  label: { en: string; es: string };
  type: 'text' | 'select' | 'image' | 'color' | 'multi-select';
  required: boolean;
  options?: Array<{ value: string; label: { en: string; es: string } }>;
}

export interface DynamicQuestion {
  key: string;
  question: { en: string; es: string };
  inputType: 'text' | 'select' | 'image' | 'color';
  options?: Array<{ value: string; label: { en: string; es: string } }>;
  triggerCondition?: (collected: Record<string, unknown>) => boolean;
}

export interface VerticalConfig {
  id: VerticalId;
  label: { en: string; es: string };
  triggers: string[]; // keywords que activan esta vertical
  subramas: Record<SubrameKey, SubramaConfig>;
}

export interface SubramaConfig {
  id: SubrameKey;
  label: { en: string; es: string };
  triggers: string[]; // keywords más específicos
  required_inputs: RequiredInput[];
  questions: DynamicQuestion[];
  workflow_steps: WorkflowStep[];
  tools: ToolName[];
}

export type WorkflowStep =
  | 'detect_missing_inputs'
  | 'ask_questions'
  | 'request_assets'
  | 'generate'
  | 'iterate'
  | 'finalize';

export type ToolName =
  | 'image_generator'
  | 'text_generator'
  | 'analyzer'
  | 'style_engine'
  | 'campaign_generator';

export interface WorkflowState {
  vertical: VerticalId;
  subrama: SubrameKey;
  collected_inputs: Record<string, unknown>;
  current_step: WorkflowStep;
  pending_questions: DynamicQuestion[];
  outputs: unknown[];
}
