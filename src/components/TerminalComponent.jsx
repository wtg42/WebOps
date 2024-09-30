import { onMount } from 'solid-js';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

function TerminalComponent() {
  /** @type {HTMLElement} */
  let terminalRef;
  const term = new Terminal()

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

  onMount(() => {
    term.open(terminalRef);

    // 在模擬器裡面請使用 單引號
    term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m \r\n$ ')

    // 開啟 WebSocket 連線
    socket = new WebSocket("ws://localhost:8080/ws")

    // 監聽 WebSocket 伺服器的訊息
    socket.onmessage = (event) => {
      term.write(`\r\nServer: ${event.data}\r\n$ `); // 顯示來自伺服器的訊息
    };

    // 處理 WebSocket 連線關閉
    socket.onclose = () => {
      term.write("\r\nConnection closed.\r\n")
    };

    // 監聽鍵盤輸入事件
    term.onData((data) => {
      // 簡單處理 Enter 鍵，並重新顯示提示符
      if (data === '\r') {
        messageStructure.type = "message"
        messageStructure.data = userInput.join('')
        socket.send(JSON.stringify(messageStructure))
        userInput = []
        term.write('\r\n$ ') // Enter 鍵換行並重新顯示提示符
      } else if (data === '\u007F') {
        // 處理退格鍵
        term.write('\b \b')
      } else {
        // 顯示鍵入的內容
        term.write(data)
        userInput.push(data)
        console.log(userInput.join(''))
      }
    });
  });

  return (
    <div>
      <div ref={el => terminalRef = el}></div>
    </div>
  );
}

export default TerminalComponent;
