tailwind.config = {  
  theme: {  
    extend: {  
      fontFamily: {  
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],  
      },  
      fontSize: {  
        xs: ['1.2rem', { lineHeight: '1.5' }],  
        sm: ['1.4rem', { lineHeight: '1.5' }],  
        base: ['1.6rem', { lineHeight: '1.7' }],  
      },  
      colors: {  
        primary: { DEFAULT: '#0066FF', hover: '#0052CC' },  
        notice:  { bg: '#FFF8E1', text: '#B8860B', border: '#B8860B' },  
        informative: { bg: '#E3F2FD', text: '#1565C0', border: '#1565C0' },  
        positive: { bg: '#E8F5E9', text: '#2E7D32', border: '#2E7D32' },  
        negative: { text: '#D32F2F' },  
        divider: { DEFAULT: '#E0E0E0' },  
        'text-secondary': '#757575',  
        'text-link': '#1064D1',  
      }
    }
  }
};
