class StaticController < ApplicationController
  respond_to :json

  def index
    redirect_to 'http://dcuo.herokuapp.com' if Rails.env == 'production'
  end

  def ping
    respond_with(Hash)
  end
end
