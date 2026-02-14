# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_02_14_020000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"
  enable_extension "uuid-ossp"

  create_table "account_balance_histories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "account_id", null: false
    t.date "date", null: false
    t.bigint "current_balance_cents", null: false
    t.bigint "available_balance_cents"
    t.bigint "credit_limit_cents"
    t.string "currency", default: "USD", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "date"], name: "index_account_balance_histories_on_account_id_and_date", unique: true
    t.index ["account_id"], name: "index_account_balance_histories_on_account_id"
    t.index ["date"], name: "index_account_balance_histories_on_date"
  end

  create_table "account_connections", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "household_id", null: false
    t.uuid "institution_id"
    t.uuid "created_by_id", null: false
    t.string "provider", default: "plaid", null: false
    t.string "status", default: "pending", null: false
    t.string "provider_connection_id"
    t.text "provider_access_token"
    t.string "error_code"
    t.text "error_message"
    t.datetime "last_synced_at"
    t.datetime "consent_expires_at"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "sync_cursor"
    t.index ["consent_expires_at"], name: "index_account_connections_on_consent_expires_at"
    t.index ["created_by_id"], name: "index_account_connections_on_created_by_id"
    t.index ["household_id"], name: "index_account_connections_on_household_id"
    t.index ["institution_id"], name: "index_account_connections_on_institution_id"
    t.index ["last_synced_at"], name: "index_account_connections_on_last_synced_at"
    t.index ["metadata"], name: "index_account_connections_on_metadata", using: :gin
    t.index ["provider"], name: "index_account_connections_on_provider"
    t.index ["provider_connection_id"], name: "index_account_connections_on_provider_connection_id"
    t.index ["status"], name: "index_account_connections_on_status"
  end

  create_table "accounts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "household_id", null: false
    t.uuid "connection_id"
    t.string "name", null: false
    t.string "account_type", null: false
    t.string "account_subtype"
    t.string "official_name"
    t.string "mask"
    t.string "plaid_account_id"
    t.bigint "current_balance_cents", default: 0
    t.bigint "available_balance_cents"
    t.bigint "credit_limit_cents"
    t.string "currency", default: "USD", null: false
    t.boolean "is_manual", default: false, null: false
    t.boolean "is_hidden", default: false, null: false
    t.integer "display_order", default: 0
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_subtype"], name: "index_accounts_on_account_subtype"
    t.index ["account_type"], name: "index_accounts_on_account_type"
    t.index ["connection_id"], name: "index_accounts_on_connection_id"
    t.index ["display_order"], name: "index_accounts_on_display_order"
    t.index ["household_id", "display_order"], name: "index_accounts_on_household_id_and_display_order"
    t.index ["household_id"], name: "index_accounts_on_household_id"
    t.index ["is_hidden"], name: "index_accounts_on_is_hidden"
    t.index ["is_manual"], name: "index_accounts_on_is_manual"
    t.index ["metadata"], name: "index_accounts_on_metadata", using: :gin
    t.index ["plaid_account_id"], name: "index_accounts_on_plaid_account_id", unique: true
  end

  create_table "api_keys", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.string "key", null: false
    t.string "name", null: false
    t.datetime "last_used_at"
    t.datetime "revoked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_api_keys_on_key", unique: true
    t.index ["user_id"], name: "index_api_keys_on_user_id"
  end

  create_table "budget_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "budget_id", null: false
    t.uuid "category_id", null: false
    t.date "month", null: false
    t.bigint "amount_cents", default: 0, null: false
    t.string "currency", default: "USD", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "rollover_cents", default: 0, null: false
    t.index ["budget_id", "category_id", "month"], name: "index_budget_items_unique", unique: true
    t.index ["budget_id"], name: "index_budget_items_on_budget_id"
    t.index ["category_id"], name: "index_budget_items_on_category_id"
    t.index ["month"], name: "index_budget_items_on_month"
  end

  create_table "budgets", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "household_id", null: false
    t.string "name", null: false
    t.text "description"
    t.date "start_date", null: false
    t.date "end_date"
    t.boolean "is_active", default: true, null: false
    t.string "period_type", default: "monthly", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["end_date"], name: "index_budgets_on_end_date"
    t.index ["household_id", "name"], name: "index_budgets_on_household_id_and_name", unique: true
    t.index ["household_id"], name: "index_budgets_on_household_id"
    t.index ["is_active"], name: "index_budgets_on_is_active"
    t.index ["period_type"], name: "index_budgets_on_period_type"
    t.index ["start_date"], name: "index_budgets_on_start_date"
  end

  create_table "categories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "household_id", null: false
    t.uuid "parent_id"
    t.string "name", null: false
    t.string "group_name"
    t.text "description"
    t.string "color", default: "#6B7280"
    t.string "color_hex", default: "#6B7280"
    t.string "icon"
    t.boolean "is_income", default: false, null: false
    t.boolean "is_system", default: false, null: false
    t.boolean "is_hidden", default: false, null: false
    t.boolean "is_active", default: true, null: false
    t.integer "display_order", default: 0
    t.jsonb "plaid_categories", default: []
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["display_order"], name: "index_categories_on_display_order"
    t.index ["household_id", "display_order"], name: "index_categories_on_household_id_and_display_order"
    t.index ["household_id", "name"], name: "index_categories_on_household_id_and_name", unique: true
    t.index ["household_id"], name: "index_categories_on_household_id"
    t.index ["is_active"], name: "index_categories_on_is_active"
    t.index ["is_income"], name: "index_categories_on_is_income"
    t.index ["is_system"], name: "index_categories_on_is_system"
    t.index ["metadata"], name: "index_categories_on_metadata", using: :gin
    t.index ["name"], name: "index_categories_on_name"
    t.index ["parent_id"], name: "index_categories_on_parent_id"
    t.index ["plaid_categories"], name: "index_categories_on_plaid_categories", using: :gin
  end

  create_table "categorization_rules", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "household_id", null: false
    t.uuid "category_id", null: false
    t.string "name", null: false
    t.string "rule_type", null: false
    t.jsonb "conditions", null: false
    t.integer "priority", default: 0
    t.boolean "is_active", default: true, null: false
    t.integer "matches_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "match_field", default: "merchant_name"
    t.string "match_type", default: "contains"
    t.string "match_value"
    t.string "rename_to"
    t.index ["category_id"], name: "index_categorization_rules_on_category_id"
    t.index ["conditions"], name: "index_categorization_rules_on_conditions", using: :gin
    t.index ["household_id", "priority"], name: "index_categorization_rules_on_household_id_and_priority"
    t.index ["household_id"], name: "index_categorization_rules_on_household_id"
    t.index ["is_active"], name: "index_categorization_rules_on_is_active"
    t.index ["priority"], name: "index_categorization_rules_on_priority"
    t.index ["rule_type"], name: "index_categorization_rules_on_rule_type"
  end

  create_table "csv_imports", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "household_id", null: false
    t.uuid "account_id", null: false
    t.string "filename", null: false
    t.string "status", default: "pending", null: false
    t.integer "total_rows", default: 0
    t.integer "imported_rows", default: 0
    t.integer "skipped_rows", default: 0
    t.jsonb "column_mapping", default: {}
    t.jsonb "errors_log", default: []
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_csv_imports_on_account_id"
    t.index ["household_id"], name: "index_csv_imports_on_household_id"
  end

  create_table "goal_accounts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "goal_id", null: false
    t.uuid "account_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_goal_accounts_on_account_id"
    t.index ["goal_id", "account_id"], name: "index_goal_accounts_on_goal_id_and_account_id", unique: true
  end

  create_table "goals", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "household_id", null: false
    t.uuid "target_account_id"
    t.string "name", null: false
    t.text "description"
    t.string "goal_type", null: false
    t.bigint "target_amount_cents", null: false
    t.bigint "current_amount_cents", default: 0
    t.string "currency", default: "USD", null: false
    t.date "target_date"
    t.date "start_date", default: -> { "CURRENT_DATE" }, null: false
    t.boolean "is_active", default: true, null: false
    t.boolean "is_achieved", default: false, null: false
    t.datetime "achieved_at"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "icon", default: "🎯"
    t.string "color", default: "#4ECDC4"
    t.index ["achieved_at"], name: "index_goals_on_achieved_at"
    t.index ["goal_type"], name: "index_goals_on_goal_type"
    t.index ["household_id"], name: "index_goals_on_household_id"
    t.index ["is_achieved"], name: "index_goals_on_is_achieved"
    t.index ["is_active"], name: "index_goals_on_is_active"
    t.index ["metadata"], name: "index_goals_on_metadata", using: :gin
    t.index ["start_date"], name: "index_goals_on_start_date"
    t.index ["target_account_id"], name: "index_goals_on_target_account_id"
    t.index ["target_date"], name: "index_goals_on_target_date"
  end

  create_table "holdings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "account_id", null: false
    t.uuid "security_id", null: false
    t.decimal "quantity", precision: 20, scale: 8, null: false
    t.bigint "current_price_cents"
    t.bigint "market_value_cents"
    t.bigint "cost_basis_cents"
    t.string "currency", default: "USD"
    t.date "as_of_date", null: false
    t.string "plaid_holding_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "security_id", "as_of_date"], name: "index_holdings_unique", unique: true
    t.index ["account_id"], name: "index_holdings_on_account_id"
    t.index ["as_of_date"], name: "index_holdings_on_as_of_date"
    t.index ["plaid_holding_id"], name: "index_holdings_on_plaid_holding_id", unique: true
    t.index ["security_id"], name: "index_holdings_on_security_id"
  end

  create_table "household_memberships", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "household_id", null: false
    t.string "role", default: "member", null: false
    t.boolean "is_active", default: true, null: false
    t.datetime "joined_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "left_at"
    t.uuid "invited_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["household_id"], name: "index_household_memberships_on_household_id"
    t.index ["invited_by_id"], name: "index_household_memberships_on_invited_by_id"
    t.index ["is_active"], name: "index_household_memberships_on_is_active"
    t.index ["role"], name: "index_household_memberships_on_role"
    t.index ["user_id", "household_id"], name: "index_household_memberships_on_user_and_household", unique: true
    t.index ["user_id"], name: "index_household_memberships_on_user_id"
  end

  create_table "households", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "currency", default: "USD", null: false
    t.string "timezone", default: "America/New_York"
    t.jsonb "preferences", default: {}
    t.jsonb "metadata", default: {}
    t.boolean "is_active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["is_active"], name: "index_households_on_is_active"
    t.index ["metadata"], name: "index_households_on_metadata", using: :gin
    t.index ["name"], name: "index_households_on_name"
    t.index ["preferences"], name: "index_households_on_preferences", using: :gin
  end

  create_table "institutions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "plaid_institution_id"
    t.string "website_url"
    t.string "logo_url"
    t.string "primary_color"
    t.jsonb "supported_products", default: []
    t.jsonb "country_codes", default: []
    t.boolean "oauth_support", default: false
    t.boolean "is_active", default: true, null: false
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["country_codes"], name: "index_institutions_on_country_codes", using: :gin
    t.index ["is_active"], name: "index_institutions_on_is_active"
    t.index ["metadata"], name: "index_institutions_on_metadata", using: :gin
    t.index ["name"], name: "index_institutions_on_name"
    t.index ["plaid_institution_id"], name: "index_institutions_on_plaid_institution_id", unique: true
    t.index ["supported_products"], name: "index_institutions_on_supported_products", using: :gin
  end

  create_table "invitations", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "email", null: false
    t.string "role", default: "member", null: false
    t.string "status", default: "pending", null: false
    t.string "token", null: false
    t.uuid "household_id", null: false
    t.uuid "invited_by_id", null: false
    t.datetime "accepted_at"
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email", "household_id"], name: "index_invitations_on_email_and_household_id", unique: true, where: "((status)::text = 'pending'::text)"
    t.index ["household_id"], name: "index_invitations_on_household_id"
    t.index ["invited_by_id"], name: "index_invitations_on_invited_by_id"
    t.index ["token"], name: "index_invitations_on_token", unique: true
  end

  create_table "merchant_mappings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "household_id", null: false
    t.string "raw_pattern", null: false
    t.string "clean_name", null: false
    t.string "match_type", default: "contains", null: false
    t.integer "applied_count", default: 0, null: false
    t.boolean "is_active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["household_id", "raw_pattern"], name: "index_merchant_mappings_on_household_id_and_raw_pattern", unique: true
    t.index ["household_id"], name: "index_merchant_mappings_on_household_id"
  end

  create_table "notification_rules", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "household_id", null: false
    t.string "name", null: false
    t.string "rule_type", null: false
    t.boolean "is_active", default: true, null: false
    t.jsonb "conditions", default: {}
    t.jsonb "settings", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["conditions"], name: "index_notification_rules_on_conditions", using: :gin
    t.index ["household_id"], name: "index_notification_rules_on_household_id"
    t.index ["is_active"], name: "index_notification_rules_on_is_active"
    t.index ["rule_type"], name: "index_notification_rules_on_rule_type"
    t.index ["settings"], name: "index_notification_rules_on_settings", using: :gin
    t.index ["user_id"], name: "index_notification_rules_on_user_id"
  end

  create_table "notifications", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "household_id", null: false
    t.string "title", null: false
    t.text "body"
    t.string "notification_type", null: false
    t.string "priority", default: "normal", null: false
    t.boolean "is_read", default: false, null: false
    t.datetime "read_at"
    t.datetime "scheduled_for"
    t.jsonb "data", default: {}
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_notifications_on_created_at"
    t.index ["data"], name: "index_notifications_on_data", using: :gin
    t.index ["household_id"], name: "index_notifications_on_household_id"
    t.index ["is_read"], name: "index_notifications_on_is_read"
    t.index ["metadata"], name: "index_notifications_on_metadata", using: :gin
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
    t.index ["priority"], name: "index_notifications_on_priority"
    t.index ["read_at"], name: "index_notifications_on_read_at"
    t.index ["scheduled_for"], name: "index_notifications_on_scheduled_for"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "recurring_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "household_id", null: false
    t.uuid "category_id"
    t.uuid "account_id"
    t.string "name", null: false
    t.text "description"
    t.string "item_type", null: false
    t.bigint "amount_cents", null: false
    t.string "currency", default: "USD"
    t.string "frequency", null: false
    t.integer "frequency_interval", default: 1
    t.date "start_date", null: false
    t.date "end_date"
    t.date "next_occurrence"
    t.boolean "is_active", default: true, null: false
    t.boolean "auto_create_transactions", default: false
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "merchant_name"
    t.boolean "is_income", default: false
    t.boolean "is_auto_detected", default: false
    t.date "last_occurrence"
    t.integer "occurrence_count", default: 0
    t.integer "average_amount_cents"
    t.integer "amount_variance_cents", default: 0
    t.index ["account_id"], name: "index_recurring_items_on_account_id"
    t.index ["category_id"], name: "index_recurring_items_on_category_id"
    t.index ["end_date"], name: "index_recurring_items_on_end_date"
    t.index ["frequency"], name: "index_recurring_items_on_frequency"
    t.index ["household_id"], name: "index_recurring_items_on_household_id"
    t.index ["is_active"], name: "index_recurring_items_on_is_active"
    t.index ["item_type"], name: "index_recurring_items_on_item_type"
    t.index ["metadata"], name: "index_recurring_items_on_metadata", using: :gin
    t.index ["next_occurrence"], name: "index_recurring_items_on_next_occurrence"
    t.index ["start_date"], name: "index_recurring_items_on_start_date"
  end

  create_table "securities", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "symbol", null: false
    t.string "name", null: false
    t.string "security_type"
    t.string "exchange"
    t.string "currency", default: "USD"
    t.string "plaid_security_id"
    t.string "cusip"
    t.string "isin"
    t.string "sedol"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cusip"], name: "index_securities_on_cusip"
    t.index ["isin"], name: "index_securities_on_isin"
    t.index ["metadata"], name: "index_securities_on_metadata", using: :gin
    t.index ["name"], name: "index_securities_on_name"
    t.index ["plaid_security_id"], name: "index_securities_on_plaid_security_id", unique: true
    t.index ["security_type"], name: "index_securities_on_security_type"
    t.index ["symbol"], name: "index_securities_on_symbol"
  end

  create_table "share_tokens", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.string "token", null: false
    t.string "widget_type", null: false
    t.jsonb "config", default: {}
    t.datetime "expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token"], name: "index_share_tokens_on_token", unique: true
    t.index ["user_id"], name: "index_share_tokens_on_user_id"
    t.index ["widget_type"], name: "index_share_tokens_on_widget_type"
  end

  create_table "shared_accounts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "account_id", null: false
    t.uuid "shared_with_user_id", null: false
    t.uuid "shared_by_user_id", null: false
    t.string "permission_level", default: "view", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "shared_with_user_id"], name: "index_shared_accounts_on_account_id_and_shared_with_user_id", unique: true
    t.index ["shared_by_user_id"], name: "index_shared_accounts_on_shared_by_user_id"
    t.index ["shared_with_user_id"], name: "index_shared_accounts_on_shared_with_user_id"
  end

  create_table "sync_logs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "account_connection_id", null: false
    t.string "sync_type", null: false
    t.string "status", null: false
    t.datetime "started_at", null: false
    t.datetime "completed_at"
    t.integer "transactions_added", default: 0
    t.integer "transactions_updated", default: 0
    t.integer "accounts_updated", default: 0
    t.text "error_message"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_connection_id"], name: "index_sync_logs_on_account_connection_id"
    t.index ["completed_at"], name: "index_sync_logs_on_completed_at"
    t.index ["metadata"], name: "index_sync_logs_on_metadata", using: :gin
    t.index ["started_at"], name: "index_sync_logs_on_started_at"
    t.index ["status"], name: "index_sync_logs_on_status"
    t.index ["sync_type"], name: "index_sync_logs_on_sync_type"
  end

  create_table "tags", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "household_id", null: false
    t.string "name", null: false
    t.text "description"
    t.string "color_hex", default: "#6B7280"
    t.boolean "is_active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["household_id", "name"], name: "index_tags_on_household_id_and_name", unique: true
    t.index ["household_id"], name: "index_tags_on_household_id"
    t.index ["is_active"], name: "index_tags_on_is_active"
    t.index ["name"], name: "index_tags_on_name"
  end

  create_table "transaction_tags", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "transaction_id", null: false
    t.uuid "tag_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tag_id"], name: "index_transaction_tags_on_tag_id"
    t.index ["transaction_id", "tag_id"], name: "index_transaction_tags_on_transaction_id_and_tag_id", unique: true
    t.index ["transaction_id"], name: "index_transaction_tags_on_transaction_id"
  end

  create_table "transactions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "account_id", null: false
    t.uuid "household_id", null: false
    t.uuid "category_id"
    t.date "date", null: false
    t.bigint "amount_cents", null: false
    t.string "currency", default: "USD", null: false
    t.string "name", null: false
    t.string "merchant_name"
    t.text "notes"
    t.boolean "is_pending", default: false, null: false
    t.boolean "needs_review", default: false, null: false
    t.boolean "is_recurring", default: false, null: false
    t.string "plaid_transaction_id"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "recurring_item_id"
    t.uuid "parent_transaction_id"
    t.boolean "is_split", default: false, null: false
    t.boolean "excluded", default: false, null: false
    t.datetime "reviewed_at"
    t.uuid "transfer_pair_id"
    t.boolean "is_transfer", default: false, null: false
    t.index ["account_id", "date"], name: "index_transactions_on_account_id_and_date"
    t.index ["account_id"], name: "index_transactions_on_account_id"
    t.index ["amount_cents"], name: "index_transactions_on_amount_cents"
    t.index ["category_id"], name: "index_transactions_on_category_id"
    t.index ["date"], name: "index_transactions_on_date"
    t.index ["excluded"], name: "index_transactions_on_excluded"
    t.index ["household_id", "date"], name: "index_transactions_on_household_id_and_date"
    t.index ["household_id"], name: "index_transactions_on_household_id"
    t.index ["is_pending"], name: "index_transactions_on_is_pending"
    t.index ["is_recurring"], name: "index_transactions_on_is_recurring"
    t.index ["is_transfer"], name: "index_transactions_on_is_transfer"
    t.index ["merchant_name"], name: "index_transactions_on_merchant_name"
    t.index ["metadata"], name: "index_transactions_on_metadata", using: :gin
    t.index ["name"], name: "index_transactions_on_name"
    t.index ["needs_review"], name: "index_transactions_on_needs_review"
    t.index ["parent_transaction_id"], name: "index_transactions_on_parent_transaction_id"
    t.index ["plaid_transaction_id"], name: "index_transactions_on_plaid_transaction_id", unique: true
    t.index ["recurring_item_id"], name: "index_transactions_on_recurring_item_id"
    t.index ["transfer_pair_id"], name: "index_transactions_on_transfer_pair_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.integer "failed_attempts", default: 0, null: false
    t.string "unlock_token"
    t.datetime "locked_at"
    t.string "jti", null: false
    t.string "name", null: false
    t.string "role", default: "owner", null: false
    t.uuid "household_id"
    t.jsonb "preferences", default: {}
    t.string "two_factor_secret"
    t.boolean "two_factor_enabled", default: false, null: false
    t.text "avatar"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["household_id"], name: "index_users_on_household_id"
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["preferences"], name: "index_users_on_preferences", using: :gin
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
    t.index ["unlock_token"], name: "index_users_on_unlock_token", unique: true
  end

  add_foreign_key "account_balance_histories", "accounts"
  add_foreign_key "account_connections", "households"
  add_foreign_key "account_connections", "institutions"
  add_foreign_key "account_connections", "users", column: "created_by_id"
  add_foreign_key "accounts", "account_connections", column: "connection_id"
  add_foreign_key "accounts", "households"
  add_foreign_key "budget_items", "budgets"
  add_foreign_key "budget_items", "categories"
  add_foreign_key "budgets", "households"
  add_foreign_key "categories", "categories", column: "parent_id"
  add_foreign_key "categories", "households"
  add_foreign_key "categorization_rules", "categories"
  add_foreign_key "categorization_rules", "households"
  add_foreign_key "goals", "accounts", column: "target_account_id"
  add_foreign_key "goals", "households"
  add_foreign_key "holdings", "accounts"
  add_foreign_key "holdings", "securities"
  add_foreign_key "household_memberships", "households"
  add_foreign_key "household_memberships", "users"
  add_foreign_key "household_memberships", "users", column: "invited_by_id"
  add_foreign_key "notification_rules", "households"
  add_foreign_key "notification_rules", "users"
  add_foreign_key "notifications", "households"
  add_foreign_key "notifications", "users"
  add_foreign_key "recurring_items", "accounts"
  add_foreign_key "recurring_items", "categories"
  add_foreign_key "recurring_items", "households"
  add_foreign_key "shared_accounts", "accounts", validate: false
  add_foreign_key "shared_accounts", "users", column: "shared_by_user_id", validate: false
  add_foreign_key "shared_accounts", "users", column: "shared_with_user_id", validate: false
  add_foreign_key "sync_logs", "account_connections"
  add_foreign_key "tags", "households"
  add_foreign_key "transaction_tags", "tags"
  add_foreign_key "transaction_tags", "transactions"
  add_foreign_key "transactions", "accounts"
  add_foreign_key "transactions", "categories"
  add_foreign_key "transactions", "households"
  add_foreign_key "users", "households"
end
