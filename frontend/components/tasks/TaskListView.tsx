'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { cn, formatDate, getPriorityColor } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import TaskDetailModal from '@/components/modals/TaskDetailModal';

export default function TaskListView() {
  const { tasks } = useStore();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      taskApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: taskApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
  });

  const toggleTaskComplete = (task: Task) => {
    const isCompleted = !task.isCompleted;
    const updates: Partial<Task> = {
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    };

    // If completing, mark all steps as completed
    if (isCompleted) {
      updates.steps = task.steps.map(step => ({ ...step, isCompleted: true }));
    }

    updateTaskMutation.mutate({ id: task.id, updates });
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleStepComplete = (task: Task, stepId: string) => {
    const updatedSteps = task.steps.map(step =>
      step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
    );

    const allCompleted = updatedSteps.every(step => step.isCompleted);

    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        steps: updatedSteps,
        isCompleted: allCompleted,
        completedAt: allCompleted ? new Date().toISOString() : undefined,
      },
    });
  };

  const groupedTasks = tasks.reduce((groups, task) => {
    const key = task.isCompleted ? 'completed' : 'active';
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
    return groups;
  }, {} as Record<string, Task[]>);

  return (
    <>
      <div className="divide-y divide-gray-200">
        {/* Active Tasks */}
        {groupedTasks.active?.length > 0 && (
          <div>
            <h3 className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-50">
              Active Tasks ({groupedTasks.active.length})
            </h3>
            <div className="divide-y divide-gray-200">
              {groupedTasks.active.map((task) => {
                const isExpanded = expandedTasks.has(task.id);
                const completedSteps = task.steps.filter(s => s.isCompleted).length;
                const progress = task.steps.length > 0 
                  ? (completedSteps / task.steps.length) * 100 
                  : 0;

                return (
                  <div key={task.id} className="hover:bg-gray-50">
                    {/* Task Header */}
                    <div className="px-6 py-4">
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTaskComplete(task)}
                          className="mt-0.5 text-gray-400 hover:text-blue-600"
                        >
                          <Circle className="w-5 h-5" />
                        </button>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 
                                className="text-base font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                onClick={() => setSelectedTask(task)}
                              >
                                {task.title}
                              </h4>
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {task.description}
                              </p>

                              {/* Metadata */}
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                <span className={cn("px-2 py-1 rounded-full", getPriorityColor(task.priority))}>
                                  {task.priority}
                                </span>
                                {task.dueDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(task.dueDate)}
                                  </span>
                                )}
                                {task.estimatedTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {task.estimatedTime}m
                                  </span>
                                )}
                                {task.steps.length > 0 && (
                                  <span>
                                    {completedSteps}/{task.steps.length} steps
                                  </span>
                                )}
                              </div>

                              {/* Progress Bar */}
                              {task.steps.length > 0 && (
                                <div className="mt-2 w-full max-w-xs">
                                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-600 transition-all duration-300"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {task.steps.length > 0 && (
                                <button
                                  onClick={() => toggleTaskExpanded(task.id)}
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              
                              <div className="relative group">
                                <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                
                                {/* Dropdown Menu */}
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                  <button
                                    onClick={() => setSelectedTask(task)}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteTaskMutation.mutate(task.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Steps */}
                    {isExpanded && task.steps.length > 0 && (
                      <div className="px-6 pb-4 pl-16">
                        <div className="space-y-2">
                          {task.steps.map((step) => (
                            <div key={step.id} className="flex items-start gap-3">
                              <button
                                onClick={() => toggleStepComplete(task, step.id)}
                                className="mt-0.5 text-gray-400 hover:text-blue-600"
                              >
                                {step.isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                              <span className={cn(
                                "text-sm",
                                step.isCompleted ? "text-gray-500 line-through" : "text-gray-700"
                              )}>
                                {step.descriptions}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {groupedTasks.completed?.length > 0 && (
          <div>
            <h3 className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-50">
              Completed ({groupedTasks.completed.length})
            </h3>
            <div className="divide-y divide-gray-200">
              {groupedTasks.completed.map((task) => (
                <div key={task.id} className="px-6 py-4 hover:bg-gray-50 opacity-60">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleTaskComplete(task)}
                      className="mt-0.5 text-blue-600"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                      <h4 className="text-base font-medium text-gray-900 line-through">
                        {task.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Completed on {formatDate(task.completedAt!)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}