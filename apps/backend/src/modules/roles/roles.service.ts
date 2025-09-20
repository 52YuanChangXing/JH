import { prisma } from '../../lib/prisma.js';
import { CreateRoleInput, UpdateRoleInput } from './roles.schema.js';

export async function listRoles() {
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.permission.findMany({ orderBy: { name: 'asc' } })
  ]);

  return {
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p) => p.permission.name)
    })),
    permissions
  };
}

export async function createRole(input: CreateRoleInput, actorId: string) {
  const role = await prisma.role.create({
    data: {
      name: input.name,
      description: input.description,
      permissions: {
        create: input.permissions.map((permission) => ({
          permission: { connect: { name: permission } }
        }))
      }
    },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'role.created',
      entity: 'Role',
      entityId: role.id,
      actorId,
      metadata: { name: role.name, permissions: input.permissions }
    }
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map((p) => p.permission.name)
  };
}

export async function updateRole(roleId: string, input: UpdateRoleInput, actorId: string) {
  await prisma.role.update({
    where: { id: roleId },
    data: {
      description: input.description
    }
  });

  if (input.permissions) {
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    if (input.permissions.length > 0) {
      const permissions = await prisma.permission.findMany({ where: { name: { in: input.permissions } } });
      await prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId,
          permissionId: permission.id
        }))
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      action: 'role.updated',
      entity: 'Role',
      entityId: roleId,
      actorId,
      metadata: input
    }
  });

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  if (!role) {
    throw new Error('Role not found after update');
  }

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map((p) => p.permission.name)
  };
}

export async function deleteRole(roleId: string, actorId: string) {
  await prisma.userRole.deleteMany({ where: { roleId } });
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  const role = await prisma.role.delete({ where: { id: roleId } });

  await prisma.auditLog.create({
    data: {
      action: 'role.deleted',
      entity: 'Role',
      entityId: roleId,
      actorId,
      metadata: { name: role.name }
    }
  });

  return role;
}
