module Api
  module V1
    class BaseController < ApplicationController
      before_action :authenticate_api_key!

      private

      def authenticate_api_key!
        key = request.headers['X-Api-Key']
        if key.blank?
          render json: { error: 'Missing API key' }, status: :unauthorized
          return
        end

        @api_key = ApiKey.active.find_by(key: key)
        if @api_key.nil?
          render json: { error: 'Invalid or revoked API key' }, status: :unauthorized
          return
        end

        @api_key.touch_last_used!
        @current_user = @api_key.user
      end

      def current_user
        @current_user
      end

      def current_household
        current_user&.household
      end
    end
  end
end
