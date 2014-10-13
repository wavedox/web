class StaticController < ApplicationController
  respond_to :json

  def index
    redirect_to "http://wavedox.com#{request.fullpath}" if request.domain.starts_with?('www.')
  end

  def ping
    respond_with(Hash)
  end
end
