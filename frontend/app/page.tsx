'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { taskApi, projectApi } from '@/lib/api';
import { useStore } from '@/lib/store';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import TaskListView from '@/components/tasks/TaskListView';
import TaskBoardView from '@/components/tasks/TaskBoardView';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { 
    viewMode, 
    setTasks, 
    setProjects,
    searchQuery,
    selectedProject 
  } = useStore();

  // Fetch tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', selectedProject?.id, searchQuery],
    queryFn: () => taskApi.getAll({
      projectId: selectedProject?.id,
      search: searchQuery
    }),
  });

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.getAll,
  });

  // Update store
  useEffect(() => {
    if (tasks) setTasks(tasks);
  }, [tasks, setTasks]);

  useEffect(() => {
    if (projects) setProjects(projects);
  }, [projects, setProjects]);

  const isLoading = tasksLoading || projectsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardStats />
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            {viewMode === 'list' && <TaskListView />}
            {viewMode === 'board' && <TaskBoardView />}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}