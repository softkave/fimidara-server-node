import multer = require('multer');
import {fileConstants} from './files/constants';

export const multerUploadFileExpressMiddleware = multer({
  limits: {
    fieldNameSize: 100,
    fieldSize: 1 * 1024 * 1204,
    fields: 1024,
    fileSize: fileConstants.maxFileSizeInBytes,
    files: 1,
    parts: 10000,
    headerPairs: 2000,
  },
});
