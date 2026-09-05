class ForgetPasswordPage{
    /**
     * @param {import('@playwright/test').Page} page
     */

    constructor(page){
        this.page = page
        this.emailInput = page.getByRole('textbox',{name:'johndoe@company.com'})
        this.continueButton = page.getByRole('button',{name:'Continue'})
        this.blankEmailError = page.getByText('Email is required')
        this.invalidEmailError = page.getByText('Invalid email')
        this.invalidEmailAlert = page.getByText('The email must be a valid email address.').first()
        this.validEmailAlert = page.getByText('If the email exists, a password reset link has been sent.')
        this.pageHeading = page.getByRole('heading',{name:'Forget Password'})
    }

    async goTo(){
        await this.page.goto('/forget-password')
    }

    async continueWithInput(email){
        await this.emailInput.fill(email)
        await this.continueButton.click()
    }

    async continueWithoutInput(){
        await this.continueButton.click()
    }
}

module.exports = {ForgetPasswordPage}