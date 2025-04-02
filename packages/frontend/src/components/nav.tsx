import { Code2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <div className="p-4 lg:px-6 mb-5 border-b border-slate-700/50">
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <Code2 className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
          <span className="text-2xl lg:text-4xl -mt-1 lg:-mt-2 text-zinc-200 font-light bg-clip-text">
            collab<span className="text-white font-extrabold">x</span>
          </span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
