import {ITestVariables} from '../src/endpoints/test-utils/vars';

export interface IFilesNodeJestVars extends Partial<ITestVariables> {
  isUsingAddedS3Bucket?: boolean;
  isUsingAddedMongoDatabase?: boolean;
}
