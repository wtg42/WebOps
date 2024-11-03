import { createEffect, on, onCleanup, onMount } from "solid-js";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

/**
 * Terminal component that displays a remote terminal.
 *
 * @param {Object} props - The props object.
 * @param {string} props.name - The name of the terminal.
 * @param {string} props.remoteIP - The remote IP address to display.
 * @param {number} props.wsCode - The WebSocket code to close the connection.
 * @param {boolean} props.reconnect - The status of the connection.
 * @param {(value: boolean | (function(boolean): boolean)) => void} props.loadingSetter
 * - The function to change the loading status.
 * @param {(value: boolean | (function(boolean): boolean)) => void} props.reconnectSetter
 * - The function to change the connection status.
 */
function TerminalComponent(props) {
  const termName = props.name;
  /** @type {HTMLElement} */
  let terminalRef;
  let term = new Terminal({
    rows: 10,
    cols: 140,
  });

  /**
   * @type {WebSocket}
   */
  let socket = null;

  /**
   * @type {Object} messageStructure - Defines the structure of a message.
   * @property {string} type - The type of the message.
   * @property {*} data - The data of the message, can be of any type.
   */
  const messageStructure = {
    "type": "",
    "data": null,
    "target": props.remoteIP,
  };

  /**
   * Prepare the WebSocket connection.
   * @returns {void} No return value.
   */
  const initWebsocket = () => {
    if (
      socket?.readyState === WebSocket.OPEN ||
      socket?.readyState === WebSocket.CONNECTING
    ) {
      socket.close(1000, "User actively closed the connection.");

      props.loadingSetter(true);
      return;
    }

    if (socket == null || socket?.readyState === WebSocket.CLOSED) {
      props.loadingSetter(false);
      socket = null;
      // terminal 初始化結束 接著連接 WebSocket
      socket = new WebSocket("ws://localhost:8080/" + termName);
      // 監聽 WebSocket 伺服器的訊息
      socket.onmessage = (event) => {
        console.log("onmessage => ", event.data);
        term.write(`${event.data}`); // 顯示來自伺服器的訊息
      };

      // 處理 WebSocket 連線關閉
      socket.onclose = (ev) => {
        props.loadingSetter(false);

        term.write("\r\nConnection closed.\r\n");
        console.log(ev);
      };

      socket.onopen = () => {
        if (socket.readyState === WebSocket.OPEN) {
          // 發送啟動服務指令
          messageStructure.type = termName;
          messageStructure.data =
            "tail -f /var/log/php.log /var/log/apache/error.log";
          socket.send(JSON.stringify(messageStructure));
          console.log("WebSocket opened and message sent.");
          term.write(`\r\n${messageStructure.data}\r\n`);
        }
      };

      socket.onerror = (ev) => {
        term.write("\r\nConnection error.\r\n");
        console.log("ev", ev);
      };
    }
  };

  /**
   * Input buffer of terminal
   * @type {string[]}
   */
  let userInput = [];

  // Websocket 關閉狀態碼
  const closeCodes = [
    1000, // regular close
    1001, // Close the connection from the server
    1006, // Abnormal Closure (Close Code 1006)
  ];

  /**
   * 定義按鍵常數
   */
  const KEYS = {
    UP: "\x1b[A",
    DOWN: "\x1b[B",
    ENTER: "\r",
    ESC: "\x1b",
    BACKSPACE: "\x7f",
  };

  createEffect(() => {
    // 用戶主動關閉 WebSocket 的副作用區
    if (closeCodes.includes(props.wsCode)) {
      if (
        socket && socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        console.log("props.wsCode::::", props.wsCode);
        socket.close(props.wsCode, "User actively closed the connection.");

        props.loadingSetter(true);
      }
    }
  });

  createEffect(on(() => props.reconnect, (newReconnect) => {
    if (newReconnect) {
      initWebsocket();
    }
    props.reconnectSetter(false);
  }));

  // 主要功能 接受跟處理任務
  const initTerm = () => {
    // 一律先銷毀物件引用
    term.dispose();
    term = new Terminal({
      rows: 30,
      cols: 100,
    });
    term.open(terminalRef);

    // 在模擬器裡面請使用 單引號
    term.write(
      "Connecting to \x1B[1;3;31m" + props.remoteIP + "\x1B[0m \r\n$ ",
    );

    // 監聽鍵盤輸入事件
    term.onData((data) => {
      switch (data) {
        case KEYS.ENTER:
          // 如果沒有輸入任何內容
          if (userInput.length === 0) {
            term.write("\r\n$ ");
            return;
          }

          // 送出用戶的內容
          // messageStructure.type = "logs";
          messageStructure.type = "processManager";
          messageStructure.data = userInput.join("");
          messageStructure.target = props.remoteIP;
          socket.send(JSON.stringify(messageStructure));

          // 清空 buffer
          userInput = [];

          term.write("\r\n$ "); // Enter 鍵換行並重新顯示提示符
          return;
        case KEYS.BACKSPACE: {
          // 處理退格鍵 最少留 "$ " 加上一個空格
          const cursorPosion = term.buffer.active.cursorX;
          if (cursorPosion > 2) {
            term.write("\b \b");
          }
          return;
        }
        default:
          // 顯示鍵入的內容 並且存入 userInput buffer
          term.write(data);
          userInput.push(data);
          console.log(userInput.join(""));
          break;
      }
    });

    // 攔截鍵盤事件
    term.attachCustomKeyEventHandler((event) => {
      console.log("evnetkey=> ", event);
      if (event.key === "ArrowUp") {
        event.preventDefault();
        return false;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        return false;
      }
      return true;
    });
  };

  onMount(() => {
    console.log("Init the Terminal.");
    initTerm();
    // 主動讓 terminal 取得焦點產生游標效果
    terminalRef.querySelector(".xterm textarea").focus();

    initWebsocket();
  });

  onCleanup(() => {
    // 生命周期關閉時關閉 WebSocket & terminal
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, "User actively closed the connection.");
    }
    term.dispose();
  });

  return (
    <div>
      <div ref={(el) => terminalRef = el}></div>
    </div>
  );
}

export default TerminalComponent;
