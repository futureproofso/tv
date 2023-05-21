import { Reminder } from "./reminder";
import { Self } from "../../recipient";

it("has a title", () => {
    const self = new Self();
    const reminder = new Reminder(self, { title: "title" });
    expect(reminder.name).toBe("reminder");
    expect(reminder.properties.title).toBe("title");
    expect(reminder.properties.description).toBe(undefined);
});

it("optionally has a description", () => {
    const self = new Self();
    const reminder = new Reminder(self, {
        title: "title",
        description: "description",
    });
    expect(reminder.name).toBe("reminder");
    expect(reminder.properties.title).toBe("title");
    expect(reminder.properties.description).toBe("description");
});
