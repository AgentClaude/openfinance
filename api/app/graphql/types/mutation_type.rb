module Types
  class MutationType < Types::BaseObject
    field :login, mutation: Mutations::LoginMutation
    field :register, mutation: Mutations::RegisterMutation
    field :create_manual_account, mutation: Mutations::CreateManualAccount
    field :create_transaction, mutation: Mutations::CreateTransaction
    field :update_transaction, mutation: Mutations::UpdateTransaction
    field :bulk_categorize, mutation: Mutations::BulkCategorize
    field :create_category, mutation: Mutations::CreateCategory
    field :update_category, mutation: Mutations::UpdateCategory
    field :delete_category, mutation: Mutations::DeleteCategory
    field :toggle_category_hidden, mutation: Mutations::ToggleCategoryHidden
    field :seed_plaid_category_mappings, mutation: Mutations::SeedPlaidCategoryMappings
    field :update_plaid_category_mapping, mutation: Mutations::UpdatePlaidCategoryMapping
    field :reset_plaid_category_mappings, mutation: Mutations::ResetPlaidCategoryMappings
    field :create_tag, mutation: Mutations::CreateTag
    field :update_budget_item, mutation: Mutations::UpdateBudgetItem
    field :delete_budget_item, mutation: Mutations::DeleteBudgetItem
    field :copy_budget_from_month, mutation: Mutations::CopyBudgetFromMonth
    field :fill_budget_from_averages, mutation: Mutations::FillBudgetFromAverages
    field :update_budget_settings, mutation: Mutations::UpdateBudgetSettings
    field :create_plaid_link_token, mutation: Mutations::CreatePlaidLinkToken
    field :exchange_plaid_token, mutation: Mutations::ExchangePlaidToken
    field :create_categorization_rule, mutation: Mutations::CreateCategorizationRule
    field :update_categorization_rule, mutation: Mutations::UpdateCategorizationRule
    field :delete_categorization_rule, mutation: Mutations::DeleteCategorizationRule
    field :apply_categorization_rules, mutation: Mutations::ApplyCategorizationRules
    field :detect_recurring_transactions, mutation: Mutations::DetectRecurringTransactions
    field :create_recurring_item, mutation: Mutations::CreateRecurringItem
    field :update_recurring_item, mutation: Mutations::UpdateRecurringItem
    field :delete_recurring_item, mutation: Mutations::DeleteRecurringItem
    field :mark_recurring_item_paid, mutation: Mutations::MarkRecurringItemPaid
    field :create_goal, mutation: Mutations::CreateGoal
    field :update_goal, mutation: Mutations::UpdateGoal
    field :delete_goal, mutation: Mutations::DeleteGoal
    field :create_investment_transaction, mutation: Mutations::CreateInvestmentTransaction
    field :delete_investment_transaction, mutation: Mutations::DeleteInvestmentTransaction
    field :update_profile, mutation: Mutations::UpdateProfile
    field :change_password, mutation: Mutations::ChangePassword
    field :invite_to_household, mutation: Mutations::InviteToHousehold
    field :accept_invitation, mutation: Mutations::AcceptInvitation
    field :cancel_invitation, mutation: Mutations::CancelInvitation
    field :remove_household_member, mutation: Mutations::RemoveHouseholdMember
    field :import_csv, mutation: Mutations::ImportCsv
    field :import_ofx, mutation: Mutations::ImportOfx
    field :preview_ofx, mutation: Mutations::PreviewOfx
    field :bulk_transaction_action, mutation: Mutations::BulkTransactionAction
    field :split_transaction, mutation: Mutations::SplitTransaction
    field :detect_transfers, mutation: Mutations::DetectTransfers
    field :link_transfer, mutation: Mutations::LinkTransfer
    field :update_household, mutation: Mutations::UpdateHousehold
    field :update_notification_preference, mutation: Mutations::UpdateNotificationPreference
    field :mark_notification_read, mutation: Mutations::MarkNotificationRead
    field :mark_all_notifications_read, mutation: Mutations::MarkAllNotificationsRead
    field :trigger_notification_check, mutation: Mutations::TriggerNotificationCheck
    field :update_tag, mutation: Mutations::UpdateTag
    field :delete_tag, mutation: Mutations::DeleteTag
    field :share_account, mutation: Mutations::ShareAccount
    field :adjust_balance, mutation: Mutations::AdjustBalance
    field :upload_receipt, mutation: Mutations::UploadReceipt
    field :delete_receipt, mutation: Mutations::DeleteReceipt
    field :upload_statement, mutation: Mutations::UploadStatement
    field :update_member_role, mutation: Mutations::UpdateMemberRole
    field :redeem_referral, mutation: Mutations::RedeemReferral
    field :export_data, mutation: Mutations::ExportData
    field :export_transactions_csv, mutation: Mutations::ExportTransactionsCsv
    field :delete_account, mutation: Mutations::DeleteAccount

    # Plaid connection management
    field :disconnect_connection, mutation: Mutations::DisconnectConnection
    field :retry_connection_sync, mutation: Mutations::RetryConnectionSync
    field :create_update_link_token, mutation: Mutations::CreateUpdateLinkToken
    field :send_test_digest, mutation: Mutations::SendTestDigest

    # Merchant mapping mutations
    field :create_merchant_mapping, mutation: Mutations::CreateMerchantMapping
    field :update_merchant_mapping, mutation: Mutations::UpdateMerchantMapping
    field :delete_merchant_mapping, mutation: Mutations::DeleteMerchantMapping
    field :apply_merchant_mappings, mutation: Mutations::ApplyMerchantMappings
    field :suggest_merchant_mappings, mutation: Mutations::SuggestMerchantMappings

    # Balance history
    field :backfill_balance_history, mutation: Mutations::BackfillBalanceHistory

    # API keys & share tokens
    field :create_api_key, mutation: Mutations::CreateApiKey
    field :revoke_api_key, mutation: Mutations::RevokeApiKey
    field :create_share_token, mutation: Mutations::CreateShareToken
    field :revoke_share_token, mutation: Mutations::RevokeShareToken

    # Subscription mutations
    field :create_subscription, mutation: Mutations::CreateSubscription
    field :change_plan, mutation: Mutations::ChangePlan
    field :cancel_subscription, mutation: Mutations::CancelSubscription
    field :reactivate_subscription, mutation: Mutations::ReactivateSubscription
    field :track_referral_click, mutation: Mutations::TrackReferralClick
  end
end
