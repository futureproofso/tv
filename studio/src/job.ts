import { DateTime } from "luxon";
import { Package } from "./packages/base";

type JobSettings = {
    startUnix: number;
    intervalMilliseconds: number;
    limit: number;
}

export class Job {
    id: string;
    packages: Array<Package>;
    settings: JobSettings;
    runCount: number;
    prevRunUnix: number;
    nextRunUnix: number;

    constructor(id: string, packages: Array<Package>, settings: JobSettings) {
        this.id = id;
        this.packages = packages;
        this.settings = settings;
        // TODO: this needs to be coming from persistent storage
        this.runCount = 0;
        this.prevRunUnix = 0;
        this.nextRunUnix = this.settings.startUnix;
    }

    run() {
        let nextRun = DateTime.fromMillis(this.nextRunUnix);
        while (this.runCount < this.settings.limit) {
            if (DateTime.now() > nextRun) {
                this.runCount++;
                this.prevRunUnix = nextRun.toUnixInteger();
                nextRun = nextRun.plus(this.settings.intervalMilliseconds);
                this.nextRunUnix = nextRun.toUnixInteger();
                this.packages.forEach(this.deliverPackage);
            }
        }
    }

    deliverPackage(pkg: Package) {
        console.log(pkg.properties);
    }
}
