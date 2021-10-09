import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {agentExtractor} from '../utils';
import {IPublicFile} from './types';

const fileFields = getFields<IPublicFile>({
  fileId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  name: true,
  description: true,
  environmentId: true,
  folderId: true,
  mimetype: true,
  organizationId: true,
  size: true,
  encoding: true,
  meta: meta => meta,
});

export const fileExtractor = makeExtract(fileFields);
export const fileListExtractor = makeListExtract(fileFields);
