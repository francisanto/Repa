import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateEventRequest, CreateRegistrationRequest } from "@shared/schema";

export function useEvents() {
  return useQuery({
    queryKey: [api.events.list.path],
    queryFn: async () => {
      const res = await fetch(api.events.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return api.events.list.responses[200].parse(await res.json());
    },
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: [api.events.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.events.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch event");
      return api.events.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEventRequest) => {
      // Ensure date is a string for JSON serialization
      const payload = { ...data, date: data.date instanceof Date ? data.date.toISOString() : data.date };
      
      const res = await fetch(api.events.create.path, {
        method: api.events.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create event");
      return api.events.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
    },
  });
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { eventId: number; studentName: string }) => {
      const res = await fetch(api.registrations.create.path, {
        method: api.registrations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Student name not found in our records");
        throw new Error("Failed to register");
      }
      
      return api.registrations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.registrations.list.path] });
    },
  });
}

export function useRegistrations(eventId?: number) {
    return useQuery({
        queryKey: [api.registrations.list.path, eventId],
        queryFn: async () => {
            let url = api.registrations.list.path;
            if (eventId) {
                url += `?eventId=${eventId}`;
            }
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch registrations");
            return api.registrations.list.responses[200].parse(await res.json());
        },
        enabled: eventId !== undefined
    });
}
