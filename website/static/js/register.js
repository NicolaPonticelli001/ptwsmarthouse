let name = new Input("name-general-container")
let surname = new Input("surname-general-container")
let telephone = new Input("telephone-general-container")
let email_input = new Input("email-general-container")
let email_confirm_input = new Input("email-confirm-general-container")
let password_input = new Password("password-general-container")
let password_confirm_input = new Password("password-confirm-general-container")

email_input.setConfirmationInputs([email_confirm_input])
email_confirm_input.setConfirmationInputs([email_input])
password_input.setConfirmationInputs([password_confirm_input])
password_confirm_input.setConfirmationInputs([password_input])

let input_array =  []
input_array.push(
  name,
  surname,
  telephone,
  email_input,
  email_confirm_input,
  password_input,
  password_confirm_input
)
let form = new Form("register-form", input_array)
