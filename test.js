// ==UserScript==
// @name         谷歌搜索结果统计增强器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  让谷歌搜索结果的统计信息更加醒目显示
// @author       阿飞
// @match        https://*.google.com/search*
// @match        https://*.google.co.*/search*
// @match        https://*.google.com.*/search*
// @include      https://*.google.*/search*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let isUpdating = false;

    // 检查是否为谷歌搜索结果页面
    function isGoogleSearchPage() {
        // 检查URL路径
        const path = window.location.pathname;
        if (!path.includes('/search')) {
            return false;
        }

        // 检查是否存在关键元素
        const hasSearchForm = document.querySelector('form[role="search"]') ||
                             document.querySelector('input[name="q"]') ||
                             document.querySelector('#searchform');

        const hasResultStats = document.querySelector('#result-stats');

        // 检查是否为谷歌域名
        const hostname = window.location.hostname;
        const isGoogleDomain = /\.?google\.[a-z]{2,}$/i.test(hostname) ||
                              hostname === 'google.com' ||
                              hostname.startsWith('www.google.');

        return isGoogleDomain && hasSearchForm && hasResultStats;
    }

    // 等待页面加载完成
    function enhanceSearchStats() {
        // 首先检查是否为谷歌搜索页面
        if (!isGoogleSearchPage()) {
            return;
        }

        const resultStats = document.querySelector('#result-stats');

        if (resultStats && !isUpdating) {
            isUpdating = true;

            // 移除旧的增强条
            const oldContainer = document.querySelector('#enhanced-search-stats');
            if (oldContainer) {
                oldContainer.remove();
            }

            // 创建增强的统计信息容器
            const enhancedContainer = document.createElement('div');
            enhancedContainer.id = 'enhanced-search-stats';
            enhancedContainer.style.cssText = `
                background: linear-gradient(135deg, #4285f4, #34a853);
                color: white;
                padding: 12px 20px;
                margin: 10px 0;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                text-align: center;
                position: relative;
                overflow: hidden;
                border: 2px solid #1a73e8;
            `;

            // 添加动画效果
            enhancedContainer.style.animation = 'slideIn 0.3s ease-out';

            // 复制原始统计文本并美化
            const statsText = resultStats.textContent.trim();
            enhancedContainer.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; gap: 15px;">
                    <span style="font-size: 20px;">📊</span>
                    <span>${statsText}</span>
                    <span style="font-size: 20px;">⚡</span>
                </div>
            `;

            // 添加CSS动画
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                #enhanced-search-stats:hover {
                    transform: scale(1.02);
                    transition: transform 0.2s ease;
                }

                /* 隐藏原始统计信息 */
                #result-stats {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);

            // 插入到搜索结果区域的顶部
            const searchResults = document.querySelector('#search') ||
                                 document.querySelector('main') ||
                                 document.querySelector('#rso');

            if (searchResults) {
                searchResults.insertBefore(enhancedContainer, searchResults.firstChild);
            } else {
                resultStats.parentNode.insertBefore(enhancedContainer, resultStats);
            }

            isUpdating = false;
        }
    }

    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceSearchStats);
    } else {
        enhanceSearchStats();
    }

    // 监听URL变化（处理SPA路由变化）
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

    // 也监听popstate事件（浏览器前进后退）
    window.addEventListener('popstate', function() {
        setTimeout(function() {
            if (isGoogleSearchPage()) {
                enhanceSearchStats();
            }
        }, 500);
    });

})();