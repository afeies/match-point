import { createApp } from "./app.js";
import { seedDemoData } from "./seed.js";

const port = Number(process.env.PORT) || 3000;
const app = createApp();

seedDemoData();

app.listen(port, () => {
  console.log(`match-point listening on http://localhost:${port}`);
});
