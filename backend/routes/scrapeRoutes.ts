import express, { Router, Request, Response } from "express";
import { spawn } from "child_process";

const scrapeRouter: Router = express.Router();

scrapeRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ message: "URL is required" });
    return;
  }

  try {
    const py = spawn("python", ["./scripts/scrap.py", url]);
    let output = "";

    py.stdout.on("data", (data) => {
      output += data.toString();
    });

    py.stderr.on("data", (data) => {
      console.error("Python stderr:", data.toString());
    });

    py.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({ message: "Python script failed" });
      }
      try {
        const parsedOutput = JSON.parse(output);
        console.log("Scraped Text:", parsedOutput.Text);
        console.log("Scraped Images:", parsedOutput.Images);

        const formData = new URLSearchParams();
        formData.append("text", parsedOutput.Text);

        if (
          Array.isArray(parsedOutput.Images) &&
          parsedOutput.Images.length > 0
        ) {
          // Send only the first image URL to meet endpoint expectations.
          formData.append("image_url", parsedOutput.Images[0]);
        } else if (parsedOutput.Images) {
          formData.append("image_url", parsedOutput.Images);
        }

        console.log("Form data being sent:", formData.toString());

        fetch("http://127.0.0.1:8000/predict/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        })
          .then(async (response) => {
            console.log("Prediction endpoint status:", response.status);
            if (!response.ok) {
              const errText = await response.text();
              console.error("Error response body:", errText);
              throw new Error("Failed to get prediction");
            }
            return response.json();
          })
          .then((prediction) => {
            console.log("Fetched prediction:", prediction);
            // If prediction indicates class 0, run textCorrection.py with the scraped text as argument.
            if (
              prediction.prediction &&
              prediction.prediction.trim() === "Class 0"
            ) {
              const tc = spawn("python", [
                "./scripts/textCorrection.py",
                parsedOutput.Text,
              ]);
              let tcOutput = "";
              tc.stdout.on("data", (data) => {
                tcOutput += data.toString();
              });
              tc.stderr.on("data", (data) => {
                console.error("TextCorrection stderr:", data.toString());
              });
              tc.on("close", (tcCode) => {
                if (tcCode !== 0) {
                  return res.status(500).json({
                    message: "Text correction script failed",
                    rawOutput: tcOutput,
                  });
                }
                return res
                  .status(200)
                  .json({ prediction, corrected_text: tcOutput });
              });
            } else {
              return res.status(200).json({ prediction });
            }
          })
          .catch((error) => {
            console.error("Error getting prediction:", error);
            return res.status(500).json({
              message: "Failed to get prediction",
              error: error.message,
              rawOutput: output,
            });
          });
      } catch (error) {
        return res.status(500).json({
          message: "Failed to parse output",
          rawOutput: output,
        });
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
    return;
  }
});

scrapeRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ message: "Scrape route is working" });
});

export default scrapeRouter;
