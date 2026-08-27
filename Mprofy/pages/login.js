class LoginPage{
    /**
     * @param {import('@playwright/test').Page} page
    */

    constructor(page){
        this.page = page
        this.emailInput = page.getByRole('textbox',{name:'Enter your email'})
        this.passwordInput = page.getByRole('textbox',{name:'Enter your password'})
        this.loginButton = page.getByRole('button',{name:'Login'})
        this.emailError = page.getByText('Email is required')
        this.passwordError = page.getByText('Password is required')
        this.passwordToggleIcon = page.locator('svg').last()
        this.forgotPasswordLink = page.getByRole('link',{name:'Forgot Password?'})
        this.signUpLink = page.getByText('Signup')
        this.importAccountLink = page.getByText('Import Account →')
    }

    async goTo(){
        await this.page.goto('/login')
    }

    async login(email,password){
        await this.emailInput.fill(email)
        await this.passwordInput.fill(password)
        await this.loginButton.click()
    }

    async loginWithoutFilling(){
        await this.loginButton.click()
    }
}

module.exports = {LoginPage}