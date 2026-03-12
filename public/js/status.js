function submit() {
    const submit = document.querySelector('input[type=submit]')
    submit.click()
}

document.querySelector('select').addEventListener('change', submit)