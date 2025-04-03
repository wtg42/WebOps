import { createSignal, onMount, createEffect } from "solid-js";

function ThemeSwitch() {
  const [theme, setTheme] = createSignal("coffee");

  createEffect(() => {
    const currentTheme = theme();
    localStorage.setItem("theme", currentTheme);
    document.documentElement.dataset.theme = currentTheme;
  })

  onMount(() => {
    const currentTheme = localStorage.getItem("theme")
    console.log(currentTheme)
    if (currentTheme) {
      setTheme(currentTheme)
    }
  })


  const toggleTheme = () => {
    setTheme((prev) => {
      return prev === "coffee" ? "dark" : "coffee"
    });
  };

  return (
    <button
      class="btn"
      onClick={toggleTheme}
    >
      Switch to {theme() === "coffee" ? "dark" : "coffee"} mode
    </button>
  );
}

export default ThemeSwitch;
