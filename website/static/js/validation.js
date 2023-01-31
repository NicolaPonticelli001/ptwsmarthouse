//The "inputElement" class represent a generic input of the form. It has a validation
//method that test the single properties of the input (such as pattern, type, required etc).
//The real validation is implemented in the "formValidation" class
class inputElement {
  #inputElement //element input
  #invalidDivMessage //element div
  #isValid //boolean
  #deleteBtn //element button

  #validityCheckingsFunctions //arrays of functions
  #validityErrorMessages //arrays of strings with string index

  constructor(inputElement) {
    this.inputElement = inputElement //put the element
    this.invalidDivMessage = document.querySelector('#'+this.inputElement.id+'-invalid-feedback') //get the empty div where error messages are displayed
    this.isValid = false //state of the input (if it is valid or not, for quick validity check)
    this.deleteBtn = document.querySelector('#delete-'+this.inputElement.id) //button element that delete the input content
    this.initializeValidityArrays() //set the validation properties of the element
  }

  //Run all the functions stored inside "validityCheckingsFunctions" array.
  //The string result is used as string index to display the errore message (not here)
  checkAllValidityProperties() {
    let result = ''

    if (!this.inputElement.checkValidity()) {
      result = 'unknown'
      for(let func of this.validityCheckingsFunctions) {
        if (func() != '') {
          result = func()
          break;
        }
      }
    }
    //Set boolean if the form is valid
    if (result != '') this.isValid = false
    else this.isValid = true
    return result
  }

  //Set the error messages displayed in invalid div and the property to check.
  //The elements inside the two arrays are generated in relation to the
  //HTML5 standard input validation tags (required, min, max, etc).
  //The function that check the single property is stored as array element inside "validityCheckingsFunctions".
  //The result of this functions is the name of the item inside "validityErrorMessages" (Objects array with string index and string element)
  //The items in the tow arrays are inserted in the order of execution of the tests for the validation (the first thing to test is
  //if the input is null, then if the pattern is respected, etc).
  initializeValidityArrays() {
    this.validityErrorMessages = new Array()
    this.validityCheckingsFunctions = new Array()

    if (this.inputElement.hasAttribute('required')) {
      this.validityErrorMessages['required'] = 'Cannot be empty'
      this.validityCheckingsFunctions.push(() => {if (this.inputElement.validity.valueMissing) return 'required'; else return ''})
    } else this.isValid = true
    if (this.inputElement.hasAttribute('pattern')) {
      this.validityErrorMessages['pattern'] = 'Incorrect syntax'
      this.validityCheckingsFunctions.push(() => {if (this.inputElement.validity.patternMismatch) return 'pattern'; else return ''})
    }
    this.validityErrorMessages['type'] = 'It is not '+this.inputElement.getAttribute('type')
    this.validityCheckingsFunctions.push(() => {if (this.inputElement.validity.typeMismatch) return 'type'; else return ''})
    if (this.inputElement.hasAttribute('minLength')) {
      this.validityErrorMessages['minLength'] = 'The characters must be at least '+this.inputElement.getAttribute('minLength')
      this.validityCheckingsFunctions.push(() => {if (this.inputElement.validity.tooShort) return 'minLength'; else return ''})
    }
    if (this.inputElement.hasAttribute('maxLength')) {
      this.validityErrorMessages['maxLength'] = 'The characters must be at most '+this.inputElement.getAttribute('maxLength')
      this.validityCheckingsFunctions.push(() => {if (this.inputElement.validity.tooLong) return 'maxLength'; else return ''})
    }
    if (this.inputElement.hasAttribute('max')) {
      this.validityErrorMessages['max'] = 'Value too big, must be less than or equal to '+this.inputElement.getAttribute('max')
      this.validityCheckingsFunctions.push(() => {if (this.inputElement.validity.rangeOverflow) return 'max'; else return ''})
    }
    if (this.inputElement.hasAttribute('min')) {
      this.validityErrorMessages['min'] = 'Value too small, must be greater or equal to '+this.inputElement.getAttribute('min')
      this.validityCheckingsFunctions.push(() => {if (this.inputElement.validity.rangeUnderflow) return 'min'; else return ''})
    }
    if (this.inputElement.hasAttribute('step')) {
      this.validityErrorMessages['step'] = 'Must follow the number of step '+this.inputElement.getAttribute('step')
      this.validityCheckingsFunctions.push(() => {if (this.inputElement.validity.stepMismatch) return 'step'; else return ''})
    }
    this.validityErrorMessages['unknown'] = 'Invalid value'
  }

  //Set the invalid style following the bootstrap 5.3 standard and set the message of invalid div
  setInvalidStyle(errorMessage) {
    this.inputElement.classList.remove('is-valid')
    this.inputElement.classList.add('is-invalid')
    this.invalidDivMessage.innerHTML = this.validityErrorMessages[errorMessage]
  }

