# Performance report

Measured on 2026-10-13 with the benchmarks of `tests/performance`, which are part of the test suite and fail when a budget is
exceeded. The numbers below are those of the run; a budget is the most a measure may take.

## Environment

| | |
|---|---|
| Moodle | 5.3 (Build 20261005), the `feat/iconrestyle-503` line |
| PHP | 8.3.33 |
| Database | PostgreSQL 17.10 |
| Host | Windows 11 with Docker on WSL2, one web server container and one database container |
| Cache | Moodle's default stores: file application cache, no Redis or Memcached |
| Run | `vendor/bin/phpunit --group local_iconrestyle_performance` |

The server side of the plugin (rules, limits, delivery, export and import) is the same in the line for Moodle 4.0 to 5.2, so these
numbers describe both.

## The datasets

| | Default | Large |
|---|---:|---:|
| Categories (a deep chain of 30 included) | 90 | 430 |
| Courses | 150 | 5,000 |
| Contexts with rules | 101 | 401 |
| Rules on the whole site | 150 | 280 |
| Rules on each category and course that has some | 3 | 12 |
| Rules in the package imported in B-06 | 3,000 | 20,000 |

The rules are as heavy as a rule reasonably is: a shape, padding on every side, a shadow, pages, regions and a colour mode. The
large site has more rules on the whole site than the default one and still fits the stylesheet cap of 256 KB: a site with 450 rules
is refused by the limit, which is what the limits are for.

Courses of the large dataset are inserted directly, because the course generator of Moodle sorts every course of the site after each
one it creates, which makes building thousands of them take hours and has nothing to do with the plugin.

## Results

### Dataset

| Measure | Default dataset | Large dataset | Budget |
|---|---:|---:|---:|
| tree ms | 2,703 | 17,145 |  |
| categories | 90 | 430 |  |
| courses | 150 | 5,000 |  |
| contexts with rules | 101 | 401 |  |
| rules ms | 473 | 3,191 |  |

### B-01 A page whose stylesheets are cached

| Measure | Default dataset | Large dataset | Budget |
|---|---:|---:|---:|
| chain 1 database reads | 0 | 0 | 0 |
| chain 1 microseconds per page | 7.91 | 7.295 | 1,000 |
| chain 4 database reads | 0 | 0 | 0 |
| chain 4 microseconds per page | 21.548 | 22.127 | 1,000 |
| chain 8 database reads | 0 | 0 | 0 |
| chain 8 microseconds per page | 21.48 | 21.174 | 1,000 |

### B-02 A page whose revisions are not cached

| Measure | Default dataset | Large dataset | Budget |
|---|---:|---:|---:|
| chain 1 database reads | 1 | 1 | 1 |
| chain 1 milliseconds | 0.844 | 0.858 | 25 |
| chain 4 database reads | 1 | 1 | 1 |
| chain 4 milliseconds | 1.84 | 1.734 | 25 |
| chain 8 database reads | 1 | 1 | 1 |
| chain 8 milliseconds | 1.833 | 1.885 | 25 |

### B-03 The stylesheet of a page

| Measure | Default dataset | Large dataset | Budget |
|---|---:|---:|---:|
| stylesheets in the longest chain | 9 | 9 |  |
| hit database reads | 0 | 0 | 0 |
| hit milliseconds | 0.065 | 0.071 | 5 |
| longest chain bytes | 144,843 | 249,523 | 409,600 |
| miss compiles for 101 requests | 9 | 9 | 9 |
| miss milliseconds for the whole chain | 74.164 | 79.549 | 2,000 |
| warm every stylesheet of the site, ms | 995 | 3,538 |  |
| database reads after the warm-up | 0 | 0 | 0 |

### B-04 Compiling the most rules a stylesheet may hold

| Measure | Default dataset | Large dataset | Budget |
|---|---:|---:|---:|
| 500 rules milliseconds | 5.664 | 5.272 | 400 |
| 500 rules bytes | 401,422 | 401,422 |  |
| 2000 rules milliseconds | 23.695 | 22.352 | 1,600 |
| 2000 rules bytes | 1,610,236 | 1,610,236 |  |
| 150 rules bytes against the cap | 120,031 | 120,031 | 262,144 |

### B-05 The catalogue

| Measure | Default dataset | Large dataset | Budget |
|---|---:|---:|---:|
| icons in the catalogue | 821 | 821 |  |
| cold build milliseconds | 11.503 | 11.36 | 3,000 |
| cached read milliseconds | 0.008 | 0.006 | 50 |

