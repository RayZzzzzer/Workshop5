import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { Value } from "../types";
import axios from "axios";


export async function node(
  nodeId: number, // the ID of the node
  N: number, // total number of nodes in the network
  F: number, // number of faulty nodes in the network
  initialValue: Value, // initial value of the node
  isFaulty: boolean, // true if the node is faulty, false otherwise
  nodesAreReady: () => boolean, // used to know if all nodes are ready to receive requests
  setNodeIsReady: (index: number) => void // this should be called when the node is started and ready to receive requests
) {
  const node = express();
  node.use(express.json());
  node.use(bodyParser.json());

  type NodeState = {
    killed: boolean;
    x: Value;
    decided: boolean | null;
    k: number | null;
  };

  let state: NodeState = {
    killed: false,
    x: initialValue,
    decided: null,
    k: null
  };

  // TODO implement this
  // this route allows retrieving the current status of the node
  // node.get("/status", (req, res) => {});
  node.get("/status", (req, res) => {
    if (isFaulty) {
      return res.status(500).json({ message: "faulty" });
    }
    return res.status(200).json({ message: "live" });
  });

  // TODO implement this
  // this route allows the node to receive messages from other nodes
  // node.post("/message", (req, res) => {});
  node.post("/message", (req, res) => {
    if (isFaulty || state.killed) {
      return res.status(500).json({ message: "Node is not responding" });
    }
    return res.status(200).json({ message: "Message received" });
  });

  // TODO implement this
  // this route is used to start the consensus algorithm
  // node.get("/start", async (req, res) => {});
  node.get("/start", async (req, res) => {
    if (isFaulty) {
      return res.status(500).json({ message: "Faulty node cannot start" });
    }
  
    console.log(`Node ${nodeId} is starting the consensus process.`);
  
    for (let round = 0; round < 3; round++) {
      console.log(`Round ${round + 1}: Node ${nodeId} is processing...`);
  
      for (let i = 0; i < N; i++) {
        if (i !== nodeId) {
          try {
            await axios.post(`http://localhost:${BASE_NODE_PORT + i}/message`, {
              x: state.x,
              decided: state.decided,
              k: state.k
            });
          } catch (error) {
            console.log(`Error communicating with node ${i}`);
          }
        }
      }
    }
  
    return res.status(200).json({ message: "Consensus process started" });
  });
  

  // TODO implement this
  // this route is used to stop the consensus algorithm
  // node.get("/stop", async (req, res) => {});
  node.get("/stop", (req, res) => {
    state.killed = true;
    res.status(200).json({ message: "Node stopped" });
  });

  // TODO implement this
  // get the current state of a node
  // node.get("/getState", (req, res) => {});
  node.get("/getState", (req, res) => {
    if (isFaulty) {
      return res.json({ killed: false, x: null, decided: null, k: null });
    }
    return res.json(state);
  });

  // start the server
  const server = node.listen(BASE_NODE_PORT + nodeId, async () => {
    console.log(
      `Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`
    );

    // the node is ready
    setNodeIsReady(nodeId);
  });

  return server;
  }
