import { redirect } from 'next/navigation';

export default function Home() {
  const sessionId = Math.random().toString(36).substring(2, 12);
  redirect(`/${sessionId}`);
}
