import { Recipient } from "../recipient";

export interface Package {
    name: string;
    recipient: Recipient;
    properties: any;
}
