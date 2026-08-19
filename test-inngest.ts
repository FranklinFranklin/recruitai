import { Inngest } from "inngest";
const inngest = new Inngest({ id: "my-app" });
inngest.createFunction(
  { id: "my-func" },
  { event: "my.event" },
  async ({ event, step }) => {}
);
