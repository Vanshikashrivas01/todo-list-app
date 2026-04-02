import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  useListTasks,
  getListTasksQueryKey,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useGetTaskStats,
  getGetTaskStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Check, Trash2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const queryClient = useQueryClient();
  const [newTaskText, setNewTaskText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tasks, isLoading: tasksLoading } = useListTasks({
    query: { queryKey: getListTasksQueryKey() },
  });

  const { data: stats } = useGetTaskStats({
    query: { queryKey: getGetTaskStatsQueryKey() },
  });

  const createTask = useCreateTask({
    mutation: {
      onSuccess: () => {
        setNewTaskText("");
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
      },
    },
  });

  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
      },
    },
  });

  const deleteTask = useDeleteTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
      },
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    createTask.mutate({ data: { text: newTaskText } });
  };

  const handleToggleTask = (id: number, currentDone: boolean) => {
    updateTask.mutate({ id, data: { done: !currentDone } });
  };

  const handleDeleteTask = (id: number) => {
    deleteTask.mutate({ id });
  };

  const completedPercentage =
    stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-2xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(new Date(), "EEEE, MMMM do")}
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Your Workspace
              </h1>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="text-3xl font-light text-primary">
                {stats?.completed || 0}
                <span className="text-muted-foreground text-lg">
                  /{stats?.total || 0}
                </span>
              </span>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                Completed
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Progress
              value={completedPercentage}
              className="h-2 w-full bg-muted/50 overflow-hidden"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Progress</span>
              <span>{completedPercentage}%</span>
            </div>
          </div>
        </header>

        <form onSubmit={handleCreateTask} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Plus className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="What needs to be done?"
            className="pl-12 h-14 text-lg bg-card/50 border-transparent hover:border-border/50 focus:bg-card focus:border-primary shadow-sm rounded-2xl transition-all duration-300"
            disabled={createTask.isPending}
          />
        </form>

        <div className="space-y-4">
          <AnimatePresence initial={false} mode="popLayout">
            {tasksLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-card/30 animate-pulse rounded-2xl"
                  />
                ))}
              </motion.div>
            ) : tasks?.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16 px-4"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/5 flex items-center justify-center text-primary/40">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  All caught up
                </h3>
                <p className="text-muted-foreground">
                  You have no tasks pending. Take a deep breath and enjoy the
                  calm.
                </p>
              </motion.div>
            ) : (
              tasks?.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <Card
                    className={cn(
                      "group overflow-hidden rounded-2xl border-none shadow-sm transition-all duration-300",
                      task.done ? "bg-card/50" : "bg-card hover:shadow-md"
                    )}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <button
                        onClick={() => handleToggleTask(task.id, task.done)}
                        className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                          task.done
                            ? "bg-primary text-primary-foreground scale-110 shadow-sm shadow-primary/20"
                            : "border-2 border-muted-foreground/30 text-transparent hover:border-primary/50"
                        )}
                      >
                        <Check
                          className={cn(
                            "w-3.5 h-3.5 transition-transform duration-300",
                            task.done ? "scale-100" : "scale-50 opacity-0"
                          )}
                        />
                      </button>

                      <div className="flex-grow min-w-0">
                        <p
                          className={cn(
                            "text-base font-medium truncate transition-all duration-300",
                            task.done
                              ? "text-muted-foreground line-through decoration-muted-foreground/30"
                              : "text-foreground"
                          )}
                        >
                          {task.text}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
