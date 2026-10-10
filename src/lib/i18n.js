/* lib/i18n.js — Thai / English interface.
   Components keep rendering English; when Thai is selected, a MutationObserver translates interface text
   (text nodes plus placeholder / aria-label / data-tip) as it is rendered. Player, club and stadium names are
   data and are never in the dictionary, so they stay as published. */

const I18N_TH = {
  // navigation & shell
  'Home': 'หน้าแรก', 'Teams': 'ทีม', 'Players': 'นักเตะ', 'Fixtures': 'โปรแกรมแข่ง', 'Standings': 'ตารางคะแนน', 'Statistics': 'สถิติ',
  'Comparison': 'เปรียบเทียบ', 'Transfers': 'การย้ายทีม', 'Discover': 'สำรวจ', 'Top scorers': 'ดาวซัลโว', 'Top assists': 'ผู้จ่ายบอลสูงสุด',
  'Fixture difficulty': 'ความยากของโปรแกรม', 'Team records': 'สถิติทีม', 'Settings': 'ตั้งค่า', 'View profile': 'ดูโปรไฟล์', 'Profile': 'โปรไฟล์',
  'Real data': 'ข้อมูลจริง', 'Notifications': 'การแจ้งเตือน', 'Mark all as read': 'อ่านทั้งหมดแล้ว', 'Local profile': 'โปรไฟล์ในเครื่อง',
  'Search players, teams, matches…': 'ค้นหานักเตะ ทีม หรือแมตช์…', 'Search': 'ค้นหา', 'Search players, teams, matches': 'ค้นหานักเตะ ทีม หรือแมตช์',
  'Football data. Deeper insights.': 'ข้อมูลฟุตบอล เจาะลึกกว่าเดิม', 'About': 'เกี่ยวกับ', 'Skip to content': 'ข้ามไปยังเนื้อหา',
  'Open navigation': 'เปิดเมนู', 'Account menu': 'เมนูบัญชี', 'Clear search': 'ล้างการค้นหา', 'Matches': 'แมตช์',
  // hero & home
  'Premier League': 'พรีเมียร์ลีก', 'Football data & analytics': 'ข้อมูลและการวิเคราะห์ฟุตบอล',
  'Explore teams, players, matches and performance across the Premier League.': 'สำรวจทีม นักเตะ แมตช์ และผลงานทั้งหมดในพรีเมียร์ลีก',
  'Explore teams': 'สำรวจทีม', 'Explore players': 'สำรวจนักเตะ', 'Season': 'ฤดูกาล', 'Season complete': 'จบฤดูกาลแล้ว',
  'Players used': 'นักเตะที่ลงสนาม', 'appeared at least once': 'ลงสนามอย่างน้อย 1 นัด', 'Goals': 'ประตู', 'Goals per match': 'ประตูต่อนัด',
  'Home wins': 'เจ้าบ้านชนะ', 'of matches played': 'ของแมตช์ที่แข่งแล้ว', 'League table': 'ตารางคะแนน', 'Full table': 'ตารางเต็ม',
  'All scorers': 'ดาวซัลโวทั้งหมด', 'Top players': 'นักเตะยอดเยี่ยม', 'Assists': 'แอสซิสต์', 'FPL points': 'แต้ม FPL', 'Goals by team': 'ประตูแยกตามทีม',
  'Upcoming fixtures': 'โปรแกรมที่จะมาถึง', 'All fixtures': 'โปรแกรมทั้งหมด', 'Latest results': 'ผลการแข่งขันล่าสุด', 'All results': 'ผลทั้งหมด',
  'Compare players': 'เปรียบเทียบนักเตะ', 'Champions League': 'แชมเปียนส์ลีก', 'Europa League': 'ยูโรปาลีก', 'Relegation': 'ตกชั้น',
  'Minutes': 'นาที', 'Rating': 'เรตติ้ง',
  // tables
  'Team': 'ทีม', 'Player': 'นักเตะ', 'Pos': 'ตำแหน่ง', 'Position': 'ตำแหน่ง', 'Age': 'อายุ', 'Apps': 'ลงสนาม', 'Min': 'นาที', 'Ast': 'แอสซิสต์',
  'FPL pts': 'แต้ม FPL', 'Form': 'ฟอร์ม', 'Rank': 'อันดับ', 'Club': 'สโมสร', 'Date': 'วันที่', 'From': 'จาก', 'To': 'ไป', 'Window': 'ช่วง',
  'Reported fee': 'ค่าตัว (รายงาน)', 'Match': 'แมตช์', 'Total': 'รวม', 'Per 90': 'ต่อ 90', 'Pct': '%ile', 'Avg': 'เฉลี่ย',
  'Sub': 'สำรอง', 'Left': 'ย้ายออก', 'Top BPS': 'BPS สูงสุด', 'Top rated': 'ยอดเยี่ยม', 'Summer': 'ซัมเมอร์', 'Mid-season': 'กลางฤดูกาล',
  'Outside the Premier League': 'นอกพรีเมียร์ลีก', 'reported': 'ตามรายงาน', 'Full time': 'จบเกม', 'Kick-off, UK time': 'เวลาเริ่ม (เวลาอังกฤษ)',
  // teams
  'Premier League teams': 'ทีมในพรีเมียร์ลีก', 'Explore team performance, squad data and statistics.': 'สำรวจผลงานทีม ข้อมูลนักเตะ และสถิติ',
  'Search team': 'ค้นหาทีม', 'Team name or code': 'ชื่อทีมหรือตัวย่อ', 'Sort by': 'เรียงตาม', 'League position': 'อันดับในตาราง', 'Points': 'แต้ม',
  'Goals scored': 'ประตูที่ยิงได้', 'Expected goals (xG)': 'โอกาสทำประตูคาดหวัง (xG)', 'Fewest conceded': 'เสียประตูน้อยสุด', 'Founded': 'ก่อตั้ง',
  'Matches': 'แมตช์', 'Wins': 'ชนะ', 'Draws': 'เสมอ', 'Losses': 'แพ้', 'Goals conceded': 'เสียประตู', 'Goal difference': 'ผลต่างประตู',
  'Clean sheets': 'คลีนชีต', 'Points by gameweek': 'แต้มสะสมรายเกมวีค', 'Attack vs defence': 'เกมรุกและเกมรับ', 'Attack': 'เกมรุก', 'Defence': 'เกมรับ',
  'xG against': 'xG ที่เสีย', 'Goals minus xG': 'ประตูลบ xG', 'Goalkeeper saves': 'การเซฟของผู้รักษาประตู', 'Tackles': 'แท็กเกิล', 'Squad': 'รายชื่อนักเตะ',
  'Upcoming fixtures': 'โปรแกรมที่จะมาถึง', 'Recent results': 'ผลล่าสุด', 'Leader': 'จ่าฝูง', 'League average': 'ค่าเฉลี่ยลีก', 'Position': 'ตำแหน่ง',
  'Goalkeeper': 'ผู้รักษาประตู', 'Defender': 'กองหลัง', 'Midfielder': 'กองกลาง', 'Forward': 'กองหน้า',
  // players
  'Explore player performance across the Premier League.': 'สำรวจผลงานนักเตะทั้งพรีเมียร์ลีก', 'Search player': 'ค้นหานักเตะ', 'Player name': 'ชื่อนักเตะ',
  'All teams': 'ทุกทีม', 'All positions': 'ทุกตำแหน่ง', 'Goalkeepers': 'ผู้รักษาประตู', 'Defenders': 'กองหลัง', 'Midfielders': 'กองกลาง', 'Forwards': 'กองหน้า',
  'All ages': 'ทุกช่วงอายุ', 'Under 21': 'ต่ำกว่า 21', '30 and over': '30 ขึ้นไป', 'Min. appearances': 'ลงสนามขั้นต่ำ', 'Any (whole squad)': 'ทั้งหมด (ทั้งทีม)',
  'Any': 'ทั้งหมด', 'Reset filters': 'ล้างตัวกรอง', 'No players found': 'ไม่พบนักเตะ', 'Try changing your filters.': 'ลองเปลี่ยนตัวกรองดู',
  'Compare': 'เปรียบเทียบ', 'Born': 'เกิด', 'Appearances': 'ลงสนาม', 'Starts': 'ตัวจริง', 'Bonus points': 'โบนัสพอยต์', 'ICT index': 'ดัชนี ICT',
  'Performance trend': 'แนวโน้มผลงาน', 'Player profile': 'โปรไฟล์นักเตะ', 'Season statistics': 'สถิติฤดูกาล', 'Creation': 'การสร้างสรรค์',
  'Defending': 'เกมรับ', 'Discipline': 'วินัย', 'Usage & FPL': 'การใช้งานและ FPL', 'Penalties missed': 'ยิงจุดโทษพลาด', 'Threat (ICT)': 'ภัยคุกคาม (ICT)',
  'Creativity (ICT)': 'ความสร้างสรรค์ (ICT)', 'Influence (ICT)': 'อิทธิพล (ICT)', 'xG involvements': 'xG รวมแอสซิสต์', 'Yellow cards': 'ใบเหลือง',
  'Red cards': 'ใบแดง', 'Own goals': 'ทำเข้าประตูตัวเอง', 'Saves': 'เซฟ', 'Penalties saved': 'เซฟจุดโทษ', 'xG conceded': 'xG ที่เสีย',
  'Recoveries': 'การแย่งบอลคืน', 'Defensive contributions': 'ผลงานเกมรับ', 'Recent matches': 'แมตช์ล่าสุด', 'Premier League history': 'ประวัติในพรีเมียร์ลีก',
  'Match-feed stats': 'สถิติเชิงลึกจากแมตช์', 'Physical': 'สมรรถภาพร่างกาย', 'Shooting': 'การยิง', 'Passing & creation': 'การจ่ายบอลและสร้างโอกาส',
  'Duels & defending': 'การดวลและเกมรับ', 'Goalkeeping': 'การเฝ้าประตู', 'Distribution': 'การแจกบอล', 'Distance covered': 'ระยะวิ่ง', 'Top speed': 'ความเร็วสูงสุด',
  'Sprints': 'การสปรินต์', 'Shots': 'การยิง', 'Shots on target': 'ยิงตรงกรอบ', 'xG on target (xGOT)': 'xG ที่ตรงกรอบ (xGOT)', 'Touches in opposition box': 'สัมผัสบอลในกรอบเขตโทษคู่แข่ง',
  'Big chances missed': 'พลาดโอกาสทองๆ', 'Touches': 'สัมผัสบอล', 'Pass accuracy': 'ความแม่นยำการจ่าย', 'Chances created': 'สร้างโอกาส',
  'Final-third passes': 'จ่ายเข้าแดนสุดท้าย', 'Accurate crosses': 'ครอสแม่นยำ', 'Accurate long balls': 'บอลยาวแม่นยำ', 'Duels won': 'ชนะการดวล',
  'Duel success': 'อัตราชนะการดวล', 'Aerial duels won': 'ชนะลูกกลางอากาศ', 'Tackles won': 'แท็กเกิลสำเร็จ', 'Interceptions': 'ตัดบอล', 'Clearances': 'สกัดบอล',
  'Dribbled past': 'ถูกเลี้ยงผ่าน', 'Fouls won': 'ถูกฟาวล์', 'Goals prevented': 'ป้องกันประตูได้', 'xGOT faced': 'xGOT ที่เผชิญ', 'Saves inside box': 'เซฟในกรอบเขตโทษ',
  'Sweeper actions': 'ออกมาตัดบอล', 'High claims': 'รับลูกกลางอากาศ', 'Goal threat': 'ภัยคุกคาม', 'Creativity': 'ความสร้างสรรค์', 'Influence': 'อิทธิพล',
  'Availability': 'ความพร้อมลงสนาม', 'Defensive actions': 'ผลงานเกมรับ', 'Few conceded': 'เสียประตูน้อย',
  // fixtures & matches
  'Fixtures & results': 'โปรแกรมและผลการแข่งขัน', 'Every Premier League match. Select a match for the full match centre.': 'ทุกแมตช์ในพรีเมียร์ลีก เลือกแมตช์เพื่อดูรายละเอียดทั้งหมด',
  'Upcoming': 'ที่จะมาถึง', 'Results': 'ผลการแข่งขัน', 'Month': 'เดือน', 'All months': 'ทุกเดือน', 'Home / away': 'เหย้า / เยือน', 'Home and away': 'ทั้งเหย้าและเยือน',
  'Home only': 'เฉพาะเกมเหย้า', 'Away only': 'เฉพาะเกมเยือน', 'Choose a team to filter by venue.': 'เลือกทีมก่อนเพื่อกรองเกมเหย้าหรือเยือน',
  'No upcoming fixtures': 'ไม่มีโปรแกรมที่เหลือ', 'Show results': 'ดูผลการแข่งขัน', 'No matches found': 'ไม่พบแมตช์', 'Clear filters': 'ล้างตัวกรอง',
  'Match centre': 'ศูนย์ข้อมูลแมตช์', 'Match stats': 'สถิติแมตช์', 'Match events': 'เหตุการณ์ในแมตช์', 'Player performances': 'ผลงานนักเตะ',
  'Form guide': 'ฟอร์มการเล่น', 'Season comparison': 'เปรียบเทียบฤดูกาล', 'Reverse fixture': 'นัดที่พบกันอีกครั้ง', 'Match not played yet': 'แมตช์ยังไม่ได้แข่ง',
  'Back to fixtures': 'กลับไปหน้าโปรแกรม', 'Possession (%)': 'การครองบอล (%)', 'Big chances': 'โอกาสทองๆ', 'Pass accuracy (%)': 'ความแม่นยำการจ่าย (%)',
  'Corners': 'เตะมุม', 'Fouls': 'ฟาวล์', 'Expected assists (xA)': 'แอสซิสต์คาดหวัง (xA)', 'Players used': 'นักเตะที่ลงสนาม', 'Points per match': 'แต้มต่อนัด',
  'xG per match': 'xG ต่อนัด', 'Conceded per match': 'เสียประตูต่อนัด', 'Clearances, blocks & interceptions': 'สกัด บล็อก และตัดบอล',
  // standings, stats, comparison, transfers, records
  'Premier League table': 'ตารางคะแนนพรีเมียร์ลีก', 'Final table.': 'ตารางคะแนนสุดท้าย', 'Statistics explorer': 'สำรวจสถิติ',
  'Rank every player on any metric. Filter by team, position and appearances.': 'จัดอันดับนักเตะทุกคนตามค่าสถิติที่เลือก กรองตามทีม ตำแหน่ง และจำนวนนัด',
  'Metric': 'ค่าสถิติ', 'Order': 'ลำดับ', 'Highest first': 'มากไปน้อย', 'Lowest first': 'น้อยไปมาก', 'Find player in ranking': 'ค้นหานักเตะในอันดับ',
  'Player comparison': 'เปรียบเทียบนักเตะ', 'Compare two players across output, creation and efficiency.': 'เปรียบเทียบนักเตะสองคนด้านผลงาน การสร้างสรรค์ และประสิทธิภาพ',
  'Player one': 'นักเตะคนที่ 1', 'Player two': 'นักเตะคนที่ 2', 'Season totals': 'รวมทั้งฤดูกาล', 'Per 90 minutes': 'ต่อ 90 นาที', 'Profile overlay': 'เปรียบเทียบโปรไฟล์',
  'Head to head': 'เทียบกันตัวต่อตัว', 'Performance timeline': 'ไทม์ไลน์ผลงาน', 'Swap players': 'สลับนักเตะ', 'Threat': 'ภัยคุกคาม', 'Def. actions': 'ผลงานเกมรับ',
  'Direction': 'ทิศทาง', 'In and out': 'ทั้งเข้าและออก', 'Arrivals': 'ย้ายเข้า', 'Departures to PL clubs': 'ย้ายออกไปทีมในพรีเมียร์ลีก', 'No transfers found': 'ไม่พบการย้ายทีม',
  'Records': 'สถิติ', 'Season leaders for players and teams.': 'ผู้นำสถิติของนักเตะและทีมในฤดูกาล', 'Player records': 'สถิตินักเตะ',
  'Most goals': 'ยิงมากที่สุด', 'Most assists': 'แอสซิสต์มากที่สุด', 'Most clean sheets': 'คลีนชีตมากที่สุด', 'Most appearances': 'ลงสนามมากที่สุด',
  'Highest xG': 'xG สูงสุด', 'Highest xA': 'xA สูงสุด', 'Most saves': 'เซฟมากที่สุด', 'Most tackles': 'แท็กเกิลมากที่สุด', 'Most FPL points': 'แต้ม FPL สูงสุด',
  'Most goals scored': 'ยิงประตูมากที่สุด', 'Fewest goals conceded': 'เสียประตูน้อยที่สุด', 'Longest winning run': 'ชนะติดต่อกันยาวที่สุด',
  'Longest unbeaten run': 'ไม่แพ้ติดต่อกันยาวที่สุด', 'Biggest win': 'ชนะขาดที่สุด', 'Full ranking': 'อันดับทั้งหมด',
  'Gameweeks ahead': 'เกมวีคข้างหน้า', 'Next 3': '3 นัดถัดไป', 'Next 5': '5 นัดถัดไป', 'Next 8': '8 นัดถัดไป', 'Easiest run first': 'โปรแกรมง่ายสุดก่อน',
  'Team strength': 'ความแข็งแกร่งของทีม', 'How it is calculated': 'วิธีคำนวณ', '1 easiest, 5 hardest': '1 ง่ายที่สุด, 5 ยากที่สุด',
  // settings & states
  'Preferences are saved in this browser.': 'การตั้งค่าจะบันทึกไว้ในเบราว์เซอร์นี้', 'Display name': 'ชื่อที่แสดง', 'Save name': 'บันทึกชื่อ', 'Saved': 'บันทึกแล้ว',
  'Preferences': 'การตั้งค่า', 'Default season': 'ฤดูกาลเริ่มต้น', 'Reduce motion': 'ลดการเคลื่อนไหว', 'Language': 'ภาษา', 'Theme': 'ธีม',
  'Testing': 'การทดสอบ', 'Simulated network speed': 'จำลองความเร็วเครือข่าย', 'Simulate API failure': 'จำลอง API ล้มเหลว', 'About the data': 'เกี่ยวกับข้อมูล',
  'Reset preferences': 'รีเซ็ตการตั้งค่า', 'Instant': 'ทันที', 'Normal': 'ปกติ', 'Slow': 'ช้า', 'Retry': 'ลองใหม่', 'Open settings': 'เปิดการตั้งค่า',
  'Page not found': 'ไม่พบหน้านี้', 'Go to home': 'กลับหน้าแรก', 'Loading…': 'กำลังโหลด…', 'Opening animation': 'แอนิเมชันเปิดเว็บ', 'Replay intro': 'เล่นอีกครั้ง',
  'Player stats not published yet': 'ยังไม่มีสถิตินักเตะ', 'Back to results': 'กลับไปหน้าผลการแข่งขัน',
  'The result is final and already counts in the table. Player stats for this gameweek are published once every match in it has been played, and appear here after the next data refresh.': 'ผลการแข่งขันเป็นทางการและนับในตารางแล้ว สถิตินักเตะของเกมวีคนี้จะเผยแพร่เมื่อแข่งครบทุกนัด และจะแสดงที่นี่หลังอัปเดตข้อมูลรอบถัดไป',
  'Galaxy': 'กาแล็กซี', 'Classic': 'คลาสสิก', 'Skip intro': 'ข้าม',
};

