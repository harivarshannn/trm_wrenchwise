import { apiClient } from "./api";
import { useCandidateStore } from "../hooks/useCandidateStore";
import { Note, ActivityEvent, ReminderItem } from "../types";

const NOTES_STORAGE_KEY = "trms_recruiter_notes";
const EVENTS_STORAGE_KEY = "trms_activity_events";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type NoteApiItem = {
  id: string;
  candidate_id: string;
  created_by?: string | null;
  note: string;
  created_at: string;
  followup_date?: string | null;
};

// Helper to seed initial mockup notes and events if not present in localStorage
const getStoredNotes = (): Note[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(NOTES_STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  // Seed default recruiter notes for the mockup candidates
  const seedNotes: Note[] = [
    {
      id: "note_1",
      candidateId: "c0a80101-0000-0000-0000-000000000001", // Alex Rivera
      recruiterName: "wrenchwise (HR Lead)",
      content: "Alex demonstrated top-tier TypeScript knowledge during the live technical screening. Very communicative and structured.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      id: "note_2",
      candidateId: "c0a80101-0000-0000-0000-000000000001",
      recruiterName: "Robert Miller (Engineering Mgr)",
      content: "Excellent system architecture design in the system design assignment. Highly selected for next engineering roles.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: "note_3",
      candidateId: "c0a80101-0000-0000-0000-000000000002", // Sarah Chen
      recruiterName: "wrenchwise (HR Lead)",
      content: "Sarah has highly specialized knowledge in FastAPI and ML. However, salary requirements need further negotiations.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    }
  ];
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(seedNotes));
  return seedNotes;
};

const getStoredEvents = (): ActivityEvent[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  const seedEvents: ActivityEvent[] = [
    {
      id: "ev_1",
      candidateId: "c0a80101-0000-0000-0000-000000000001",
      type: "upload",
      title: "Resume Ingested",
      description: "Resume uploaded successfully.",
      recruiterName: "wrenchwise",
      created_at: "2026-05-20T10:30:00Z",
    },
    {
      id: "ev_2",
      candidateId: "c0a80101-0000-0000-0000-000000000001",
      type: "note_added",
      title: "Screening Note Added",
      description: "Note added by recruiter.",
      recruiterName: "wrenchwise",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "ev_3",
      candidateId: "c0a80101-0000-0000-0000-000000000001",
      type: "status_change",
      title: "Recruitment Status Updated",
      description: "Candidate status changed: In Progress to Selected.",
      recruiterName: "Robert Miller",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    },
    {
      id: "ev_4",
      candidateId: "c0a80101-0000-0000-0000-000000000002",
      type: "upload",
      title: "Resume Ingested",
      description: "Resume uploaded successfully.",
      recruiterName: "wrenchwise",
      created_at: "2026-05-22T14:45:00Z",
    },
    {
      id: "ev_5",
      candidateId: "c0a80101-0000-0000-0000-000000000003",
      type: "upload",
      title: "Resume Ingested",
      description: "Resume uploaded successfully.",
      recruiterName: "wrenchwise",
      created_at: "2026-05-24T09:15:00Z",
    },
    {
      id: "ev_6",
      candidateId: "c0a80101-0000-0000-0000-000000000003",
      type: "status_change",
      title: "Recruitment Status Updated",
      description: "Candidate status changed: In Progress to Rejected.",
      recruiterName: "wrenchwise",
      created_at: "2026-05-24T11:00:00Z",
    },
    {
      id: "ev_7",
      candidateId: "c0a80101-0000-0000-0000-000000000004",
      type: "upload",
      title: "Resume Ingested",
      description: "Resume uploaded successfully.",
      recruiterName: "wrenchwise",
      created_at: "2026-05-25T16:20:00Z",
    }
  ];
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(seedEvents));
  return seedEvents;
};

