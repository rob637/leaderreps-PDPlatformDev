#!/usr/bin/env python3
"""Batch add dark: Tailwind variants to JSX files for dark mode support."""

import re
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Files already manually fixed - skip these
ALREADY_FIXED = {
    'ThisWeeksActionsWidget.jsx',
    'ConditioningModal.jsx',
    'ConditioningWidget.jsx',
    'DevelopmentPlanWidget.jsx',
    'MyJourneyWidget.jsx',
    'CommitRepForm.jsx',
    'RepDetailModal.jsx',
    'RepTypePicker.jsx',
    'MySettingsWidget.jsx',
    'VoiceTextarea.jsx',
    'FacilitatorProfileModal.jsx',
    'DailyPlanWidget.jsx',
    'WinTheDayWidget.jsx',
    'GroundingRepWidget.jsx',
    'ConditioningHistoryWidget.jsx',
    'CoachingUpcomingSessionsWidget.jsx',
    'AppContent.jsx',
    'Dashboard.jsx',
    'DashboardHooks.jsx',
}

# (light_class, dark_class) - the script handles /opacity suffixes automatically
MAPPINGS = [
    # Text colors - slate
    ('text-slate-900', 'text-white'),
    ('text-slate-800', 'text-slate-200'),
    ('text-slate-700', 'text-slate-200'),
    ('text-slate-600', 'text-slate-300'),
    ('text-slate-500', 'text-slate-400'),
    # Text colors - gray
    ('text-gray-900', 'text-gray-100'),
    ('text-gray-800', 'text-gray-200'),
    ('text-gray-700', 'text-gray-200'),
    ('text-gray-600', 'text-gray-300'),
    ('text-gray-500', 'text-gray-400'),
    # Backgrounds - neutral
    ('bg-white', 'bg-slate-800'),
    ('bg-slate-50', 'bg-slate-800'),
    ('bg-slate-100', 'bg-slate-700'),
    ('bg-gray-50', 'bg-gray-800'),
    ('bg-gray-100', 'bg-gray-700'),
    # Borders - neutral
    ('border-slate-200', 'border-slate-700'),
    ('border-slate-300', 'border-slate-600'),
    ('border-gray-200', 'border-gray-700'),
    ('border-gray-300', 'border-gray-600'),
    # Accent backgrounds (-50 level)
    ('bg-blue-50', 'bg-blue-900/20'),
    ('bg-green-50', 'bg-green-900/20'),
    ('bg-red-50', 'bg-red-900/20'),
    ('bg-amber-50', 'bg-amber-900/20'),
    ('bg-orange-50', 'bg-orange-900/20'),
    ('bg-teal-50', 'bg-teal-900/20'),
    ('bg-emerald-50', 'bg-emerald-900/20'),
    ('bg-purple-50', 'bg-purple-900/20'),
    ('bg-yellow-50', 'bg-yellow-900/20'),
    ('bg-indigo-50', 'bg-indigo-900/20'),
    ('bg-cyan-50', 'bg-cyan-900/20'),
    ('bg-rose-50', 'bg-rose-900/20'),
    # Accent backgrounds (-100 level)
    ('bg-blue-100', 'bg-blue-900/30'),
    ('bg-green-100', 'bg-green-900/30'),
    ('bg-red-100', 'bg-red-900/30'),
    ('bg-amber-100', 'bg-amber-900/30'),
    ('bg-orange-100', 'bg-orange-900/30'),
    ('bg-teal-100', 'bg-teal-900/30'),
    ('bg-emerald-100', 'bg-emerald-900/30'),
    ('bg-purple-100', 'bg-purple-900/30'),
    ('bg-yellow-100', 'bg-yellow-900/30'),
    ('bg-indigo-100', 'bg-indigo-900/30'),
    ('bg-cyan-100', 'bg-cyan-900/30'),
    ('bg-rose-100', 'bg-rose-900/30'),
    # Accent borders
    ('border-blue-200', 'border-blue-800'),
    ('border-blue-100', 'border-blue-800'),
    ('border-green-200', 'border-green-800'),
    ('border-red-200', 'border-red-800'),
    ('border-amber-200', 'border-amber-800'),
    ('border-emerald-200', 'border-emerald-800'),
    ('border-teal-200', 'border-teal-800'),
    ('border-purple-200', 'border-purple-800'),
    ('border-orange-200', 'border-orange-800'),
    ('border-yellow-200', 'border-yellow-800'),
    ('border-indigo-200', 'border-indigo-800'),
    # Dividers
    ('divide-slate-200', 'divide-slate-700'),
    ('divide-gray-200', 'divide-gray-700'),
    ('divide-slate-100', 'divide-slate-700'),
    ('divide-gray-100', 'divide-gray-700'),
    # Placeholder
    ('placeholder-slate-400', 'placeholder-slate-500'),
    ('placeholder-gray-400', 'placeholder-gray-500'),
]


