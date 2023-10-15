import "./styles.css";
import { useCallback, useEffect, useRef, useState } from "react";

import * as tfjs from "@tensorflow/tfjs";
import * as tmImage from "@teachablemachine/image";

// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

let model: tmImage.CustomMobileNet | null = null;
let webcam: tmImage.Webcam | null = null;
let labelContainer: HTMLElement | null = null;
let maxPredictions: number = 0;

type InitModelAndCam = {
  webcamContainer: HTMLElement;
};

type Prediction = {
  className: string;
  probability: number;
};

// Load the image model and setup the webcam
async function initModelAndCam({ webcamContainer }: InitModelAndCam) {
  const modelURL = "/model.json";
  const metadataURL = "/metadata.json";

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // or files from your local hard drive
  // Note: the pose library adds "tmImage" object to your window (window.tmImage)
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const flip = true; // whether to flip the webcam
  webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam

  webcamContainer.appendChild(webcam.canvas);
}

export default function App() {
  const webcamContainerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

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
      setPredictions(predictions);
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
      <div id="label-container">
        {predictions.map(({ className, probability }) => (
          <div key={className}>
            {className}: {probability}
          </div>
        ))}
      </div>
    </>
  );
}
