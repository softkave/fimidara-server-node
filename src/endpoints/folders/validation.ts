import Joi from 'joi';
import {kValidationSchemas} from '../../utils/validationUtils.js';
import {kFolderConstants} from './constants.js';

/**
A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
a b c d e f g h i j k l m n o p q r s t u v w x y z
0 1 2 3 4 5 6 7 8 9 . _ -
with space " "
 */

const chars = 'a-zA-Z0-9._\\- ';
const nameRegex = new RegExp(`^[${chars}]+$`);
const pathRegex = new RegExp(`[${chars}]+`);
const notNameRegex = new RegExp(`[^${chars}]`);
const folderpath = Joi.string()
  .regex(pathRegex)
  .min(kFolderConstants.minFolderNameLength)
  .max(kFolderConstants.maxFolderNameLength * kFolderConstants.maxFolderDepth);

const folderMatcherParts = {
  folderpath,
  folderId: kValidationSchemas.resourceId,
  workspaceId: kValidationSchemas.resourceId,
};

const folderValidationSchemas = {
  folderpath,
  folderMatcherParts,
  nameRegex,
  pathRegex,
  notNameRegex,
};

export default folderValidationSchemas;