### Cache housekeeping

| Measure | Default dataset | Large dataset | Budget |
|---|---:|---:|---:|
| contexts with rules | 109 | 409 |  |
| stylesheets cached for them | 0 | 0 | 0 |
| stale entries left behind | 0 | 0 | 0 |

### B-08 What the plugin adds to a page

| Measure | Default dataset | Large dataset | Budget |
|---|---:|---:|---:|
| disabled microseconds per page | 1.358 | 1.323 |  |
| enabled microseconds per page | 25.292 | 25.076 | 1,000 |
| enabled over disabled, microseconds | 23.934 | 23.752 | 1,000 |

### B-06 Importing a package one line at a time

| Measure | Default dataset | Large dataset | Budget |
|---|---:|---:|---:|
| rules in the package | 3,000 | 20,000 |  |
| rules created | 3,000 | 20,000 |  |
| seconds | 2.11 | 54.661 |  |
| rules per second | 1,422 | 366 |  |
| memory the import added to the peak, MB | 0 | 2.696 | 64 |
| rules left out | 0 | 0 | 0 |

## What it says

- **A page costs nothing when the cache is warm.** B-01: no database read and 7 to 22 microseconds, for a page with one stylesheet
  or with the longest chain of nine, on a site with 5,000 courses as on one with 150. The work depends on the contexts on the
  path of the page, not on the size of the site.
- **A cold page costs one query.** B-02: one database read and under two milliseconds.
- **A stylesheet is compiled once.** B-03: a hit is read from the cache in 0.07 ms; after a purge, 101 requests for the longest
  chain compile its nine stylesheets nine times, not 909. Warming every stylesheet of the large site, 409 of them, takes 3.5
  seconds and leaves no page with a database read.
- **Compiling is cheap.** B-04: 500 rules in 5 ms and 2,000 in 22 ms, 400 KB and 1.6 MB of CSS. The stylesheet that a site may
  hold, 150 of the heaviest rules, is 120 KB against the cap of 256 KB.
- **The catalogue** of 821 icons is built in 11 ms once per code version and read from the cache in a few microseconds.
- **What the plugin adds to a page** is 24 to 26 microseconds over the 1.3 of a page that has the plugin disabled, against a budget
  of 1,000.
- **No cache entry is left behind.** Each context keeps exactly one compiled stylesheet, however many times it was saved.
- **Importing is streaming.** B-06: 20,000 rules in 55 seconds (366 rules per second) added 2.7 MB to the peak memory of the
  process, against a budget of 64 MB, and none was left out. The rate falls as the site has more contexts with rules, because each
  batch raises the revision of each stylesheet it touches; the memory does not depend on the size of the package.

## Not part of this run

| Item | State |
|---|---|
| B-07 The grid in a real browser | Covered by `tests/behat/performance.feature`, which passes in Firefox: the first grid of more than 800 icons draws in under 6 seconds and holds at most 250 cards, and scrolling through the whole catalogue keeps up. The numbers are budgets of the scenario, not a report. |
| B-09 Several web servers | Not measured. The cache is Moodle's, so a shared store, such as Redis, is what several servers use; the compile lock works through Moodle's lock factory for the same reason. |
| Chrome and WebKit | The suite was run in Firefox; the pipeline of the repository runs Behat with Chrome. |
| Moodle 4.0 to 5.2 | The benchmarks of the maintenance line passed on 4.0.12 when they were written; this run is on 5.3. |

## How to run it again

```bash
# default dataset, which is also part of the suite
vendor/bin/phpunit --group local_iconrestyle_performance

# a large site
ICONRESTYLE_BENCH_CATEGORIES=400 ICONRESTYLE_BENCH_COURSES=5000 ICONRESTYLE_BENCH_SYSTEM_RULES=280 \
ICONRESTYLE_BENCH_CONTEXT_RULES=12 ICONRESTYLE_BENCH_RULE_CONTEXTS=200 ICONRESTYLE_BENCH_IMPORT=20000 \
ICONRESTYLE_BENCH_REPORT=/tmp/report.json \
php -d memory_limit=3G vendor/bin/phpunit --group local_iconrestyle_performance
```

`tests/performance/storm.php` starts many operating system processes at once to prove that a stylesheet is compiled once under
concurrency, and `tests/performance/package.php` writes a package of any size for `cli/import.php`.
