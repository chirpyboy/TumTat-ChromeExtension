/**
 * AI Summary Content - Background Service Worker
 * Quản lý context menu và các chức năng chạy nền cho extension
 */

// Constants
const MENU_ITEMS = {
  SUMMARY: "summaryContentMenu",
  TRANSLATE: "translateContentMenu",
  ASK: "askContentMenu"
};

const MENU_TITLES = {
  [MENU_ITEMS.SUMMARY]: "Summarize content 📝",
  [MENU_ITEMS.TRANSLATE]: "Translate content 🌐",
  [MENU_ITEMS.ASK]: "Q&A about content 💬"
};

const MENU_CONTEXTS = {
  [MENU_ITEMS.SUMMARY]: ["page", "link", "selection"],
  [MENU_ITEMS.TRANSLATE]: ["selection"],
  [MENU_ITEMS.ASK]: ["page", "link", "selection"]
};

const KEYBOARD_COMMAND = "trigger-ai-summary";

/**
 * Khởi tạo context menu và event handlers khi extension được cài đặt
 */
const initializeExtension = () => {
  // Tạo các menu items
  Object.entries(MENU_ITEMS).forEach(([key, id]) => {
    chrome.contextMenus.create({
      id,
      title: MENU_TITLES[id],
      contexts: MENU_CONTEXTS[id]
    });
  });
};

/**
 * Xử lý sự kiện khi người dùng nhấn phím tắt
 * @param {string} command - Lệnh phím tắt được kích hoạt
 */
const handleKeyboardCommand = (command) => {
  if (command === KEYBOARD_COMMAND) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "onClickSummaryContentMenu",
          source: "keyboard_shortcut",
          linkUrl: "",
          selectionText: ""
        });
      }
    });
  }
};

/**
 * Xử lý sự kiện khi người dùng click vào context menu
 * @param {Object} info - Thông tin liên quan đến click
 * @param {Object} tab - Tab hiện tại
 */
const handleContextMenuClick = (info, tab) => {
  const menuActions = {
    [MENU_ITEMS.SUMMARY]: () => {
      chrome.tabs.sendMessage(tab.id, {
        action: "onClickSummaryContentMenu", 
        linkUrl: info.linkUrl || "", 
        selectionText: info.selectionText || ""
      });
    },
    [MENU_ITEMS.TRANSLATE]: () => {
      chrome.tabs.sendMessage(tab.id, {
        action: "onClickTranslateContentMenu", 
        selectionText: info.selectionText || ""
      });
    },
    [MENU_ITEMS.ASK]: () => {
      chrome.tabs.sendMessage(tab.id, {
        action: "onClickAskContentMenu", 
        linkUrl: info.linkUrl || "", 
        selectionText: info.selectionText || ""
      });
    }
  };

  const action = menuActions[info.menuItemId];
  if (action) {
    action();
  }
};

/**
 * Xử lý tin nhắn đến từ content scripts
 * @param {Object} request - Nội dung tin nhắn
 * @param {Object} sender - Thông tin người gửi
 * @param {Function} sendResponse - Hàm callback để trả lời
 */
const handleMessage = (request, sender, sendResponse) => {
  if (request.action === "createGeminiTab") {
    chrome.tabs.create({url: "https://gemini.google.com/app"}, (tab) => {
      // Đợi 1.5 giây để tab tải xong, sau đó gửi nội dung
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, {
          action: "sendGeminiMessage", 
          content: request.content, 
          title: request.title
        });
      }, 1500);
    });
  }
};

// Đăng ký các event listeners
chrome.runtime.onInstalled.addListener(initializeExtension);
chrome.commands.onCommand.addListener(handleKeyboardCommand);
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
chrome.runtime.onMessage.addListener(handleMessage);
