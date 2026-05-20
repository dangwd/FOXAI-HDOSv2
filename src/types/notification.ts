export interface NotificationRecord {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  channel: string;
  status: string;
  createdAtUtc: string;
  sentAtUtc: string | null;
}

export interface NotificationsResponse {
  success: boolean;
  data: NotificationRecord[];
}
