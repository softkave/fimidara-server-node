import Joi from 'joi';
import {kValidationSchemas} from '../../utils/validationUtils.js';
import permissionItemValidationSchemas from '../permissionItems/validation.js';
import workspaceValidationSchemas from '../workspaces/validation.js';
import resourcesConstants from './constants.js';
import {FetchResourceItem} from './types.js';

const fetchResourceItem = Joi.object<FetchResourceItem>().keys({
  resourceId: kValidationSchemas.resourceId,
  folderpath: permissionItemValidationSchemas.targetParts.folderpath,
  filepath: permissionItemValidationSchemas.targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
  action: kValidationSchemas.crudAction.required(),
});

const fetchResourceItemList = Joi.array()
  .items(fetchResourceItem)
  .max(resourcesConstants.maxFetchItems);
const resourcesValidationSchemas = {fetchResourceItem, fetchResourceItemList};
export default resourcesValidationSchemas;
