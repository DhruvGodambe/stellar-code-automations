class ForgetPasswordPage{
    /**
     * @param {import('@playwright/test').Page} page
     */

    constructor(page){
        this.page = page
        this.emailInput = page.getByRole('textbox',{name:'johndoe@company.com'})
        this.continueButton = page.getByRole('button',{name:'Continue'})
        this.emailError = page.getByText('Email is required')
    }

    async goTo(){
        await this.page.goto('/forget-password')
    }

    async continueWithoutInput(){
        await this.continueButton.click()
    }
}

module.exports = {ForgetPasswordPage}