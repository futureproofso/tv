export type Recipient = Self | Everyone | Array<Peer>;

export const EVERYONE_ADDRESS = "0xEVERYONE";
export const SELF_ADDRESS = "0xSELF";

export class Self {
    address: string = SELF_ADDRESS;
}

export class Everyone {
    address: string = EVERYONE_ADDRESS;
}

export class Peer {
    address: string;

    constructor(address: string) {
        this.address = address;
    }
}
