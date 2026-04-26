/**
 * Intake Validator
 *
 * Validates and normalizes user input before sending to the Brain.
 * Catches missing fields and provides helpful error messages.
 */

import 'server-only';
import type { CampaignIntake } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized: CampaignIntake;
}

/**
 * Required fields for a usable Brain run.
 * Anything not in this list is optional but improves quality.
 */
const REQUIRED_FIELDS: Array<keyof CampaignIntake> = [
  'productName',
  'productDescription',
  'goalDescription',
];

const RECOMMENDED_FIELDS: Array<keyof CampaignIntake> = [
  'audienceDescription',
  'campaignName',
];

export function validateIntake(input: Partial<CampaignIntake>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    const value = input[field];
    if (typeof value !== 'string' || value.trim().length < 3) {
      errors.push(
        `Missing or too short: "${field}". This is required for the Brain to produce a useful strategy.`,
      );
    }
  }

  // Recommended fields (warnings, not errors)
  for (const field of RECOMMENDED_FIELDS) {
    const value = input[field];
    if (typeof value !== 'string' || value.trim().length < 3) {
      warnings.push(
        `Missing recommended field: "${field}". Brain will use defaults, but quality may decrease.`,
      );
    }
  }

  // Length sanity checks
  if (input.productDescription && input.productDescription.length > 2000) {
    warnings.push('productDescription is very long (2000+ chars). Brain will summarize.');
  }

  if (input.audienceDescription && input.audienceDescription.length > 1000) {
    warnings.push('audienceDescription is very long. Brain will distill key segments.');
  }

  // Normalize: trim strings, default arrays
  const normalized: CampaignIntake = {
    campaignName: (input.campaignName ?? '').trim(),
    productName: (input.productName ?? '').trim(),
    productDescription: (input.productDescription ?? '').trim(),
    goalDescription: (input.goalDescription ?? '').trim(),
    audienceDescription: (input.audienceDescription ?? '').trim(),
    vertical: input.vertical,
    campaignType: input.campaignType,
    platforms: input.platforms ?? [],
    brandTone: input.brandTone?.trim(),
    offer: input.offer?.trim(),
    callToAction: input.callToAction?.trim(),
    competitorReferences: input.competitorReferences ?? [],
    visualReferences: input.visualReferences ?? [],
    doNotInclude: input.doNotInclude?.trim(),
    brandName: input.brandName?.trim(),
    brandColors: input.brandColors,
    brandLogoUrl: input.brandLogoUrl,
    brandFontUrl: input.brandFontUrl,
  };

  // Default campaign name if blank
  if (!normalized.campaignName && normalized.productName) {
    normalized.campaignName = `${normalized.productName} Campaign`;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized,
  };
}
