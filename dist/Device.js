import React, {
  useEffect,
  useRef,
  useState
} from "../_snowpack/pkg/react.js";
import {Link, useRouteMatch} from "../_snowpack/pkg/react-router-dom.js";
import {useDevice} from "./device-cache.js";
import {CodeInput} from "./CodeInput.js";
import {db} from "./db.js";
import {useSocket} from "./puck-stuff.js";
import {assert, Bubble} from "./util.js";
import {useLiveQuery} from "../_snowpack/pkg/dexie-react-hooks.js";
import Mqt from "../_snowpack/pkg/mqt.js";
export const DEVICE_ROUTE = "/\u2192/:id/:name";
const CHANNEL_NAME = "test";
export const DEVICE_INFO_ROUTE = DEVICE_ROUTE + "/info";
export const Device = () => {
  const route = useRouteMatch(DEVICE_ROUTE);
  assert(route);
  const urlId = decodeURIComponent(route.params.id);
  const deviceQuery = useLiveQuery(() => db.devices.get(urlId), []);
  const [device, reconnect, clear] = useDevice(route.params.name);
  const {send, output, error, state} = useSocket(device);
  const main = useRef(null);
  const [sess] = useState(() => db.sessions.add({
    deviceId: urlId,
    createdAt: Date.now(),
    content: ""
  }));
  const [prev, setPrev] = useState("");
  useEffect(() => {
    const results = db.sessions.where("deviceId").equals(urlId).sortBy("createdAt");
    results.then((r) => {
      const join = r.map((result) => result.content).filter(Boolean).join("\n");
      setPrev(join);
    });
  }, []);
  useEffect(() => {
    if (main.current) {
      main.current.scrollTo({
        top: main.current.scrollHeight - main.current.clientHeight,
        behavior: "smooth"
      });
    }
    sess.then((id) => db.sessions.update(id, {content: output})).then(() => console.log("updated session"));
  }, [prev, output]);
  const [mqq] = useState(() => new Mqt("wss://mqtt.remotehack.space"));
  const [mqChannel, setMqChannel] = useState("channel");
  const [mqChannelConnect, setMqChannelConnect] = useState();
  const submitChannel = () => {
    setMqChannelConnect(mqChannel);
  };
  const ref = useRef(send);
  ref.current = send;
  const [mq] = useState(() => new Mqt("wss://mqtt.remotehack.space"));
  useEffect(() => {
    console.log("subscribing to mqtt");
    mq.subscribe(CHANNEL_NAME, (message) => {
      ref.current(message);
    });
  }, []);
  useEffect(() => {
    if (output.slice(-7).includes("HEY")) {
      mq.publish(CHANNEL_NAME, "hello()");
    }
  }, [output]);
  const [expanded, setExpanded] = useState(false);
  if (!device) {
    return /* @__PURE__ */ React.createElement("div", {
      className: "m-4 p-4 bg-yellow-400 rounded-md shadow-lg"
    }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Link, {
      className: "p-4 hover:text-blue-600",
      to: "/"
    }, "\u2190"), "connection lost"), /* @__PURE__ */ React.createElement("button", {
      className: "m-4 text-xl hover:text-blue-600",
      onClick: reconnect
    }, "Reconnect ", decodeURIComponent(route.params.name), " "));
  }
  return /* @__PURE__ */ React.createElement("section", {
    className: "h-full flex flex-col"
  }, /* @__PURE__ */ React.createElement("header", {
    className: "bg-black text-white p-4 flex items-center justify-between cursor-pointer focus:outline-none",
    tabIndex: -1,
    onClick: () => setExpanded((prev2) => !prev2)
  }, /* @__PURE__ */ React.createElement(Link, {
    className: "px-4 py-2 hover:text-blue-600",
    to: "/"
  }, "\u2190"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Bubble, {
    name: deviceQuery?.id
  })), /* @__PURE__ */ React.createElement("p", {
    className: "px-4 text-xl font-mono flex-1"
  }, deviceQuery?.nickname ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, deviceQuery?.nickname), /* @__PURE__ */ React.createElement("span", {
    className: "text-xs px-3"
  }, device.name)) : device.name)), expanded && /* @__PURE__ */ React.createElement("div", {
    className: "bg-gray-800 text-white p-8"
  }, /* @__PURE__ */ React.createElement(Details, {
    id: decodeURIComponent(route.params.id),
    send
  })), /* @__PURE__ */ React.createElement("main", {
    ref: main,
    className: "flex-1 font-mono whitespace-pre-wrap p-4 overflow-scroll"
  }, /* @__PURE__ */ React.createElement("span", {
    className: "text-gray-400"
  }, prev), output), error && /* @__PURE__ */ React.createElement("p", {
    className: "m-4 bg-red-100 text-red-500 rounded-md p-2 flex items-center"
  }, error || "Error", /* @__PURE__ */ React.createElement("button", {
    className: " p-2 rounded-md block bg-red-200 hover:bg-red-300",
    onClick: clear
  }, "Reconnect")), /* @__PURE__ */ React.createElement("footer", null, /* @__PURE__ */ React.createElement(CodeInput, {
    onChange: send
  })));
};
const Details = ({id, send}) => {
  const deviceQuery = useLiveQuery(() => db.devices.get(id), []);
  const setNickname = (e) => {
    const nickname = e.currentTarget.value;
    db.devices.update(id, {nickname});
  };
  const initMQTT = () => {
    send("reset();");
    send(`
    setWatch(() => console.log("HEY"), BTN, {repeat:true});
function hello() {
    LED1.set()
    if (process.env.BOARD === "BANGLEJS") Bangle.buzz();
    setTimeout(() => {
        LED1.reset()
    }, 1000)
}
`);
  };
  return /* @__PURE__ */ React.createElement("form", {
    onSubmit: (e) => e.preventDefault()
  }, /* @__PURE__ */ React.createElement("label", {
    className: "flex"
  }, /* @__PURE__ */ React.createElement("span", {
    className: "p-2"
  }, "nickname"), /* @__PURE__ */ React.createElement("input", {
    type: "text",
    className: "text-black p-2",
    value: deviceQuery?.nickname || "",
    onChange: setNickname
  })), /* @__PURE__ */ React.createElement("button", {
    className: "my-8 p-2 bg-blue-500 w-full ",
    onClick: initMQTT
  }, "Init MQTT & Reset()"));
};