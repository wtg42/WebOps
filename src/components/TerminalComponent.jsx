import { onMount, onCleanup, createEffect } from 'solid-js';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

/**
 * Terminal component that displays a remote terminal.
 *
 * @param {Object} props - The props object.
 * @param {string} props.remoteIP - The remote IP address to display.
 * @param {number} props.wsCode - The WebSocket code to close the connection.
 * @param {boolean} props.reconnect - The status of the connection.
 * @param {(value: boolean | (function(boolean): boolean)) => void} props.reconnectSetter
 * - The function to change the connection status.
 */
function TerminalComponent(props) {
  /** @type {HTMLElement} */
  let terminalRef
  let term = new Terminal()

  // Mark if the terminal is disposed
  let isDisposed = false

  /**
   * @type {WebSocket}
   */
  let socket;

  /**
   * @type {string[]}
   */
  let userInput = []


  const messageStructure = {
    "type": "",
    "data": null,
  }

  // Websocket 關閉狀態碼
  const closeCodes = [
    1000, // regular close
    1001, // Close the connection from the server
    1006, // Abnormal Closure (Close Code 1006)
  ]

  /**
   * 定義按鍵常數
   * @type {{ ENTER: string; ESC: string; BACKSPACE: string }}
   */
  const KEYS = {
    UP:"\x1b[A",
    DOWN:"\x1b[B",
    ENTER: '\r',
    ESC: '\x1b',
    BACKSPACE: '\x7f'
  };

  createEffect(() => {
    // 用戶主動關閉 WebSocket 的副作用區
    if (closeCodes.includes(props.wsCode)) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(props.wsCode, "User actively closed the connection.");
      }
      isDisposed = true
    }

    // 這個變數用來判斷是否是重新連線
    if (props.reconnect) {
      initTerm()
      props.reconnectSetter(false)
    }
  })

  const initTerm = () => {
    if (socket) {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close(1000, "Reconnecting...");
      }
    }

    term.dispose()
    term = new Terminal()
    term.open(terminalRef)

    // 在模擬器裡面請使用 單引號
    term.write('Connecting to \x1B[1;3;31m' + props.remoteIP + '\x1B[0m \r\n$ ')

    // 開啟 WebSocket 連線
    socket = new WebSocket("ws://localhost:8080/ws")

    // 監聽 WebSocket 伺服器的訊息
    socket.onmessage = (event) => {
      term.write(`\r\nServer: ${event.data}\r\n$ `); // 顯示來自伺服器的訊息
    };

    // 處理 WebSocket 連線關閉
    socket.onclose = (ev) => {
      term.write("\r\nConnection closed.\r\n")
      term.write(`\r\n${ev.reason}\r\n`)
    };

    // 監聽鍵盤輸入事件
    term.onData((data) => {
      switch (data) {
        case KEYS.ENTER:
          // 如果沒有輸入任何內容
          if (userInput.length === 0) {
            term.write('\r\n$ ')
            return
          }

          // 送出用戶的內容
          messageStructure.type = "message"
          messageStructure.data = userInput.join('')
          socket.send(JSON.stringify(messageStructure))

          // 清空 buffer
          userInput = []

          term.write('\r\n$ ') // Enter 鍵換行並重新顯示提示符
          return
        case KEYS.BACKSPACE:
          // 處理退格鍵
          term.write('\b \b')
          return
        default:
          // 顯示鍵入的內容 並且存入 userInput buffer
          term.write(data)
          userInput.push(data)
          console.log(userInput.join(''))
          break
      }
    });

    // 攔截鍵盤事件
    term.attachCustomKeyEventHandler((event) => {
      console.log("evnetkey=> ", event)
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        return false
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        return false
      }
      return true
    });
  }

  onMount(() => {
    console.log("Init the Terminal.")
    initTerm()

    // 讓 terminal 取得焦點產生游標效果
    terminalRef.querySelector('.xterm textarea').focus();
  });

  onCleanup(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(props.wsCode, "User actively closed the connection.");
    }
    term.dispose();
  });

  return (
    <div>
      <div ref={el => terminalRef = el}></div>
    </div>
  );
}

export default TerminalComponent;
