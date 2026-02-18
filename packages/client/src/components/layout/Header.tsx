import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, Search, ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
const currentTerm = currentMonth >= 8 ? '1' : '2';

const schoolYears = [
  `${currentYear}-${currentYear + 1}学年`,
  `${currentYear - 1}-${currentYear}学年`,
  `${currentYear - 2}-${currentYear - 1}学年`,
];

const terms = [
  { value: '1', label: '第一学期' },
  { value: '2', label: '第二学期' },
];

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [schoolYear, setSchoolYear] = useState(schoolYears[0]);
  const [term, setTerm] = useState(currentTerm);
  const [searchText, setSearchText] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate(`/students?search=${encodeURIComponent(searchText)}`);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-ds-border bg-ds-surface px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={schoolYear} onValueChange={setSchoolYear}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="选择学年" />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="选择学期" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={handleSearch} className="relative ml-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-fg-muted" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索学生（姓名/学号）..."
            className="h-9 w-[240px] rounded-md border border-ds-border bg-ds-surface py-2 pl-10 pr-4 text-sm text-ds-fg outline-none transition-colors placeholder:text-ds-fg-subtle focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
          />
        </form>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-md p-2 text-ds-fg-muted hover:bg-ds-surface-2 hover:text-ds-fg">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-ds-danger" />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-md px-3 py-2 text-ds-fg hover:bg-ds-surface-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ds-primary text-sm text-white">
                {user?.name?.charAt(0) || <User className="h-4 w-4" />}
              </div>
              <span className="text-sm">{user?.name}</span>
              <ChevronDown className="h-4 w-4 text-ds-fg-muted" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[160px] rounded-md border border-ds-border bg-[#1a1f35] p-1 shadow-lg"
              sideOffset={5}
            >
              <DropdownMenu.Item className="cursor-pointer rounded-sm px-3 py-2 text-sm text-ds-fg outline-none hover:bg-ds-surface-2">
                个人设置
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-ds-border" />
              <DropdownMenu.Item
                className="cursor-pointer rounded-sm px-3 py-2 text-sm text-ds-danger outline-none hover:bg-ds-surface-2"
                onSelect={handleLogout}
              >
                <span className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  退出登录
                </span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
