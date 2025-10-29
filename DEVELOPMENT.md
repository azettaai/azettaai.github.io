# Development Guide

## 📁 Project Architecture

### Feature-Sliced Design

This project follows a **modular, feature-sliced architecture** that separates concerns and promotes maintainability.

```
azetta/
├── index.html          # Semantic HTML structure
├── styles.css          # Modular CSS organized by sections
├── main.js             # Feature modules in vanilla JS
├── manifest.json       # PWA configuration
├── robots.txt          # Search engine crawler rules
├── sitemap.xml         # URL structure for search engines
├── .htaccess           # Apache server configuration
├── README.md           # Project documentation
└── DEVELOPMENT.md      # This file
```

## 🏛️ Architecture Principles

### 1. Separation of Concerns
- **HTML**: Structure and content only
- **CSS**: Presentation and styling
- **JavaScript**: Behavior and interactivity

### 2. Module Pattern
Each feature in `main.js` is an independent module using the **IIFE (Immediately Invoked Function Expression)** pattern:

```javascript
const ModuleName = (function() {
    'use strict';
    
    // Private variables and functions
    let privateVar = 'secret';
    
    function privateFunction() {
        // Implementation
    }
    
    // Public API
    return {
        publicMethod: function() {
            privateFunction();
        },
        init: function() {
            // Initialize module
        }
    };
})();
```

### 3. No Dependencies (Except Anime.js)
- Pure vanilla JavaScript
- No frameworks (React, Vue, Angular)
- No build tools required
- No npm packages needed
- Optional: Anime.js for SVG animations (loaded from CDN)

## 📦 JavaScript Modules

### CircuitAnimation Module
**Purpose**: Canvas-based animated circuit background

**API:**
```javascript
CircuitAnimation.init('circuit-canvas');
```

**Responsibilities:**
- Canvas setup and resize handling
- Line animation drawing
- Performance optimization

### SVGAnimation Module
**Purpose**: Logo and icon animations using Anime.js

**API:**
```javascript
SVGAnimation.init();
```

**Responsibilities:**
- SVG element selection
- Animation timeline creation
- Loop management

### CTAHandlers Module
**Purpose**: Call-to-action button interactions

**API:**
```javascript
CTAHandlers.init();
```

**Responsibilities:**
- Button event listeners
- User interaction tracking
- Future form handling

### Analytics Module
**Purpose**: Track user behavior and performance

**API:**
```javascript
Analytics.trackPageView();
Analytics.trackEvent(action, label);
```

**Responsibilities:**
- Page view tracking
- Event tracking
- Integration ready for GA/Plausible

### Accessibility Module
**Purpose**: Enhance accessibility features

**API:**
```javascript
Accessibility.init();
```

**Responsibilities:**
- Keyboard navigation
- ARIA labels
- Reduced motion support
- Screen reader optimization

### App Module
**Purpose**: Application initialization and coordination

**API:**
```javascript
App.init();
```

**Responsibilities:**
- Module initialization
- DOM ready detection
- Error handling

## 🎨 CSS Architecture

### Organization
CSS is organized into logical sections with clear comments:

1. **CSS Variables** - Theme colors and reusable values
2. **Reset & Base** - Normalize browser defaults
3. **Component Styles** - Organized by feature
4. **Animations** - Keyframe animations
5. **Responsive** - Media queries for mobile

### Naming Convention
We use **semantic naming** based on purpose:

```css
.feature-element { }      /* Feature-based names */
.node-title { }           /* Component parts */
.arch-layer { }           /* Architecture components */
```

### CSS Custom Properties
Colors and values use CSS variables for easy theming:

```css
:root {
    --primary: #2d3748;
    --circuit-primary: #1b998b;
}
```

## 🔧 Development Workflow

### 1. Local Development

```bash
# Start a local server (choose one):

# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

### 2. Making Changes

#### Adding a New Feature Module

1. Add module to `main.js`:
```javascript
const NewFeature = (function() {
    'use strict';
    
    function init() {
        // Implementation
    }
    
    return { init: init };
})();
```

2. Initialize in App module:
```javascript
function initModules() {
    // ... existing modules
    NewFeature.init();
}
```

#### Adding New Styles

1. Add section comment in `styles.css`:
```css
/* ============================================
   NEW SECTION NAME
   ============================================ */
