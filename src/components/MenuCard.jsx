import { createSignal, Match, onCleanup, onMount, Switch } from "solid-js";

/**
 * 首頁選單卡片
 */
function MenuCard(props) {
  // 打字效果的全文
  const fullText = "tail -f /var/log/php.log /var/log/apache/error.log";
  // 打字效果的暫存變數
  const [displayedText, setDisplayedText] = createSignal("");
  // 打字效果的游標
  const [blinkCursor, setblinkCursor] = createSignal(true);

  /** @type { number } 打字效果計時器 */
  let typingInterval;

  /** 打字效果 */
  const typingEffect = () => {
    let i = 0;
    typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText((displayedText) => displayedText + fullText.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);
  };

  /** @type { number } 游標閃爍計時器 */
  let cursorInterval;

  const blinkCursorEffect = () => {
    cursorInterval = setInterval(() => {
      setblinkCursor((blinkCursor) => !blinkCursor);
    }, 500);
  };

  onMount(() => {
    // setDisplayedText(fullText)
    typingEffect();
    blinkCursorEffect();
  });

  onCleanup(() => {
    clearInterval(typingInterval);
  });

  const handleOpenLogPage = () => {
    console.log("Hi There!!");
    console.log(props.name);
    window.location.href = "/log";
  };

  return (
    <Switch
      fallback={
        <div class="mockup-code w-full h-64">
          <pre data-prefix="$" class="bg-warning text-warning-content">
            💀
            <code>
              In Development
              {blinkCursor() && <span class="cursor">|</span>}
            </code>
          </pre>
        </div>
      }
    >
      <Match when={props.name === "logs"}>
        <div onclick={handleOpenLogPage} class="mockup-code w-full h-64">
          <pre data-prefix="$">
            <code>
              {displayedText()}
              {blinkCursor() && <span class="cursor">|</span>}
            </code>
          </pre>
        </div>
      </Match>
    </Switch>
  );
}

export default MenuCard;
