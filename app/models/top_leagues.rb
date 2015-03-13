require 'iron_cache'

class TopLeagues
  CACHE = IronCache::Client.new.cache('dcuo')

  def self.all
    JSON.parse(CACHE.get('top_leagues').value)
  end
end