```

2. Add your styles with semantic class names

3. Add responsive styles in media queries if needed

#### Adding New HTML Content

1. Use semantic HTML5 elements
2. Add ARIA labels for accessibility
3. Include proper heading hierarchy
4. Add meta descriptions for new pages

### 3. Testing Checklist

Before committing changes:

- [ ] Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test keyboard navigation
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Check console for errors
- [ ] Validate HTML (W3C Validator)
- [ ] Check Lighthouse scores
- [ ] Test with slow network (throttling)
- [ ] Test with reduced motion enabled

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Update sitemap.xml with new pages
- [ ] Update robots.txt if needed
- [ ] Update manifest.json
- [ ] Generate/optimize favicon set
- [ ] Compress images
- [ ] Minify CSS and JS (optional)
- [ ] Enable HTTPS redirect in .htaccess
- [ ] Configure CSP headers
- [ ] Test on staging environment
- [ ] Run Lighthouse audit
- [ ] Check mobile responsiveness
- [ ] Verify all links work
- [ ] Test form submissions (if any)

### Build Process (Optional)

For production, you may want to:

1. **Minify CSS**:
```bash
npx clean-css-cli styles.css -o styles.min.css
```

2. **Minify JavaScript**:
```bash
npx terser main.js -o main.min.js
```

3. **Update HTML** to use minified versions

## 📊 Performance Optimization

### Current Optimizations
- Deferred script loading
- DNS prefetch for CDNs
- Browser caching (via .htaccess)
- Gzip compression
- Minimal external dependencies

### Future Optimizations
- Image lazy loading
- Critical CSS inlining
- Service worker for offline support
- Font subsetting
- WebP image format

## ♿ Accessibility Guidelines

### WCAG 2.1 Level AA Compliance

1. **Color Contrast**: Maintain 4.5:1 ratio for text
2. **Keyboard Navigation**: All interactive elements accessible via keyboard
3. **Screen Readers**: Proper ARIA labels and semantic HTML
4. **Focus Indicators**: Visible focus states on interactive elements
5. **Alternative Text**: Descriptive alt text for images
6. **Heading Structure**: Logical heading hierarchy (h1 → h2 → h3)
7. **Form Labels**: All inputs have associated labels
8. **Motion**: Respect `prefers-reduced-motion`

### Testing Tools
- **Automated**: Lighthouse, axe DevTools
- **Manual**: Keyboard navigation, screen readers
- **Browsers**: Check with different browser zoom levels

## 🐛 Debugging

### Common Issues

**Animation not working:**
- Check if Anime.js is loaded (CDN might be blocked)
- Verify browser console for errors
- Check if elements exist before animating

**Canvas not appearing:**
- Verify canvas element exists in HTML
- Check if CircuitAnimation.init() is called
- Look for JavaScript errors in console

**Styles not applying:**
- Clear browser cache
- Check CSS selector specificity
- Verify file path to styles.css

### Debug Mode

Add to main.js for verbose logging:

```javascript
const DEBUG = true;

function log(...args) {
    if (DEBUG) console.log('[Azetta]', ...args);
}
```

## 📈 Analytics Integration

To add Google Analytics:

1. Get GA tracking ID
2. Add to `<head>` of index.html:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

3. Update Analytics module in main.js to use gtag

## 🔒 Security Best Practices

### Implemented
- X-XSS-Protection header
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy
- No sensitive data in client-side code

### To Implement
- Content Security Policy (CSP)
- HTTPS everywhere (when SSL configured)
- Subresource Integrity (SRI) for CDN resources
- Regular dependency updates

## 📚 Resources

### Documentation
- [MDN Web Docs](https://developer.mozilla.org/)
- [Web.dev](https://web.dev/)
- [A11y Project](https://www.a11yproject.com/)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [W3C Validator](https://validator.w3.org/)
- [WAVE Accessibility Tool](https://wave.webaim.org/)
- [Can I Use](https://caniuse.com/)

### Libraries Used
- [Anime.js](https://animejs.com/) - SVG animation

## 🤝 Contributing

### Code Style
- Use 4 spaces for indentation
- Use single quotes in JavaScript
- Use double quotes in HTML
- Add JSDoc comments for functions
- Keep functions small and focused
- Use meaningful variable names

### Git Workflow
1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Test thoroughly
4. Create pull request
5. Code review
6. Merge to main

### Commit Messages
Follow conventional commits:
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## 📞 Support

For questions or issues:
- Email: dev@azetta.ai
- GitHub Issues: (repository URL)
- Documentation: https://azetta.ai/docs

---

Happy coding! 🚀

