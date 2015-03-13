class TopLeaguesController < ApplicationController
  respond_to :json

  def index
    respond_with TopLeagues.all
  end
end
