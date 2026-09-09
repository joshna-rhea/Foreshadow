import {
  LlmAgent,
  InMemoryRunner
} from "@google/adk";

async function main() {
  const agent = new LlmAgent({
    name: "foreshadow_test_agent",
    model: "gemini-3.6-flash",
    instruction:
      "Reply with exactly: FORESHADOW ADK ONLINE"
  });

  const runner = new InMemoryRunner({
    agent,
    appName: "foreshadow"
  });

  const session =
    await runner.sessionService.createSession({
      appName: "foreshadow",
      userId: "test-user"
    });

  for await (const event of runner.runAsync({
    userId: session.userId,
    sessionId: session.id,
    newMessage: {
      role: "user",
      parts: [
        {
          text: "Confirm the agent is running."
        }
      ]
    }
  })) {
    console.dir(event, { depth: null });
  }
}

main().catch((error) => {
  console.error("ADK smoke test failed:");
  console.error(error);
  process.exitCode = 1;
});

