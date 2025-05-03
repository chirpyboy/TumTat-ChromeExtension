/**
 * AI Summary Content - Content Script
 * Xử lý tương tác với trang web và hiển thị popup Gemini
 */

(async function() {
    // Utils instance
    const Utils = window.AIUtils;

    /**
     * MobileBubbleMenu: Quản lý giao diện menu bubble trên thiết bị di động
     */
    const MobileBubbleMenu = {
        // Biến lưu trữ các phần tử DOM
        bubbleElement: null,
        menuItemsElement: null,
        
        /**
         * Khởi tạo menu bubble
         */
        initialize() {
            // Tạo các phần tử CSS cho menu bubble
            this.injectStyles();
            
            // Tạo phần tử HTML cho menu bubble
            this.createMenuElements();
            
            // Đăng ký các sự kiện
            this.registerEventListeners();
            
            return this;
        },
        
        /**
         * Thêm CSS cho menu bubble vào trang
         */
        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                /* Menu Bubble Styles */
                #mobile-menu-bubble {
                    display: none; /* Mặc định ẩn trên desktop */
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 42px; /* Giảm 30% từ 60px */
                    height: 42px; /* Giảm 30% từ 60px */
                    background-color: #4285f4;
                    border-radius: 50%;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    z-index: 100000001;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
            
                #mobile-menu-bubble .bubble-icon {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                    color: white;
                    font-size: 18px; /* Giảm kích thước font */
                }
                
                #mobile-menu-bubble .bubble-icon img {
                    width: 70%;
                    height: 70%;
                    object-fit: contain;
                }
            
                #mobile-menu-bubble:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
                }
            
                #mobile-menu-items {
                    position: fixed;
                    bottom: 70px; /* Điều chỉnh lại vị trí để phù hợp với bubble nhỏ hơn */
                    right: 20px;
                    display: none;
                    flex-direction: column;
                    gap: 10px;
                    z-index: 100000001;
                }
            
                #mobile-menu-items.active {
                    display: flex;
                    animation: fadeInUp 0.3s ease forwards;
                }
            
                .mobile-menu-item {
                    background-color: white;
                    color: #333;
                    padding: 10px 15px;
                    border-radius: 20px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
            
                .mobile-menu-item:hover {
                    background-color: #f5f5f5;
                    transform: translateX(-5px);
                }
            
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            
                /* Chỉ hiển thị trên thiết bị di động và tablet */
                @media only screen and (max-width: 1024px) {
                    #mobile-menu-bubble {
                        display: block;
                    }
                }
                
                /* Mobile class cho popup modal */
                #ai-popup-modal.mobile {
                    width: 100vw !important;
                    height: 100vh !important;
                }
                
                #ai-popup-modal.mobile .iframe-wrapper {
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 0 !important;
                }
            `;
            document.head.appendChild(style);
        },
        
        /**
         * Tạo phần tử HTML cho menu bubble
         */
        createMenuElements() {
            // Tạo menu bubble
            this.bubbleElement = document.createElement('div');
            this.bubbleElement.id = 'mobile-menu-bubble';
            
            // Lấy URL icon của extension
            const iconURL = chrome.runtime.getURL('images/ai_icon_32.png');
            
            this.bubbleElement.innerHTML = `
                <div class="bubble-icon">
                    <img src="${iconURL}" alt="AI Extension">
                </div>
            `;
            
            // Tạo menu items
            this.menuItemsElement = document.createElement('div');
            this.menuItemsElement.id = 'mobile-menu-items';
            this.menuItemsElement.innerHTML = `
                <div class="mobile-menu-item" data-action="summaryContentMenu">
                    <span>📝</span> Summarize content
                </div>
                <div class="mobile-menu-item" data-action="translateContentMenu">
                    <span>🌐</span> Translate content
                </div>
                <div class="mobile-menu-item" data-action="askContentMenu">
                    <span>💬</span> Q&A about content
                </div>
            `;
            
            // Thêm vào body
            document.body.appendChild(this.bubbleElement);
            document.body.appendChild(this.menuItemsElement);
        },
        
        /**
         * Đăng ký các sự kiện cho menu bubble
         */
        registerEventListeners() {
            // Hiển thị/ẩn menu khi click vào bubble
            this.bubbleElement.addEventListener('click', () => {
                this.menuItemsElement.classList.toggle('active');
            });
            
            // Đóng menu khi click ra ngoài
            document.addEventListener('click', (event) => {
                if (!this.bubbleElement.contains(event.target) && !this.menuItemsElement.contains(event.target)) {
                    this.menuItemsElement.classList.remove('active');
                }
            });
            
            // Xử lý khi click vào menu item
            const menuOptions = this.menuItemsElement.querySelectorAll('.mobile-menu-item');
            menuOptions.forEach(item => {
                item.addEventListener('click', async function() {
                    const action = this.getAttribute('data-action');
                    
                    // Gọi trực tiếp các hàm xử lý tương ứng
                    const googleSearchPattern = /google\.com(\.vn)?\/search/;
                    try {
                        // Handle Google search results
                        if (action === "summaryContentMenu" && googleSearchPattern.test(location.href)) {
                            const searchQuery = Utils.getUrlParams().get("q");
                            await ContentHandler.handleGoogleSearchSummary(searchQuery);
                        } 
                        // Handle content summary
                        else if (action === "summaryContentMenu") {
                            await ContentHandler.handleSummaryContent({
                                linkUrl: "",
                                selectionText: ""
                            });
                        } 
                        // Handle content translation
                        else if (action === "translateContentMenu") {
                            await ContentHandler.handleTranslateContent({
                                selectionText: ""
                            });
                        } 
                        // Handle content Q&A
                        else if (action === "askContentMenu") {
                            await ContentHandler.handleAskContent({
                                linkUrl: "",
                                selectionText: ""
                            });
                        }
                    } catch (error) {
                        console.error("Error handling menu item click:", error);
                    }
                    
                    // Đóng menu sau khi click
                    document.getElementById('mobile-menu-items').classList.remove('active');
                });
            });
        },
        
        /**
         * Hiển thị bubble
         */
        show() {
            if (this.bubbleElement) {
                this.bubbleElement.style.display = 'block';
            }
        },
        
        /**
         * Ẩn bubble
         */
        hide() {
            if (this.bubbleElement) {
                this.bubbleElement.style.display = 'none';
                // Đồng thời ẩn menu items
                this.menuItemsElement.classList.remove('active');
            }
        }
    };

    /**
     * AIPopup: Quản lý giao diện popup AI
     */
    const AIPopup = {
        // Properties
        isVisible: false,
        element: null,
        iframe: null,
        btnSidebar: null,
        btnClose: null,
        
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
                    this.btnClose = this.element.querySelector(".close-popup");
                    // Kiểm tra kích thước màn hình và thêm class mobile nếu cần
                    this.checkAndAddMobileClass();
                    
                    // Thêm event listener cho sự kiện resize
                    window.addEventListener('resize', this.checkAndAddMobileClass.bind(this));
                    
                    // Đăng ký event listeners
                    this.element.addEventListener("click", this.handleDocumentClick.bind(this));
                    this.btnSidebar.addEventListener("click", this.handleSidebarButtonClick.bind(this));
                    this.btnClose.addEventListener("click", this.hide.bind(this));
                    
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
         * Kiểm tra kích thước màn hình và thêm class mobile nếu cần
         */
        checkAndAddMobileClass() {
            if (window.innerWidth <= 1024) {
                this.element.classList.add('mobile');
            } else {
                this.element.classList.remove('mobile');
            }
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
            
            // Ẩn menu bubble khi popup hiển thị
            MobileBubbleMenu.hide();
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
            
            // Hiển thị lại menu bubble khi popup ẩn
            MobileBubbleMenu.show();
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
                
                const languagePrompt = `Hãy tóm tắt nội dung sau một cách dễ hiểu nhất bằng tiếng ${responseLanguage}, nội dung bao gồm 4 phần, 1 là tiêu đề bài viết, 2 là nội dung chính được tóm gọn trong 3-5 câu, 3 là các thông tin chi tiết được liệt kê dưới dạng bullet, 4 là tóm tắt ngắn gọn những kiến thức mới được rút ra từ nội dung trên giúp mở rộng tầm hiểu biết của tôi, hãy trả lời thẳng vào câu hỏi, không cần giới thiệu kiểu "Here is the summary of the content:".`;
                
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

    // Khởi tạo menu bubble cho thiết bị di động
    MobileBubbleMenu.initialize();
})();

console.log("AI Chrome Extension V2")