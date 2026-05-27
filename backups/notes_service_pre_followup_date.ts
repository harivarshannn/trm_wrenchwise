import { Note, ActivityEvent } from "../types";

const NOTES_STORAGE_KEY = "trms_recruiter_notes";
const EVENTS_STORAGE_KEY = "trms_activity_events";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to seed initial mockup notes and events if not present in localStorage
const getStoredNotes = (): Note[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(NOTES_STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  // Seed default recruiter notes for the mockup candidates
  const seedNotes: Note[] = [
    {
      id: "note_1",
      candidateId: "cand_1", // Alex Rivera
      recruiterName: "Jane Doe (HR Lead)",
      content: "Alex demonstrated top-tier TypeScript knowledge during the live technical screening. Very communicative and structured.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      id: "note_2",
      candidateId: "cand_1",
      recruiterName: "Robert Miller (Engineering Mgr)",
      content: "Excellent system architecture design in the system design assignment. Highly selected for next engineering roles.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: "note_3",
      candidateId: "cand_2", // Sarah Chen
      recruiterName: "Jane Doe (HR Lead)",
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
      candidateId: "cand_1",
      type: "upload",
      title: "Resume Ingested",
      description: "Successfully processed through direct PDF extraction tunnel.",
      recruiterName: "Jane Doe",
      created_at: "2026-05-20T10:30:00Z",
    },
    {
      id: "ev_2",
      candidateId: "cand_1",
      type: "note_added",
      title: "Screening Note Added",
      description: "Added core performance evaluation feedback.",
      recruiterName: "Jane Doe",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "ev_3",
      candidateId: "cand_1",
      type: "status_change",
      title: "Recruitment Status Updated",
      description: "Pipeline status advanced: In Progress ➔ Selected",
      recruiterName: "Robert Miller",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    },
    {
      id: "ev_4",
      candidateId: "cand_2",
      type: "upload",
      title: "Resume Ingested",
      description: "Processed Sarah Chen's CV using Direct Text Extractor.",
      recruiterName: "Jane Doe",
      created_at: "2026-05-22T14:45:00Z",
    },
    {
      id: "ev_5",
      candidateId: "cand_3",
      type: "upload",
      title: "Resume Ingested",
      description: "Successfully processed Marcus Vance's CV.",
      recruiterName: "Jane Doe",
      created_at: "2026-05-24T09:15:00Z",
    },
    {
      id: "ev_6",
      candidateId: "cand_3",
      type: "status_change",
      title: "Recruitment Status Updated",
      description: "Pipeline status shifted: In Progress ➔ Rejected",
      recruiterName: "Jane Doe",
      created_at: "2026-05-24T11:00:00Z",
    },
    {
      id: "ev_7",
      candidateId: "cand_4",
      type: "upload",
      title: "Resume Ingested",
      description: "Successfully processed Elena Rostova's CV.",
      recruiterName: "Jane Doe",
      created_at: "2026-05-25T16:20:00Z",
    }
  ];
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(seedEvents));
  return seedEvents;
};

export const notesService = {
  getNotes: async (candidateId: string): Promise<Note[]> => {
    await delay(200);
    const notes = getStoredNotes();
    // Return reverse-chronological order
    return notes
      .filter((n) => n.candidateId === candidateId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addNote: async (candidateId: string, content: string, recruiterName = "HR Manager"): Promise<Note> => {
    await delay(200);
    const notes = getStoredNotes();
    const newNote: Note = {
      id: `note_${Date.now()}`,
      candidateId,
      recruiterName,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    
    // Save note
    notes.push(newNote);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));

    // Automatically append a corresponding timeline event
    await notesService.addEvent(
      candidateId,
      "note_added",
      "Notes Workspace Updated",
      `Recruiter note added: "${newNote.content.substring(0, 40)}${newNote.content.length > 40 ? "..." : ""}"`,
      recruiterName
    );

    return newNote;
  },

  deleteNote: async (noteId: string): Promise<string> => {
    await delay(100);
    const notes = getStoredNotes();
    const updated = notes.filter((n) => n.id !== noteId);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updated));
    return noteId;
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
