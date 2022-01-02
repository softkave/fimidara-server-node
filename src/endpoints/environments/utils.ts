import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IPublicEnvironment} from './types';

const environmentFields = getFields<IPublicEnvironment>({
  environmentId: true,
  createdBy: true,
  createdAt: getDateString,
  lastUpdatedBy: true,
  lastUpdatedAt: getDateStringIfPresent,
  name: true,
  description: true,
  organizationId: true,
});

export const environmentExtractor = makeExtract(environmentFields);
export const environmentListExtractor = makeListExtract(environmentFields);

export abstract class EnvironmentUtils {
  static getPublicEnvironment = environmentExtractor;
  static getPublicEnvironmentList = environmentListExtractor;
}
