/**
 * AI Summary Content - Content Script
 * Xử lý tương tác với trang web và hiển thị popup Gemini
 */

(async function() {
    // Utils instance
    const Utils = window.AIUtils;

    /**
     * AIPopup: Quản lý giao diện popup AI
     */
    const AIPopup = {
        // Properties
        isVisible: false,
        element: null,
        iframe: null,
        btnSidebar: null,
        
        /**
         * Khởi tạo và trả về instance của popup
         * @returns {Object} instance của AIPopup
         */
        async initialize() {
            if (!this.element) {
                try {
                    // Tải nội dung HTML
                    const htmlURL = chrome.runtime.getURL('popup.html');
                    const fetchResult = await fetch(htmlURL);
                    const html = await fetchResult.text();
                    
                    // Inject HTML vào trang
                    Utils.injectHTML(html);
                    
                    // Lưu trữ tham chiếu đến các phần tử
                    this.element = document.getElementById("ai-popup-modal");
                    this.btnSidebar = this.element.querySelector(".btn-sidebar");
                    this.iframe = this.element.querySelector("iframe");
                    
                    // Đăng ký event listeners
                    this.element.addEventListener("click", this.handleDocumentClick.bind(this));
                    this.btnSidebar.addEventListener("click", this.handleSidebarButtonClick.bind(this));
                    
                    // Đăng ký listener cho sự kiện message từ iframe
                    window.addEventListener("message", (event) => {
                        if (event.data && event.data.action === "onAIIframeLoaded") {
                            window.AIIframeLoaded = true;
                        } else if (event.data && event.data.action === "onPressESC") {
                            this.hide();
                        }
                    });
                } catch (error) {
                    console.error("Error initializing AIPopup:", error);
                }
            }else{
                window.AIIframeLoaded = false;
                this.iframe.src = ""
                this.iframe.src = "https://gemini.google.com/app"
            }
            
            return this;
        },
        
        /**
         * Hiển thị popup
         */
        show() {
            if (this.isVisible) {
                return;
            }
            
            this.isVisible = true;
            this.element.classList.add("visible");
            this.element.style.display = "flex";
        },
        
        /**
         * Ẩn popup
         */
        hide() {
            if (!this.isVisible) {
                return;
            }
            
            this.isVisible = false;
            this.element.classList.remove("visible");
            this.element.style.display = "none";
        },
        
        /**
         * Chuyển đổi sang chế độ sidebar
         */
        handleSidebarButtonClick() {
            this.element.classList.add("left-side");
        },
        
        /**
         * Xử lý sự kiện click trên overlay
         * @param {MouseEvent} event - Sự kiện click
         */
        handleDocumentClick(event) {
            // Đóng popup khi click ra ngoài iframe
            if (event.target === this.element) {
                this.hide();
            }
        }
    };

    /**
     * ContentHandler: Xử lý các chức năng chính của extension
     */
    const ContentHandler = {
        /**
         * Xử lý chức năng tóm tắt nội dung từ kết quả Google Search
         * @param {string} searchQuery - Query tìm kiếm hiện tại
         * @returns {Promise<void>}
         */
        async handleGoogleSearchSummary(searchQuery) {
            try {
                // Lấy ngôn ngữ từ cài đặt
                const responseLanguage = await Utils.getResponseLanguage();

                // Lấy các liên kết từ kết quả tìm kiếm
                const linkElements = [...document.querySelectorAll("#search a[data-ved]")];
                const validLinks = linkElements
                    .map(element => element.href)
                    .filter(href => !href.includes("youtube.com") && !href.includes("facebook.com") && !href.includes(".pdf"))
                    .slice(0, 5);
                
                // Phân tích nội dung các bài viết từ các liên kết
                const articles = await Promise.all(
                    validLinks.map(url => Utils.parseArticleFromURL(url))
                );
                
                // Tạo nội dung tham chiếu cho AI
                const refContents = articles
                    .filter(article => article !== null)
                    .map(article => {
                        return `<article>
                            <title>${article.title}</title>
                            <content>${article.content.substring(0, 5000)}</content>
                        </article>`;
                    })
                    .join("\n");
                
                // Tạo prompt cho AI
                const languagePrompt = `<require>Always answer in ${responseLanguage}</require>`;

                const prompt = `<role>The user is searching on Google, your task is to use the Google search results content to answer the user's question</role>
${languagePrompt}
<search-query>${searchQuery}</search-query>
<reference-articles>
    ${refContents}
</reference-articles>`;
                
                // Hiển thị popup và gửi prompt tới Gemini
                const popup = await AIPopup.initialize();
                popup.show();
                
                await Utils.waitFor("AIIframeLoaded");
                popup.iframe.contentWindow.postMessage({
                    action: "sendAIMessage",
                    prompt: prompt
                }, "*");
            } catch (error) {
                console.error("Error handling Google Search summary:", error);
            }
        },
        
        /**
         * Xử lý nội dung từ URL, YouTube hoặc văn bản được chọn
         * @param {Object} options - Tùy chọn cho chức năng
         * @returns {Promise<Object>} Nội dung và tiêu đề đã xử lý
         */
        async processContent(options) {
            const { linkUrl, selectionText } = options;
            let webContent = null;
            let title = document.title;
            
            try {
                // Xử lý nếu có URL
                if (linkUrl) {
                    // Kiểm tra nếu là YouTube
                    const youtubeId = linkUrl.includes("youtube.com") ? Utils.getYouTubeVideoId(linkUrl) : undefined;
                    
                    if (youtubeId) {
                        // Lấy phụ đề từ video YouTube
                        const videoInfo = await Utils.getYoutubeCaptionsFromVideoId(youtubeId);
                        webContent = Utils.mergeYoutubeCaptionToString(videoInfo.captions);
                        title = videoInfo.title;
                    } else {
                        // Xử lý đặc biệt cho Medium articles
                        let finalUrl = linkUrl;
                        if (linkUrl.includes("https://medium.com/")) {
                            const url = new URL(linkUrl);
                            const pathParts = url.pathname.split("/");
                            finalUrl = "https://readmedium.com/" + pathParts[pathParts.length - 1] + url.search;
                            
                            // Tạo iframe ẩn cho Medium
                            setTimeout(() => {
                                Utils.createHiddenIframe(linkUrl);
                            }, 1000);
                        }
                        
                        // Phân tích nội dung từ URL
                        const article = await Utils.parseArticleFromURL(finalUrl);
                        if (article) {
                            webContent = article.content;
                            title = article.title;
                        }
                    }
                } 
                // Xử lý nếu đang ở trang YouTube
                else if (location.href.includes("youtube.com/watch?v=")) {
                    const youtubeId = Utils.getYouTubeVideoId();
                    const videoInfo = await Utils.getYoutubeCaptionsFromVideoId(youtubeId);
                    webContent = Utils.mergeYoutubeCaptionToString(videoInfo.captions);
                    title = videoInfo.title;
                }
                // Xử lý nếu có đoạn văn bản được chọn
                else if (selectionText && selectionText.length > 300) {
                    webContent = selectionText;
                }
                // Mặc định lấy toàn bộ nội dung trang
                else {
                    webContent = document.body.innerText;
                }
                
                return { webContent, title };
            } catch (error) {
                console.error("Error processing content:", error);
                return { webContent: document.body.innerText, title };
            }
        },
        
        /**
         * Xử lý chức năng tóm tắt nội dung
         * @param {Object} options - Các tùy chọn
         * @returns {Promise<void>}
         */
        async handleSummaryContent(options) {
            try {
                const { webContent, title } = await this.processContent(options);
                const responseLanguage = await Utils.getResponseLanguage();
                
                const languagePrompt = `Trình bày lại nội dung sau một cách dễ hiểu nhất ${responseLanguage}:`;
                
                const prompt = `${languagePrompt}
Title: 
\`\`\`${title}\`\`\`
Content:
\`\`\`${webContent}\`\`\``;
                
                const popup = await AIPopup.initialize();
                popup.show();
                
                await Utils.waitFor("AIIframeLoaded");
                popup.iframe.contentWindow.postMessage({
                    action: "sendAIMessage",
                    prompt: prompt
                }, "*");
            } catch (error) {
                console.error("Error handling content summary:", error);
            }
        },
        
        /**
         * Xử lý chức năng hỏi đáp từ nội dung
         * @param {Object} options - Các tùy chọn
         * @returns {Promise<void>}
         */
        async handleAskContent(options) {
            try {
                const { webContent, title } = await this.processContent(options);
                const responseLanguage = await Utils.getResponseLanguage();
                
                const languagePrompt = `remember to answer in ${responseLanguage}`;
                
                const prompt = `<role>Content analyst who answers user questions</role>
<required>Remember the following content and just answer 'I have remembered the content you sent, please ask me any question you want about this content' and say nothing more, the user will ask you later, ${languagePrompt}</required>
<web_page_title>${title}</web_page_title>
<web_page_content>${webContent}</web_page_content>`;
                
                const popup = await AIPopup.initialize();
                popup.show();
                
                await Utils.waitFor("AIIframeLoaded");
                popup.iframe.contentWindow.postMessage({
                    action: "sendAIMessage",
                    prompt: prompt
                }, "*");
            } catch (error) {
                console.error("Error handling ask content:", error);
            }
        },
        
        /**
         * Xử lý chức năng dịch nội dung
         * @param {Object} options - Các tùy chọn
         * @returns {Promise<void>}
         */
        async handleTranslateContent(options) {
            try {
                const context = Utils.getSelectionContext();
                const responseLanguage = await Utils.getResponseLanguage();
                
                const prompt = `<role>Translator, translate from English to ${responseLanguage} or vice versa</role>
<require>Translate the main content (main_text) below, keep the answer concise</require>
<before_text>${context.before}</before_text>
<main_text>${context.selected}</main_text>
<after_text>${context.after}</after_text>
<result_format>
    ### Main text (Only show if main_text is less than 100 words)
    ### Translated text
</result_format>`;
                
                const popup = await AIPopup.initialize();
                popup.show();
                
                await Utils.waitFor("AIIframeLoaded");
                popup.iframe.contentWindow.postMessage({
                    action: "sendAIMessage",
                    prompt: prompt
                }, "*");
            } catch (error) {
                console.error("Error handling translation:", error);
            }
        }
    };

    // Lắng nghe tin nhắn từ background script
    chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
        const googleSearchPattern = /google\.com(\.vn)?\/search/;
        
        try {
            // Handle Google search results
            if (request.action === "onClickSummaryContentMenu" && googleSearchPattern.test(location.href)) {
                const searchQuery = Utils.getUrlParams().get("q");
                await ContentHandler.handleGoogleSearchSummary(searchQuery);
            } 
            // Handle content summary
            else if (request.action === "onClickSummaryContentMenu") {
                await ContentHandler.handleSummaryContent({
                    linkUrl: request.linkUrl,
                    selectionText: request.selectionText
                });
            } 
            // Handle content translation
            else if (request.action === "onClickTranslateContentMenu") {
                await ContentHandler.handleTranslateContent({
                    selectionText: request.selectionText
                });
            } 
            // Handle content Q&A
            else if (request.action === "onClickAskContentMenu") {
                await ContentHandler.handleAskContent({
                    linkUrl: request.linkUrl,
                    selectionText: request.selectionText
                });
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    });
})();

console.log("AI Chrome Extension V2")