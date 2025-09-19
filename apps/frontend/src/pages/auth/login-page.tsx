import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../providers/auth-provider';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const schema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(8, '密码至少8位')
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login, loading } = useAuth();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: FormValues) => {
    await login(values);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-brand-500 via-brand-600 to-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl font-bold">简浩影视 · 影像后台</h2>
          <p className="mt-4 max-w-md text-sm text-brand-50/80">
            从客户沟通、项目排期、拍摄执行到成片交付，一站式数字化管理，让团队协作更顺畅，让客户体验更惊艳。
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
            <h3 className="text-lg font-semibold">摄影工作室最佳拍档</h3>
            <ul className="mt-4 space-y-2 text-sm text-brand-50/90">
              <li>· 实时掌握拍摄进度与待办事项</li>
              <li>· 客户档案、合同与预算集中管理</li>
              <li>· 智能提醒重要档期与交付时间</li>
            </ul>
          </div>
        </motion.div>
      </div>
      <div className="flex items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>欢迎登录</CardTitle>
            <CardDescription>输入账号密码即可访问后台控制中心</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input id="password" type="password" placeholder="至少8位" {...form.register('password')} />
                {form.formState.errors.password && (
                  <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>
            <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
              <Link to="/register" className="hover:text-brand-600">
                注册账号
              </Link>
              <Link to="/forgot-password" className="hover:text-brand-600">
                忘记密码？
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
