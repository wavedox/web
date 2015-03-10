require 'benchmark'
require 'census'
require 'iron_cache'
require 'json'

class Worker
  def initialize(census, cache)
    @top_characters = Array.new
    @league_map = Hash.new
    @census = census
    @cache = cache
  end

  def measure
    b = Benchmark.measure { yield }
    puts "Completed in #{b.real} seconds"
  end

  def work
    fetch_top_characters
    group_by_league
    select_top_leagues
    fetch_league_members
    calculate_score
    sort_by_score
    persist_to_cache
  end

  private

  MIN_SIZE  = 10

  MIN_LEVEL = 30
  MIN_SP    = 150
  MIN_PVE   = 113
  MIN_PVP   = 97

  SP_WEIGHT  = 0.7
  PVE_WEIGHT = 0.3
  PVP_WEIGHT = 0.3

  ALIGNMENT_MAP = {
    '2330' => 'Hero',
    '2331' => 'Villain'
  }

  WORLD_MAP = {
    '1' => 'uspc',
    '2' => 'usps',
    '3' => 'eupc',
    '4' => 'eups'
  }

  TOP_CHARACTERS_CONDITIONS = [
    'skill_points=]150&skill_points=<160',
    'skill_points=]160&skill_points=<170',
    'skill_points=]170&skill_points=<180',
    'skill_points=]180&skill_points=<190',
    'skill_points=]190&skill_points=<200',
    'skill_points=]200'
  ]

  def top_characters_query(condition)
    q = "/character?#{condition}&deleted=false&c:lang=en&c:show=character_id&c:limit=15000"
    q += '&c:join=guild_roster^outer:0^on:character_id^to:character_id(guild^show:name)'
  end

  def league_members_query(id)
    q = "/guild_roster?guild_id=#{id}&c:lang=en&c:limit=100000&c:show=character_id"
    q += '&c:join=character^on:character_id^to:character_id'
    q += '^show:level%27combat_rating%27pvp_combat_rating%27skill_points%27alignment_id%27world_id'
  end

  def fetch_top_characters
    TOP_CHARACTERS_CONDITIONS.each do |condition|
      Hash.new.tap do |response|
        measure { response = @census.get(top_characters_query(condition)) }
        (response['character_list'] || []).each do |c|
          @top_characters.push({
            league_id: c.try(:[], 'character_id_join_guild_roster').try(:[], 'guild_id'),
            league_name: c.try(:[], 'character_id_join_guild_roster').try(:[], 'guild_id_join_guild').try(:[], 'name')
          })
        end
      end
    end
  end

  def group_by_league
    puts "Indexing #{@top_characters.size} characters"

    measure do
      @top_characters.each do |character|
        next unless character[:league_id]

        @league_map[character[:league_id]] ||= {
          id: character[:league_id],
          name: character[:league_name],
          members: Array.new
        }

        @league_map[character[:league_id]][:members].push(character)
      end
    end
  end

  def select_top_leagues
    puts 'Selecting top leagues by minimum size'
    measure { @top_leagues = @league_map.values.select { |l| l[:members].size >= MIN_SIZE }}
    puts "Selected #{@top_leagues.size} top leagues"
  end

  def fetch_league_members
    puts 'Fetching league members'

    measure do
      @top_leagues.each_with_index do |league, i|
        response = @census.get(league_members_query(league[:id]), false)
        roster = response['guild_roster_list'] || []

        league[:alignment] = ALIGNMENT_MAP[roster.first['character_id_join_character']['alignment_id']]
        league[:world] = WORLD_MAP[roster.first['character_id_join_character']['world_id']]

        league[:members] = roster.map do |c|
          {
            sp: c.try(:[], 'character_id_join_character').try(:[], 'skill_points').to_i,
            pve: c.try(:[], 'character_id_join_character').try(:[], 'combat_rating').to_i,
            pvp: c.try(:[], 'character_id_join_character').try(:[], 'pvp_combat_rating').to_i,
            level: c.try(:[], 'character_id_join_character').try(:[], 'level').to_i
          }
        end

        puts "#{i + 1} / #{@top_leagues.size}" if (i + 1) % 100 == 0 || (i + 1) == @top_leagues.size
      end
    end
  end

  def calculate_score
    puts "Calculating score for #{@top_leagues.size} leagues"

    measure do
      @top_leagues.each do |league|
        sp_count, pve_count, pvp_count = 0, 0, 0
        sp_weight, pve_weight, pvp_weight = 0, 0, 0
        sum_sp, sum_pve, sum_pvp, base = 0, 0, 0, 0

        league[:members].each do |member|
          sp_count += 1 if member[:sp] >= MIN_SP
          pve_count += 1 if member[:pve] >= MIN_PVE
          pvp_count += 1 if member[:pvp] >= MIN_PVP

          if member[:level] >= MIN_LEVEL
            sum_sp += member[:sp]
            sum_pve += member[:pve]
            sum_pvp += member[:pvp]
            base += 1
          end
        end

        safe_base = [base, 1].max

        league[:avg_sp] = sum_sp / safe_base
        league[:avg_pve] = sum_pve / safe_base
        league[:avg_pvp] = sum_pvp / safe_base

        league[:sp_count] = sp_count
        league[:pve_count] = pve_count
        league[:pvp_count] = pvp_count

        league[:size] = league[:members].size
        league.delete(:members)

        sp_weight = sp_count * SP_WEIGHT
        pve_weight = pve_count * PVE_WEIGHT
        pvp_weight = pvp_count * PVP_WEIGHT

        sp_score = league[:avg_sp] + sp_weight
        pve_score = league[:avg_pve] + pve_weight
        pvp_score = league[:avg_pvp] + pvp_weight

        league[:score] = sp_score + pve_score + pvp_score
      end
    end
  end

  def sort_by_score
    puts 'Sorting leagues by score'
    measure { @top_leagues.sort_by! { |league| league[:score] * -1 }}
    puts "Top 10 leagues are\n#{@top_leagues[0..9].join("\n")}"
  end

  def persist_to_cache
    puts 'Persisting to cache'
    measure { @cache.put('top_leagues', @top_leagues.to_json) }
  end
end

w = Worker.new(Census.new, IronCache::Client.new.cache('dcuo'))
w.measure { w.work }
