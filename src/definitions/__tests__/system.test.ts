import {expectTypeOf} from 'expect-type';
import {describe, test} from 'vitest';
import {
  FimidaraResourceType,
  FimidaraTypeToTSType,
  kFimidaraResourceType,
  kFimidaraTypeToTSTypeNotFound,
} from '../system.js';

describe('system.d.ts', () => {
  test('FimidaraTypeToTSType', () => {
    /** if this test fails, then you have a type not represented in
     * `FimidaraTypeToTSType` */
    expectTypeOf(
      {} as Extract<
        FimidaraTypeToTSType<
          Exclude<
            FimidaraResourceType,
            | typeof kFimidaraResourceType.All
            | typeof kFimidaraResourceType.System
            | typeof kFimidaraResourceType.Public
            | typeof kFimidaraResourceType.EndpointRequest
          >
        >,
        typeof kFimidaraTypeToTSTypeNotFound
      >
    ).not.toEqualTypeOf<typeof kFimidaraTypeToTSTypeNotFound>();
  });
});