export const notesService = {
  getNotes: async (candidateId: string): Promise<Note[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: NoteApiItem[] }>(
        `/api/candidates/${candidateId}/notes`
      );
      if (response.data && response.data.success) {
        return response.data.data.map((note) => ({
          id: note.id,
          candidateId: note.candidate_id,
          recruiterName: note.created_by || "HR Manager",
          content: note.note,
          created_at: note.created_at,
          followup_date: note.followup_date || undefined,
        }));
      }
    } catch (error) {
      console.warn("Backend notes fetch failed. Falling back to local storage.", error);
    }

    await delay(200);
    const notes = getStoredNotes();
    return notes
      .filter((n) => n.candidateId === candidateId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addNote: async (
    candidateId: string,
    content: string,
    recruiterName = "HR Manager",
    followupDate?: string
  ): Promise<Note> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: NoteApiItem }>(
        `/api/candidates/${candidateId}/notes`,
        {
          note: content.trim(),
          created_by: recruiterName,
          followup_date: followupDate || null,
        }
      );
      if (response.data && response.data.success) {
        return {
          id: response.data.data.id,
          candidateId: response.data.data.candidate_id,
          recruiterName: response.data.data.created_by || recruiterName,
          content: response.data.data.note,
          created_at: response.data.data.created_at,
          followup_date: response.data.data.followup_date || undefined,
        };
      }
    } catch (error) {
      console.warn("Backend note create failed. Falling back to local storage.", error);
    }

    await delay(200);
    const notes = getStoredNotes();
    const newNote: Note = {
      id: `note_${Date.now()}`,
      candidateId,
      recruiterName,
      content: content.trim(),
      created_at: new Date().toISOString(),
      ...(followupDate ? { followup_date: followupDate } : {}),
    };

    notes.push(newNote);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));

    const followUpText = followupDate
      ? ` (Follow-up scheduled: ${new Date(followupDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`
      : "";
    await notesService.addEvent(
      candidateId,
      "note_added",
      "Notes Workspace Updated",
      `Recruiter note added${followUpText}: "${newNote.content.substring(0, 40)}${newNote.content.length > 40 ? "..." : ""}"`,
      recruiterName
    );

    return newNote;
  },

  deleteNote: async (noteId: string): Promise<string> => {
    try {
      await apiClient.delete(`/api/notes/${noteId}`);
      return noteId;
    } catch (error) {
      console.warn("Backend note delete failed. Falling back to local storage.", error);
    }

    await delay(100);
    const notes = getStoredNotes();
    const updated = notes.filter((n) => n.id !== noteId);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updated));
    return noteId;
  },

  getReminders: async (days = 30): Promise<ReminderItem[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: ReminderItem[] }>(
        "/api/notes/reminders",
        { params: { days } }
      );
      if (response.data && response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.warn("Backend reminders fetch failed. Falling back to local storage.", error);
    }

    await delay(150);
    const notes = getStoredNotes().filter((note) => note.followup_date);
    const candidates = useCandidateStore.getState().candidates;
    return notes
      .map((note) => {
        const candidate = candidates.find((c) => c.id === note.candidateId);
        return {
          note_id: note.id,
          candidate_id: note.candidateId,
          candidate_name: candidate?.name,
          candidate_email: candidate?.email,
          candidate_status: candidate?.status,
          note: note.content,
          followup_date: note.followup_date!,
          created_by: note.recruiterName,
          created_at: note.created_at,
        };
      })
      .sort((a, b) => new Date(a.followup_date).getTime() - new Date(b.followup_date).getTime());
  },

  getEvents: async (candidateId: string): Promise<ActivityEvent[]> => {
    await delay(200);
    const events = getStoredEvents();
    // Sort in reverse-chronological order
    return events
      .filter((e) => e.candidateId === candidateId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addEvent: async (
    candidateId: string,
    type: ActivityEvent["type"],
    title: string,
    description: string,
    recruiterName = "HR Manager"
  ): Promise<ActivityEvent> => {
    const events = getStoredEvents();
    const newEvent: ActivityEvent = {
      id: `ev_${Date.now()}`,
      candidateId,
      type,
      title,
      description,
      recruiterName,
      created_at: new Date().toISOString(),
    };
    events.push(newEvent);
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    return newEvent;
  },
};
