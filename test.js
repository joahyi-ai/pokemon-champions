// ==UserScript==
// @name         谷歌搜索结果统计增强器
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  让谷歌搜索结果的统计信息更加醒目显示
// @author       阿飞
// @include      https://*.google.*/search*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 如果在 iframe 中运行则直接退出，防止递归
    if (window.self !== window.top) return;

    let isUpdating = false;
    let styleInjected = false;

    function getSearchQuery() {
        const params = new URLSearchParams(window.location.search);
        return params.get('q') || '';
    }

    function extractResultCount(text) {
        const match = text.match(/[\d,\.]+/);
        return match ? match[0] : '0';
    }

    function isGoogleSearchPage() {
        const path = window.location.pathname;
        if (!path.includes('/search')) return false;

        const hasSearchForm = document.querySelector('form[role="search"]') ||
                             document.querySelector('input[name="q"]') ||
                             document.querySelector('#searchform');
        const hasResultStats = document.querySelector('#result-stats');
        const hostname = window.location.hostname;
        const isGoogleDomain = /\.?google\.[a-z]{2,}$/i.test(hostname) ||
                              hostname === 'google.com' ||
                              hostname.startsWith('www.google.');

        return isGoogleDomain && hasSearchForm && hasResultStats;
    }

    function injectStyle() {
        if (styleInjected) return;
        styleInjected = true;

        const style = document.createElement('style');
        style.textContent = `
            #enhanced-search-stats {
                display: flex;
                gap: 12px;
                margin: 14px 0;
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
            }

            .stats-card {
                flex: 1;
                background: #fff;
                border: 1px solid #e5e5e5;
                border-radius: 12px;
                padding: 16px 20px;
                transition: box-shadow 0.2s ease;
            }

            .stats-card:hover {
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            }

            .stats-label {
                font-size: 11px;
                font-weight: 500;
                color: #86868b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
            }

            .stats-value {
                font-size: 22px;
                font-weight: 600;
                color: #1d1d1f;
                letter-spacing: -0.3px;
            }

            .stats-value.loading {
                color: #c7c7cc;
            }

            #result-stats {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    function fetchIntitleCount(query) {
        return new Promise(function(resolve) {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `/search?q=${encodeURIComponent('intitle:"' + query + '"')}`;
            iframe.onload = function() {
                try {
                    const stats = iframe.contentDocument.querySelector('#result-stats');
                    resolve(stats ? extractResultCount(stats.textContent) : '0');
                } catch(e) {
                    resolve('-');
                } finally {
                    iframe.remove();
                }
            };
            iframe.onerror = function() {
                iframe.remove();
                resolve('-');
            };
            document.body.appendChild(iframe);
        });
    }

    async function enhanceSearchStats() {
        if (!isGoogleSearchPage() || isUpdating) return;

        const resultStats = document.querySelector('#result-stats');
        if (!resultStats) return;

        isUpdating = true;
        injectStyle();

        const oldContainer = document.querySelector('#enhanced-search-stats');
        if (oldContainer) oldContainer.remove();

        const totalCount = extractResultCount(resultStats.textContent);
        const query = getSearchQuery();

        const container = document.createElement('div');
        container.id = 'enhanced-search-stats';
        container.innerHTML = `
            <div class="stats-card">
                <div class="stats-label">Total Results</div>
                <div class="stats-value">${totalCount}</div>
            </div>
            <div class="stats-card">
                <div class="stats-label">intitle:"${query}"</div>
                <div class="stats-value loading" id="intitle-count">--</div>
            </div>
        `;

        const searchResults = document.querySelector('#search') ||
                             document.querySelector('main') ||
                             document.querySelector('#rso');

        if (searchResults) {
            searchResults.insertBefore(container, searchResults.firstChild);
        } else {
            resultStats.parentNode.insertBefore(container, resultStats);
        }

        isUpdating = false;

        const intitleCount = await fetchIntitleCount(query);
        const intitleEl = document.querySelector('#intitle-count');
        if (intitleEl) {
            intitleEl.textContent = intitleCount;
            intitleEl.classList.remove('loading');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceSearchStats);
    } else {
        enhanceSearchStats();
    }

    let currentUrl = window.location.href;
    const urlChangeObserver = new MutationObserver(function() {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            setTimeout(enhanceSearchStats, 500);
        }
    });

    urlChangeObserver.observe(document, {
        childList: true,
        subtree: true
    });

    window.addEventListener('popstate', function() {
        setTimeout(function() {
            if (isGoogleSearchPage()) {
                enhanceSearchStats();
            }
        }, 500);
    });

})();
