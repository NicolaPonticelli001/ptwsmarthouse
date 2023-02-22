class Input {
  #general_container
  #input_element
  #has_delete_button
  #delete_button
  #is_valid_value
  #confirm_inputs

  constructor(idGeneralContainer, hasDeleteBtn = true) {
    this.is_valid_value = false
    this.confirm_inputs = []
    this.general_container = document.getElementById(idGeneralContainer)
    this.input_element = this.general_container.querySelector("input")

    if (hasDeleteBtn) {
      this.delete_button = this.general_container.querySelector('[data-btn-action="delete-input"]')
      this.delete_button.addEventListener("click", this.deleteInput.bind(this))
      this.has_delete_button = true
    } else this.has_delete_button = false
    this.input_element.addEventListener("input", this.validateInput.bind(this))

  }

  validateInput(additionalBoolValues = []) {
    this.is_valid_value = this.input_element.checkValidity()
    if (additionalBoolValues.length != 0) {
      for (let value in additionalBoolValues) this.is_valid_value = (this.is_valid_value && value)
    }
    if (this.confirm_inputs.length != 0) {
      for (let input of this.confirm_inputs) {
        this.is_valid_value = (this.is_valid_value && (this.getInputValue() == input.getInputValue()))
        input.toggleValidStyle(this.is_valid_value)
      }
    }
    this.toggleValidStyle()
  }

  toggleValidStyle(setValid = "empty") {
    console.log(setValid)
    let toggleToBoolean
    if (setValid != "empty") toggleToBoolean = setValid
    else toggleToBoolean = this.is_valid_value

    if (toggleToBoolean) {
      this.input_element.classList.remove("is-invalid")
      this.input_element.classList.add("is-valid")
      this.is_valid_value = true
    } else {
      this.input_element.classList.remove("is-valid")
      this.input_element.classList.add("is-invalid")
      this.is_valid_value = false
    }

  }

  deleteInput() {
    this.input_element.value = ""
    this.validateInput()
  }

  setConfirmationInputs(inputObjs) { this.confirm_inputs = inputObjs }
  getGeneralContainer() { return this.general_container }
  getInputElement() { return this.input_element }
  getInputValue() { return this.input_element.value }
  getDeleteButton() {
    if (this.has_delete_button) return this.delete_button
    else return false
  }
  getIsValidValue() { return this.is_valid_value }
}

class Password extends Input {
  #show_button

  constructor(idGeneralContainer, hasDeleteBtn = true) {
    super(idGeneralContainer, hasDeleteBtn)
    this.show_button = super.getGeneralContainer().querySelector('[data-btn-action="show-password"]')
    this.show_button.addEventListener("click", this.showPassword.bind(this))
  }

  showPassword() {
    let attr_type = super.getInputElement().getAttribute("type")
    let input_element = super.getInputElement()
    if (attr_type == "password") {
      input_element.setAttribute("type", "text")
      input_element.setAttribute("placeholder", "Password is visible")
    } else {
      input_element.setAttribute("type", "password")
      input_element.setAttribute("placeholder", "Password is hidden")
    }
  }
}

class Form {
  #form_element
  #submit_button
  #input_objects

  constructor(formId, inputObjs) {
    this.form_element = document.getElementById(formId)
    this.submit_button = this.form_element.querySelector('[type="submit"]')
    this.submit_button.addEventListener("submit", function(e) { e.preventDefault(); this.validateForm.bind(this) })
    this.input_objects = inputObjs
    for (let input of inputObjs) {
      input.getInputElement().addEventListener("input", this.validateForm.bind(this))
      if (input.getDeleteButton()) input.getDeleteButton().addEventListener("click", this.validateForm.bind(this))
    }
  }

  validateForm(additionalBoolValues = []) {
    let formValidation = true;
    for (let input of this.input_objects) formValidation = (input.getIsValidValue() && formValidation)
    if (additionalBoolValues.length != 0) {
      for (let value in additionalBoolValues) formValidation = (formValidation && value)
    }
    if (formValidation) this.submit_button.removeAttribute("disabled")
    else this.submit_button.setAttribute("disabled", "")
  }
}

class Template {
  #element_container
  #cloned_content

  constructor(elementTemplate, elementContainer) {
    this.element_container = elementContainer
    this.cloned_content = elementTemplate.content.cloneNode(true)
  }

  appendTemplate() { this.element_container.appendChild(this.cloned_content) }
  deleteContainerContent() { this.element_container.innerHTML = "" }

