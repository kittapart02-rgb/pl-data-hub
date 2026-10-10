"""Inline src/ into a single self-contained dist/index.html (order matters: data -> services -> lib -> components -> pages -> main). Run etl/build_data.py first.."""
from pathlib import Path
root = Path(__file__).parent / 'src'
order = ['data/real-data.js', 'data/teams.js', 'data/transfers.js', 'services/repository.js',
         'lib/core.js', 'lib/i18n.js', 'services/api.js', 'components/ui.js', 'components/charts.js', 'components/football.js',
         'components/layout.js', 'lib/galaxy.js', 'pages/home-teams.js', 'pages/players.js', 'pages/matches.js', 'pages/more.js', 'main.js']
import sys
mode = sys.argv[sys.argv.index('--images') + 1] if '--images' in sys.argv else 'none'   # none | remote | embedded
if mode == 'embedded' and not (root / 'data/images.js').exists():
    sys.exit('src/data/images.js not found: run etl/embed_images.py first')
if mode == 'embedded':
    order = ['data/images.js'] + order
js = f"const IMAGE_MODE = '{mode}';\n" + '\n'.join(f'/* ==== {f} ==== */\n' + (root / f).read_text() for f in order)
html = (root / 'index.html').read_text().replace('/*__CSS__*/', (root / 'styles/theme.css').read_text()).replace('/*__JS__*/', js)
out = Path(__file__).parent / 'dist'; out.mkdir(exist_ok=True)
name = {'none': 'index.html', 'remote': 'index-images-online.html', 'embedded': 'index-images.html'}[mode]
(out / name).write_text(html)
print('built', name, len(html) // 1024, 'KB')
