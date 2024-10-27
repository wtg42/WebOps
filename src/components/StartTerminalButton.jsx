import TerminalComponent from "./TerminalComponent";

function StartTerminalConnection() {
  return (
    <div>
      <button
        class="btn"
        onClick={() => {
          document.getElementById("terminalContainer").style.display = "block";
        }}
      >
        Button
      </button>
      <div id="terminalContainer" style="display: none;">
        <TerminalComponent />
      </div>
    </div>
  );
}

export default StartTerminalConnection;
