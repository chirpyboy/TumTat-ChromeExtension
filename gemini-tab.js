/**
 * Gemini Tab Controller
 * Manages communication between the Gemini AI iframe and the parent window.
 */
(async function() {
    const Utils = window.AIUtils;

    // Notify parent when AI iframe is loaded
    Utils.waitForElement(".ql-editor.textarea").then(() => {
        console.log("SEND onAIIframeLoaded")
        window.parent.postMessage({
            action: "onAIIframeLoaded",
            data: "Nội dung tin nhắn từ iframe"
        }, "*");
    })

    // Hide user query element when available
    Utils.waitForElement("user-query").then(element => {
        element.style.display = "none";
    })

    // Listen for message events from parent window
    window.addEventListener("message", async event => {
        if (event.data.action === "sendAIMessage") {
            const prompt = event.data.prompt;
            const messageElement = await Utils.waitForElement(".ql-editor.textarea");
            messageElement.textContent = prompt;
            
            const submitButton = await Utils.waitForElement("[data-mat-icon-name=\"send\"]");
            submitButton.click();
        }
    });

    // Handle ESC key to notify parent window
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' || event.key === 'Esc') {
            window.parent.postMessage({
                action: "onPressESC"
            }, "*");
        }
    });

    //[data-mat-icon-name="send"]
    //.ql-editor.textarea
    /**
     * Executes a callback when the document is fully loaded
     * @param {Function} callback - Function to execute when document is ready
     */
    function onDocumentLoad(callback) {
        if (document.readyState === 'complete') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    }

    // Listen for Chrome extension messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "sendGeminiMessage") {
            const { content: webContent, title } = request;
            
            const prompt = `Analyze the web page content and prepare a web page summary report which has a key takeaway and a summary in bullet points.

                ### Key Takeaway
                A single most important takeaway from the text in Vietnamese
                
                ### Summary
                Summarize the web page here in bullet-points. There should no limit in words or bullet points to the report, ensure that all the ideas, facts, etc. are concisely reported out. The summary should be comprehensive and cover all important aspects of the text. Do not use any emoji.
                
                [WEB PAGE TITLE]:
                ${title}
                
                [WEB PAGE CONTENT]:
                ${webContent}`;

            onDocumentLoad(() => {
                document.querySelector(".ql-editor.textarea").textContent = prompt;
                setTimeout(() => {
                    document.querySelector("[data-mat-icon-name=\"send\"]").click();
                }, 200);
            });
        }
    });
})()