const I18N_PATTERNS = [
  [/^After gameweek (\d+) of 38 \((\d+) of 380 matches\)$/, 'หลังเกมวีคที่ $1 จาก 38 ($2 จาก 380 นัด)'],
  [/^Gameweek (\d+)$/, 'เกมวีคที่ $1'], [/^GW(\d+)$/, 'GW$1'], [/^(\d+) played$/, 'แข่งแล้ว $1 นัด'],
  [/^(\d[\d,]*) players$/, '$1 คน'], [/^(\d[\d,]*) moves$/, '$1 รายการ'], [/^Top 10 by (.+)$/, '10 อันดับแรก: $1'], [/^Bottom 10 by (.+)$/, '10 อันดับสุดท้าย: $1'],
  [/^(\d+)(st|nd|rd|th) in table$/, 'อันดับ $1 ในตาราง'], [/^(.+) per 90$/, '$1 ต่อ 90 นาที'], [/^Age \(1 Aug (\d+)\)$/, 'อายุ (1 ส.ค. $1)'],
  [/^Race so far: points after each gameweek for the top four in (.+)\.$/, 'ลุ้นแชมป์ตอนนี้: แต้มสะสมรายเกมวีคของ 4 อันดับแรกฤดูกาล $1'],
  [/^Title race: points after each gameweek for the top four in (.+)\.$/, 'ลุ้นแชมป์: แต้มสะสมรายเกมวีคของ 4 อันดับแรกฤดูกาล $1'],
  [/^(\d+) goals$/, '$1 ประตู'], [/^(\d+) pts$/, '$1 แต้ม'], [/^(\d+) conceded$/, 'เสีย $1 ประตู'], [/^(\d+) wins$/, 'ชนะ $1 นัด'], [/^(\d+) games$/, '$1 นัด'],
  [/^Cumulative total after each gameweek\.$/, 'ผลรวมสะสมหลังแต่ละเกมวีค'],
  [/^(\d+) matches, ([\d,]+) minutes\. Bars show the percentile against (goalkeepers|outfield players) with 180\+ minutes \(per 90 unless it is a rate\)\.$/, '$1 นัด $2 นาที แถบแสดงเปอร์เซ็นไทล์เทียบกับผู้เล่นตำแหน่งเดียวกันที่ลงเล่น 180 นาทีขึ้นไป (คิดต่อ 90 นาที ยกเว้นค่าที่เป็นอัตรา)'],
  [/^Percentile vs Premier League (outfield players|goalkeepers) with 450\+ minutes(, per 90)?$/, 'เปอร์เซ็นไทล์เทียบกับผู้เล่นพรีเมียร์ลีกที่ลงเล่น 450 นาทีขึ้นไป'],
  [/^Everyone registered to the club this season, with stats for this club\. Select a column to sort, or a player to open their profile\.$/, 'นักเตะทุกคนที่ลงทะเบียนกับสโมสรในฤดูกาลนี้ กดหัวคอลัมน์เพื่อเรียง หรือกดชื่อเพื่อดูโปรไฟล์'],
  [/^Expected-goal difference per match over each club’s last 38 league games in the dataset\.$/, 'ผลต่าง xG ต่อนัด จาก 38 เกมลีกล่าสุดของแต่ละทีม'],
  [/^How hard each club’s next gameweeks look, rated from opponent strength and venue\.$/, 'ความยากของโปรแกรมถัดไปของแต่ละทีม คำนวณจากความแข็งแกร่งของคู่แข่งและสนาม'], [/^Cumulative (.+) after each gameweek\.$/, 'ผลรวมสะสมหลังแต่ละเกมวีค'],
];

