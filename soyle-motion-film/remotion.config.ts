import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("png");
Config.setConcurrency(null);
// Set REMOTION_BROWSER to a local Chrome/Chromium if Remotion cannot download its own headless shell.
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
