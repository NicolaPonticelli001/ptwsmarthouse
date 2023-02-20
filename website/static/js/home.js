window.addEventListener("load", homeBodyLoad)
// = '{ "1":{"name":"casa 1","stanze":{"1":{"name":"stanza 1","devices":{"1":{"name":"device 1","type":"son/off"}}},"2":{"name":"stanza 2","devices":{"2":{"name":"device 2","type":"son/off"}}}}}, "2":{"name":"casa 2","stanze":{"1":{"name":"stanza 1","devices":{"3":{"name":"device 3","type":"son/off"}}}}} }'

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

function homeBodyLoad() {
  const xhttp = new XMLHttpRequest()
  xhttp.onload = function() {
    let json_parsed = JSON.parse(this.responseText)

    // Set the two select
    let obj_array_id_value_option
    obj_array_id_value_option = getHouses()   // Get the houses info to be inserted in the house select
    let select_house = new SelectElement("select-house", obj_array_id_value_option) // Create the object and updating the select
    obj_array_id_value_option = getRooms(select_house.getSelectedValue())   // Get the rooms info of the selected house. They will be inserted in the room select
    let select_room = new SelectElement("select-room", obj_array_id_value_option, false)  // Create the object and updating the select. The boolean value means that the constructor does not select the first value

    // Set the device list
    let rooms_obj = displayRoomsAndDevices(json_parsed[select_house.getSelectedValue()][json_keys.rooms_array_name])

    //Listener that update the room select and the device list when the user select a different house
    select_house.getSelectElement().addEventListener(
      "change",
      function() {
        changeHouseSelection(select_house.getSelectedValue(), select_room)  // Update the option elements of the room select with the right data
        document.getElementById("list").innerHTML = ""  // Delete the device list content
        rooms_obj = displayRoomsAndDevices(json_parsed[select_house.getSelectedValue()][json_keys.rooms_array_name])  //The device list is regenerated with the right devices
    })

    // Listener that show and hide the rooms inside the device list (the room is a containers in which there are the devices)
    select_room.getSelectElement().addEventListener(
      "change",
      function() {
        changeRoomView(select_room.getSelectedValue(), rooms_obj) // Hide the room containers and show the selected one
    })
  }
  xhttp.open("POST", "/home/userHomeSelection")
  xhttp.send()
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
