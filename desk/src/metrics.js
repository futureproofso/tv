const { InfluxDB, Point } = require("@influxdata/influxdb-client");

const token = process.env.INFLUXDB_TOKEN;
const url = process.env.INFLUXDB_URL;

const config = {
  url,
  token,
};

const nullTransport = {
  send: () => {},
  request: () => {},
  iterate: () => {},
};

const dataPoints = {
  USER_LOGIN: (userId) => {
    return new Point("user_login")
      .tag("app_version", "0.0.5")
      .stringField("user_id", userId)
      .intField("count", 1);
  },
};

class Metrics {
  client;
  writeClient;

  constructor() {
    // pass
  }

  setup(enabled) {
    if (!enabled || !config.url) {
      config.url = "https://futureproof.so";
      config.transport = nullTransport;
    }
    const client = new InfluxDB(config);
    const org = process.env.INFLUXDB_ORG;
    const bucket = process.env.INFLUXDB_BUCKET;
    this.writeClient = client.getWriteApi(org, bucket, "ms");
  }

  userLoggedIn(id) {
    this.writeClient.writePoint(dataPoints.USER_LOGIN(id));
    this.writeClient.flush();
  }
}

module.exports = {
  Metrics,
};
