import express from "express";
import { runLivePreflight } from "./parallel.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/api/health", (_req, res)=> {
    res.json({
        status: "ok",
        service: "foreshadow"
    });
});

app.get("/api/preflight", async (_req, res) => {
    try{
        const result = await runLivePreflight();

        if(!result){
            return res.status(422).json({
                error: "No validated boundary evidence found"
            });
        }
    res.json(result);
    }catch(error) {
        console.error("Preflight failed:", error);

        res.status(500).json({
            error: "PreFlight failed"
        });
    }
});

app.listen(PORT, () => {
    console.log(`FORESHADOW running on port ${PORT}`);
});
