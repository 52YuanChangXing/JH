import { Response } from 'express';
import createError from 'http-errors';
import { AuthRequest } from '../../middleware/auth.js';
import { success } from '../../utils/http.js';
import { createRole, deleteRole, listRoles, updateRole } from './roles.service.js';
import { createRoleSchema, updateRoleSchema } from './roles.schema.js';

export async function listRolesHandler(_req: AuthRequest, res: Response) {
  const payload = await listRoles();
  return success(res, payload, 'Roles fetched');
}

export async function createRoleHandler(req: AuthRequest, res: Response) {
  const result = createRoleSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const role = await createRole(result.data, req.user?.id ?? 'system');
  return success(res, role, 'Role created', 201);
}

export async function updateRoleHandler(req: AuthRequest, res: Response) {
  const result = updateRoleSchema.safeParse(req.body);
  if (!result.success) {
    throw createError(400, result.error.flatten().formErrors.join(', '));
  }
  const role = await updateRole(req.params.id, result.data, req.user?.id ?? 'system');
  return success(res, role, 'Role updated');
}

export async function deleteRoleHandler(req: AuthRequest, res: Response) {
  await deleteRole(req.params.id, req.user?.id ?? 'system');
  return success(res, { id: req.params.id }, 'Role deleted');
}
