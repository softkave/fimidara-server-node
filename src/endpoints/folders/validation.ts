import {validationSchemas} from '../../utilities/validationUtils';
import {folderConstants} from './constants';

const concatFolderName = validationSchemas.alphanum
  .min(folderConstants.minFolderNameLength)
  .max(
    folderConstants.maxFolderNameLength * folderConstants.maxConcatFolderNames
  );

const folderValidationSchemas = {concatFolderName};

export default folderValidationSchemas;
