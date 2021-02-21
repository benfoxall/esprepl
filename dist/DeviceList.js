import React from "../_snowpack/pkg/react.js";
import {requestDevice} from "./puck-stuff.js";
import {toast} from "../_snowpack/pkg/react-toastify.js";
import {generatePath, NavLink} from "../_snowpack/pkg/react-router-dom.js";
import {DEVICE_ROUTE} from "./Device.js";
import {useGradientStyle} from "./util.js";
import {db} from "./db.js";
import {useLiveQuery} from "../_snowpack/pkg/dexie-react-hooks.js";
export const DeviceList = ({
  value,
  onChange
}) => {
  const addDevice = async () => {
    try {
      const device = await requestDevice();
      if (value.includes(device)) {
        toast.warn("already added");
      } else {
        onChange((prev) => prev.concat(device));
        db.devices.add({
          id: device.id,
          name: device.name || "",
          createdAt: Date.now(),
          nickname: "",
          notes: ""
        }, device.id);
      }
    } catch (e) {
      console.warn(e);
    }
  };
  const deviceData = useLiveQuery(() => db.devices.toArray(), []);
  return /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("ul", null, deviceData?.map((data) => /* @__PURE__ */ React.createElement(DeviceListItem, {
    key: data.id,
    device: data
  }))), /* @__PURE__ */ React.createElement("button", {
    className: "rounded-full bg-purple-800 w-12 h-12 hover:bg-purple-700 transition shadow-lg fixed bottom-10 left-1/2 transform -translate-x-1/2 text-white",
    onClick: addDevice
  }, "+"));
};
const DeviceListItem = ({device}) => {
  const link = generatePath(DEVICE_ROUTE, {
    id: device.id,
    name: device.name || "?"
  });
  const background = useGradientStyle(device.id);
  const remove = (e) => {
    e.preventDefault();
    if (confirm("Remove?"))
      db.devices.delete(device.id);
  };
  return /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(NavLink, {
    className: "flex items-center text-gray-900 hover:bg-gray-100",
    to: link,
    key: device.id
  }, /* @__PURE__ */ React.createElement("div", {
    className: "rounded-full bg-gray-800 w-10 h-10 hover:bg-gray-700 transition shadow-md m-5",
    style: background
  }), /* @__PURE__ */ React.createElement("div", {
    className: "flex-1"
  }, /* @__PURE__ */ React.createElement("h2", {
    className: "text-lg"
  }, device.name), /* @__PURE__ */ React.createElement("h3", {
    className: "text-gray-800 text-sm"
  }, "-")), /* @__PURE__ */ React.createElement("button", {
    onClick: remove,
    className: "m-3 h-7 w-7 hover:bg-red-100 text-red-500 p-0 rounded-full flex items-center justify-center"
  }, "\xD7")));
};