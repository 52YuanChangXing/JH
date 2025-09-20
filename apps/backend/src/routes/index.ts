import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';
import { authenticate, authorize, enrichUser } from '../middleware/auth.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { usersRouter } from '../modules/users/users.routes.js';
import { rolesRouter } from '../modules/roles/roles.routes.js';
import { projectsRouter } from '../modules/projects/projects.routes.js';
import { sessionsRouter } from '../modules/sessions/sessions.routes.js';
import { auditRouter } from '../modules/audit/audit.routes.js';
import { statsRouter } from '../modules/stats/stats.routes.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const openApiCandidates = [
  path.resolve(process.cwd(), 'docs/openapi.yaml'),
  path.resolve(moduleDir, '../../docs/openapi.yaml')
];

const openApiPath = openApiCandidates.find((candidate) => fs.existsSync(candidate));

if (!openApiPath) {
  throw new Error(
    'Unable to locate docs/openapi.yaml. Ensure the file exists and the server is started from the backend workspace.'
  );
}

const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));

const docs = Router();
docs.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.set('WWW-Authenticate', 'Basic realm="API Docs"');
    return res.status(401).send('Authentication required to access documentation.');
  }
  const encoded = authHeader.replace('Basic ', '');
  const [user, password] = Buffer.from(encoded, 'base64').toString().split(':');
  if (user !== env.swaggerUser || password !== env.swaggerPassword) {
    res.set('WWW-Authenticate', 'Basic realm="API Docs"');
    return res.status(401).send('Invalid documentation credentials');
  }
  return next();
});
docs.use('/', swaggerUi.serve, swaggerUi.setup(openApiDocument));

type RouterBundle = {
  docs: Router;
  api: Router;
};

const api = Router();

api.use('/auth', authRouter);
api.use(authenticate, enrichUser);
api.use('/users', authorize('users:manage'), usersRouter);
api.use('/roles', authorize('roles:manage'), rolesRouter);
api.use('/projects', authorize(['projects:read']), projectsRouter);
api.use('/sessions', authorize(['sessions:read']), sessionsRouter);
api.use('/audit-logs', authorize('audit:view'), auditRouter);
api.use('/stats', authorize('dashboard:view'), statsRouter);

export const router: RouterBundle = {
  docs,
  api
};
