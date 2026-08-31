import {test as base,expect} from '@playwright/test'
import { SponsorPage } from '../pages/sponsor'

const test = base.extend({
    sponsorPage : async({page}, use)=>{
        const sponsorPage = new SponsorPage(page)
        await sponsorPage.goTo()
        await use(sponsorPage)
    }
})

test('Verify error message on blank sponsor input',async({sponsorPage})=>{
    await sponsorPage.continueWithoutSponsor()
    await expect(sponsorPage.blankSponsorError).toBeVisible()
})

test('Verify error message on invalid sponsor input',async({sponsorPage})=>{
    await sponsorPage.continueWithSponsor('notExist')
    await expect(sponsorPage.invalidSponsorErrorFirst).toBeVisible()
    await expect(sponsorPage.invalidSponsorErrorSecond).toBeVisible()
})

test('Verify valid sponsor behaviour',async({sponsorPage,page})=>{
    await sponsorPage.continueWithSponsor('adarsh2')
    await expect(page).toHaveURL(/sponsor=adarsh2/)
})

test('Verify visual of sponsor page',async({page,sponsorPage})=>{
    await expect(page.getByRole('heading',{name:"Let's get started quickly"})).toBeVisible()
    await expect(page).toHaveScreenshot('sponsor-page.png')
})

test('Verify login page redirection',async({sponsorPage,page})=>{
    await sponsorPage.loginButton.click()
    await page.waitForURL(/login/)
    await expect(page.getByRole('heading',{name:'Get started with MPROFY'})).toBeVisible()
})

test('Sponsor field should handle long sponsor input gracefully',async({sponsorPage})=>{
    const longString = 'a'.repeat(60)
    await sponsorPage.continueWithSponsor(`${longString}`)
    await expect(sponsorPage.invalidSponsorErrorFirst).toBeVisible()
    await expect(sponsorPage.invalidSponsorErrorSecond).toBeVisible()
})