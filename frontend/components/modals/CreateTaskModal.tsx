'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useStore } from '@/lib/store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import { TextInput } from '@/lib/types';
import toast from 'react-hot-toast';
import { X, Sparkles, Plus, Trash2 } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
}

export default function CreateTaskModal({ isOpen, onClose, initialText = '' }: CreateTaskModalProps) {
  const { projects } = useStore();
  const queryClient = useQueryClient();
  
  const [text, setText] = useState(initialText);
  const [projectId, setProjectId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTask, setGeneratedTask] = useState<any>(null);
  const [customSteps, setCustomSteps] = useState<string[]>(['']);

  const createTaskMutation = useMutation({
    mutationFn: taskApi.createFromText,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully!');
      handleClose();
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });

  const handleGenerateTask = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await taskApi.createFromText({ text });
      setGeneratedTask(response.task);
      
      // Set custom steps from generated task
      if (response.task.steps) {
        setCustomSteps(response.task.steps.map(s => s.descriptions));
      }
    } catch (error) {
      toast.error('Failed to generate task');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateTask = () => {
    if (!generatedTask) {
      handleGenerateTask();
      return;
    }

    // Update task with custom steps and project
    const taskData = {
      ...generatedTask,
      projectId: projectId || undefined,
      steps: customSteps
        .filter(step => step.trim())
        .map((step, index) => ({
          id: `step-${index}`,
          descriptions: step,
          isCompleted: false,
        })),
    };

    createTaskMutation.mutate({ text, context: `Project: ${projectId}` });
  };

  const handleClose = () => {
    setText('');
    setProjectId('');
    setGeneratedTask(null);
    setCustomSteps(['']);
    onClose();
  };

  const addStep = () => {
    setCustomSteps([...customSteps, '']);
  };

  const removeStep = (index: number) => {
    setCustomSteps(customSteps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...customSteps];
    updated[index] = value;
    setCustomSteps(updated);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="div" className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Create AI Task
                  </h3>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Title>

                <div className="space-y-4">
                  {/* Text Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Describe your task
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="E.g., Create a landing page for our new product launch with hero section, features, and contact form..."
                    />
                  </div>

                  {/* Project Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project (optional)
                    </label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Generated Task Preview */}
                  {generatedTask && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Generated Task Preview
                      </h4>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Title:</strong> {generatedTask.title}
                      </p>
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Description:</strong> {generatedTask.description}
                      </p>
                      
                      {/* Editable Steps */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Steps (editable)
                          </label>
                          <button
                            onClick={addStep}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add Step
                          </button>
                        </div>
                        <div className="space-y-2">
                          {customSteps.map((step, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 w-6">
                                {index + 1}.
                              </span>
                              <input
                                type="text"
                                value={step}
                                onChange={(e) => updateStep(index, e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter step description"
                              />
                              {customSteps.length > 1 && (
                                <button
                                  onClick={() => removeStep(index)}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTask}
                    disabled={!text.trim() || isGenerating || createTaskMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {generatedTask ? 'Create Task' : 'Generate & Create'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
