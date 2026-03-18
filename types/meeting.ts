export interface Meeting {
  id: string;
  name: string | null;
  identifier: string;
  host: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  meetingUrl: string;
}

export interface CreateMeetingResponse {
  message: string;
  meeting: Meeting;
}
