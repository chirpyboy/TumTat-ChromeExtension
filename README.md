# TumTat - Free AI Summary and Asking

![TumTat Logo](images/ai_icon_32.png)

## Introduction

TumTat is a Chrome extension that helps users leverage the power of AI to summarize, translate, and search for information from web content. Using Gemini AI technology, TumTat provides smart features that help users save time and improve efficiency when browsing the web.

## Key Features

- **Content Summarization**: Summarize any web page with a single click
- **Content Translation**: Translate selected text into various languages
- **Smart Q&A**: Ask questions about the current page's content
- **Multiple Source Support**: Works with news sites, articles, Google searches, and YouTube videos
- **Multilingual**: Supports multiple response languages
- **Shortcuts**: Quick access with Ctrl+Shift+S (Windows) or Command+Shift+S (Mac)

## Installation

### From Chrome Web Store

1. Visit [TumTat on Chrome Web Store](#) *(Link will be updated after upload)*
2. Click the "Add to Chrome" button
3. Confirm the extension installation

### Manual Installation

1. Download the source code from [GitHub Repository](https://github.com/yourusername/TumTat)
2. Extract the downloaded ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked" and select the extracted folder

## How to Use

### Summarize Web Pages

1. Visit the web page you want to summarize
2. Right-click and select "Summarize content 📝" from the context menu
3. Or click on the TumTat icon in the toolbar and select "Summarize current page"

### Translate Content

1. Select the text you want to translate
2. Right-click and select "Translate content 🌐" from the context menu

### Q&A About Content

1. Visit a web page with content you're interested in
2. Right-click and select "Ask questions from content 💬" from the context menu
3. Or select a specific text segment before right-clicking

## Customization Options

1. Click on the TumTat icon in the toolbar
2. Select "Settings" from the popup menu
3. Adjust the AI response language according to your preference

## Privacy

TumTat respects user privacy:
- We do not store or collect personal data
- Content is processed locally and sent directly to the Gemini API
- The extension only requests the minimum permissions necessary for its functionality

## Troubleshooting

If you encounter issues when using TumTat:

1. **Extension not displaying**: Make sure the extension is activated in `chrome://extensions/`
2. **Summary not working**: Some websites with content protection measures may prevent TumTat from accessing
3. **Gemini not responding**: Check your internet connection and try refreshing the page

## System Requirements

- **Browser**: Google Chrome 88 or later
- **Operating System**: Windows, macOS, Linux
- **Internet Connection**: Required to connect to the Gemini API

## Development

### Project Structure

```
popup_version/
├── background.js       # Service worker for background tasks
├── content.js          # Script interacting with page content
├── utils.js            # Utility functions
├── popup.js            # Popup interface handling
├── options.js          # Settings management
├── manifest.json       # Extension configuration
├── css/                # CSS files
│   ├── content.css
│   ├── popup.css
│   └── gemini-styles.css
├── libs/               # External libraries
│   ├── Readability.min.js  # Mozilla Readability for content parsing
│   └── hystModal/      # Modal popup framework
└── images/             # Image resources
```

### Technologies Used

- JavaScript
- Chrome Extension API
- Gemini AI API
- Mozilla Readability.js
- hystModal

## Contributing

We welcome all contributions to improve TumTat:

1. Fork this repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or suggestions, please contact us at [chienthang9124@@gmail.com](mailto:chienthang9124@@gmail.com)

---

*Developed with ❤️ by ThangNC