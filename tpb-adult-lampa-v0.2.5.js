/*
 * TPB Adult -> Lampa bridge
 * Version: 0.2.7
 *
 * Based on working v0.2.0
 *
 * Fixes:
 * - keeps all 6 TPB configurations
 * - keeps TPB Adult in sidebar menu
 * - keeps InteractionCategory lifecycle
 * - no manual comp.start()/comp.create() recursion
 * - correct activity loader access
 * - vertical catalog scrolling is handled by Lampa
 * - catalog pagination uses ONLY Stremio `skip`
 * - NO `limit` parameter is sent to TPB
 * - NO `maxResults` parameter is sent to TPB
 * - each catalog uses its own TPB base
 * - only first 20 received metas are passed to Lampa
 * - next pages use skip=20, skip=40, skip=60...
 * - meta/stream requests use the same base as the catalog
 * - no playlist reset when starting a stream
 *
 * ES5, no external dependencies.
 */

(function () {
    'use strict';

    var PLUGIN_ID = 'tpb_adult_lampa';
    var VERSION = '0.2.7';

    /*
     * =========================================================
     * SIX TPB CONFIGURATIONS
     * =========================================================
     *
     * IMPORTANT:
     * These URLs are preserved exactly from working v0.2.0.
     */

    var DEFAULT_BASE = [
        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56YmdlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsicG9ybnJpcHMiLCJoZW50YWkiLCJwamF2Iiwic3RyaXBjaGF0IiwieWVzcG9ybiIsInBvcm53ZXgiXSwidGJLZXkiOiJhNWVjZmJiZC1mNDRlLTQ3MWUtODA0MC1iYWY4MWRmYzQyODIiLCJkaXNhYmxlZENhdGFsb2dzIjpbInNjX2d1cyIsInNjX3RyYW5zIiwic2NfdXNhIiwic2Nfc291dGhfbWVyaWNhIiwic2NfZXVyb3BlIiwic2NfYXNpYSIsInNjX2luZGlhIiwic2Nfb2NlYW5pYSJdLCJ0cGRiQ2F0ZWdvcmllcyI6W10sInN0YXNoZGJDYXRlZ29yaWVzIjpbXSwiZ3JvdXAiOjEsImdyb3VwVG90YWwiOjZ9',

        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56YmdlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsicGltcGJ1bm55Iiwia29yZWFuYmoiLCJ4aGFtc3RlciIsImhkcG9ybmdnIiwicG9ybnRyZXgiLCJmcmVzaHBvcm5vIiwiYmluZ2F0byJdLCJ0YktleSI6ImE1ZWNmYmJkLWY0NGUtNDcxZS04MDA0MC1iYWY4MWRmYzQyODIiLCJ0cGRiQ2F0ZWdvcmllcyI6W10sInN0YXNoZGJDYXRlZ29yaWVzIjpbXSwiZ3JvdXAiOjIsImdyb3VwVG90YWwiOjZ9',

        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsiZXBvcm5lciIsInZqYXYiLCJ4dmlkZW9zIiwieG54eCIsInN4eWxhbmQiLCJ5b3VwZXJ2Il0sInRiS2V5IjoiYTVlY2ZiYmQtZjQ0ZS00NzFlLTgwNDAtYmFmODFkZmM0MjgyIiwidHBkYkNhdGVnb3JpZXMiOltdLCJzdGFzaGRiQ2F0ZWdvcmllcyI6W10sImdyb3VwIjozLCJncm91cFRvdGFsIjo2fQ',

        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsic3VwZXJwb3JuIiwiZnVsbHZpZGVvc3Bvcm4iLCJwb3JuaHViIiwibm90ZmFucyIsImhvcm55ZmFwIiwic2V2ZXJlcG9ybiIsImhsaW50YWlzbWlsZSIsIm1lZ2FwYWNrcyJdLCJ0YktleSI6ImE1ZWNmYmJkLWY0NGUtNDcxZS04MDAwMC1iYWY4MWRmYzQyODIiLCJ0cGRiQ2F0ZWdvcmllcyI6W10sInN0YXNoZGJDYXRlZ29yaWVlcyI6W10sImdyb3VwIjo0LCJncm91cFRvdGFsIjo2fQ',

        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsic2hhcmVhbnludWRlcyIsInh4YnJpdHMiLCJoZW50YWlnYXNtIiwieG1hemEiLCJoaW5kaXh4Z2hkIiwid2VieHNlcmllcyIsIndvd3VuY3V0IiwieWVzcG9ucGxlYXNleCJdLCJ0YktleSI6ImE1ZWNmYmJkLWY0NGUtNDcxZS04MDAwMC1iYWY4MWRmYzQyODIiLCJ0cGRiQ2F0ZWdvcmllcyI6W10sInN0YXNoZGJDYXRlZ29yaWVzIjpbXSwiZ3JvdXAiOjUsImdyb3VwVG90YWwiOjZ9',

        'https://tpb-adult-addon.click/eyJtYXhSZXN1bHRzIjoyMCwibWluU2VlZGVycyI6MywicHJld2FybURlYnJpZCI6ZmFsc2UsInNlcGFyYXRlQ2F0ZWdvcmllcyI6dHJ1ZSwibWVkaWFGbG93UHJveHlVcmwiOiIiLCJtZWRpYUZsb3dBcGlQYXNzd29yZCI6IiIsImFkUmVkaXJlY3RvclVybCI6IiIsImphY2tldHRVcmwiOiIiLCJ1c2VuZXRNb2RlIjoidG9yYm94IiwidXNlbmV0SW5kZXhlciI6Im56Z2JlZWsiLCJlbmFibGVkU29ydHMiOlsicmVjZW50Il0sInNvdXJjZXMiOlsiaG90bGVhayJdLCJ0YktleSI6ImE1ZWNmYmJkLWY0NGUtNDcxZS04MDAwMC1iYWY4MWRmYzQyODIiLCJ0cGRiQ2F0ZWdvcmllcyI6W10sInN0YXNoZGJDYXRlZ29yaWVzIjpbXSwiZ3JvdXAiOjYsImdyb3VwVG90YWwiOjZ9'
    ];

    if (window[PLUGIN_ID]) return;
    window[PLUGIN_ID] = true;

    function trimSlash(url) {
        return String(url || '').replace(/\/+$/, '');
    }

    /*
     * IMPORTANT:
     * Do NOT use one global stored URL here.
     *
     * Every catalog received from getManifest() contains
     * its own `_base_index`, therefore catalog #1 uses base #1,
     * catalog #2 uses base #2, etc.
     */
    function getBase(index) {
        index = typeof index === 'number' ? index : 0;

        return trimSlash(
            DEFAULT_BASE[index] || DEFAULT_BASE[0]
        );
    }

    function enc(v) {
        return encodeURIComponent(
            v == null ? '' : String(v)
        );
    }

    function request(url, success, fail) {
        var network = new Lampa.Reguest();

        network.silent(
            url,
            success,
            fail || function () {},
            false
        );

        return network;
    }

    function json(data) {
        if (typeof data === 'object') {
            return data || {};
        }

        try {
            return JSON.parse(data);
        } catch (e) {
            return {};
        }
    }

    /*
     * =========================================================
     * MANIFEST
     * =========================================================
     */

    function getManifest(callback, error) {
        var bases = DEFAULT_BASE.slice(0);
        var catalogs = [];
        var completed = 0;

        bases.forEach(function (base, index) {

            var url = trimSlash(base) + '/manifest.json';

            console.log(
                '[TPB Adult] MANIFEST REQUEST',
                index + 1,
                url
            );

            request(
                url,
                function (data) {

                    var manifest = json(data);

                    if (
                        manifest.catalogs &&
                        manifest.catalogs.length
                    ) {

                        manifest.catalogs.forEach(function (cat) {

                            /*
                             * Remember which of the six TPB bases
                             * owns this catalog.
                             */
                            cat._base_index = index;

                            catalogs.push(cat);
                        });
                    }

                    completed++;

                    if (completed >= bases.length) {

                        if (!catalogs.length) {

                            if (error) {
                                error(
                                    'Не удалось получить каталоги TPB Adult'
                                );
                            }

                            return;
                        }

                        callback({
                            catalogs: catalogs
                        });
                    }

                },
                function (err) {

                    console.warn(
                        '[TPB Adult] MANIFEST ERROR',
                        index + 1,
                        err
                    );

                    completed++;

                    if (
                        completed >= bases.length &&
                        !catalogs.length
                    ) {

                        if (error) {
                            error(
                                'Не удалось получить manifest TPB Adult'
                            );
                        }
                    }
                }
            );
        });
    }

    /*
     * =========================================================
     * CATALOG URL
     * =========================================================
     *
     * IMPORTANT:
     *
     * TPB accepts:
     *
     *   /catalog/type/id/skip=0.json
     *   /catalog/type/id/skip=20.json
     *   /catalog/type/id/skip=40.json
     *
     * DO NOT add:
     *
     *   limit=20
     *   maxResults=20
     *
     * Those produce HTTP 404 on the current addon.
     */

    function catalogUrl(cat, extra) {

        var base = getBase(
            cat && cat._base_index
        );

        var url =
            base +
            '/catalog/' +
            enc(cat.type) +
            '/' +
            enc(cat.id);

        var parts = [];

        extra = extra || {};

        Object.keys(extra).forEach(function (key) {

            if (
                extra[key] !== undefined &&
                extra[key] !== null &&
                extra[key] !== ''
            ) {

                parts.push(
                    enc(key) +
                    '=' +
                    enc(extra[key])
                );
            }
        });

        if (parts.length) {
            url += '/' + parts.join('/');
        }

        return url + '.json';
    }

    /*
     * =========================================================
     * META / STREAM
     * =========================================================
     */

    function metaUrl(type, id, baseIndex) {

        return (
            getBase(baseIndex) +
            '/meta/' +
            enc(type) +
            '/' +
            enc(id) +
            '.json'
        );
    }

    function streamUrl(type, id, baseIndex) {

        return (
            getBase(baseIndex) +
            '/stream/' +
            enc(type) +
            '/' +
            enc(id) +
            '.json'
        );
    }

    /*
     * =========================================================
     * NORMALIZE META
     * =========================================================
     */

    function normalizeMeta(
        item,
        fallbackType,
        baseIndex
    ) {

        item = item || {};

        var title =
            item.name ||
            item.title ||
            'Без названия';

        var poster =
            item.poster ||
            item.background ||
            item.logo ||
            '';

        return {

            id: String(item.id || ''),

            type:
                item.type ||
                fallbackType ||
                'movie',

            title: title,
            name: title,
            original_title: title,
            original_name: title,

            poster: poster,
            img: poster,

            background_image:
                item.background ||
                item.banner ||
                poster,

            release_date:
                item.releaseInfo ?
                String(item.releaseInfo).slice(0, 10) :
                '',

            first_air_date:
                item.releaseInfo ?
                String(item.releaseInfo).slice(0, 10) :
                '',

            description:
                item.description ||
                '',

            overview:
                item.description ||
                '',

            genre:
                item.genres ||
                [],

            genres:
                item.genres ||
                [],

            imdb_id:
                /^tt\d+$/.test(
                    String(item.id || '')
                )
                    ? String(item.id)
                    : '',

            /*
             * Internal TPB information.
             */
            tpb_addon_id:
                String(item.id || ''),

            tpb_addon_type:
                item.type ||
                fallbackType ||
                'movie',

            tpb_base_index:
                typeof baseIndex === 'number'
                    ? baseIndex
                    : 0
        };
    }

    /*
     * =========================================================
     * STREAMS
     * =========================================================
     */

    function streamLabel(s, index) {

        var name =
            s.name ||
            s.title ||
            '';

        var quality =
            s.quality ||
            '';

        var behavior =
            s.behaviorHints ||
            {};

        var size =
            behavior.videoSize
                ? (
                    ' ' +
                    Math.round(
                        behavior.videoSize /
                        1073741824 *
                        10
                    ) / 10 +
                    ' GB'
                )
                : '';

        if (name && quality) {
            return (
                name +
                ' · ' +
                quality +
                size
            );
        }

        if (name) {
            return name + size;
        }

        if (quality) {
            return quality + size;
        }

        return 'Поток ' + (index + 1);
    }

    function getPlayableUrl(s) {

        if (!s) return '';

        return (
            s.url ||
            s.file ||
            s.externalUrl ||
            ''
        );
    }

    function playStream(s, movie) {

        var url = getPlayableUrl(s);

        if (!url) {

            Lampa.Noty.show(
                'TPB Adult: поток без URL'
            );

            return;
        }

        var entry = {

            url: url,

            title:
                movie.title ||
                movie.name ||
                s.title ||
                s.name ||
                '',

            quality:
                s.quality ||
                '',

            subtitles:
                s.subtitles ||
                undefined
        };

        /*
         * Do NOT call Player.playlist([entry]).
         */
        Lampa.Player.play(entry);
    }

    function showStreams(
        movie,
        type,
        id,
        baseIndex
    ) {

        request(

            streamUrl(
                type,
                id,
                baseIndex
            ),

            function (data) {

                var result = json(data);

                var streams =
                    result.streams ||
                    [];

                if (!streams.length) {

                    Lampa.Noty.show(
                        'TPB Adult: потоки не найдены'
                    );

                    return;
                }

                var items =
                    streams.map(
                        function (s, i) {

                            return {

                                title:
                                    streamLabel(
                                        s,
                                        i
                                    ),

                                stream: s,

                                movie: movie
                            };
                        }
                    );

                Lampa.Select.show({

                    title:
                        movie.title ||
                        movie.name ||
                        'Потоки',

                    items: items,

                    onSelect:
                        function (item) {

                            playStream(
                                item.stream,
                                item.movie
                            );
                        }
                });

            },

            function () {

                Lampa.Noty.show(
                    'TPB Adult: ошибка получения потоков'
                );
            }
        );
    }

    /*
     * =========================================================
     * OPEN META
     * =========================================================
     */

    function openMeta(item) {

        var type =
            item.tpb_addon_type ||
            item.type ||
            'movie';

        var id =
            item.tpb_addon_id ||
            item.id;

        var baseIndex =
            typeof item.tpb_base_index === 'number'
                ? item.tpb_base_index
                : 0;

        request(

            metaUrl(
                type,
                id,
                baseIndex
            ),

            function (data) {

                var result =
                    json(data);

                var meta =
                    result.meta ||
                    result;

                var movie =
                    normalizeMeta(
                        meta,
                        type,
                        baseIndex
                    );

                movie.tpb_addon_id =
                    id;

                movie.tpb_addon_type =
                    type;

                movie.tpb_base_index =
                    baseIndex;

                Lampa.Activity.push({

                    url: '',

                    title:
                        movie.title,

                    component:
                        'tpb_adult_card',

                    movie:
                        movie,

                    meta:
                        meta
                });
            },

            function () {

                var movie =
                    normalizeMeta(
                        item,
                        type,
                        baseIndex
                    );

                showStreams(
                    movie,
                    type,
                    id,
                    baseIndex
                );
            }
        );
    }

    /*
     * =========================================================
     * TPB CARD
     * =========================================================
     */

    function TpbCard(object) {

        var html =
            $('<div></div>');

        var movie =
            object.movie || {};

        var streamsLoaded =
            false;

        this.create =
            function () {

                var title =
                    movie.title ||
                    movie.name ||
                    'TPB Adult';

                var block = $(

                    '<div style="padding:2em;">' +

                        '<div style="' +
                            'font-size:1.7em;' +
                            'margin-bottom:.8em;' +
                        '">' +

                            escapeHtml(
                                title
                            ) +

                        '</div>' +

                        '<div class="' +
                            'selector simple-button" ' +
                            'style="' +
                                'display:inline-block;' +
                                'padding:1em 1.4em;' +
                            '">' +

                            '▶ Смотреть' +

                        '</div>' +

                        '<div style="' +
                            'margin-top:1.2em;' +
                            'opacity:.85;' +
                            'line-height:1.5;' +
                        '">' +

                            escapeHtml(
                                movie.description ||
       