def add_dark_variants(content, light_base, dark_base):
    """Add dark:{dark_base} after each {light_base} occurrence that doesn't already have a dark variant."""
    # Match the light class with optional /opacity suffix
    # Negative lookbehind: not preceded by alphanumeric, dash, or colon (excludes hover:, focus:, etc.)
    # Negative lookahead: not followed by alphanumeric or /
    pattern = re.compile(
        rf'(?<![a-zA-Z0-9:])({re.escape(light_base)}(?:/\d+)?)(?![a-zA-Z0-9/])'
    )

    # Determine the property type for detecting existing dark variants
    prop_type = light_base.split('-')[0]  # 'text', 'bg', 'border', 'divide', 'placeholder'

    parts = []
    last_end = 0

    for m in pattern.finditer(content):
        matched_class = m.group(1)
        end = m.end()

        # Check if a dark: variant for this property type already follows
        after = content[end:end + 50]
        if re.search(rf'\s+dark:{prop_type}[-\s"\'\)`}}]', after[:45]):
            # Already has a dark variant for this property type
            continue

        # Extract opacity from matched class (e.g., /50 from bg-slate-50/50)
        opacity = ''
        base_light = light_base
        if '/' in matched_class:
            idx = matched_class.index('/')
            opacity = matched_class[idx:]

        # Build dark class preserving opacity
        dark_class = f'dark:{dark_base}{opacity}'

        parts.append(content[last_end:end])
        parts.append(f' {dark_class}')
        last_end = end

    parts.append(content[last_end:])
    return ''.join(parts)


def process_file(filepath):
    """Process a single JSX file, adding dark: variants."""
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    for light_base, dark_base in MAPPINGS:
        content = add_dark_variants(content, light_base, dark_base)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        # Count changes
        changes = 0
        for light_base, _ in MAPPINGS:
            changes += content.count(f'dark:') - original.count(f'dark:')
        return True
    return False


def main():
    search_dirs = [
        os.path.join(BASE_DIR, 'src/components/widgets'),
        os.path.join(BASE_DIR, 'src/components/coaching'),
        os.path.join(BASE_DIR, 'src/components/conditioning'),
        os.path.join(BASE_DIR, 'src/components/rep'),
        os.path.join(BASE_DIR, 'src/components/arena'),
        os.path.join(BASE_DIR, 'src/components/layout'),
        os.path.join(BASE_DIR, 'src/components/shared'),
        os.path.join(BASE_DIR, 'src/components/common'),
        os.path.join(BASE_DIR, 'src/components/modals'),
        os.path.join(BASE_DIR, 'src/components/screens'),
        os.path.join(BASE_DIR, 'src/components/screens/dashboard'),
        os.path.join(BASE_DIR, 'src/ui'),
    ]

    modified = []
    skipped = []

    for d in search_dirs:
        if not os.path.isdir(d):
            continue
        for fname in sorted(os.listdir(d)):
            if not fname.endswith('.jsx'):
                continue
            if fname in ALREADY_FIXED:
                skipped.append(fname)
                continue
            filepath = os.path.join(d, fname)
            if process_file(filepath):
                relpath = os.path.relpath(filepath, BASE_DIR)
                modified.append(relpath)

    print(f"\n=== Dark Mode Batch Fix Results ===")
    print(f"Skipped (already fixed): {len(skipped)}")
    print(f"Modified: {len(modified)} files")
    print()
    for f in sorted(modified):
        print(f"  ✓ {f}")


if __name__ == '__main__':
    main()
