import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesService } from "../services/notes.service";
import { Note } from "../types";

export const useNotes = (candidateId: string | null) => {
  return useQuery({
    queryKey: ["notes", candidateId],
    queryFn: () => (candidateId ? notesService.getNotes(candidateId) : []),
    enabled: !!candidateId,
  });
};

export const useAddNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      candidateId,
      content,
      recruiterName,
      followupDate,
    }: {
      candidateId: string;
      content: string;
      recruiterName?: string;
      followupDate?: string;
    }) => notesService.addNote(candidateId, content, recruiterName, followupDate),
    onSuccess: (data, variables) => {
      // Invalidate notes list and timeline events for the candidate
      queryClient.invalidateQueries({ queryKey: ["notes", variables.candidateId] });
      queryClient.invalidateQueries({ queryKey: ["timeline", variables.candidateId] });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId }: { noteId: string; candidateId: string }) =>
      notesService.deleteNote(noteId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes", variables.candidateId] });
    },
  });
};

export const useTimelineEvents = (candidateId: string | null) => {
  return useQuery({
    queryKey: ["timeline", candidateId],
    queryFn: () => (candidateId ? notesService.getEvents(candidateId) : []),
    enabled: !!candidateId,
  });
};
