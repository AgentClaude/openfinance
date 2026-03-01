import React from 'react';
import Modal from '@/components/ui/Modal';

interface Shortcut {
  keys: string;
  label: string;
  group: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

const Kbd: React.FC<{ children: string }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-mono font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
    {children}
  </kbd>
);

const KeyCombo: React.FC<{ keys: string }> = ({ keys }) => {
  const parts = keys.split(' ');
  return (
    <span className="flex items-center gap-1">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <Kbd>{part.toUpperCase()}</Kbd>
          {i < parts.length - 1 && <span className="text-gray-400 text-xs">then</span>}
        </React.Fragment>
      ))}
    </span>
  );
};

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose, shortcuts }) => {
  // Group shortcuts
  const groups: Record<string, Shortcut[]> = {};
  shortcuts.forEach((s) => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });

  // Add ⌘K manually since it's handled by GlobalSearch
  if (!groups['General']) groups['General'] = [];
  const hasSearch = groups['General'].some((s) => s.keys === '⌘K');
  if (!hasSearch) {
    groups['General'].unshift({ keys: '⌘K', label: 'Open search', group: 'General' });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              {group}
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.keys}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  {item.keys === '⌘K' ? (
                    <span className="flex items-center gap-1">
                      <Kbd>⌘</Kbd>
                      <Kbd>K</Kbd>
                    </span>
                  ) : (
                    <KeyCombo keys={item.keys} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsModal;
