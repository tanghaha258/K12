import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(account, password);
      setAuth(res.data.accessToken, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ds-bg p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-ds-fg">K12教务管理系统</h1>
            <p className="mt-2 text-sm text-ds-fg-muted">请登录您的账号</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-ds-danger/10 px-4 py-3 text-sm text-ds-danger">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm text-ds-fg-muted">
                账号
              </label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary"
                placeholder="请输入账号"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-ds-fg-muted">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-ds-border bg-ds-surface px-4 py-2.5 text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary"
                placeholder="请输入密码"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-ds-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ds-primary/90 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              登录
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-ds-fg-subtle">
            默认管理员账号: admin / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
