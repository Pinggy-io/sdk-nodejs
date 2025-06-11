import { Pinggy } from "./core/pinggy";
import { PinggyOptions } from "./types";

// // Example usage
// const options: PinggyOptions = {
//   forwardTo: "localhost:3000",
//   sniServerName: "t.pinggy.io",
//   // token: process.env.TUNNEL_TOKEN_SUB,
// };

// const tunnel = new PinggySDK(options);

// console.log("Server Address:", tunnel.getServerAddress());
// console.log("SNI Server Name:", tunnel.getSniServerName());
// // console.log("Token:", tunnel.getToken());

// tunnel.startTunnel();

// // Start web debugging after 2 seconds
// // setTimeout(() => {
// //   tunnel.startWebDebugging(3001);
// // }, 1000);

// tunnel.startWebDebugging(8081);

// // Request additional forwarding after 2 seconds
// // tunnel.tunnelRequestAdditionalForwarding(
// //   "pompom.abhijitmondal.in",
// //   "localhost:4000"
// // );

// // console.log(tunnel.getLastException());

// // To do:
// // On C side, threadlocal variable (global variable but local to thread)
// // select/poll
// // handle exception

// // 18.02.2025
// // try to check if nodejs is running the processes on different threads
// // check how to read threadlocal variable in nodejs

const pinggy = new Pinggy();
export default pinggy;
export type { PinggyOptions };

// on master