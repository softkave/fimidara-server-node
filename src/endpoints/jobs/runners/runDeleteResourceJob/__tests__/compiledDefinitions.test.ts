import assert from 'assert';
import {forEach} from 'lodash';
import {
  AppResourceType,
  kResourceTypeToPossibleChildren,
} from '../../../../../definitions/system';
import {kCascadeDeleteDefinitions} from '../compiledDefinitions';

describe('compiledDefinitions', () => {
  test('cascade defs contains every child type', () => {
    forEach(kResourceTypeToPossibleChildren, (childrenTypes, type) => {
      const def = kCascadeDeleteDefinitions[type as AppResourceType];
      childrenTypes.forEach(childType => {
        assert(
          def.deleteArtifacts[childType],
          `Missing deleteArtifacts fn for ${childType} in ${type}`
        );
        assert(
          def.getArtifacts[childType],
          `Missing getArtifacts fn for ${childType} in ${type}`
        );
      });
    });
  });
});
