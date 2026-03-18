import { JoinMeetingScreen } from "@/components/JoinMeetingScreen";

// Required for static export: at least one path. Other IDs are handled by not-found.tsx.
export function generateStaticParams() {
  return [{ identifier: "default" }];
}

type Props = {
  params: Promise<{ identifier: string }>;
};

export default async function MeetingPage({ params }: Props) {
  const { identifier } = await params;
  return <JoinMeetingScreen identifier={identifier} />;
}
