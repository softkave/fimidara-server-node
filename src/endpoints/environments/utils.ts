import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IPublicEnvironment} from './types';

const environmentFields = getFields<IPublicEnvironment>({
  environmentId: true,
  createdBy: true,
  createdAt: getDateString,
  lastUpdatedBy: true,
  lastUpdatedAt: getDateString,
  name: true,
  description: true,
  organizationId: true,
});

export const environmentExtractor = makeExtract(environmentFields);
export const environmentListExtractor = makeListExtract(environmentFields);
