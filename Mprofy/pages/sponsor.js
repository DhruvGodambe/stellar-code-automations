class SponsorPage{
    /**
     * @param {import('@playwright/test').Page} page
    */

    constructor(page){
        this.page = page
        this.sponsorInput = page.getByRole('textbox',{name:'Enter Sponsor ID or Referral username'})
        this.continueButton = page.getByRole('button',{name:'Continue'})
        this.loginButton = page.getByRole('link',{name:'Login'})
        this.blankSponsorError = page.getByText('Sponsor ID is required')
        this.invalidSponsorErrorFirst = page.getByText('Invalid sponsor code').first()
        this.invalidSponsorErrorSecond = page.getByText('Invalid sponsor code').last()
    }

    async goTo(){
        await this.page.goto('/sponsor')
    }

    async continueWithSponsor(sponsor){
        await this.sponsorInput.fill(sponsor)
        await this.continueButton.click()
    }

    async continueWithoutSponsor(){
        await this.continueButton.click()
    }
}

module.exports = {SponsorPage}