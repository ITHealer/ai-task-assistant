'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { cn, getPriorityColor } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Clock, Calendar, MoreVertical } from 'lucide-react';

type BoardColumn = 'todo' | 'in-progress' | 'done';

const columns: { id: BoardColumn; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50' },
  { id: 'done', title: 'Done', color: 'bg-green-50' },
];

export default function TaskBoardView() {
  const { tasks } = useStore();
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      taskApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Group tasks by status
  const tasksByColumn = tasks.reduce((acc, task) => {
    let column: BoardColumn = 'todo';
    
    if (task.isCompleted) {
      column = 'done';
    } else if (task.steps.some(step => step.isCompleted)) {
      column = 'in-progress';
    }
    
    if (!acc[column]) acc[column] = [];
    acc[column].push(task);
    return acc;
  }, {} as Record<BoardColumn, Task[]>);

  const handleDragEnd = (result: any) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    
    const sourceColumn = result.source.droppableId as BoardColumn;
    const destColumn = result.destination.droppableId as BoardColumn;
    
    if (sourceColumn === destColumn) return;
    
    const taskId = result.draggableId;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // Update task based on destination column
    let updates: Partial<Task> = {};
    
    switch (destColumn) {
      case 'done':
        updates = {
          isCompleted: true,
          completedAt: new Date().toISOString(),
          steps: task.steps.map(step => ({ ...step, isCompleted: true })),
        };
        break;
      case 'in-progress':
        updates = {
          isCompleted: false,
          completedAt: undefined,
        };
        break;
      case 'todo':
        updates = {
          isCompleted: false,
          completedAt: undefined,
          steps: task.steps.map(step => ({ ...step, isCompleted: false })),
        };
        break;
    }
    
    updateTaskMutation.mutate({ id: taskId, updates });
    toast.success(`Task moved to ${columns.find(c => c.id === destColumn)?.title}`);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={() => setIsDragging(true)}>
      <div className="flex gap-6 p-6 overflow-x-auto">
        {columns.map((column) => (
          <div key={column.id} className="flex-1 min-w-[300px]">
            <div className={cn("rounded-t-lg px-4 py-3", column.color)}>
              <h3 className="font-medium text-gray-900">
                {column.title}
                <span className="ml-2 text-sm text-gray-600">
                  ({tasksByColumn[column.id]?.length || 0})
                </span>
              </h3>
            </div>
            
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "bg-gray-50 min-h-[400px] p-2 rounded-b-lg transition-colors",
                    snapshot.isDraggingOver && "bg-blue-50",
                    isDragging && "ring-2 ring-blue-200"
                  )}
                >
                  {tasksByColumn[column.id]?.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "bg-white p-4 mb-2 rounded-lg shadow-sm border border-gray-200",
                            "hover:shadow-md transition-shadow cursor-move",
                            snapshot.isDragging && "shadow-lg rotate-2"
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 line-clamp-2">
                              {task.title}
                            </h4>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {task.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              getPriorityColor(task.priority)
                            )}>
                              {task.priority}
                            </span>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              {task.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              {task.estimatedTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {task.estimatedTime}m
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {task.steps.length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>
                                  {task.steps.filter(s => s.isCompleted).length}/{task.steps.length}
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600 transition-all"
                                  style={{ 
                                    width: `${(task.steps.filter(s => s.isCompleted).length / task.steps.length) * 100}%` 
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}