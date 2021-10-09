import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {agentExtractor} from '../utils';
import {IPublicFolder} from './types';

const folderFields = getFields<IPublicFolder>({
  folderId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  environmentId: true,
  maxFileSize: true,
  organizationId: true,
  parentId: true,
  name: true,
  description: true,
});

export const folderExtractor = makeExtract(folderFields);
export const folderListExtractor = makeListExtract(folderFields);
