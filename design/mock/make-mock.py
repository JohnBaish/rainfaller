"""Writes mock.html from mock.template.html and the figures worked out from real
Environment Agency readings (figs.json, made in the session's scratch folder). Usage:
python3 make-mock.py <figs.json> <code> <place> <cut> <checked> <credits.json>"""
import json, sys, pathlib
figs, code, place, cut, checked, credits = sys.argv[1:7]
rows = [{k: r[k] for k in ('name', 'line', 'miles', 'dir', 'hour', 'today', 'yesterday', 'avg', 'days')} for r in json.load(open(figs))]
data = {'code': code, 'place': place, 'cut': cut, 'checked': checked, 'rows': rows,
        'recent': ['RG4 · Caversham', 'BN1 · Brighton', 'EX1 · Exeter'],
        'credits': json.load(open(credits))}
here = pathlib.Path(__file__).parent
html = (here / 'mock.template.html').read_text().replace('__DATA__', json.dumps(data, ensure_ascii=False))
(here / 'mock.html').write_text(html)
