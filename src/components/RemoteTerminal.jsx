import { createSignal, Show } from "solid-js";
import TerminalComponent from "./TerminalComponent";
import { validateIP } from "../utils/validate-helper";

/**
 * RemoteTerminal - 遠端日誌服務串流服務
 * 包含 IP 輸入框、連線按鈕、模擬器
 *
 * @param {Object} props
 * @param {string} props.name - The name of the remote terminal.
 */
function RemoteTerminal(props) {
  const [reconnect, setReconnect] = createSignal(false);

  // 處理輸入框變化，更新信號狀態
  const [ip, setIp] = createSignal("");
  const handleInputChange = (e) => {
    setIp(e.target.value);
  };

  const [showAlert, setShowAlert] = createSignal(false);

  // Show the terminal after the user inputs the IP.
  // or reconnect the terminal
  const [showTerminal, setShowTerminal] = createSignal(false);
  const handleConnection = () => {
    // Vlidate IP first
    if (!validateIP(ip())) {
      console.log("Your IP Stirng is invalid.");
      setShowAlert(true);

      // Close the terminal that is already open if the IP is invalid
      if (showTerminal()) {
        // Interupt the terminal then close it.
        handleDisconnection();
        setShowTerminal(false);
      }
      return;
    }

    if (showTerminal()) {
      setReconnect(true);
    } else {
      setShowTerminal(true);
    }

    // 重置 close code
    setWsCode(0);
  };

  // Send a code to the terminal when the user disconnects.
  const [wsCode, setWsCode] = createSignal(0);
  const handleDisconnection = () => {
    setWsCode(1000);
  };

  // Loading Overlay control
  const [isLoading, setIsLoading] = createSignal(false);

  return (
    <div class="w-5/6 m-auto mt-24">
      <Show when={isLoading()}>
        <div
          id="loading-overlay"
          class="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-50"
        >
          <div class="loading loading-dots loading-lg"></div>
        </div>
      </Show>

      <label class="input input-bordered flex items-center gap-2 w-1/2">
        Remote IP
        <input
          value={ip()}
          type="text"
          placeholder="127.0.0.1"
          onInput={handleInputChange}
          onfocus={() => setShowAlert(false)}
        />
      </label>

      <Show when={showAlert()}>
        <div role="alert" class="alert alert-error mt-2 w-1/2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Please enter a valid IP address.</span>
        </div>
      </Show>

      <div class="flex gap-2">
        <button
          onclick={handleConnection}
          class="btn btn-outline btn-primary mt-2"
        >
          Connect
        </button>
        <button
          onclick={handleDisconnection}
          class="btn btn-outline btn-primary mt-2"
        >
          Disconnect
        </button>
      </div>

      <div class="divider"></div>

      <Show when={showTerminal()}>
        <TerminalComponent
          name={props.name}
          remoteIP={ip()}
          wsCode={wsCode()}
          reconnect={reconnect()}
          reconnectSetter={setReconnect}
          loadingSetter={setIsLoading}
          client:only="solid-js"
        />
      </Show>
    </div>
  );
}

export default RemoteTerminal;
