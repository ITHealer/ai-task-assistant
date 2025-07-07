'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Task } from '@/lib/types';
import { useStore } from '@/lib/store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import { formatDate, getPriorityColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  X,
  Calendar,
  Clock,
  Flag,
  Folder,
  CheckCircle2,
  Circle,
  Edit2,
  Save,
  Trash2
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const { projects } = useStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      taskApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated');
      setIsEditing(false);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: taskApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
      onClose();
    },
  });

  const handleSave = () => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        title: editedTask.title,
        description: editedTask.description,
        priority: editedTask.priority,
        projectId: editedTask.projectId,
        dueDate: editedTask.dueDate,
        estimatedTime: editedTask.estimatedTime,
      },
    });
  };

  const toggleStep = (stepId: string) => {
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

  const currentProject = projects.find(p => p.id === task.projectId);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedTask.title}
                          onChange={(e) =>
                            setEditedTask({ ...editedTask, title: e.target.value })
                          }
                          className="text-xl font-semibold bg-white px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <h2 className="text-xl font-semibold text-gray-900">
                          {task.title}
                        </h2>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setEditedTask(task);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={onClose}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="text-sm text-gray-600">Priority</label>
                      {isEditing ? (
                        <select
                          value={editedTask.priority}
                          onChange={(e) =>
                            setEditedTask({
                              ...editedTask,
                              priority: e.target.value as any,
                            })
                          }
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <Flag className="w-4 h-4" />
                          <span className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Project</label>
                      {isEditing ? (
                        <select
                          value={editedTask.projectId || ''}
                          onChange={(e) =>
                            setEditedTask({
                              ...editedTask,
                              projectId: e.target.value || undefined,
                            })
                          }
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">No Project</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          <span>{currentProject?.name || 'No Project'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Due Date</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedTask.dueDate?.split('T')[0] || ''}
                          onChange={(e) =>
                            setEditedTask({
                              ...editedTask,
                              dueDate: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : undefined,
                            })
                          }
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{task.dueDate ? formatDate(task.dueDate) : 'Not set'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Time Est.</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedTask.estimatedTime || ''}
                          onChange={(e) =>
                            setEditedTask({
                              ...editedTask,
                              estimatedTime: parseInt(e.target.value) || undefined,
                            })
                          }
                          placeholder="Minutes"
                          className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {task.estimatedTime ? `${task.estimatedTime}m` : 'Not set'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedTask.description}
                        onChange={(e) =>
                          setEditedTask({ ...editedTask, description: e.target.value })
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Steps */}
                  {task.steps.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Steps ({task.steps.filter(s => s.isCompleted).length}/
                        {task.steps.length})
                      </h3>
                      <div className="space-y-2">
                        {task.steps.map((step) => (
                          <div
                            key={step.id}
                            className="flex items-start gap-3 p-2 rounded hover:bg-gray-50"
                          >
                            <button
                              onClick={() => toggleStep(step.id)}
                              className="mt-0.5 text-gray-400 hover:text-blue-600"
                            >
                              {step.isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                            <span
                              className={
                                step.isCompleted
                                  ? 'text-gray-500 line-through'
                                  : 'text-gray-700'
                              }
                            >
                              {step.descriptions}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source Text */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium text-gray-700">
                        Original Text
                      </summary>
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {task.sourceText}
                      </p>
                    </details>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}