import * as Joi from 'joi';
import {kValidationSchemas} from '../../utils/validationUtils';
import permissionItemValidationSchemas from '../permissionItems/validation';
import workspaceValidationSchemas from '../workspaces/validation';
import resourcesConstants from './constants';
import {FetchResourceItem} from './types';

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
