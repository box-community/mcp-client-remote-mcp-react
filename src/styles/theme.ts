export interface Theme {
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
    full: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export const lightTheme: Theme = {
  colors: {
    primary: '#0061d5',
    primaryHover: '#004bb8',
    secondary: '#6c757d',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: {
      primary: '#212529',
      secondary: '#6c757d',
      muted: '#adb5bd',
    },
    border: '#dee2e6',
    error: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    info: '#17a2b8',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      xlarge: '1.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 600,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    small: '0.25rem',
    medium: '0.5rem',
    large: '1rem',
    full: '9999px',
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#0d6efd',
    primaryHover: '#0b5ed7',
    secondary: '#6c757d',
    background: '#121212',
    surface: '#1e1e1e',
    text: {
      primary: '#ffffff',
      secondary: '#adb5bd',
      muted: '#6c757d',
    },
    border: '#343a40',
    error: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    info: '#17a2b8',
  },
};