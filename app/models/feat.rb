require 'iron_cache'

class Feat
  CACHE = IronCache::Client.new.cache('dcuo')

  def self.completed_count
    JSON.parse(CACHE.get('feat_completed_count').value)
  end
end
