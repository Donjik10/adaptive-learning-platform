import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TopicTree as TopicTreeType } from "store/slices/topicsSlice";

const TopicNode: React.FC<{
  topic: TopicTreeType;
  level: number;
}> = ({ topic, level }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const hasChildren = topic.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors
          ${level === 0 ? "bg-indigo-50 hover:bg-indigo-100" : "hover:bg-gray-100"}
        `}
        style={{ marginLeft: level * 20 }}
      >
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
            className="text-gray-400 hover:text-gray-600 text-xs w-4"
          >
            {open ? "▼" : "▶"}
          </button>
        )}
        {!hasChildren && <span className="w-4" />}
        <span
          className="flex-1 text-sm font-medium text-gray-700 cursor-pointer"
          onClick={() => navigate(`/review/${topic.id}`)}
        >
          {topic.name}
        </span>
        {topic.description && (
          <span className="text-xs text-gray-400 truncate max-w-[200px]">
            {topic.description}
          </span>
        )}
      </div>
      {open && hasChildren && (
        <div className="mt-1">
          {topic.children.map((child) => (
            <TopicNode key={child.id} topic={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const TopicTree: React.FC<{ tree: TopicTreeType[] }> = ({ tree }) => {
  return (
    <div className="space-y-1">
      {tree.map((topic) => (
        <TopicNode key={topic.id} topic={topic} level={0} />
      ))}
    </div>
  );
};

export default TopicTree;
