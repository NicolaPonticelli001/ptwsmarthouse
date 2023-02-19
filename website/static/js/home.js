window.addEventListener("load", homeBodyLoad)

let json_str = '{ "1":{"name":"casa 1","stanze":{"1":{"name":"stanza 1","devices":{"1":{"name":"device 1","type":"son/off"}}},"2":{"name":"stanza 2","devices":{"1":{"name":"device 1","type":"son/off"}}}}}, "2":{"name":"casa 2","stanze":{"1":{"name":"stanza 1","devices":{"2":{"name":"device 2","type":"son/off"}}}}} }'
let json_parsed = JSON.parse(json_str)

function homeBodyLoad() {
  let obj_array_id_value_option //Contains
  obj_array_id_value_option = getHouses()
  let select_house = new SelectElement("select-house", obj_array_id_value_option)
  obj_array_id_value_option = getRooms(select_house.getValueTextSelected().value)
  let select_room = new SelectElement("select-room", obj_array_id_value_option, false)
}

function getRooms(idHouse) {
  let objArray = []
  for (let id_room of Object.keys(json_parsed[idHouse]["stanze"])) {
    let obj = json_parsed[idHouse]["stanze"][id_room]
    let to_push = { id:id_room,name:obj["name"]}
    objArray.push(to_push)
  }
  return objArray
}
function getHouses() {
   let objArray = []
   for (let id_house of Object.keys(json_parsed)) {
     let obj = json_parsed[id_house]
     let to_push = { id:id_house,name:obj["name"]}
     objArray.push(to_push)
   }
   return objArray
 }
