/**
 * @typedef {Object} ContentItem
 * @property {string} contentItemId - The ID of the content item in the Content Library
 * @property {string} contentItemType - Type of content (workout, read_and_rep, video, module, etc.)
 * @property {string} contentItemLabel - Display label for the content
 * @property {boolean} isRequiredContent - Whether this content is required for completion
 */

/**
 * @typedef {Object} CommunityItem
 * @property {string} communityItemId - The ID of the community item
 * @property {string} communityItemType - Type of community item (leader_circle, community_event, forum_thread, etc.)
 * @property {string} communityItemLabel - Display label
 * @property {string} [recommendedWeekDay] - Suggested day of the week (e.g., "Thursday")
 * @property {boolean} [isRequiredCommunityItem] - Whether this item is required
 */

/**
 * @typedef {Object} CoachingItem
 * @property {string} coachingItemId - The ID of the coaching item
 * @property {string} coachingItemType - Type of coaching (open_gym, 1:1, group_coaching, office_hours, etc.)
 * @property {string} coachingItemLabel - Display label
 * @property {boolean} [isOptionalCoachingItem] - Whether this item is optional
 */

/**
 * @typedef {Object} ReminderTemplate
 * @property {string} reminderTemplateId - Unique ID for the reminder template
 * @property {string} reminderFrequency - Frequency (e.g., "daily", "weekly")
 * @property {string} reminderChannel - Channel (e.g., "email", "push", "in_app")
 * @property {string} [reminderMessageKey] - Key for localization or message lookup
 */

/**
 * @typedef {Object} WeekBlock
 * @property {string} weekBlockId - Unique ID for the week block
 * @property {number} weekNumber - Sequence index (1-26)
 * @property {string} title - User-facing title
 * @property {string} focus - Main skill/theme focus
 * @property {string} phase - High-level program segment (Foundation, Spaced Learning, etc.)
 * @property {string} [description] - Short summary
 * @property {number} startOffsetWeeks - Weeks after program start to unlock
 * @property {number} [estimatedTimeMinutes] - Rough total time estimate
 * @property {ContentItem[]} content - Array of content items
 * @property {CommunityItem[]} community - Array of community items
 * @property {CoachingItem[]} coaching - Array of coaching items
 * @property {string[]} skills - Array of skill tags
 * @property {string[]} pillars - Array of pillars (Lead Self, Lead Work, Lead People)
 * @property {string} difficultyLevel - Difficulty (foundation, intermediate, advanced)
 * @property {string[]} [prerequisiteWeekBlockIds] - IDs of prerequisite weeks
 * @property {string[]} [prerequisiteSkills] - Prerequisite skills
 * @property {ReminderTemplate[]} [reminderTemplates] - Reminder hooks
 */

/**
 * @typedef {Object} UserWeekStatus
 * @property {string} userId - The user's ID
 * @property {string} weekBlockId - The week block ID
 * @property {boolean} isUnlocked - Has this week opened yet?
 * @property {boolean} isActive - Is this the current week?
 * @property {string} completionStatus - "not_started" | "in_progress" | "completed"
 * @property {number} completedItemsCount - How many items completed
 * @property {number} requiredItemsCount - Total required items
 * @property {string} [reflectionResponse] - User's reflection
 * @property {string} [startedAt] - ISO date string
 * @property {string} [completedAt] - ISO date string
 */

export const WeekBlockSchema = {
  // This object can be used for runtime validation if needed
  requiredFields: ['weekBlockId', 'weekNumber', 'title', 'focus', 'phase', 'startOffsetWeeks'],
  collections: ['content', 'community', 'coaching', 'skills', 'pillars', 'reminderTemplates']
};
