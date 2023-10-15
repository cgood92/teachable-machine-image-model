import "./styles.css";
import { useCallback, useEffect, useRef, useState } from "react";

import * as tmImage from "@teachablemachine/image";

const SELECTED_CLASS_PROBABILITY_THRESHOLD = 0.7;
let model: tmImage.CustomMobileNet | null = null;
let webcam: tmImage.Webcam | null = null;
let classLabels: string[] | null = null;

type InitModelAndCam = {
  webcamContainer: HTMLElement;
};

type Prediction = {
  className: string;
  probability: number;
};

async function initModelAndCam({ webcamContainer }: InitModelAndCam) {
  const modelURL = "/model.json";
  const metadataURL = "/metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  classLabels = model.getClassLabels();

  // Convenience function to setup a webcam
  const flip = true; // whether to flip the webcam
  webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam

  webcamContainer.appendChild(webcam.canvas);
}

export default function App() {
  const webcamContainerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  //const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [currentSelectedClassName, setCurrentSelectedClassName] = useState<
    string | null
  >(null);
  const [round, setRound] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const init = useCallback(async () => {
    if (!webcam) {
      await initModelAndCam({ webcamContainer: webcamContainerRef.current! });
    }
    await webcam?.play();

    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    setPlaying(false);
    webcam?.pause();
  }, []);

  useEffect(() => {
    let loopRequest: number | null = null;

    async function loop() {
      webcam!.update();
      await predict();
      loopRequest = window.requestAnimationFrame(loop);
    }

    async function predict() {
      const predictions = await model!.predict(webcam!.canvas);
      //setPredictions(predictions);

      const recognized = predictions.some(({ className, probability }) => {
        if (probability >= SELECTED_CLASS_PROBABILITY_THRESHOLD) {
          setCurrentSelectedClassName(className);

          const isShowingCorrectAnswer = className === classLabels?.[round];
          if (isShowingCorrectAnswer) {
            correctAnswer();
          }

          return true;
        }
      });

      function correctAnswer() {
        setRound((previous) => {
          if (previous < (classLabels?.length || 0)) {
            return previous + 1;
          } else {
            setIsWon(true);
          }

          return previous;
        });
      }

      if (!recognized) {
        setCurrentSelectedClassName(null);
      }
    }

    const stop = () => {
      if (loopRequest != null) window.cancelAnimationFrame(loopRequest);
    };

    if (playing) {
      loop();
    } else {
      stop();
    }

    return stop;
  }, [playing]);

  return (
    <>
      <div>Teachable Machine Image Model</div>
      <button type="button" onClick={init}>
        Start
      </button>
      <button type="button" onClick={stop}>
        Pause
      </button>
      <div id="webcam-container" ref={webcamContainerRef}></div>
      <div>Currently showing: {currentSelectedClassName}</div>
      <div>Round: {round + 1}</div>
      <div>Did you win? {JSON.stringify(isWon)}</div>
    </>
  );
}
