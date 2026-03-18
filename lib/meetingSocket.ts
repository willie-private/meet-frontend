"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3000";

export interface MeetingParticipant {
  id?: string;
  userId?: string;
  user_id?: string;
  username?: string;
  name?: string;
  email?: string;
  status?: string;
  joined_at?: string;
  [key: string]: unknown;
}

export interface ParticipantJoinedPayload {
  userId: string;
  username?: string;
  participant: MeetingParticipant;
}

export interface EndCallPayload {
  meetingIdentifier: string;
}

export interface ParticipantLeavePayload {
  userId: string;
  username: string | null;
}

/** From join API response: activeParticipants item */
export interface ActiveParticipantFromJoin {
  userId: string;
  username: string;
  participantId: string;
  joinedAt: string;
}

/** Map join API activeParticipants to MeetingParticipant */
export function mapActiveParticipantsToMeeting(
  list: ActiveParticipantFromJoin[]
): MeetingParticipant[] {
  return list.map((p) => ({
    id: p.participantId,
    user_id: p.userId,
    userId: p.userId,
    username: p.username,
    joined_at: p.joinedAt,
  }));
}

/**
 * Hook to connect to the meeting socket, subscribe to a meeting by identifier,
 * and listen for participant_joined, participant_leave, and end_call events.
 * Optionally seed participants from join API response (activeParticipants).
 */
export function useMeetingSocket(
  meetingIdentifier: string | null,
  initialParticipants: MeetingParticipant[] | null = null
) {
  const socketRef = useRef<Socket | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [lastJoined, setLastJoined] = useState<ParticipantJoinedPayload | null>(null);
  const onParticipantJoinedRef = useRef<((payload: ParticipantJoinedPayload) => void) | null>(null);
  const onEndCallRef = useRef<((payload: EndCallPayload) => void) | null>(null);
  const initialSyncedRef = useRef(false);

  const onParticipantJoined = useCallback((callback: (payload: ParticipantJoinedPayload) => void) => {
    onParticipantJoinedRef.current = callback;
  }, []);

  const onEndCall = useCallback((callback: (payload: EndCallPayload) => void) => {
    onEndCallRef.current = callback;
  }, []);

  useEffect(() => {
    if (!meetingIdentifier) return;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.emit("subscribe_meeting", meetingIdentifier);

    if (initialParticipants?.length) {
      initialSyncedRef.current = true;
      queueMicrotask(() => setParticipants(initialParticipants));
    }

    socket.on("participant_joined", (payload: ParticipantJoinedPayload) => {
      const { userId, username, participant } = payload;
      setParticipants((prev) => {
        const key = participant.id ?? participant.user_id ?? participant.userId ?? userId;
        const exists = prev.some((p) => (p.id ?? p.user_id ?? p.userId) === key);
        if (exists) return prev;
        return [...prev, { ...participant, userId, username: username ?? participant.username }];
      });
      setLastJoined(payload);
      onParticipantJoinedRef.current?.(payload);
    });

    socket.on("participant_leave", (payload: ParticipantLeavePayload) => {
      const { userId } = payload;
      console.log("participant_leave", JSON.stringify(payload, null, 2));
      setParticipants((prev) =>
        prev.filter((p) => (p.user_id ?? p.userId) !== userId)
      );
    });

    socket.on("end_call", (payload: EndCallPayload) => {
      socket.disconnect();
      socketRef.current = null;
      setParticipants([]);
      setLastJoined(null);
      onEndCallRef.current?.(payload);
    });

    return () => {
      socket.off("participant_joined");
      socket.off("participant_leave");
      socket.off("end_call");
      socket.disconnect();
      socketRef.current = null;
      setParticipants([]);
      setLastJoined(null);
      initialSyncedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialParticipants only used to seed on connect
  }, [meetingIdentifier]);

  return { participants, lastJoined, onParticipantJoined, onEndCall };
}
