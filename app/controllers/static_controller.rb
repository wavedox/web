class StaticController < ApplicationController
  respond_to :json

  def index
  end

  def ui
  end

  def ping
    respond_with(Hash)
  end
end
