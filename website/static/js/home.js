window.addEventListener("load", homeBodyLoad)
// = '{ "1":{"name":"casa 1","stanze":{"1":{"name":"stanza 1","devices":{"1":{"name":"device 1","type":"son/off"}}},"2":{"name":"stanza 2","devices":{"2":{"name":"device 2","type":"son/off"}}}}}, "2":{"name":"casa 2","stanze":{"1":{"name":"stanza 1","devices":{"3":{"name":"device 3","type":"son/off"}}}}} }'
let timeout_value = 2500
let timeout
// Object with the key names that are inside the json received. If the json structure change
// then it only needs to change the names here. in this way the code is less dependent from json key names
let json_keys = {
  house_name: "name",
  rooms_array_name: "stanze",
  room_name: "name",
  devices_array_name: "devices",
  device_name: "name",
  device_type: "type"
}
let json_parsed
let select_house
let select_room
let rooms_obj

function homeBodyLoad() {
  const xhttp = new XMLHttpRequest()
  xhttp.onload = function() {
    let str = '{"1":{"name": "Casa al mare", "stanze": {"1": {"name": "Saloon", "devices": {"10": {"name": "ESP-SmartTv", "type": "Smart ON/OFF"}}}, "6": {"name": "bathroom", "devices": {"11": {"name": "Arduino-Termostato", "type": "Smart Regulation"}}}}}, "2": {"name": "Casa", "stanze": {"2": {"name": "kitchen", "devices": {"12": {"name": "Smart-Fridge", "type": "Smart List"}, "14": {"name": "Smart-AirConditioner", "type": "Smart Regulation"}}}, "3": {"name": "saloon", "devices": {"13": {"name": "ESP-SmartTv", "type": "Smart ON/OFF"}}}}}, "4": {"name": "Mountain house", "stanze": {"7": {"name": "cucina", "devices": {"18": {"name": "ArduinoSolarPanel", "type": "Smart Report"}}}}}}'
    json_parsed = JSON.parse(this.responseText)

    // Set the two select
    let obj_array_id_value_option
    obj_array_id_value_option = getHouses()   // Get the houses info to be inserted in the house select
    select_house = new SelectElement("select-house", obj_array_id_value_option) // Create the object and updating the select
    obj_array_id_value_option = getRooms(select_house.getSelectedValue())   // Get the rooms info of the selected house. They will be inserted in the room select
    select_room = new SelectElement("select-room", obj_array_id_value_option, false)  // Create the object and updating the select. The boolean value means that the constructor does not select the first value

    // Set the device list
    rooms_obj = displayRoomsAndDevices(json_parsed[select_house.getSelectedValue()][json_keys.rooms_array_name])
    
    // Listener for each status button of the devices
    for (let room of rooms_obj) {
      for (let device of room.getDevices()) {
        device.getDeviceButton().addEventListener("click", function() { changeStatus(device) })
      }
    }

    //Listener that update the room select and the device list when the user select a different house
    select_house.getSelectElement().addEventListener(
      "change",
      function() {
        clearTimeout(timeout)
        changeHouseSelection(select_house.getSelectedValue(), select_room)  // Update the option elements of the room select with the right data
        document.getElementById("list").innerHTML = ""  // Delete the device list content
        rooms_obj = displayRoomsAndDevices(json_parsed[select_house.getSelectedValue()][json_keys.rooms_array_name])  //The device list is regenerated with the right devices
        // Listener for each status button of the devices
        for (let room of rooms_obj) {
          for (let device of room.getDevices()) {
            device.getDeviceButton().addEventListener("click", function() { changeStatus(device) })
            console.log(device.getDeviceButton())
          }
        }
        getDevicesStatus()
    })

    // Listener that show and hide the rooms inside the device list (the room is a containers in which there are the devices)
    select_room.getSelectElement().addEventListener(
      "change",
      function() {
        changeRoomView(select_room.getSelectedValue(), rooms_obj) // Hide the room containers and show the selected one
    })

    getDevicesStatus()
  }
  xhttp.open("POST", "/home/userHomeSelection")
  xhttp.send()
}

