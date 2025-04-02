import { toast } from 'sonner';

export class NotificationService {
  static showUserJoined(username: string) {
    toast.success(`${username} joined the session`);
  }

  static showUserLeft(username: string) {
    toast.info(`${username} left the session`);
  }
}
