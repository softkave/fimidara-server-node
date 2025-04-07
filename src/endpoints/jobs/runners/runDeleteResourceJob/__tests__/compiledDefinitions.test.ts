import assert from 'assert';
import {forEach} from 'lodash-es';
import {describe, test} from 'vitest';
import {
  FimidaraResourceType,
  kResourceTypeToPossibleChildren,
} from '../../../../../definitions/system.js';
import {kCascadeDeleteDefinitions} from '../compiledDefinitions.js';
import {noopDeleteCascadeEntry} from '../genericDefinitions.js';

describe('compiledDefinitions', () => {
  test('cascade defs contains every child type', () => {
    forEach(kResourceTypeToPossibleChildren, (childrenTypes, type) => {
      const def = kCascadeDeleteDefinitions[type as FimidaraResourceType];
      if (def === noopDeleteCascadeEntry) {
        return;
      }

      childrenTypes.forEach(childType => {
        assert(
          def.deleteArtifacts[childType] || def.getArtifactsToDelete[childType],
          `${childType} not found in delete or get artifacts for ${type}`
        );
      });
    });
  });
});
