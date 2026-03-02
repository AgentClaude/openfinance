# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Household-scoped policies' do
  let(:household) { create(:household) }
  let(:user) { create(:user, household: household) }
  let(:other_household) { create(:household) }
  let(:other_user) { create(:user, household: other_household) }

  shared_examples 'household scoped policy' do |policy_class, factory_name, extra_attrs = {}|
    let(:own_record) { create(factory_name, household: household, **extra_attrs) }
    let(:other_record) { create(factory_name, household: other_household, **extra_attrs) }

    describe 'Scope' do
      subject(:resolved_scope) { policy_class::Scope.new(user, own_record.class).resolve }

      it 'includes own household records' do
        expect(resolved_scope).to include(own_record)
      end

      it 'excludes other household records' do
        expect(resolved_scope).not_to include(other_record)
      end
    end
  end

  it_behaves_like 'household scoped policy', CategoryPolicy, :category
  it_behaves_like 'household scoped policy', GoalPolicy, :goal
  it_behaves_like 'household scoped policy', RecurringItemPolicy, :recurring_item
  it_behaves_like 'household scoped policy', TagPolicy, :tag
  it_behaves_like 'household scoped policy', CategorizationRulePolicy, :categorization_rule
end