  getElementContainer() { return this.element_container }
  getClonedContentAsFragment() { return this.cloned_content }
  getClonedContentAsElement() { return this.cloned_content }
}

class Room extends Template {
  #room_name
  #room_id
  #devices_obj
  #room_html_element

  constructor(elementTemplate, elementContainer, roomName, roomId) {
    super(elementTemplate, elementContainer)
    this.room_name = roomName
    this.room_id = roomId
    this.completeElementsId()
    this.parseDataElements()
    super.appendTemplate()
    this.devices_obj = []
    this.room_html_element = elementContainer.querySelector("#room-"+roomId)
  }

  completeElementsId() {
    let elements = super.getClonedContentAsFragment().querySelectorAll("[data-completeId]")
    for (let element of elements) {
      element.id += this.room_id
      element.removeAttribute("data-completeId")
    }
  }

  parseDataElements() {
    let elements = super.getClonedContentAsFragment().querySelectorAll("[data-parseJsonData]")
    for (let element of elements) {
      switch (element.getAttribute("data-parseJsonData")) {
        case "room-name":
          element.textContent = this.room_name
          break;
      }
      element.removeAttribute("data-parseJsonData")
    }
  }

  hideRoom() { this.room_html_element.classList.add("hide") }
  showRoom() { this.room_html_element.classList.remove("hide") }

  addDevice(deviceObj) { this.devices_obj.push(deviceObj) }
  getDevices() { return this.devices_obj }
  getRoomName() { return this.room_name }
  getRoomId() { return this.room_id }
}

class Device extends Template {
  #device_name
  #device_id
  #device_type
  #device_button
  #status

  constructor(elementTemplate, elementContainer, deviceName, deviceId, deviceType) {
    super(elementTemplate, elementContainer)
    this.device_name = deviceName
    this.device_id = deviceId
    this.device_type = deviceType
    this.completeElementsId()
    this.parseDataElements()
    super.appendTemplate()
  }

  completeElementsId() {
    let elements = super.getClonedContentAsFragment().querySelectorAll("[data-completeId]")
    for (let element of elements) {
      element.id += this.device_id
      element.removeAttribute("data-completeId")
    }
    this.device_button = super.getClonedContentAsFragment().querySelector("#toggle_status-"+this.device_id)
    this.status = false
  }

  parseDataElements() {
    let elements = super.getClonedContentAsFragment().querySelectorAll("[data-parseJsonData]")
    for (let element of elements) {
      switch (element.getAttribute("data-parseJsonData")) {
        case "device-name":
          element.textContent = this.device_name
          break;
      }
      element.removeAttribute("data-parseJsonData")
    }
  }

  setDeviceBtnOn() {
    this.device_button.classList.remove("btn-danger")
    this.device_button.classList.add("btn-success")
    this.device_button.textContent = "ON"
    this.status = true
  }
  setDeviceBtnOff() {
    this.device_button.classList.remove("btn-success")
    this.device_button.classList.add("btn-danger")
    this.device_button.textContent = "OFF"
    this.status = false
  }

  getDeviceName() { return this.device_name }
  getDeviceId() { return this.device_id }
  getDeviceType() { return this.device_type }
  getDeviceButton() { return this.device_button }
  getStatus() { return this.status }
}

class SelectElement {
  #select_element
  #options

  constructor(idSelect, objArrayIdValueOption, setFirstSelected = true) {
    this.select_element = document.getElementById(idSelect)
    this.setOptionElements(objArrayIdValueOption, setFirstSelected)
  }

  setOptionElements(objArrayIdValueOption, setFirstSelected = true) {
    for (let index in this.select_element) this.select_element.remove(index)
    this.options = []
    for (let obj of objArrayIdValueOption) {
      let option = document.createElement("option")
      option.setAttribute("value", obj.id)
      option.textContent = obj.name
      this.options.push(option)
    }
    if (setFirstSelected) this.options[0].setAttribute("selected", "")
    for (let option of this.options) this.select_element.appendChild(option)
  }

  getSelectedText() { return this.select_element.options[this.select_element.selectedIndex].text }
  getSelectedValue() { return this.select_element.options[this.select_element.selectedIndex].value }
  getSelectElement() { return this.select_element }

}

class JsonHousesRoomsDevices {
  #json_obj


  constructor(jsonString) {
    this.json_obj = JSON.parse(jsonString)
  }
}
