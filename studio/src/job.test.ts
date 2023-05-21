import { Job } from "./job";
import { Reminder } from "./packages/reminder/reminder";
import { DateTime } from "luxon";
import { Self } from "./recipient";

it("sends reminders on time", () => {
    const self = new Self();
    const reminder = new Reminder(self, {
        title: "title",
        description: "description",
    });
    const settings = {
        startUnix: DateTime.now().plus(1000).toUnixInteger(),
        intervalMilliseconds: 100,
        limit: 3,
    };

    const job = new Job(Date.now().toString(), [reminder], settings);
    job.run();
    expect(job.runCount).toBe(3);
});
