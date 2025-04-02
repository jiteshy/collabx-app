import { toast } from 'sonner';

export class NotificationService {
  static showUserJoined(username: string, currentUsername: string) {
    if (username !== currentUsername) {
      toast.success(`${username} joined the session`);
    }
  }

  static showUserLeft(username: string, currentUsername: string) {
    if (username !== currentUsername) {
      toast.info(`${username} left the session`);
    }
  }
}
