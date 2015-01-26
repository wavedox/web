require 'benchmark'
require 'census'
require 'iron_cache'
require 'json'

class Worker
  attr_reader :cache

  def initialize(cache, census)
    @cache = cache
    @census = census
  end

  def resolve_pending_slices
    cached_slices = @cache.get('feat_completed_pending_slices')
    pending_slices = cached_slices ? JSON.parse(cached_slices.value) : []
    return slice_all_feat_ids if pending_slices.empty?
    pending_slices
  end

  def count_completed_feats(feat_ids)
    feat_ids.inject({}) do |memo, feat_id|
      path = "/characters_completed_feat?feat_id=#{feat_id}"
      update_feat_completed_count(memo, feat_id, @census.count(path))
      memo
    end
  end

  def update_cached_counts(current_feat_counts)
    cached_counts = @cache.get('feat_completed_count')
    feat_completed_counts = cached_counts ? JSON.parse(cached_counts.value) : {}
    merged_counts = feat_completed_counts.merge(current_feat_counts)
    @cache.put('feat_completed_count', merged_counts.to_json)
  end

  private

  def slice_all_feat_ids
    all_feat_ids = fetch_all_feat_ids
    all_feat_ids.each_slice(all_feat_ids.size / 10).to_a
  end

  def fetch_all_feat_ids
    path = '/feat?c:limit=9999&c:show=feat_id'
    response = @census.get(path)
    feats = response['feat_list'] || []
    feats.map { |feat| feat['feat_id'].to_i }.sort
  end

  def update_feat_completed_count(memo, feat_id, updated_count)
    if updated_count.nil?
      puts "Got nil count for feat #{feat_id}, skipping..."
    else
      memo[feat_id] = updated_count
    end
  end
end

benchmark = Benchmark.measure do
  worker = Worker.new(IronCache::Client.new.cache('dcuo'), Census.new)

  pending_slices = worker.resolve_pending_slices
  current_feat_ids = pending_slices.shift
  current_feat_counts = worker.count_completed_feats(current_feat_ids)

  worker.update_cached_counts(current_feat_counts)
  worker.cache.put('feat_completed_pending_slices', pending_slices.to_json)
end

puts "Completed in #{benchmark.real} seconds"
