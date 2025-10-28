'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="px-6 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors font-medium"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

