/**
 * Router — Returns the SubramaConfig for a given intent.
 */

import type { VerticalId, SubrameKey, SubramaConfig } from './types';
import { APPAREL_VERTICAL } from './verticals/apparel';
import { PRODUCT_VERTICAL } from './verticals/product';
import { CONTENT_VERTICAL } from './verticals/content';
import { BUSINESS_VERTICAL } from './verticals/business';

const VERTICALS_MAP = {
  apparel: APPAREL_VERTICAL,
  product: PRODUCT_VERTICAL,
  content: CONTENT_VERTICAL,
  business: BUSINESS_VERTICAL,
};

export function routeToSubrama(
  vertical: VerticalId,
  subrama: SubrameKey,
): SubramaConfig | null {
  const v = VERTICALS_MAP[vertical];
  if (!v) return null;
  return v.subramas[subrama] ?? null;
}