const I18n = {
  lang: 'en',
  init() {
    this.lang = Settings.get('lang') === 'th' ? 'th' : 'en';
    document.documentElement.lang = this.lang;
    if (this.lang !== 'th' || !window.MutationObserver) return;
    this.translate(document.body);
    new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(n => this.translate(n)))).observe(document.body, { childList: true, subtree: true });
  },
  word(s) {
    const k = s.trim(); if (!k) return null;
    if (I18N_TH[k]) return s.replace(k, I18N_TH[k]);
    for (const [re, rep] of I18N_PATTERNS) if (re.test(k)) return s.replace(k, k.replace(re, rep));
    return null;
  },
  translate(node) {
    if (node.nodeType === 3) { const t = this.word(node.data); if (t != null) node.data = t; return; }
    if (node.nodeType !== 1 || node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
    ['placeholder', 'aria-label', 'data-tip', 'title'].forEach(a => { if (node.hasAttribute(a)) { const t = this.word(node.getAttribute(a)); if (t != null) node.setAttribute(a, t); } });
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n = walker.nextNode();
    while (n) {
      if (n.nodeType === 3) { if (!n.parentElement || !n.parentElement.closest('.no-i18n')) { const t = this.word(n.data); if (t != null) n.data = t; } }
      else ['placeholder', 'aria-label', 'data-tip', 'title'].forEach(a => { if (n.hasAttribute(a)) { const t = this.word(n.getAttribute(a)); if (t != null) n.setAttribute(a, t); } });
      n = walker.nextNode();
    }
  },
  set(lang) { Settings.set('lang', lang); location.reload(); },
};
