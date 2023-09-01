import addTag from './addTag/handler';
import countWorkspaceTags from './countWorkspaceTags/handler';
import deleteTag from './deleteTag/handler';
import {
  addTagEndpointDefinition,
  countWorkspaceTagsEndpointDefinition,
  deleteTagEndpointDefinition,
  getTagEndpointDefinition,
  getWorkspaceTagsEndpointDefinition,
  updateTagEndpointDefinition,
} from './endpoints.mddoc';
import getTag from './getTag/handler';
import getWorkspaceTags from './getWorkspaceTags/handler';
import {TagsExportedEndpoints} from './types';
import updateTag from './updateTag/handler';

export function getTagsPublicHttpEndpoints() {
  const tagsExportedEndpoints: TagsExportedEndpoints = {
    addTag: {
      fn: addTag,
      mddocHttpDefinition: addTagEndpointDefinition,
    },
    deleteTag: {
      fn: deleteTag,
      mddocHttpDefinition: deleteTagEndpointDefinition,
    },
    getTag: {
      fn: getTag,
      mddocHttpDefinition: getTagEndpointDefinition,
    },
    getWorkspaceTags: {
      fn: getWorkspaceTags,
      mddocHttpDefinition: getWorkspaceTagsEndpointDefinition,
    },
    countWorkspaceTags: {
      fn: countWorkspaceTags,
      mddocHttpDefinition: countWorkspaceTagsEndpointDefinition,
    },
    updateTag: {
      fn: updateTag,
      mddocHttpDefinition: updateTagEndpointDefinition,
    },
  };
  return tagsExportedEndpoints;
}
