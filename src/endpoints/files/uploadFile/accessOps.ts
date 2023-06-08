// export const makeFilePublicReadAccessOps = (file: File): PermissionItemInput[] => [
//   {
//     action: AppActionType.Read,
//     target: {targetId: file.resourceId},
//   },
// ];

// export const makeFilePublicReadAndUpdateAccessOps = (file: File): PermissionItemInput[] =>
//   makeFilePublicReadAccessOps(file).concat([
//     {
//       action: AppActionType.Update,
//       target: {targetId: file.resourceId},
//     },
//     {
//       action: AppActionType.Create,
//       target: {targetId: file.resourceId},
//     },
//   ]);

// export const makeFilePublicReadUpdateAndDeleteAccessOps = (file: File): PermissionItemInput[] =>
//   makeFilePublicReadAndUpdateAccessOps(file).concat([
//     {
//       action: AppActionType.Delete,
//       target: {targetId: file.resourceId},
//     },
//   ]);

// export const makeFilePublicAccessOps = (
//   file: File,
//   action: UploadFilePublicAccessActions | undefined | null
// ) => {
//   switch (action) {
//     case UploadFilePublicAccessActions.Read:
//       return makeFilePublicReadAccessOps(file);
//     case UploadFilePublicAccessActions.ReadAndUpdate:
//       return makeFilePublicReadAndUpdateAccessOps(file);
//     case UploadFilePublicAccessActions.ReadUpdateAndDelete:
//       return makeFilePublicReadUpdateAndDeleteAccessOps(file);
//     case UploadFilePublicAccessActions.None:
//     default:
//       return [];
//   }
// };
