import {test as base,expect} from '@playwright/test'
import { ForgetPasswordPage } from '../pages/forgetPassword'

const test = base.extend({
    forgetPasswordPage:async({page},use)=>{
        const forgetPasswordPage = new ForgetPasswordPage(page)
        await forgetPasswordPage.goTo()
        await use(forgetPasswordPage)
    }
})

test('Verify blank email field error message',async({forgetPasswordPage})=>{
    await forgetPasswordPage.continueWithoutInput()
    await expect(forgetPasswordPage.emailError).toBeVisible()
})