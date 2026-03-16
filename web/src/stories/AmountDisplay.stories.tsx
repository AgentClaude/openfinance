import type { Meta, StoryObj } from '@storybook/react-vite';
import AmountDisplay from '../components/ui/AmountDisplay';

const meta: Meta<typeof AmountDisplay> = {
  title: 'UI/AmountDisplay',
  component: AmountDisplay,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof AmountDisplay>;

export const Positive: Story = { args: { amount: 1234.56 } };
export const Negative: Story = { args: { amount: -892.30 } };
export const Zero: Story = { args: { amount: 0 } };
export const WithSign: Story = { args: { amount: 500, showSign: true } };
export const NegativeWithSign: Story = { args: { amount: -500, showSign: true } };
export const NoColor: Story = { args: { amount: -250, colorize: false } };
export const Small: Story = { args: { amount: 42.99, size: 'sm' } };
export const Large: Story = { args: { amount: 15000, size: 'lg' } };
export const ExtraLarge: Story = { args: { amount: 250000, size: 'xl' } };
export const EuroCurrency: Story = { args: { amount: 1500.75, currency: 'EUR' } };
