import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { createRole, deleteRole, fetchRoles, RoleRecord, updateRole } from '../../services/roles';
import { toast } from '../../components/ui/sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string())
});

type RoleFormValues = z.infer<typeof roleSchema>;

export function RolesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['roles'], queryFn: fetchRoles });

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', description: '', permissions: [] }
  });

  const openCreate = () => {
    setEditingRole(null);
    form.reset({ name: '', description: '', permissions: [] });
    setDialogOpen(true);
  };

  const openEdit = (role: RoleRecord) => {
    setEditingRole(role);
    form.reset({ name: role.name, description: role.description || '', permissions: role.permissions });
    setDialogOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (values: RoleFormValues) => {
      if (editingRole) {
        return updateRole(editingRole.id, values);
      }
      return createRole(values);
    },
    onSuccess: () => {
      toast.success('角色已保存');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDialogOpen(false);
    },
    onError: () => toast.error('操作失败')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      toast.success('角色已删除');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: () => toast.error('删除失败')
  });

  const columns: ColumnDef<RoleRecord>[] = [
    {
      header: '角色名称',
      accessorKey: 'name'
    },
    {
      header: '描述',
      accessorKey: 'description',
      cell: ({ row }) => row.original.description || '—'
    },
    {
      header: '权限',
      accessorKey: 'permissions',
      cell: ({ row }) => row.original.permissions.join('、')
    },
    {
      header: '操作',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}>
            编辑
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteMutation.mutate(row.original.id)}
            disabled={deleteMutation.isLoading}
          >
            删除
          </Button>
        </div>
      )
    }
  ];

  const onSubmit = (values: RoleFormValues) => {
    mutation.mutate(values);
  };

  const selectedPermissions = form.watch('permissions');

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/80 shadow-md backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">角色权限</CardTitle>
            <p className="text-sm text-slate-500">控制各类角色的访问范围与功能权限</p>
          </div>
          <Button onClick={openCreate}>新增角色</Button>
        </CardHeader>
        <CardContent>
          <DataTable<RoleRecord, unknown> columns={columns} data={data?.roles || []} isLoading={isLoading} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? '编辑角色' : '新增角色'}</DialogTitle>
            <DialogDescription>勾选需要赋予该角色的具体权限。</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">角色名称</Label>
              <Input id="name" {...form.register('name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">角色描述</Label>
              <Textarea id="description" rows={3} {...form.register('description')} />
            </div>
            <div className="space-y-2">
              <Label>权限列表</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {data?.permissions.map((permission) => {
                  const checked = selectedPermissions.includes(permission.name);
                  return (
                    <label key={permission.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const current = form.getValues('permissions');
                          if (event.target.checked) {
                            form.setValue('permissions', [...current, permission.name]);
                          } else {
                            form.setValue(
                              'permissions',
                              current.filter((item) => item !== permission.name)
                            );
                          }
                        }}
                      />
                      <span>{permission.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={mutation.isLoading}>
                {mutation.isLoading ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
