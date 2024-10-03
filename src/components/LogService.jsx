import { createSignal, Show } from "solid-js"
import TerminalComponent from "./TerminalComponent";

/**
 * LogService - 遠端日誌服務串流服務
 * 包含 IP 輸入框、連線按鈕、模擬器
 */
function LogService() {
  const [reconnect, setReconnect] = createSignal(false)

  // 處理輸入框變化，更新信號狀態
  const [ip, setIp] = createSignal("")
  const handleInputChange = (e) => {
    setIp(e.target.value);
  };

  // Show the terminal after the user inputs the IP.
  // or reconnect the terminal
  const [showTerminal, setShowTerminal] = createSignal(false)
  const handleConnection = () => {
    if (showTerminal()) {
      setReconnect(true)
    } else {
      setShowTerminal(true)
    }

    // 重置 close code
    setWsCode(0)
  }

  // Send a code to the terminal when the user disconnects.
  const [wsCode, setWsCode] = createSignal(0)
  const handleDisconnection = () => {
    console.log("handleDisconnection", wsCode())
    setWsCode(1000)
    // setShowTerminal(false)
  }

  return (
    <div class="w-5/6 m-auto mt-24">
      <label class="input input-bordered flex items-center gap-2 w-1/2">
        Remote IP
        <input
          value={ip()}
          type="text"
          placeholder="192.168.91.63"
          onInput={handleInputChange}
        />
      </label>
      <div class="flex gap-2">
        <button
          onclick={handleConnection}
          class="btn btn-outline btn-primary mt-2">
          Connect
        </button>
        <button
          onclick={handleDisconnection}
          class="btn btn-outline btn-primary mt-2">
          Disconnect
        </button>
      </div>
      <div class="divider"></div>
      <Show when={showTerminal()}>
        <TerminalComponent
          remoteIP={ip()}
          wsCode={wsCode()}
          reconnect={reconnect()}
          reconnectSetter={setReconnect}
          client:only="solid-js"
        />
      </Show>
    </div>
  )
}

export default LogService
