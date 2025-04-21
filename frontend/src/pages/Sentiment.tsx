import TestimonialSentiment from '@/components/custom/dashboard/sentimentanalysis/TestimonialSentiment'

// Create a theme context at the top level (commented out for later implementation)
// export const ThemeContext = createContext({
//   isDark: true,
//   toggleTheme: () => {}
// });

const Sentiment = () => {
  // Theme functionality commented out for later implementation
  // const [isDarkMode, setIsDarkMode] = useState(true);
  
  // useEffect(() => {
  //   // Check if user has a theme preference saved
  //   const savedTheme = localStorage.getItem('theme');
  //   if (savedTheme) {
  //     setIsDarkMode(savedTheme === 'dark');
  //   } else {
  //     // Check system preference
  //     const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  //     setIsDarkMode(prefersDark);
  //   }
    
  //   // Apply dark mode class to the document element
  //   if (isDarkMode) {
  //     document.documentElement.classList.add('dark');
  //   } else {
  //     document.documentElement.classList.remove('dark');
  //   }
  // }, []);
  
  // // Update document class whenever dark mode changes
  // useEffect(() => {
  //   if (isDarkMode) {
  //     document.documentElement.classList.add('dark');
  //   } else {
  //     document.documentElement.classList.remove('dark');
  //   }
  //   localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  // }, [isDarkMode]);
  
  // const toggleTheme = () => {
  //   setIsDarkMode(!isDarkMode);
  // };
  
  // // Theme value to be passed to context provider
  // const themeValue = {
  //   isDark: isDarkMode,
  //   toggleTheme
  // };

  return (
    // <ThemeContext.Provider value={themeValue}>
      // Removed dark mode classes for now
      <div className="min-h-screen bg-gray-50 text-slate-800">
        <TestimonialSentiment />
      </div>
    // </ThemeContext.Provider>
  )
}

export default Sentiment