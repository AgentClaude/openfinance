# Institution model for OpenFinance
# Represents financial institutions (banks, credit unions, etc.)

class Institution < ApplicationRecord
  # Associations
  has_many :account_connections, dependent: :destroy
  has_many :households, through: :account_connections

  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 255 }
  validates :logo_url, format: { with: URI::regexp }, allow_blank: true
  validates :website_url, format: { with: URI::regexp }, allow_blank: true
  validates :plaid_institution_id, uniqueness: true, allow_blank: true
  # Note: finicity_institution_id and mx_institution_id columns not yet added to schema
  # validates :finicity_institution_id, uniqueness: true, allow_blank: true
  # validates :mx_institution_id, uniqueness: true, allow_blank: true

  # Scopes
  scope :with_plaid, -> { where.not(plaid_institution_id: nil) }
  scope :with_finicity, -> { where.not(finicity_institution_id: nil) }
  scope :with_mx, -> { where.not(mx_institution_id: nil) }
  scope :popular, -> { joins(:account_connections).group('institutions.id').order('COUNT(account_connections.id) DESC') }
  scope :search, ->(query) { where('name ILIKE ?', "%#{query}%") if query.present? }

  # Class methods
  def self.find_or_create_from_plaid(plaid_institution)
    inst_id = plaid_institution.respond_to?(:institution_id) ? plaid_institution.institution_id : plaid_institution['institution_id']
    inst_name = plaid_institution.respond_to?(:name) ? plaid_institution.name : plaid_institution['name']
    inst_logo = plaid_institution.respond_to?(:logo) ? plaid_institution.logo : plaid_institution['logo']
    inst_url = plaid_institution.respond_to?(:url) ? plaid_institution.url : plaid_institution['url']
    inst_color = plaid_institution.respond_to?(:primary_color) ? plaid_institution.primary_color : plaid_institution['primary_color']

    find_or_create_by(plaid_institution_id: inst_id) do |institution|
      institution.name = inst_name
      institution.logo_url = inst_logo
      institution.website_url = inst_url
      institution.primary_color = inst_color
    end
  end

  def self.find_or_create_from_finicity(finicity_institution)
    find_or_create_by(finicity_institution_id: finicity_institution['id']) do |institution|
      institution.name = finicity_institution['name']
      institution.logo_url = finicity_institution['branding']&.dig('logo')
      institution.website_url = finicity_institution['urlHomeApp']
    end
  end

  def self.find_or_create_from_mx(mx_institution)
    find_or_create_by(mx_institution_id: mx_institution['code']) do |institution|
      institution.name = mx_institution['name']
      institution.logo_url = mx_institution['medium_logo_url']
      institution.website_url = mx_institution['url']
    end
  end

  # Instance methods
  def supports_plaid?
    plaid_institution_id.present?
  end

  def supports_finicity?
    respond_to?(:finicity_institution_id) && finicity_institution_id.present?
  end

  def supports_mx?
    respond_to?(:mx_institution_id) && mx_institution_id.present?
  end

  def supported_providers
    providers = []
    providers << 'plaid' if supports_plaid?
    providers << 'finicity' if supports_finicity?
    providers << 'mx' if supports_mx?
    providers
  end

  def primary_provider
    return 'plaid' if supports_plaid?
    return 'finicity' if supports_finicity?
    return 'mx' if supports_mx?
    nil
  end

  def connection_count
    account_connections.count
  end

  def household_count
    households.distinct.count
  end

  def display_logo_url
    logo_url.presence || default_logo_url
  end

  def display_color
    primary_color.presence || default_color
  end

  # Search functionality
  def self.search_by_name(query)
    return none if query.blank?
    
    sanitized_query = ActiveRecord::Base.sanitize_sql_like(query)
    where('name ILIKE ?', "%#{sanitized_query}%")
      .order(:name)
  end

  # Popular institutions for quick access
  def self.most_popular(limit = 20)
    joins(:account_connections)
      .group('institutions.id')
      .order('COUNT(account_connections.id) DESC')
      .limit(limit)
  end

  # API serialization
  def as_json(options = {})
    super(options.merge(
      only: [:id, :name, :website_url, :primary_color],
      methods: [:display_logo_url, :supported_providers, :primary_provider]
    ))
  end

  private

  def default_logo_url
    # Placeholder image or generate one based on institution name
    color_hex = display_color.to_s.delete('#')
    color_hex = '1f77b4' if color_hex.blank?
    "https://via.placeholder.com/150x150/#{color_hex}/FFFFFF?text=#{name.first(2).upcase}"
  end

  def default_color
    # Generate a consistent color based on institution name
    colors = %w[#1f77b4 #ff7f0e #2ca02c #d62728 #9467bd #8c564b #e377c2 #7f7f7f #bcbd22 #17becf]
    colors[name.sum % colors.length]
  end
end