import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRandomColor(): string {
  const colors = [
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#8BC34A',
    '#CDDC39',
    '#FFC107',
    '#FF9800',
    '#FF5722',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
];

export const DEFAULT_LANGUAGE = 'javascript';

export const DEFAULT_CONTENT = `function greet(name) {
  // This is a collaborative editor
  // Any changes you make are visible to others in real-time
  return \`Welcome to CollabX, \${name}!\`;
}

// Try editing this code together with your team
const message = greet('Team');
console.log(message);`;

export const coolUsernames = [
  'ByteMaster',
  'PixelNinja',
  'CodeWizard',
  'DataDragon',
  'CyberPanda',
  'QuantumFox',
  'SyntaxRaven',
  'LogicLynx',
  'BinaryBadger',
  'TechTiger',
  'AlgoAlien',
  'CloudKoala',
  'DevDragon',
  'ScriptSage',
  'NeonNebula',
  'CryptoCat',
  'DigitalDolphin',
  'WebWolf',
  'CodeCrane',
  'DataDeer',
];

export function getRandomUsername(): string {
  const randomIndex = Math.floor(Math.random() * coolUsernames.length);
  // Add a random number to make it more unique
  const randomSuffix = Math.floor(Math.random() * 1000);
  return `${coolUsernames[randomIndex]}${randomSuffix}`;
}
