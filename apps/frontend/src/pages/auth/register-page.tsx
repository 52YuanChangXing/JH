import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../providers/auth-provider';
import { Link } from 'react-router-dom';

const schema = z
  .object({
    displayName: z.string().min(2, '名称至少2个字符'),
    email: z.string().email('请输入有效邮箱'),
    password: z.string().min(8, '密码至少8位'),
    confirmPassword: z.string().min(8, '确认密码至少8位')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次密码不一致',
    path: ['confirmPassword']
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser, loading } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: '摄影爱好者',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (values: FormValues) => {
    await registerUser({ email: values.email, password: values.password, displayName: values.displayName });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6 dark:from-slate-900 dark:to-slate-950">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle>创建团队账号</CardTitle>
          <CardDescription>注册后默认获得观察者权限，可由管理员在后台升级角色</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="displayName">昵称</Label>
              <Input id="displayName" placeholder="如：简浩摄影师" {...form.register('displayName')} />
              {form.formState.errors.displayName && (
                <p className="text-xs text-red-500">{form.formState.errors.displayName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input id="password" type="password" placeholder="至少8位" {...form.register('password')} />
                {form.formState.errors.password && (
                  <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input id="confirmPassword" type="password" placeholder="再次输入" {...form.register('confirmPassword')} />
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '提交中...' : '注册账号'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            已有账号？
            <Link to="/login" className="ml-1 text-brand-600 hover:underline">
              立即登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
