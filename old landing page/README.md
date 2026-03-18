# Azetta.ai - Website

Revolutionary white-box AI architecture built from quantum mechanical principles.

## 🏗️ Project Structure

This project follows a **modular, feature-sliced design** with separation of concerns:

```
azetta/
├── index.html          # Main HTML with semantic markup and SEO optimizations
├── styles.css          # Modular CSS with organized sections
├── main.js             # Feature-sliced vanilla JavaScript modules
└── README.md           # Project documentation
```

## 📦 Features

### Modular Architecture
- **Separated concerns**: HTML structure, CSS styles, and JavaScript logic are in separate files
- **Feature-sliced design**: JavaScript organized into independent modules:
  - `CircuitAnimation`: Canvas-based circuit line animation
  - `SVGAnimation`: Anime.js-powered SVG animations
  - `CTAHandlers`: Call-to-action button interactions
  - `Analytics`: Performance and user tracking
  - `Accessibility`: A11y enhancements and ARIA labels
  - `App`: Main application initialization

### SEO Optimizations
- **Meta tags**: Comprehensive meta tags for search engines
- **Open Graph**: Full OG tags for social media sharing
- **Twitter Cards**: Optimized for Twitter previews
- **Structured Data**: JSON-LD schema markup for Organization, SoftwareApplication, and WebSite
- **Semantic HTML**: Proper use of `<section>`, `<article>`, `<header>`, `<nav>`, etc.
- **Canonical URLs**: Proper canonical link tags
- **Performance**: Preconnect and DNS prefetch for external resources

### Accessibility Features
- **ARIA labels**: Comprehensive aria-label and aria-labelledby attributes
- **Keyboard navigation**: Full keyboard support with tabindex
- **Semantic roles**: Proper role attributes for screen readers
- **Reduced motion**: Respects `prefers-reduced-motion` user preference
- **Alt text**: Descriptive labels for all visual elements

### Performance Optimizations
- **Deferred scripts**: Scripts loaded with `defer` attribute
- **Preconnect**: DNS prefetching for external CDNs
- **Modular loading**: Separate CSS and JS files for better caching
- **Optimized animations**: Hardware-accelerated CSS animations

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, but recommended)

### Installation

1. Clone or download this repository
2. Open the project folder
3. Serve the files using a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

4. Open your browser and navigate to `http://localhost:8000`

### Direct Usage
Simply open `index.html` in your web browser for basic viewing (some features may require a web server).

## 📝 Code Organization

### HTML (`index.html`)
- Semantic HTML5 structure
- SEO-optimized meta tags
- Accessibility attributes (ARIA)
- Structured data (JSON-LD)
- Clean, readable markup

### CSS (`styles.css`)
Organized into logical sections:
1. **CSS Variables**: Color palette and theme variables
2. **Reset & Base Styles**: Consistent baseline styles
3. **Hero Section**: Landing area with logo and tagline
4. **SVG Styling**: Logo and icon styles
5. **Brand & Typography**: Text and heading styles
6. **Data Flow Section**: Feature cards grid
7. **Node Grid**: Interactive node components
8. **Architecture Section**: System diagram
9. **Terminal Section**: Command-line demo
10. **CTA Section**: Call-to-action area
11. **Responsive Design**: Mobile-first breakpoints

### JavaScript (`main.js`)
Modular feature-sliced architecture using the **Module Pattern**:

```javascript
// Each feature is an IIFE (Immediately Invoked Function Expression)
const FeatureModule = (function() {
    'use strict';
    
    // Private functions and variables
    function privateFunction() { }
    
    // Public API
    return {
        publicMethod: function() { }
    };
})();
```

**Modules:**
- `CircuitAnimation`: Background animation system
- `SVGAnimation`: Logo animation controller
- `CTAHandlers`: User interaction handlers
- `Analytics`: Tracking and metrics
- `Accessibility`: A11y enhancements
- `App`: Main initialization

## 🎨 Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary: #2d3748;
    --accent: #e07a5f;
    --light: #f4f1de;
    --circuit-primary: #1b998b;
    --circuit-accent: #ed217c;
}
```

### Content
Edit text content directly in `index.html` while maintaining semantic structure.

### Animations
Modify animation parameters in `main.js`:
- Circuit animation: `CircuitAnimation` module
- SVG animation: `SVGAnimation` module

## 🔧 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📊 Performance

- **Lighthouse Score Target**: 95+ across all metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **Total Blocking Time**: < 200ms
- **Cumulative Layout Shift**: < 0.1

## ♿ Accessibility

- **WCAG 2.1 Level AA** compliant
- Screen reader compatible
- Keyboard navigation support
- Color contrast ratios meet standards
- Reduced motion support

## 🔍 SEO Checklist

- ✅ Meta descriptions and titles
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Structured data (JSON-LD)
- ✅ Semantic HTML
- ✅ Canonical URLs
- ✅ Alt text for images
- ✅ Descriptive link text
- ✅ Mobile-friendly design
- ✅ Fast loading times

## 🛠️ Future Enhancements

Planned improvements:
- [ ] Add sitemap.xml
- [ ] Implement robots.txt
- [ ] Add Progressive Web App (PWA) support
- [ ] Integrate analytics (Google Analytics / Plausible)
- [ ] Add blog section
- [ ] Implement dark/light theme toggle
- [ ] Add multi-language support
- [ ] Create API documentation section

## 📄 License

All rights reserved © Azetta.ai

## 🤝 Contributing

This is a proprietary project. For inquiries, contact: info@azetta.ai

## 📞 Contact

- Website: [azetta.ai](https://azetta.ai)
- Email: info@azetta.ai
- Twitter: [@azettaai](https://twitter.com/azettaai)
- GitHub: [azettaai](https://github.com/azettaai)

---

Built with ❤️ using vanilla JavaScript, modern CSS, and semantic HTML.

