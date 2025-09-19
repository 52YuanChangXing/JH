import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { createUser, deleteUser, fetchUsers, updateUser, UserRecord } from '../../services/users';
import { fetchRoles } from '../../services/roles';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '../../components/ui/sonner';
import { format } from 'date-fns';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  displayName: z.string().min(2),
  roles: z.array(z.string())
});

type UserFormValues = z.infer<typeof userSchema>;

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => fetchUsers({ page, pageSize: 6, search: search || undefined })
  });

  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: fetchRoles });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: '', password: '', displayName: '', roles: [] }
  });

  const openCreate = () => {
    setEditingUser(null);
    form.reset({ email: '', password: '', displayName: '', roles: [] });
    setDialogOpen(true);
  };

  const openEdit = (user: UserRecord) => {
    setEditingUser(user);
    form.reset({
      email: user.email,
      password: '',
      displayName: user.displayName,
      roles: user.roles
    });
    setDialogOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (editingUser) {
        return updateUser(editingUser.id, {
          displayName: values.displayName,
          roles: values.roles,
          ...(values.password ? { password: values.password } : {})
        });
      }
      return createUser({
        email: values.email,
        password: values.password || 'changeme123',
        displayName: values.displayName,
        roles: values.roles
      });
    },
    onSuccess: () => {
      toast.success('用户信息已保存');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
    },
    onError: () => toast.error('操作失败，请重试')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('用户已删除');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('删除失败')
  });

  const columns = useMemo<ColumnDef<UserRecord>[]>(
    () => [
      {
        header: '姓名',
        accessorKey: 'displayName'
      },
      {
        header: '邮箱',
        accessorKey: 'email'
      },
      {
        header: '角色',
        accessorKey: 'roles',
        cell: ({ row }) => row.original.roles.join('、')
      },
      {
        header: '创建时间',
        accessorKey: 'createdAt',
        cell: ({ row }) => format(new Date(row.original.createdAt), 'yyyy-MM-dd')
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
    ],
    [deleteMutation]
  );

  const onSubmit = (values: UserFormValues) => {
    mutation.mutate(values);
  };

  const selectedRoles = form.watch('roles');

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/80 shadow-md backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">用户与角色管理</CardTitle>
            <p className="text-sm text-slate-500">维护后台成员资料与权限配置</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="搜索姓名或邮箱"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <Button onClick={openCreate}>新增成员</Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<UserRecord, unknown>
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={
              page: data?.pagination.page || 1,
              pageSize: data?.pagination.pageSize || 6,
              totalPages: data?.pagination.totalPages || 1,
              total: data?.pagination.total || 0,
              onChange: ({ pageIndex }) => setPage(pageIndex + 1)
            }
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle>
            <DialogDescription>设置基础资料及角色权限。</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">姓名</Label>
                <Input id="displayName" {...form.register('displayName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" disabled={!!editingUser} {...form.register('email')} />
              </div>
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">初始密码</Label>
                <Input id="password" type="password" {...form.register('password')} />
              </div>
            )}
            <div className="space-y-2">
              <Label>角色</Label>
              <div className="flex flex-wrap gap-3">
                {rolesQuery.data?.roles.map((role) => {
                  const checked = selectedRoles.includes(role.name);
                  return (
                    <label key={role.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const current = form.getValues('roles');
                          if (event.target.checked) {
                            form.setValue('roles', [...current, role.name]);
                          } else {
                            form.setValue(
                              'roles',
                              current.filter((item) => item !== role.name)
                            );
                          }
                        }}
                      />
                      <span>{role.name}</span>
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
