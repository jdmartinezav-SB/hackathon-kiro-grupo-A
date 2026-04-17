import * as yaml from 'js-yaml';
import { InternalApiDefinition } from './types';

/**
 * Serialize an InternalApiDefinition back to YAML or JSON.
 *
 * Uses `model.raw` as the source of truth so the output preserves
 * every field from the original spec (round-trip — Property 1).
 */
export function format(model: InternalApiDefinition, fmt: 'yaml' | 'json'): string {
  if (fmt === 'yaml') {
    return yaml.dump(model.raw, { lineWidth: -1, noRefs: true });
  }
  return JSON.stringify(model.raw, null, 2);
}
