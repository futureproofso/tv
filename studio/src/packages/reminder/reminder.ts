import { Self } from "../../recipient";
import { Package } from "../base";

export type ReminderProperties = {
    title: string;
    description?: string;
}

export class Reminder implements Package {
    name: string = "reminder";
    recipient: Self;

    properties: ReminderProperties;

    constructor(recipient: Self, properties: ReminderProperties) {
        this.properties = properties;
        this.recipient = recipient;
    }
}
