import * as Joi from 'joi';
import {validationSchemas} from '../../utils/validationUtils';
import permissionItemValidationSchemas from '../permissionItems/validation';
import workspaceValidationSchemas from '../workspaces/validation';
import resourcesConstants from './constants';
import {FetchResourceItem} from './types';

const fetchResourceItem = Joi.object<FetchResourceItem>().keys({
  resourceId: validationSchemas.resourceId.required(),
  folderpath: permissionItemValidationSchemas.targetParts.folderpath,
  filepath: permissionItemValidationSchemas.targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
});

const fetchResourceItemList = Joi.array()
  .items(fetchResourceItem)
  .max(resourcesConstants.maxFetchItems);
const resourcesValidationSchemas = {fetchResourceItem, fetchResourceItemList};
export default resourcesValidationSchemas;
