// Lưu tùy chọn vào chrome.storage
function saveOptions() {
  const responseLanguage = document.getElementById('responseLanguage').value;
  
  chrome.storage.sync.set(
    { responseLanguage: responseLanguage },
    function() {
      // Cập nhật trạng thái để thông báo người dùng
      const status = document.getElementById('status');
      status.textContent = 'Đã lưu cài đặt!';
      
      // Ẩn thông báo sau 1.5 giây
      setTimeout(function() {
        status.textContent = '';
      }, 1500);
    }
  );
}

// Khôi phục các tùy chọn đã lưu
function restoreOptions() {
  chrome.storage.sync.get(
    { responseLanguage: 'Vietnamese' },  // Mặc định là tiếng Việt
    function(items) {
      document.getElementById('responseLanguage').value = items.responseLanguage;
    }
  );
}

// Khởi tạo trang tùy chọn
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions); 