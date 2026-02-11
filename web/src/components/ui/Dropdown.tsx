import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className,
}) => {
  const alignClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
  };

  return (
    <Menu as="div" className={clsx('relative inline-block text-left', className)}>
      <Menu.Button as="div">
        {trigger}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={clsx(
            'absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
            alignClasses[align]
          )}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <Menu.Item key={index} disabled={item.disabled}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={clsx(
                      'flex items-center px-4 py-2 text-sm w-full text-left',
                      {
                        'bg-gray-100 text-gray-900': active && !item.disabled,
                        'text-gray-700': !active && !item.disabled,
                        'text-gray-400 cursor-not-allowed': item.disabled,
                        'text-red-700': item.variant === 'danger' && !item.disabled,
                        'bg-red-50': item.variant === 'danger' && active && !item.disabled,
                      }
                    )}
                  >
                    {item.icon && (
                      <div className="mr-3 h-4 w-4">
                        {item.icon}
                      </div>
                    )}
                    {item.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default Dropdown;