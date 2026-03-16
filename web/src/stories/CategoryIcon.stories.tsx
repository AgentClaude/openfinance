import type { Meta, StoryObj } from '@storybook/react-vite';
import CategoryIcon from '../components/ui/CategoryIcon';

const meta: Meta<typeof CategoryIcon> = {
  title: 'UI/CategoryIcon',
  component: CategoryIcon,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof CategoryIcon>;

export const Emoji: Story = { args: { icon: '🛒' } };
export const HouseEmoji: Story = { args: { icon: '🏠' } };
export const CarEmoji: Story = { args: { icon: '🚗' } };
export const FontAwesome: Story = { args: { icon: 'fa-shopping-cart' } };
export const WithClassName: Story = { args: { icon: '💰', className: 'text-2xl' } };
export const Empty: Story = { args: { icon: '' } };
