import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type { CreateStudentRequest, Student } from "@shared/schema";

export function useStudents(params?: { search?: string; batch?: string }) {
  const queryKey = params ? [api.students.list.path, params] : [api.students.list.path];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build query string manually or use a helper if params exist
      let url = api.students.list.path;
      if (params) {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.append("search", params.search);
        if (params.batch) searchParams.append("batch", params.batch);
        if (searchParams.toString()) url += `?${searchParams.toString()}`;
      }

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch students");
      return api.students.list.responses[200].parse(await res.json());
    },
  });
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: [api.students.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.students.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch student");
      return api.students.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStudentRequest) => {
      const res = await fetch(api.students.create.path, {
        method: api.students.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create student");
      }
      return api.students.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.students.list.path] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.students.delete.path, { id });
      const res = await fetch(url, { 
        method: api.students.delete.method, 
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete student");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.students.list.path] });
    },
  });
}

export function useBulkCreateStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStudentRequest[]) => {
        const res = await fetch(api.students.bulkCreate.path, {
            method: api.students.bulkCreate.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include",
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to bulk create students");
        }
        return api.students.bulkCreate.responses[201].parse(await res.json());
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [api.students.list.path] });
    }
  });
}
