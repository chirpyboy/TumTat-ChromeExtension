document.addEventListener('DOMContentLoaded', function() {
  const optionsLink = document.getElementById('options-link');
  
  if (optionsLink) {
    optionsLink.addEventListener('click', function() {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
    });
  }

  const summaryBtn = document.getElementById('summary-btn');
  if (summaryBtn) {
    summaryBtn.addEventListener('click', function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: "onClickSummaryContentMenu" 
        });
        window.close();
      });
    });
  }

  const askBtn = document.getElementById('ask-btn');
  if (askBtn) {
    askBtn.addEventListener('click', function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: "onClickAskContentMenu" 
        });
        window.close();
      });
    });
  }
}); 