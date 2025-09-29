"""
Test script to verify HTML parsing with sample BGA data.
"""

from bs4 import BeautifulSoup
from bga_scraper import BGAScraper

# Sample HTML from BGA
SAMPLE_HTML = '''
<table class="statstable" id="gamelist_inner">
<tr><td style="text-align:left;"><div class="emblemwrap_l"><img src="https://x.boardgamearena.net/data/themereleases/250924-0909/../../data/gamemedia/pylos/icon/default.png?h=1759174035665" class="game_icon"></div><a href="/table?table=731982074" class="table_name gamename">Pylos</a><br><a href="/table?table=731982074" class="table_name bga-link smalltext">#731982074</a></td><td><div class="smalltext">today at 07:42</div><div class="smalltext">14051 mn</div></td><td><div class="simple-score-entry"><div class="rank">1st</div><div class="name"><a href="/player?id=6870632" class="playername">stst</a></div><div class="score">1  <div class="icon16 icon16_point"></div></div></div><div class="simple-score-entry"><div class="rank">2nd</div><div class="name"><a href="/player?id=25567698" class="playername">Zaka91</a></div><div class="score">0  <div class="icon16 icon16_point"></div></div></div></td><td><div style="display:none"><span class="smalltext"></span> → </div><div style="display:block"><span style="display:none;" class="leavepenalty">&nbsp;<span><div class="icon20 icon20_penaltyleave "></div> </span></span><span class="smalltext">11 </span> → <div class="gamerank gamerank_expert ">
                        <span class="icon20 icon20_rankw"></span> <span class="gamerank_value ">657</span>
                    </div></div><div class="smalltext"><span class="smalltext"></span></div></td></tr>
<tr><td style="text-align:left;"><div class="emblemwrap_l"><img src="https://x.boardgamearena.net/data/themereleases/250924-0909/../../data/gamemedia/pylos/icon/default.png?h=1759174035666" class="game_icon"></div><a href="/table?table=724985750" class="table_name gamename">Pylos</a><br><a href="/table?table=724985750" class="table_name bga-link smalltext">#724985750</a></td><td><div class="smalltext">09/19/2025 at 13:29</div><div class="smalltext">21687 mn</div></td><td><div class="simple-score-entry"><div class="rank">1st</div><div class="name"><a href="/player?id=25567698" class="playername">Zaka91</a></div><div class="score">1  <div class="icon16 icon16_point"></div></div></div><div class="simple-score-entry"><div class="rank">2nd</div><div class="name"><a href="/player?id=6870632" class="playername">stst</a></div><div class="score">0  <div class="icon16 icon16_point"></div></div></div></td><td><div style="display:none"><span class="smalltext"></span> → </div><div style="display:block"><span style="display:none;" class="leavepenalty">&nbsp;<span><div class="icon20 icon20_penaltyleave "></div> </span></span><span class="smalltext">-9 </span> → <div class="gamerank gamerank_expert ">
                        <span class="icon20 icon20_rankw"></span> <span class="gamerank_value ">633</span>
                    </div></div><div class="smalltext"><span class="smalltext"></span></div></td></tr>
</table>
'''


def test_parser():
    """Test the parser with sample HTML."""
    print("Testing BGA HTML parser...\n")
    
    # Create scraper instance
    scraper = BGAScraper()
    
    # Parse sample HTML
    soup = BeautifulSoup(SAMPLE_HTML, 'lxml')
    
    # Extract game stats
    games = scraper.extract_game_stats(soup)
    
    # Display results
    print(f"\n{'='*70}")
    print(f"Successfully parsed {len(games)} games")
    print(f"{'='*70}\n")
    
    for i, game in enumerate(games, 1):
        print(f"Game {i}:")
        print(f"  Name: {game.game_name}")
        print(f"  Table ID: {game.table_id}")
        print(f"  Date: {game.date}")
        print(f"  Duration: {game.duration}")
        print(f"  Opponent: {game.opponent}")
        print(f"  Result: {game.result}")
        print(f"  Score: {game.score} - {game.opponent_score}")
        print(f"  ELO Change: {game.elo_change}")
        print()
    
    return len(games) > 0


if __name__ == "__main__":
    success = test_parser()
    if success:
        print("✅ Parser test PASSED!")
    else:
        print("❌ Parser test FAILED!")
