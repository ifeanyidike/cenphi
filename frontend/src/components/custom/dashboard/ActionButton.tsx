// ActionButton.tsx
import { ActionItem } from "@/types/types";

interface ActionButtonProps {
  action: ActionItem;
}

export const ActionButton = ({ action }: ActionButtonProps) => {
  return (
    <button
      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 transition-colors"
    >
      <div className={`${action.color}`}>
        <action.icon className="h-5 w-5" />
      </div>
      <div className="text-left">
        <span className="font-medium text-gray-700 block">
          {action.label}
        </span>
        <span className="text-xs text-gray-500">
          {action.description}
        </span>
      </div>
    </button>
  );
};