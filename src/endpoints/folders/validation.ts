import * as Joi from 'joi';
import {validationSchemas} from '../../utilities/validationUtils';
import {folderConstants} from './constants';

/**
A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
a b c d e f g h i j k l m n o p q r s t u v w x y z
0 1 2 3 4 5 6 7 8 9 . _ -
 */

const nameRegex = /^[a-zA-Z0-9._-]+$/;
const pathRegex = /[A-Za-z0-9/._-]+/;
const notNameRegex = /[^a-zA-Z0-9._-]/;
const folderpath = Joi.string()
  .regex(pathRegex)
  .min(folderConstants.minFolderNameLength)
  .max(folderConstants.maxFolderNameLength * folderConstants.maxFolderDepth);

const folderMatcherParts = {
  folderpath,
  folderId: validationSchemas.resourceId,
  workspaceId: validationSchemas.resourceId,
};

const folderValidationSchemas = {
  folderpath,
  folderMatcherParts,
  nameRegex,
  pathRegex,
  notNameRegex,
};

export default folderValidationSchemas;
