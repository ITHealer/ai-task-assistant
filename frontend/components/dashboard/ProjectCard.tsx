import { Project } from '@/lib/types';
import { Folder, MoreVertical } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ProjectCard({ project, onClick, onEdit, onDelete }: ProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer relative group"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${project.color}20` }}
        >
          <Folder className="w-6 h-6" style={{ color: project.color }} />
        </div>
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {/* Dropdown would go here */}
        </div>
      </div>

      <h3 className="font-medium text-gray-900 mb-2">{project.name}</h3>
      {project.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
        </span>
        <span className="text-gray-400">
          {new Date(project.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}