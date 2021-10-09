import {IFolder} from '../../definitions/folder';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {FolderDoesNotExistError} from '../folders/errors';
import {IBaseContext} from './BaseContext';
import {IFolderProvider} from './FolderProvider';

const items: Record<string, IFolder> = {};

// export default class FolderMemoryProvider implements IFolderProvider {
//   public getFolderById = wrapFireAndThrowError(
//     (ctx: IBaseContext, folderId: string) => {
//       return items[folderId] || null;
//     }
//   );

//   public assertGetFolderById = wrapFireAndThrowError(
//     async (ctx: IBaseContext, folderId: string) => {
//       const folder = items[folderId];

//       if (!folder) {
//         throw new FolderDoesNotExistError();
//       }

//       return folder;
//     }
//   );

//   public assertFolderById = wrapFireAndThrowError(
//     async (ctx: IBaseContext, folderId: string) => {
//       const exists = !!items[folderId];

//       if (!exists) {
//         throw new FolderDoesNotExistError();
//       }

//       return exists;
//     }
//   );

//   public updateFolderById = wrapFireAndThrowError(
//     (ctx: IBaseContext, folderId: string, data: Partial<IFolder>) => {
//       if (items[folderId]) {
//         items[folderId] = {...items[folderId], ...data};
//         return items[folderId];
//       }

//       return null;
//     }
//   );

//   public deleteFolder = wrapFireAndThrowError(
//     async (ctx: IBaseContext, folderId: string) => {
//       delete items[folderId];
//     }
//   );

//   public saveFolder = wrapFireAndThrowError(
//     async (ctx: IBaseContext, folder: IFolder) => {
//       items[folder.folderId] = folder;
//       return folder;
//     }
//   );
// }

// export const getFolderMemoryProvider = singletonFunc(
//   () => new FolderMemoryProvider()
// );
