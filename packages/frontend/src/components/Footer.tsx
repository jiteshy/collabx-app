import { cn } from '@/lib/utils';

export function Footer() {
  return (
    <div className="w-full lg:absolute bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 lg:from-transparent lg:via-transparent lg:to-transparent bottom-0 px-4 lg:px-6 pt-1 pb-2">
      <div className="flex justify-between items-center text-xs lg:text-sm text-slate-300">
        <span>© {new Date().getFullYear()} CollabX. All rights reserved.</span>
        <div className="lg:flex justify-center hidden">
          {[
            { key: 'Cmd/Ctrl + Shift + C', action: 'Copy Session' },
            { key: 'Cmd/Ctrl + Shift + L', action: 'Toggle Dark Mode' },
            { key: 'Cmd/Ctrl + Shift + E', action: 'Jump to Editor' },
          ].map((shortcut, index, arr) => (
            <div
              key={index}
              className={cn(
                'flex items-center',
                index < arr.length - 1 && 'border-r border-zinc-400 pr-1',
                index > 0 && 'pl-1',
              )}
            >
              <div className="text-xs text-zinc-400">{shortcut.action}:&nbsp;</div>
              <span className="text-xs text-zinc-300">{shortcut.key}</span>
            </div>
          ))}
        </div>
        <a
          href="mailto:info@collabx.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          Submit Feedback
        </a>
      </div>
    </div>
  );
}
