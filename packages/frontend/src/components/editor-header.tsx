import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_LANGUAGES } from '@collabx/shared';
import { User } from '@collabx/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

interface EditorHeaderProps {
  language: string;
  users: User[];
  username: string;
  readOnly: boolean;
  setLanguage: (value: string) => void;
}

export function EditorHeader({
  language,
  users,
  username,
  readOnly,
  setLanguage,
}: EditorHeaderProps) {
  return (
    <div className="pr-4 lg:pr-6 pl-12 h-12 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {readOnly ? (
          <div className="text-zinc-600 dark:text-zinc-400 text-xs">In Read-Only Mode</div>
        ) : (
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px] lg:w-[180px] !h-8 border-zinc-400 dark:border-zinc-600 dark:text-zinc-300">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang: { value: string; label: string }) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-400">
          <Users className="h-4 w-4" />
          <span className="text-xs">{users.length} active</span>
        </div>
      </div>

      <div className="flex -space-x-2">
        <AnimatePresence>
          {users.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="relative group"
            >
              <div
                className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 flex items-center justify-center text-xs text-white shadow-sm transition-all duration-200 hover:scale-110 hover:z-10 ${
                  user.username === username
                    ? 'border-zinc-800 dark:border-zinc-100'
                    : 'border-zinc-100 dark:border-zinc-800'
                }`}
                style={{ backgroundColor: user.color }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <div className="absolute left-1/2 -translate-x-10/12 z-10 top-full mb-2 hidden group-hover:block">
                <div className="bg-slate-800 text-zinc-100 text-xs py-1.5 px-2.5 rounded whitespace-nowrap shadow-lg">
                  <div className="font-medium">{user.username}</div>
                  {user.username === username && (
                    <div className="text-amber-400 text-[10px] mt-0.5">(You)</div>
                  )}
                </div>
                <div className="absolute left-10/12 -translate-x-1/2 bottom-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[4px] border-b-slate-800"></div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
