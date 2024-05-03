import assert from 'assert';
import {forEach} from 'lodash-es';
import {describe, test} from 'vitest';
import {
  FimidaraResourceType,
  kResourceTypeToPossibleChildren,
} from '../../../../../definitions/system.js';
import {kCascadeDeleteDefinitions} from '../compiledDefinitions.js';

describe('compiledDefinitions', () => {
  test('cascade defs contains every child type', () => {
    forEach(kResourceTypeToPossibleChildren, (childrenTypes, type) => {
      const def = kCascadeDeleteDefinitions[type as FimidaraResourceType];
      childrenTypes.forEach(childType => {
        assert(
          def.deleteArtifacts[childType] || def.getArtifactsToDelete[childType]
        );
      });
    });
  });
});
