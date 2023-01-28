import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addTag from './addTag/handler';
import {tagConstants} from './constants';
import deleteTag from './deleteTag/handler';
import getTag from './getTag/handler';
import getWorkspaceTags from './getWorkspaceTags/handler';
import updateTag from './updateTag/handler';

export default function setupTagsRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    addTag: wrapEndpointREST(addTag, ctx),
    deleteTag: wrapEndpointREST(deleteTag, ctx),
    getWorkspaceTags: wrapEndpointREST(getWorkspaceTags, ctx),
    getTag: wrapEndpointREST(getTag, ctx),
    updateTag: wrapEndpointREST(updateTag, ctx),
  };

  app.post(tagConstants.routes.addTag, endpoints.addTag);
  app.delete(tagConstants.routes.deleteTag, endpoints.deleteTag);
  app.post(tagConstants.routes.getWorkspaceTags, endpoints.getWorkspaceTags);
  app.post(tagConstants.routes.getTag, endpoints.getTag);
  app.post(tagConstants.routes.updateTag, endpoints.updateTag);
}
