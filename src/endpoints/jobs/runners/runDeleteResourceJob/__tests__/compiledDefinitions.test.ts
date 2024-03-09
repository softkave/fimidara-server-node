import assert from 'assert';
import {forEach} from 'lodash';
import {
  FimidaraResourceType,
  kResourceTypeToPossibleChildren,
} from '../../../../../definitions/system';
import {kCascadeDeleteDefinitions} from '../compiledDefinitions';

describe('compiledDefinitions', () => {
  test('cascade defs contains every child type', () => {
    forEach(kResourceTypeToPossibleChildren, (childrenTypes, type) => {
      const def = kCascadeDeleteDefinitions[type as FimidaraResourceType];
      childrenTypes.forEach(childType => {
        assert(def.deleteArtifacts[childType] || def.getArtifacts[childType]);
      });
    });
  });
});
