class TemplateElement {
  #element_container
  #template_cloned_content

  constructor(elementTemplate, elementContainer, jsonObj) {
    this.element_container = elementContainer
    this.template_cloned_content = elementTemplate.content.cloneNode(true)
  }

  appendTemplate() {
    this.element_container.appendChild(this.template_cloned_content)
  }

  deleteContainerContent() {
    this.element_container.innerHTML = ""
  }

  getElementContainer() {
    return this.element_container
  }

  getTemplateClonedContent() {
    return this.template_cloned_content
  }
}

class NetworkElement extends TemplateElement {

  #elements_parse_data
  #elements_complete_id
  #network_number
  #delete_buttons
  #info_box
  #form_element

  constructor(elementTemplate, elementContainer, networkNumber) {
    super(elementTemplate, elementContainer)
    this.network_number = networkNumber
    this.elements_complete_id = super.getTemplateClonedContent().querySelectorAll("[data-completeId]")
    this.elements_parse_data = super.getTemplateClonedContent().querySelectorAll("[data-parseData]")
    this.delete_buttons = super.getTemplateClonedContent().querySelectorAll(".delete-btn")
    this.info_box = super.getTemplateClonedContent().querySelector("#infoBox")
    this.form_element = super.getTemplateClonedContent().querySelector("form")
  }

  attachSingleJsonObj(jsonObj) {
    for (let i = 0; i < Object.keys(jsonObj).length; i++) {
      let actualElement = this.elements_parse_data[i]
      actualElement.textContent = jsonObj[actualElement.getAttribute("data-parseData")]
      actualElement.removeAttribute("data-parseData")
    }

    for (let i = 0; i < this.elements_complete_id.length; i++) {
      let actualElement = this.elements_complete_id[i]
      actualElement.id += "-" + this.network_number
      actualElement.removeAttribute("data-completeId")
    }

    for (let button of this.delete_buttons) button.addEventListener("click", function(e) { deleteInput(e.target || e.srcElement) })
    super.appendTemplate()
  }

  getFormElement() { return this.form_element }
  getNetworkNumber() { return this.network_number }

}