  //Set the valid style following the bootstrap 5.3 standard
  setValidStyle() {
    this.inputElement.classList.remove('is-invalid')
    this.inputElement.classList.add('is-valid')
  }

  /* START RETURN FUNCTIONS
  These functions return the variables of the object.
  The class itself does not implement the full validation operations (they are
  implemented in "formValidation" class), so these variables are necessary to add
  listeners and make others operation
  */
  getIsValid() {
    return this.isValid;
  }
  getInputElement() {
    return this.inputElement
  }
  getDeleteBtn() {
    return this.deleteBtn
  }
  /* END RETURN FUNCTIONS */
}

//This class implement the full validation operation
class formValidation {
  #form //element form
  #submitBtn //element button
  #inputs //aray of class objects

  constructor(form) {
    let formId = form.getAttribute('id') //get the id value of the form
    this.form = form //initialize the form variable
    this.submitBtn = document.querySelector('[data-formId='+formId+'][type=\'submit\']') //get the right submit button
    this.inputs = new Array()
    document.querySelectorAll('input[data-formId='+formId+']').forEach(input => { //get all the inputs of the form
      this.inputs.push(new inputElement(input)) //create a new object "inputElement" and push it inside the array
      this.inputs[this.inputs.length-1].getDeleteBtn().addEventListener('click', this) //add listener to the delete button of the last input added
      this.inputs[this.inputs.length-1].getInputElement().addEventListener('input', this) //add listener to the last input added
      this.form.addEventListener('submit', this) //add listener to the form
    })
  }

  //Handler of the events
  handleEvent(e) {
    switch(e.type) {
      case 'click':
        this.deleteInputContent(e.originalTarget) //delete the content of input by passing the delete button element
        break
      case 'input':
        this.validateInput(e.originalTarget) //validate the input by passing it
        break
      case 'submit':
        this.validateOnSubmit(e) //validate the form (so the single inputs) and pass the event
        break;
    }
  }

  //This function delete the content of the input.
  //All delete buttons have the pattern "delete-<input id>"
  deleteInputContent(button) {
    let idInput = button.id.substr(7)

    //detect wich button fired the event
    for (let input of this.inputs) {
      if (input.getInputElement().id == idInput) {
        input.getInputElement().value = ''
        this.validateInput(input, true) //The true value means that the input passed is an inputElement objecy, not a string
        break;
      }
    }
  }

  //The function validate the input by calling the specific method of inputElement object.
  //It sets also the style of the single inputs and of the submit button
  validateInput(input, isObject = false) {
    let inputToValidate //inputElement object
    let resultInputValidation //string
    let areAllInputsValid //boolean
    //Obtain the right input object if it's not passed
    if (!isObject) {
      for (inputToValidate of this.inputs) {
        if (inputToValidate.getInputElement() == input) break;
      }
    } else inputToValidate = input
    //Call validate method of the input object. It will return the valide error
    resultInputValidation = inputToValidate.checkAllValidityProperties()
    if (resultInputValidation != '') inputToValidate.setInvalidStyle(resultInputValidation)
    else inputToValidate.setValidStyle()
    //Test if all input are valid in order to enable the submit button
    areAllInputsValid = this.inputs.every(input => {return input.getIsValid()})
    if (areAllInputsValid) this.enableSubmit()
    else this.disableSubmit()
  }

  //This function validate the form when submit button is clicked.
  //Essentially call the "validateInput" function for each input.
  //The only thing is that if any input is not valid than stop the submit
  validateOnSubmit(event) {
    if(!this.form.checkValidity()) {
      event.preventDefault()
      event.stopPropagation()
      this.inputs.forEach(input => {
        this.validateInput(input, true)
      });

    }
  }

  /* START SUBMIT BUTTON FUNCTIONS
  these functions enable or disable the button by setting or removing
  the "required" attribute
  */
  enableSubmit() {
    this.submitBtn.removeAttribute('disabled')
  }

  disableSubmit() {
    this.submitBtn.setAttribute('disabled', '')
  }
  /* END SUBMIT BUTTON FUNCTIONS */
}

const formsValidation = new Array()
Array.from(document.getElementsByTagName('form')).forEach(form => {
  formsValidation.push(new formValidation(form))
})

//This function show or hide the password of a input type password.
//All eyes icon have the id pattern "<input id>-eye"
function togglePassword(passwordInputId) {

  let input = document.getElementById(passwordInputId)
  let eyeIcon = document.getElementById(passwordInputId+'-eye')

  if (input.getAttribute('type') == 'password') {
    input.setAttribute('type', 'text')
    input.setAttribute('placeholder', 'Password visible')
    eyeIcon.setAttribute('class', 'bi bi-eye-slash-fill')
  } else {
    input.setAttribute('type', 'password')
    input.setAttribute('placeholder', 'Password hidden')
    eyeIcon.setAttribute('class', 'bi bi-eye-fill')
  }
}
