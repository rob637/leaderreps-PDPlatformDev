import React from 'react';

const SkillDetailsEditor = ({ details, onChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Skill Definition</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Competency Domain / Category
        </label>
        <input
          type="text"
          name="domain"
          value={details.domain || ''}
          onChange={handleChange}
          placeholder="e.g. Communication, Leadership, Strategy"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          The high-level category this skill belongs to.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Key Behaviors
        </label>
        <textarea
          name="behaviors"
          value={details.behaviors || ''}
          onChange={handleChange}
          rows={4}
          placeholder="- Listens actively&#10;- Asks open-ended questions"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          List the observable behaviors associated with this skill.
        </p>
      </div>
    </div>
  );
};

export default SkillDetailsEditor;
