# HNTR Automation Testing

Automation test suite for HNTR platform QA — covering functional, regression, and end-to-end testing.

## 🔗 Project Info
- **Live App:** https://hntr-web-nextjs.vercel.app/
- **Purpose:** Automated QA testing for HNTR Membership & Compensation Plan features
- **Tech Stack:** Playwright + JavaScript

## 📁 Project Structure
hntr/<br>
├── tests/ # Test spec files<br>
├── pages/ # Page Object Model files<br>
├── fixtures/ # Test data / fixtures<br>
├── utils/ # Helper functions<br>
└── README.md<br>

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- npm or yarn

### Installation
```bash
npm install
```

### Running Tests
```bash
npx playwright test
```

### Running Tests in UI Mode
```bash
npx playwright test --ui
```

## 🧪 Test Coverage
- [ ] Login / Wallet connection flow
- [ ] Membership plan features
- [ ] Compensation plan validation
- [ ] Transaction testing (Sepolia testnet)

## 👤 Author
Adarsh — QA Automation Intern

## 📝 Notes
Testing done using MetaMask wallet on Sepolia testnet with test USDC/ETH.