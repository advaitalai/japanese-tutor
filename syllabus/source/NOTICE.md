# Syllabus data sources

`vocab-n5.csv`, `vocab-n4.csv`, `grammar-n5.csv` and `grammar-n4.csv` are copied unchanged from
[OpenJLPT](https://github.com/evanclan/OpenJLPT) (commit in `VERSION`), licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Contains data from OpenJLPT (CC BY-SA 4.0), which uses JMdict and KANJIDIC2 (EDRDG),
Jonathan Waller's JLPT lists (tanos.co.uk, CC BY), and Tatoeba (CC BY 2.0 FR).

`syllabus/syllabus.json` is derived from these files by `scripts/build-syllabus.ts`, so it is
also CC BY-SA 4.0. `syllabus/sets.json` (numbers, counters, dates, times, prices) is our own.
JLPT levels are community approximations; the JLPT publishes no official lists.
