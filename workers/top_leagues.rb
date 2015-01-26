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
  MIN_PVE   = 111
  MIN_PVP   = 97

  SP_WEIGHT  = 0.3
  PVE_WEIGHT = 0.1
  PVP_WEIGHT = 0.1

  ALIGNMENT_MAP = {
    '2330' => 'Hero',
    '2331' => 'Villain'
  }

  WORLD_MAP = {
    '1' => 'USPC',
    '2' => 'USPS',
    '3' => 'EUPC',
    '4' => 'EUPS'
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
    q += '^show:combat_rating%27pvp_combat_rating%27skill_points%27alignment_id%27world_id'
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
            pvp: c.try(:[], 'character_id_join_character').try(:[], 'pvp_combat_rating').to_i
          }
        end

        puts "#{i + 1} / #{@top_leagues.size}" if (i + 1) % 100 == 0
      end
    end
  end

  def calculate_score
    puts "Calculating score for #{@top_leagues.size} leagues"

    measure do
      @top_leagues.each do |league|
        count_sp, count_pve, count_pvp, sum_sp, base_sp = 0, 0, 0, 0, 0

        league[:members].each do |member|
          count_pve += PVE_WEIGHT if member[:pve] >= MIN_PVE
          count_pvp += PVP_WEIGHT if member[:pvp] >= MIN_PVP
          count_sp += SP_WEIGHT if member[:sp] >= MIN_SP

          if member[:pve] >= MIN_LEVEL
            sum_sp += member[:sp]
            base_sp += 1
          end
        end

        league[:size] = league[:members].size
        league.delete(:members)

        league[:avg_sp] = sum_sp / [base_sp, 1].max
        league[:count_sp] = count_sp
        league[:count_pve] = count_pve
        league[:count_pvp] = count_pvp

        league[:score] = league[:avg_sp] + count_sp + count_pve + count_pvp
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
