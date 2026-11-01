import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
export function useMemories(userId?: string) {
  return useQuery({
    ...orpc.memory.list.queryOptions(),
    queryKey: [...orpc.memory.list.key(), userId],
    enabled: !!userId,
  });
}
export function useTasks(userId?: string) {
  return useQuery({
    ...orpc.memory.tasks.queryOptions(),
    queryKey: [...orpc.memory.tasks.key(), userId],
    enabled: !!userId,
  });
}
export function useMemoryActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: orpc.memory.key() });
  return {
    create: useMutation(orpc.memory.create.mutationOptions({ onSuccess: refresh })),
    update: useMutation(orpc.memory.update.mutationOptions({ onSuccess: refresh })),
    remove: useMutation(orpc.memory.remove.mutationOptions({ onSuccess: refresh })),
    summarize: useMutation(orpc.memory.summarize.mutationOptions({ onSuccess: refresh })),
    ask: useMutation(orpc.memory.ask.mutationOptions()),
    addTask: useMutation(orpc.memory.addTask.mutationOptions({ onSuccess: refresh })),
    taskStatus: useMutation(orpc.memory.taskStatus.mutationOptions({ onSuccess: refresh })),
  };
}