// /device/publish status: "on" oppure "off" - device: id_device
function changeStatus(device) {
  console.log("change status of device " + device.getDeviceName())
  const xhttp = new XMLHttpRequest()
  const form_data = new FormData()
  form_data.append("status", (device.getStatus()) ? "on" : "off")   //If the current status is off then turn the device on
  form_data.append("device", device.getDeviceId())
  
  xhttp.onload = function() {
    console.log(JSON.parse(this.responseText).status)
  }
  
  xhttp.open("POST", "/device/publish")
  xhttp.send(form_data)
}


// /home/getstatus
function getDevicesStatus() {
  const xhttp = new XMLHttpRequest()
  const form_data = new FormData()
  form_data.append("house", select_house.getSelectedValue())
  xhttp.onload = function() {

    //let str_status = '{"1": {"10": false}, "6": {"11": false}, "2": {"12": false, "14": false}, "3": {"13": false}, "7": {"18": false}}'
    let json_status = JSON.parse(this.responseText)
    console.log(json_status)

    for (let room of rooms_obj) {
      for (let device of room.getDevices()) {
        if (json_status[room.getRoomId()][device.getDeviceId()] == "1") {
          device.setDeviceBtnOn()
        } else device.setDeviceBtnOff()
      }
    }
    timeout = setTimeout(getDevicesStatus, timeout_value)
  }
  xhttp.open("POST", "/home/getStatus")
  xhttp.send(form_data)
}

// Display the selected room container and hide the others
function changeRoomView(idRoomToShow, rooms_obj) {
  for (let room of rooms_obj) {
    if (idRoomToShow == "all") room.showRoom()
    else {
      if (room.getRoomId() == idRoomToShow) room.showRoom()
      else room.hideRoom()
    }
  }
}

// Create the rooms and associated devices objects using the appropriate classes.
// After created, the devices are appended inside the right room container.
function displayRoomsAndDevices(rooms) {
  let rooms_obj = []
  for (let room_id in rooms) {
    let room = new Room(
      document.getElementById("room-template"),
      document.getElementById("list"),
      rooms[room_id][json_keys.room_name],
      room_id
    )
    rooms_obj.push(room)
    let devices = rooms[room_id][json_keys.devices_array_name]
    for (let device_id in devices) {
      let device_obj = new Device(
        document.getElementById("device-template"),
        document.getElementById("devices-"+room_id),
        devices[device_id][json_keys.device_name],
        device_id,
        devices[device_id][json_keys.device]
      )
      rooms_obj[rooms_obj.length-1].addDevice(device_obj)
    }
  }
  return rooms_obj
}

// Change the options of the room select with the right ones that belong
// to the house selected
function changeHouseSelection(houseValue, selectRoomObj) {
  selectRoomObj.setOptionElements(getRooms(houseValue))
}

// Get the id and name of the rooms that have to be inserted as options of the room select.
// The id key is the value of the attribute "value" and the name key is the value of the option text content
// (it is the one that has to be shown to the user)
function getRooms(idHouse) {
  let objArray = []
  objArray.push({ id:"all",name:"all"})
  for (let id_room of Object.keys(json_parsed[idHouse][json_keys.rooms_array_name])) {
    let obj = json_parsed[idHouse][json_keys.rooms_array_name][id_room]
    let to_push = { id:id_room,name:obj[json_keys.room_name]}
    objArray.push(to_push)
  }
  return objArray
}

// Get the id and the name of the houses that have to be inserted as options of the house select.
// The id key is the value of the attribute "value" and the name key is the value of the option text content
// (it is the text that has to be shown to the user)
function getHouses() {
   let objArray = []
   for (let id_house of Object.keys(json_parsed)) {
     let obj = json_parsed[id_house]
     let to_push = { id:id_house,name:obj[json_keys.house_name]}
     objArray.push(to_push)
   }
   return objArray
 }
