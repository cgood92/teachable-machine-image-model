import "./styles.css";
import { useRef } from "react";
import { useMachine } from "@xstate/react";

import { appMachine } from "./appMachine";

export default function App() {
  const webcamContainerRef = useRef<HTMLDivElement>(null);
  const [current, send] = useMachine(appMachine);
  const { round } = current.context;

  return (
    <>
      <div>Teachable Machine Image Model</div>
      {current.matches("uninitialized") && (
        <button
          type="button"
          onClick={() =>
            send("INIT", { webcamContainer: webcamContainerRef.current })
          }
        >
          Start
        </button>
      )}
      {current.matches("active") && (
        <button type="button" onClick={() => send("PAUSE")}>
          Pause
        </button>
      )}
      {current.matches("paused") && (
        <button type="button" onClick={() => send("PLAY")}>
          Resume
        </button>
      )}
      <div id="webcam-container" ref={webcamContainerRef}></div>
      <div>Round: {round + 1}</div>
    </>
  );
}
