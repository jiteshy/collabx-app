import { redirect } from 'next/navigation';
import { ValidationService } from '@collabx/shared';

export default function Home() {
  const sessionId = ValidationService.generateValidSessionId(12);
  redirect(`/${sessionId}`);
}
