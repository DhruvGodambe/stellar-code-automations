import {test as base,expect} from '@playwright/test'
import { ForgetPasswordPage } from '../pages/forgetPassword'
import { exec } from 'node:child_process'

const test = base.extend({
    forgetPasswordPage:async({page},use)=>{
        const forgetPasswordPage = new ForgetPasswordPage(page)
        await forgetPasswordPage.goTo()
        await use(forgetPasswordPage)
    }
})

test('Verify blank email field error message',async({forgetPasswordPage})=>{
    await forgetPasswordPage.continueWithoutInput()
    await expect(forgetPasswordPage.blankEmailError).toBeVisible()
})

test('Verify error message on invalid email',async({forgetPasswordPage})=>{
    await forgetPasswordPage.continueWithInput('johndoegmai.com')
    await expect(forgetPasswordPage.invalidEmailError).toBeVisible()
})

test('Verify email field behaviour on long email input',async({forgetPasswordPage})=>{
    const longString = 'a'.repeat(100)
    await forgetPasswordPage.continueWithInput(`${longString}@gmail.com`)
    await expect(forgetPasswordPage.invalidEmailAlert).toBeVisible()
})

test('Verify page behaviour on valid email input',async({forgetPasswordPage})=>{
    await forgetPasswordPage.continueWithInput('test@example.com')
    await expect(forgetPasswordPage.validEmailAlert).toBeVisible()
})

test('Verify visual of page',async({page,forgetPasswordPage})=>{
    await expect(forgetPasswordPage.pageHeading).toBeVisible()
    if(process.env.CI){
        await expect(page).toHaveScreenshot('forget-password-page-cicd.png')
    }else{
        await expect(page).toHaveScreenshot('forget-password-page.png')
    }
})