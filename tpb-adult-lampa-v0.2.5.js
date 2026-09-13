/*
 * TPB Adult -> Lampa bridge
 * Version: 0.2.0
 *
 * Fixes:
 * - correct InteractionCategory lifecycle
 * - no manual comp.start()/comp.create() recursion
 * - correct activity loader access
 * - vertical catalog scrolling/focus is left to Lampa InteractionCategory
 * - real pagination
 * - meta/stream requests use the same configured base as the catalog
 * - no single-item playlist reset when starting a stream
 *
 * ES5, no external dependencies.
 */
(function () {
    'use strict';

    var PLUGIN_ID = 'tpb_adult_lampa';

    var DEFAULT_BASE = [
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56YmdlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsicG9ybnJpcHMiLCJoZW50YWkiLCJwamF2Iiwic3RyaXBjaGF0IiwieWVzcG9ybiIsInBvcm53ZXgiXSwidGJLZXkiOiJhNWVjZmJiZC1mNDRlLTQ3MWUtODA0MC1iYWY4MWRmYzQyODIiLCJkaXNhYmxlZENhdGFsb2dzIjpbInNjX2d1cyIsInNjX3RyYW5zIiwic2NfdXNhIiwic2Nfc291dGhfbWVyaWNhIiwic2NfZXVyb3BlIiwic2NfYXNpYSIsInNjX2luZGlhIiwic2Nfb2NlYW5pYSJdLCJ0cGRiQ2F0ZWdvcmllcyI6W10sInN0YXNoZGJDYXRlZ29yaWVzIjpbXSwiZ3JvdXAiOjEsImdyb3VwVG90YWwiOjZ9',
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56YmdlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsicGltcGJ1bm55Iiwia29yZWFuYmoiLCJ4aGFtc3RlciIsImhkcG9ybmdnIiwicG9ybnRyZXgiLCJmcmVzaHBvcm5vIiwiYmluZ2F0byJdLCJ0YktleSI6ImE1ZWNmYmJkLWY0NGUtNDcxZS04MDA0MC1iYWY4MWRmYzQyODIiLCJ0cGRiQ2F0ZWdvcmllcyI6W10sInN0YXNoZGJDYXRlZ29yaWVzIjpbXSwiZ3JvdXAiOjIsImdyb3VwVG90YWwiOjZ9',
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56YmdlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsiZXBvcm5lciIsInZqYXYiLCJ4dmlkZW9zIiwieG54eCIsInN4eWxhbmQiLCJ5b3VwZXJ2Il0sInRiS2V5IjoiYTVlY2ZiYmQtZjQ0ZS00NzFlLTgwNDAtYmFmODFkZmM0MjgyIiwidHBkYkNhdGVnb3JpZXMiOltdLCJzdGFzaGRiQ2F0ZWdvcmllcyI6W10sImdyb3VwIjozLCJncm91cFRvdGFsIjo2fQ',
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56ZmdlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsic3VwZXJwb3JuIiwiZnVsbHZpZGVvc3Bvcm4iLCJwb3JuaHViIiwibm90ZmFucyIsImhvcm55ZmFwIiwic2V2ZXJlcG9ybiIsImhsaW50YWlzbWlsZSIsIm1lZ2FwYWNrcyJdLCJ0YktleSI6ImE1ZWNmYmJkLWY0NGUtNDcxZS04MDAwMC1iYWY4MWRmYzQyODIiLCJ0cGRiQ2F0ZWdvcmllcyI6W10sInN0YXNoZGJDYXRlZ29yaWVlcyI6W10sImdyb3VwIjo0LCJncm91cFRvdGFsIjo2fQ',
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsic2hhcmVhbnludWRlcyIsInh4YnJpdHMiLCJoZW50YWlnYXNtIiwieG1hemEiLCJoaW5kaXh4Z2hkIiwid2VieHNlcmllcyIsIndvd3VuY3V0IiwieWVzcG9ucGxlYXNleCJdLCJ0YktleSI6ImE1ZWNmYmJkLWY0NGUtNDcxZS04MDAwMC1iYWY4MWRmYzQyODIiLCJ0cGRiQ2F0ZWdvcmllcyI6W10sInN0YXNoZGJDYXRlZ29yaWVlcyI6W10sImdyb3VwIjo1LCJncm91cFRvdGFsIjo2fQ',
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsiaG90bGVhayJdLCJ0YktleSI6ImE1ZWNmYmJkLWY0NGUtNDcxZS04MDAwMC1iYWY4MWRmYzQyODIiLCJ0cGRiQ2F0ZWdvcmllcyI6W10sInN0YXNoZGJDYXRlZ29yaWVzIjpbXSwiZ3JvdXAiOjYsImdyb3VwVG90YWwiOjZ9'
    ];

    if (window[PLUGIN_ID]) return;
    window[PLUGIN_ID] = true;

    function trimSlash(url) {
        return String(url || '').replace(/\/+$/, '');
    }

    function getBase(index) {
        var stored = Lampa.Storage.get(PLUGIN_ID + '_url', '');
        if (stored) return trimSlash(stored);

        index = typeof index === 'number' ? index : 0;
        return trimSlash(DEFAULT_BASE[index] || DEFAULT_BASE[0]);
    }

    function enc(v) {
        return encodeURIComponent(v == null ? '' : String(v));
    }

    function request(url, success, fail) {
        var network = new Lampa.Reguest();
        network.silent(url, success, fail || function () {}, false);
        return network;
    }

    function json(data) {
        if (typeof data === 'object') return data || {};
        try {
            return JSON.parse(data);
        } catch (e) {
            return {};
        }
    }

    function getManifest(callback, error) {
        var bases = DEFAULT_BASE.slice(0);
        var catalogs = [];
        var completed = 0;

        bases.forEach(function (base, index) {
            request(trimSlash(base) + '/manifest.json', function (data) {
                var manifest = json(data);

                if (manifest.catalogs && manifest.catalogs.length) {
                    manifest.catalogs.forEach(function (cat) {
                        cat._base_index = index;
                        catalogs.push(cat);
                    });
                }

                completed++;

                if (completed >= bases.length) {
                    if (!catalogs.length) {
                        if (error) error('Не удалось получить каталоги TPB Adult');
                        return;
                    }

                    callback({
                        catalogs: catalogs
                    });
                }
            }, function () {
                completed++;

                if (completed >= bases.length && !catalogs.length) {
                    if (error) error('Не удалось получить manifest TPB Adult');
                }
            });
        });
    }

    function catalogUrl(cat, extra) {
        var base = getBase(cat && cat._base_index);
        var url = base + '/catalog/' + enc(cat.type) + '/' + enc(cat.id);
        var parts = [];

        extra = extra || {};

        Object.keys(extra).forEach(function (key) {
            if (extra[key] !== undefined && extra[key] !== null && extra[key] !== '') {
                parts.push(enc(key) + '=' + enc(extra[key]));
            }
        });

        if (parts.length) url += '/' + parts.join('/');

        return url + '.json';
    }

    function metaUrl(type, id, baseIndex) {
        return getBase(baseIndex) + '/meta/' + enc(type) + '/' + enc(id) + '.json';
    }

    function streamUrl(type, id, baseIndex) {
        return getBase(baseIndex) + '/stream/' + enc(type) + '/' + enc(id) + '.json';
    }

    function normalizeMeta(item, fallbackType, baseIndex) {
        item = item || {};

        var title = item.name || item.title || 'Без названия';
        var poster = item.poster || item.background || item.logo || '';

        return {
            id: String(item.id || ''),
            type: item.type || fallbackType || 'movie',
            title: title,
            name: title,
            original_title: title,
            original_name: title,
            poster: poster,
            img: poster,
            background_image: item.background || item.banner || poster,
            release_date: item.releaseInfo ? String(item.releaseInfo).slice(0, 10) : '',
            first_air_date: item.releaseInfo ? String(item.releaseInfo).slice(0, 10) : '',
            description: item.description || '',
            overview: item.description || '',
            genre: item.genres || [],
            genres: item.genres || [],
            imdb_id: /^tt\d+$/.test(String(item.id || '')) ? String(item.id) : '',
            tpb_addon_id: String(item.id || ''),
            tpb_addon_type: item.type || fallbackType || 'movie',
            tpb_base_index: typeof baseIndex === 'number' ? baseIndex : 0
        };
    }

    function streamLabel(s, index) {
        var name = s.name || s.title || '';
        var quality = s.quality || '';
        var behavior = s.behaviorHints || {};
        var size = behavior.videoSize ?
            (' ' + Math.round(behavior.videoSize / 1073741824 * 10) / 10 + ' GB') : '';

        if (name && quality) return name + ' · ' + quality + size;
        if (name) return name + size;
        if (quality) return quality + size;

        return 'Поток ' + (index + 1);
    }

    function getPlayableUrl(s) {
        if (!s) return '';
        return s.url || s.file || s.externalUrl || '';
    }

    function playStream(s, movie) {
        var url = getPlayableUrl(s);

        if (!url) {
            Lampa.Noty.show('TPB Adult: поток без URL');
            return;
        }

        var entry = {
            url: url,
            title: movie.title || movie.name || s.title || s.name || '',
            quality: s.quality || '',
            subtitles: s.subtitles || undefined
        };

        /*
         * Do NOT call Player.playlist([entry]) here.
         * For one stream it can reset player state/position in some Lampa builds.
         */
        Lampa.Player.play(entry);
    }

    function showStreams(movie, type, id, baseIndex) {
        request(streamUrl(type, id, baseIndex), function (data) {
            var result = json(data);
            var streams = result.streams || [];

            if (!streams.length) {
                Lampa.Noty.show('TPB Adult: потоки не найдены');
                return;
            }

            var items = streams.map(function (s, i) {
                return {
                    title: streamLabel(s, i),
                    stream: s,
                    movie: movie
                };
            });

            Lampa.Select.show({
                title: movie.title || movie.name || 'Потоки',
                items: items,
                onSelect: function (item) {
                    playStream(item.stream, item.movie);
                }
            });
        }, function () {
            Lampa.Noty.show('TPB Adult: ошибка получения потоков');
        });
    }

    function openMeta(item) {
        var type = item.tpb_addon_type || item.type || 'movie';
        var id = item.tpb_addon_id || item.id;
        var baseIndex = typeof item.tpb_base_index === 'number' ? item.tpb_base_index : 0;

        request(metaUrl(type, id, baseIndex), function (data) {
            var result = json(data);
            var meta = result.meta || result;
            var movie = normalizeMeta(meta, type, baseIndex);

            movie.tpb_addon_id = id;
            movie.tpb_addon_type = type;
            movie.tpb_base_index = baseIndex;

            Lampa.Activity.push({
                url: '',
                title: movie.title,
                component: 'tpb_adult_card',
                movie: movie,
                meta: meta
            });
        }, function () {
            var movie = normalizeMeta(item, type, baseIndex);
            showStreams(movie, type, id, baseIndex);
        });
    }

    function TpbCard(object) {
        var html = $('<div></div>');
        var movie = object.movie || {};
        var streamsLoaded = false;

        this.create = function () {
            var title = movie.title || movie.name || 'TPB Adult';

            var block = $(
                '<div style="padding:2em;">' +
                    '<div style="font-size:1.7em;margin-bottom:.8em;">' +
                        escapeHtml(title) +
                    '</div>' +
                    '<div class="selector simple-button" style="display:inline-block;padding:1em 1.4em;">' +
                        '▶ Смотреть' +
                    '</div>' +
                    '<div style="margin-top:1.2em;opacity:.85;line-height:1.5;">' +
                        escapeHtml(movie.description || '') +
                    '</div>' +
                '</div>'
            );

            block.find('.simple-button').on('hover:enter', function () {
                if (streamsLoaded) return;

                streamsLoaded = true;

                showStreams(
                    movie,
                    movie.tpb_addon_type || movie.type,
                    movie.tpb_addon_id || movie.id,
                    movie.tpb_base_index || 0
                );

                setTimeout(function () {
                    streamsLoaded = false;
                }, 1000);
            });

            html.append(block);

            return html;
        };

        this.render = function () {
            return html;
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(html, html);
                    Lampa.Controller.collectionFocus(false, html);
                },
                left: function () {
                    Lampa.Controller.toggle('menu');
                },
                right: function () {},
                up: function () {
                    Lampa.Controller.toggle('head');
                },
                down: function () {},
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};

        this.destroy = function () {
            html.remove();
        };
    }

    function escapeHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /*
     * IMPORTANT:
     * InteractionCategory owns the grid, focus and vertical scrolling.
     * We only provide create/build/cardRender/nextPageReuest.
     *
     * We intentionally DO NOT override comp.start().
     */
    function TpbCatalog(object) {
        var comp = new Lampa.InteractionCategory(object);
        var catalog = object.catalog || {};
        var search = object.search || '';
        var pageSize = 20;
        var currentPage = parseInt(object.page || 1, 10);

        // InteractionCategory/next.js проверяет object.page < total_pages.
        // TPB не сообщает total_pages, поэтому разрешаем догрузку до пустой страницы.
        comp.total_pages = 999999;

        function loadPage(page, callback, fail) {
            var extra = {
                skip: (page - 1) * pageSize,
                limit: pageSize,
                maxResults: pageSize
            };

            if (search) extra.search = search;

            request(catalogUrl(catalog, extra), function (data) {
                var result = json(data);
                var metas = result.metas || [];

                callback(metas);
            }, fail);
        }

        comp.create = function () {
            /*
             * ActivitySlide invokes create() with the component context.
             * Therefore use `this.activity`, NOT the outer TpbCatalog `this`.
             */
            var activity = this.activity;
            var self = this;

            if (activity && typeof activity.loader === 'function') {
                activity.loader(true);
            }

            loadPage(currentPage, function (metas) {
                var items = metas.map(function (item) {
                    return normalizeMeta(
                        item,
                        catalog.type,
                        typeof catalog._base_index === 'number' ? catalog._base_index : 0
                    );
                });

                // TPB может вернуть больше элементов, чем запрошено.
                // Отдаём Lampa строго по 20 карточек за страницу.
                var firstPage = items.slice(0, pageSize);
                self.build({
                    results: firstPage,
                    more: metas.length > pageSize || metas.length >= pageSize,
                    collection: true
                });

                if (activity && typeof activity.loader === 'function') {
                    activity.loader(false);
                }
            }, function () {
                if (activity && typeof activity.loader === 'function') {
                    activity.loader(false);
                }

                Lampa.Noty.show('TPB Adult: каталог недоступен');
            });
        };

        comp.cardRender = function (object, element, card) {
            card.onEnter = function () {
                openMeta(element);
            };
        };

        comp.nextPageReuest = function (nextObject, resolve, reject) {
            // InteractionCategory increments object.page before calling next().
            // Prefer that page number so pagination stays synchronized with Lampa.
            var nextPage = nextObject && nextObject.page ? parseInt(nextObject.page, 10) : currentPage + 1;

            loadPage(nextPage, function (metas) {
                currentPage = nextPage;

                var items = metas.map(function (item) {
                    return normalizeMeta(
                        item,
                        catalog.type,
                        typeof catalog._base_index === 'number' ? catalog._base_index : 0
                    );
                });

                // Даже если addon вернул 50/100 записей, Lampa получает только 20.
                resolve({
                    results: items.slice(0, pageSize),
                    more: metas.length > 0
                });
            }, function (err) {
                if (reject) reject(err);
                else resolve({
                    results: [],
                    more: false
                });
            });
        };

        return comp;
    }

    function addMenu() {
        if (!Lampa.Menu || !Lampa.Menu.addButton) return;

        var icon =
            '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
            '<path d="M4 5h16M4 12h16M4 19h16"/>' +
            '</svg>';

        Lampa.Menu.addButton(icon, 'TPB Adult', function () {
            getManifest(function (manifest) {
                var catalogs = manifest.catalogs || [];

                if (!catalogs.length) {
                    Lampa.Noty.show('TPB Adult: каталогов нет');
                    return;
                }

                var items = catalogs.map(function (c) {
                    return {
                        title: c.name || c.id,
                        catalog: c
                    };
                });

                Lampa.Select.show({
                    title: 'TPB Adult',
                    items: items,
                    onSelect: function (item) {
                        Lampa.Component.add('tpb_adult_catalog', TpbCatalog);

                        Lampa.Activity.push({
                            url: '',
                            title: item.title,
                            component: 'tpb_adult_catalog',
                            catalog: item.catalog,
                            page: 1
                        });
                    },
                    onBack: function () {
                        Lampa.Controller.toggle('menu');
                    }
                });
            }, function (err) {
                Lampa.Noty.show(err || 'TPB Adult: ошибка');
            });
        });
    }

    function addFullCardButton() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite' || !e.data || !e.data.movie) return;

            var movie = e.data.movie;
            var imdb = movie.imdb_id || movie.imdb || '';

            if (!imdb) return;

            var render = e.object.activity.render().find('.view--torrent');

            if (!render.length || render.find('.tpb-adult-source').length) {
                return;
            }

            var button = $(
                '<div class="full-start__button selector view--online tpb-adult-source">' +
                    '<span>TPB Adult</span>' +
                '</div>'
            );

            button.on('hover:enter', function () {
                getManifest(function () {
                    var type = movie.number_of_seasons ? 'series' : 'movie';
                    showStreams(movie, type, imdb, 0);
                });
            });

            render.after(button);
        });
    }

    function register() {
        Lampa.Component.add('tpb_adult_card', TpbCard);

        addMenu();
        addFullCardButton();

        Lampa.Manifest.plugins = {
            type: 'video',
            version: '0.2.5',
            name: 'TPB Adult Bridge',
            description: 'Stremio TPB Adult bridge for Lampa',
            component: 'tpb_adult_card'
        };

        getManifest(function () {
            console.log('[TPB Adult] v0.2.5 ready');
        }, function (err) {
            console.warn('[TPB Adult]', err);
        });
    }

    function waitReady() {
        if (typeof Lampa === 'undefined') {
            setTimeout(waitReady, 250);
            return;
        }

        if (window.appready) {
            register();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') register();
            });
        }
    }

    waitReady();
})();
