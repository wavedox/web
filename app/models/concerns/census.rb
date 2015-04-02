require 'json'
require 'net/http'
require 'uri'

class Census
  BASE_URL = 'http://census.daybreakgames.com'
  BASE_GET_PATH = '/s:bytecode/json/get/dcuo:v1'
  BASE_COUNT_PATH = '/s:bytecode/json/count/dcuo:v1'

  def get(path, verbose=true)
    puts "Census.get: #{BASE_URL}#{BASE_GET_PATH}#{path}" if verbose
    request = Net::HTTP::Get.new(BASE_GET_PATH + path)
    response = http.request(request)
    JSON.parse(response.body)
  end

  def count(path, verbose=true)
    puts "Census.count: #{BASE_URL}#{BASE_COUNT_PATH}#{path}" if verbose
    request = Net::HTTP::Get.new(BASE_COUNT_PATH + path)
    response = http.request(request)
    JSON.parse(response.body)['count']
  end

  def encode(string)
    URI::encode(string)
  end

  private

  def http
    uri = URI.parse(BASE_URL)
    @http ||= Net::HTTP.new(uri.host, uri.port)
  end
end
