class StaticController < ApplicationController
  respond_to :json

  def ping
    respond_with(Hash)
  end
end
