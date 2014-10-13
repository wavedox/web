class FeatsController < ApplicationController
  respond_to :json

  def completed_count
    respond_with Feat.completed_count
  end
end
