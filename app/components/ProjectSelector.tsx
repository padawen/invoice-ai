'use client';
import React, { useState } from 'react';

interface Props {
  projects: string[];
  onSelect: (project: string) => void;
}

const ProjectSelector = ({ projects, onSelect }: Props) => {
  const [newProject, setNewProject] = useState('');

  return (
    <div className="space-y-2">
      <label className="block font-semibold">Select or create project:</label>
      <select
        className="w-full border p-2 rounded"
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">-- Select Project --</option>
        {projects.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          className="border p-2 rounded w-full"
          placeholder="New project name"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => onSelect(newProject)}
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default ProjectSelector;
