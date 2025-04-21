/**
 * Mô tả: Lớp Article mô tả cấu trúc dữ liệu của một bài viết
 */
class Article {
    constructor(title = "", description = "", content = "", image = "", url = "") {
        this.title = title;
        this.description = description;
        this.content = content;
        this.image = image;
        this.url = url;
    }
}

/**
 * AIUtils: Cung cấp các tiện ích để xử lý nội dung web, YouTube và DOM
 */
window.AIUtils = {
    /**
     * Lấy ngôn ngữ phản hồi từ cài đặt
     * @returns {Promise<string>} Promise trả về ngôn ngữ phản hồi
     */
    async getResponseLanguage() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(
                { responseLanguage: 'Vietnamese' },
                function(items) {
                    resolve(items.responseLanguage);
                }
            );
        });
    },

    /**
     * Phân tích nội dung bài viết từ DOM
     * @param {Document} doc - DOM document để phân tích
     * @param {string} url - URL của trang
     * @returns {Article} Đối tượng Article chứa thông tin đã phân tích
     */
    parseArticleFromDOM(doc, url) {
        try {
            const cloneDoc = doc || document.cloneNode(true);
            const article = new Readability(cloneDoc).parse();
            
            return new Article(
                article.title,
                article.description,
                article.textContent,
                article.image,
                url
            );
        } catch(error) {
            console.error('Error parsing article from DOM:', error);
            return null;
        }
    },

    /**
     * Phân tích nội dung bài viết từ URL
     * @param {string} url - URL cần phân tích
     * @returns {Promise<Article>} Promise trả về đối tượng Article
     */
    async parseArticleFromURL(url) {
        try {
            const urlWithProxy = `https://thangnc.12h.biz/proxy.php?url=${encodeURIComponent(url)}`;
            const htmlResponse = await fetch(urlWithProxy, { 
                signal: AbortSignal.timeout(5000) 
            }).then(response => response.text());
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlResponse, 'text/html');
            
            return this.parseArticleFromDOM(doc, url);
        } catch(error) {
            console.error('Error parsing article from URL:', error);
            return null;
        }
    },

    /**
     * Kiểm tra xem trang hiện tại có phải là Medium không
     * @returns {boolean} True nếu là trang Medium
     */
    isMedium() {
        return !!document.querySelector("meta[content=Medium]");
    },

    /**
     * Kiểm tra xem bài viết Medium có yêu cầu trả phí không
     * @returns {Promise<boolean>} Promise trả về true nếu là bài Premium
     */
    async isMediumPremiumPost() {
        if (!this.isMedium()) {
            return false;
        }

        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const check = () => {
                const isPremium = document.body.textContent.includes("only available to read with a paid Medium");
                
                if (isPremium) {
                    resolve(true);
                } else {
                    const duration = Date.now() - startTime;
                    
                    if (duration > 5000) {
                        resolve(false);
                    } else {
                        setTimeout(check, 300);
                    }
                }
            };
            
            check();
        });
    },

    /**
     * Kiểm tra và tải thư viện Readability nếu cần
     * @returns {Promise<void>}
     */
    async checkReadability() {
        if (window.Readability) {
            return;
        }
        
        await this.injectJSFile("libs/Readability.min.js");
        return this.waitFor("Readability");
    },

    /**
     * Inject CSS file vào trang
     * @param {string} filePath - Đường dẫn đến file CSS
     */
    injectCSSFile(filePath) {
        const link = document.createElement('link');
        link.href = chrome.runtime.getURL(filePath);
        link.type = 'text/css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    },

    /**
     * Inject JS file vào trang
     * @param {string} filePath - Đường dẫn đến file JS
     * @returns {Promise<void>} Promise hoàn thành khi file được tải
     */
    async injectJSFile(filePath) {
        const script = document.createElement('script');
        const scriptContent = await fetch(chrome.runtime.getURL(filePath))
            .then(response => response.text());
            
        script.textContent = scriptContent;
        (document.head || document.documentElement).appendChild(script);
        
        return new Promise((resolve) => {
            script.onload = resolve;
        });
    },

    /**
     * Inject HTML content vào trang
     * @param {string} htmlString - Nội dung HTML cần inject
     */
    injectHTML(htmlString) {
        const div = document.createElement('div');
        div.innerHTML = htmlString;
        document.body.appendChild(div);
    },

    /**
     * Đợi cho đến khi các phần tử phù hợp với selector xuất hiện
     * @param {string} selector - CSS selector
     * @param {number} timeout - Thời gian timeout (ms)
     * @returns {Promise<NodeList>} Danh sách các phần tử phù hợp
     */
    async waitForElements(selector, timeout = 30000) {
        return this.waitForTrue(() => document.querySelectorAll(selector).length > 0, timeout)
            .then(() => document.querySelectorAll(selector));
    },

    /**
     * Đợi cho đến khi phần tử phù hợp với selector xuất hiện
     * @param {string} selector - CSS selector
     * @param {number} timeout - Thời gian timeout (ms)
     * @returns {Promise<Element>} Phần tử phù hợp đầu tiên
     */
    async waitForElement(selector, timeout = 30000) {
        return this.waitForTrue(() => document.querySelector(selector), timeout);
    },

    /**
     * Đợi cho đến khi một đối tượng xuất hiện trong window
     * @param {string} windowEntity - Tên đối tượng cần kiểm tra
     * @param {number} timeout - Thời gian timeout (ms)
     * @returns {Promise<any>} Đối tượng khi nó xuất hiện
     */
    async waitFor(windowEntity, timeout = 30000) {
        return this.waitForTrue(() => !!window[windowEntity], timeout)
            .then(() => window[windowEntity]);
    },

    /**
     * Đợi cho đến khi hàm callback trả về true
     * @param {Function} func - Hàm kiểm tra điều kiện
     * @param {number} timeout - Thời gian timeout (ms)
     * @returns {Promise<any>} Kết quả của hàm func
     */
    async waitForTrue(func, timeout = 30000) {
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const check = () => {
                const result = func();
                
                if (!!result) {
                    resolve(result);
                } else {
                    const duration = Date.now() - startTime;
                    
                    if (duration > timeout) {
                        reject(new Error("Timeout waiting for condition"));
                    } else {
                        setTimeout(check, 300);
                    }
                }
            };
            
            check();
        });
    },

    /**
     * Lấy context của đoạn văn bản được chọn
     * @param {Selection} selection - Đối tượng Selection
     * @param {number} contextLength - Độ dài context (số ký tự)
     * @returns {Object} Context trước, được chọn và sau
     */
    getSelectionContext(selection = window.getSelection(), contextLength = 150) {
        if (selection.rangeCount === 0) return null;
    
        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;
    
        // Hàm để lấy text từ các node
        function getTextFromNode(node, start, end) {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.slice(start, end);
            }
            return Array.from(node.childNodes)
                .map(child => getTextFromNode(child, 0, child.textContent.length))
                .join('');
        }
    
        // Hàm để lấy text trước selection
        function getTextBefore(node, offset, length) {
            let text = getTextFromNode(node, 0, offset);
            
            while (text.length < length && node.previousSibling) {
                node = node.previousSibling;
                const nodeText = getTextFromNode(node, 0, node.textContent.length);
                text = nodeText.slice(-length + text.length) + text;
            }
            
            return text.slice(-length);
        }
    
        // Hàm để lấy text sau selection
        function getTextAfter(node, offset, length) {
            let text = getTextFromNode(node, offset, node.textContent.length);
            
            while (text.length < length && node.nextSibling) {
                node = node.nextSibling;
                const nodeText = getTextFromNode(node, 0, node.textContent.length);
                text += nodeText.slice(0, length - text.length);
            }
            
            return text.slice(0, length);
        }
    
        const beforeText = getTextBefore(startContainer, range.startOffset, contextLength);
        const selectedText = range.toString();
        const afterText = getTextAfter(endContainer, range.endOffset, contextLength);
    
        return {
            before: beforeText,
            selected: selectedText,
            after: afterText
        };
    },

    /**
     * Lấy ID video YouTube từ URL
     * @param {string} url - URL của video YouTube
     * @returns {string} ID video
     */
    getYouTubeVideoId(url = location.href) {
        try {
            const urlParams = new URLSearchParams(new URL(url).searchParams);
            return urlParams.get('v');
        } catch (error) {
            console.error('Error extracting YouTube video ID:', error);
            return null;
        }
    },

    /**
     * Lấy phụ đề và thông tin video YouTube từ ID
     * @param {string} videoId - ID video YouTube
     * @returns {Promise<Object>} Thông tin video và phụ đề
     */
    async getYoutubeCaptionsFromVideoId(videoId) {
        // Hàm phân tích cú pháp XML phụ đề
        const parseTranscript = (xmlString) => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");
            const textElements = xmlDoc.querySelectorAll("transcript text");
            
            return Array.from(textElements).map((el, idx) => ({
                idx: idx,
                time: this.formatTime(parseFloat(el.getAttribute("start") || "0")),
                from: parseFloat(el.getAttribute("start") || "0"),
                to: parseFloat(el.getAttribute("start") || "0") + parseFloat(el.getAttribute("dur") || "0"),
                content: el.textContent || ""
            }));
        };

        // Lấy thông tin video
        try {
            if (!videoId) {
                throw new Error("Invalid video ID");
            }
            
            const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
            const html = await response.text();
            
            // Tìm tiêu đề video
            const titleMatch = html.match(/<title>([^<]*)<\/title>/);
            const title = titleMatch ? titleMatch[1].replace(" - YouTube", "") : "Unknown Title";
            
            // Tìm transcript_url
            const captionUrlMatch = html.match(/"captionTracks":\[\{"baseUrl":"([^"]+)"/);
            if (!captionUrlMatch) {
                return { title, captions: [] };
            }
            
            const captionUrl = captionUrlMatch[1].replace(/\\u0026/g, '&');
            const captionResponse = await fetch(captionUrl);
            const captionText = await captionResponse.text();
            
            const captions = parseTranscript(captionText);
            return { title, captions };
        } catch (error) {
            console.error('Error fetching YouTube captions:', error);
            return { title: "Error loading video", captions: [] };
        }
    },

    /**
     * Định dạng thời gian từ giây sang hh:mm:ss
     * @param {number} seconds - Thời gian tính bằng giây
     * @returns {string} Thời gian đã định dạng
     */
    formatTime(seconds) {
        seconds = Math.floor(seconds);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? (h < 10 ? "0" : "") + h + ":" : ""}${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    },

    /**
     * Ghép các phụ đề YouTube thành một chuỗi text
     * @param {Array} captions - Mảng các phụ đề
     * @returns {string} Chuỗi phụ đề đã ghép
     */
    mergeYoutubeCaptionToString(captions) {
        return captions.map(cap => cap.content).join(' ');
    },

    /**
     * Lấy tham số URL từ location hiện tại
     * @returns {URLSearchParams} Các tham số URL
     */
    getUrlParams() {
        return new URLSearchParams(window.location.search);
    },

    /**
     * Tạo iframe ẩn để tải nội dung từ URL
     * @param {string} url - URL cần tải
     * @returns {HTMLIFrameElement} Phần tử iframe đã tạo
     */
    createHiddenIframe(url) {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        return iframe;
    }
};