import {test as base,expect} from '@playwright/test'
import { LoginPage } from '../pages/login'

const test = base.extend({
    loginPage:async({page},use)=>{
        const loginPage = new LoginPage(page)
        await loginPage.goTo()
        await use(loginPage)
    }
})

test.describe('Positive Testing',()=>{
    test('Valid credentials should log in successfully', async ({ page,loginPage }) => {
        await loginPage.login(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD)
        await expect(page.getByText('Login Successfully !!')).toBeVisible()
    })

    test('Password visibility toggle should work', async ({loginPage}) => {
        await loginPage.passwordInput.fill('MyPassword123')
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password')
        await loginPage.passwordToggleIcon.click()
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'text')
    })

    test('Forgot password page should open/redirect',async({page,loginPage})=>{
        await loginPage.forgotPasswordLink.click()
        await page.waitForURL(/forget-password/)
        await expect(page).toHaveURL(/forget-password/)
    })

    test('Sign up sponsor page should open/redirect',async({page,loginPage})=>{
        await loginPage.signUpLink.click()
        await page.waitForURL(/sponsor/)
        await expect(page).toHaveURL(/sponsor/)
    })

    test('Import account page should open/redirect',async({page,loginPage})=>{
        await loginPage.importAccountLink.click()
        await page.waitForURL(/import-account/)
        await expect(page).toHaveURL(/import-account/)
    })
})

test.describe('Negative Testing',()=>{
    test('Should show validation errors when submitted empty', async({loginPage}) => {
        await loginPage.loginWithoutFilling()
        await expect(loginPage.emailError).toBeVisible()
        await expect(loginPage.passwordError).toBeVisible()
    })

    test('Should show email required error if only password filled', async({loginPage}) => {
        await loginPage.passwordInput.fill('SomePass123')
        await loginPage.loginButton.click()
        await expect(loginPage.emailError).toBeVisible()
    })

    test('Should show password required error if only email filled', async ({loginPage}) => {
        await loginPage.emailInput.fill('test@example.com')
        await loginPage.loginButton.click()
        await expect(loginPage.passwordError).toBeVisible()
    })

    test('Invalid credentials should show error', async ({ page,loginPage }) => {
        await loginPage.login('wrong@example.com', 'wrongpass')
        await expect(page.getByText('Email or Password did not match, Please try again.')).toBeVisible()
    })

    test('Should handle long email/password gracefully', async ({ page, loginPage }) => {
        const longString = 'a'.repeat(60)
        await loginPage.login(`${longString}@example.com`, longString)
        await expect(page.getByText('Email or Password did not match, Please try again.')).toBeVisible()
    })
})
