import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useTimetables() {
  return useQuery({
    queryKey: [api.timetables.list.path],
    queryFn: async () => {
      const res = await fetch(api.timetables.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch timetables");
      return api.timetables.list.responses[200].parse(await res.json());
    },
  });
}

export function useUploadTimetable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { batch: string; image: string }) => {
      const res = await fetch(api.timetables.upload.path, {
        method: api.timetables.upload.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to upload timetable");
      return api.timetables.upload.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.timetables.list.path] });
    },
  });
}
