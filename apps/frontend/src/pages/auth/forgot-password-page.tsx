import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Link } from 'react-router-dom';
import { toast } from '../../components/ui/sonner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    toast.info('我们已向您的邮箱发送重置指引（示例功能）');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 dark:bg-slate-900">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>找回密码</CardTitle>
          <CardDescription>输入注册邮箱，我们将发送重置链接。演示环境不会真正发送邮件。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <Button type="submit" className="w-full">
              发送重置链接
            </Button>
          </form>
          {submitted && (
            <p className="mt-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
              重置邮件示例已发送，请查收。若未收到，可联系管理员直接修改密码。
            </p>
          )}
          <p className="mt-6 text-center text-sm text-slate-500">
            记起密码了？
            <Link to="/login" className="ml-1 text-brand-600 hover:underline">
              返回登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
