import serverless from 'serverless-http';
import appModule from '../../dist/server.cjs';

const app = appModule.default || appModule;
export const handler = serverless(app);