# 🎃 Hacktoberfest 2025 | 🥷 Fruit Ninja on Solana with Ephemeral Rollups

<div align="center">

[![Hacktoberfest 2025](https://img.shields.io/badge/Hacktoberfest-2025-orange?style=for-the-badge&logo=hacktoberfest)](https://hacktoberfest.com)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen?style=for-the-badge)](https://opensource.org)
[![Contributors Welcome](https://img.shields.io/badge/Contributors-Welcome-blue?style=for-the-badge)](CONTRIBUTING.md)

![Fruit Ninja Demo](https://img.shields.io/badge/Demo-Live-brightgreen)
![Solana](https://img.shields.io/badge/Solana-Blockchain-purple)
![Ephemeral Rollups](https://img.shields.io/badge/Ephemeral-Rollups-blue)
![Next.js](https://img.shields.io/badge/Next.js-React-black)
![Anchor](https://img.shields.io/badge/Anchor-Framework-orange)

### 🍂 Join Hacktoberfest 2025! 🍂
**A modern, blockchain-powered Fruit Ninja game built on Solana that leverages Ephemeral Rollups technology**

[🚀 Get Started](#-quick-start) • [🐛 Find Issues](#-hacktoberfest-issues) • [🤝 Contribute](#-hacktoberfest-contribution-guide) • [📖 Docs](#-api-reference)

</div>

---

## 🎯 Hacktoberfest 2025 Special

> **🎃 This repository is participating in Hacktoberfest 2025!**
> 
> We have **25+ beginner-friendly issues** ready for contributors. Whether you're a blockchain developer, frontend enthusiast, or documentation writer - there's something for everyone!

### 🏆 Contribution Rewards
- **🥇 Top Contributors**: Special recognition in README
- **🎁 Swag**: Project stickers and certificates
- **💝 NFT Rewards**: Exclusive project NFTs for quality contributions
- **🌟 Learning**: Hands-on experience with Solana & Ephemeral Rollups

---

## 🌟 Project Overview

This project reimagines the classic Fruit Ninja game as a decentralized application (dApp) on Solana, utilizing cutting-edge **Ephemeral Rollups** technology to achieve:

- **⚡ Lightning-fast gameplay** with sub-second transaction finality
- **💰 Minimal transaction costs** through rollup batching
- **🔒 Blockchain security** with on-chain score verification
- **🏆 Global leaderboards** stored immutably on-chain
- **🎮 Seamless UX** that feels like a traditional game

### 🚀 What are Ephemeral Rollups?

Ephemeral Rollups are a revolutionary scaling solution that allows our game to:

1. **Delegate session state** to high-performance validators
2. **Batch multiple game actions** into single transactions
3. **Commit state periodically** to ensure data persistence
4. **Maintain full Solana security** while achieving near-instant responses

This technology enables real-time gaming experiences on blockchain without sacrificing decentralization or security.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Solana Program  │    │ Ephemeral       │
│   (Next.js)     │◄──►│   (Anchor)       │◄──►│ Rollup          │
│                 │    │                  │    │ Validator       │
│ • Game Logic    │    │ • State Mgmt     │    │                 │
│ • Wallet UI     │    │ • Score Verify   │    │ • Fast Commits  │
│ • Canvas Render │    │ • Leaderboards   │    │ • Batching      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## ✨ Key Features

### 🎮 Core Gameplay
- **Intuitive fruit slicing** with mouse/touch controls
- **Combo system** for multiplied scoring
- **Power-ups** including Slow Motion, Freeze Time, and Double Points
- **Lives system** with visual feedback
- **Real-time particle effects** and animations

### 🔗 Blockchain Integration
- **Session delegation** to Ephemeral Rollup validators
- **On-chain score verification** preventing cheating
- **Global leaderboards** with immutable high scores
- **Player profiles** with persistent statistics
- **Gasless gameplay** through session batching

### 🎯 Advanced Features
- **Responsive design** for desktop and mobile
- **Professional UI/UX** with smooth animations
- **Toast notifications** for blockchain actions
- **Error handling** with user-friendly messages
- **Admin panel** for game configuration

## 🛠️ Technology Stack

### Frontend
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)** - Wallet integration

### Blockchain
- **[Solana](https://solana.com/)** - High-performance blockchain
- **[Anchor Framework](https://www.anchor-lang.com/)** - Solana development framework
- **[Ephemeral Rollups SDK](https://github.com/magicblock-labs/ephemeral-rollups-sdk)** - Scaling solution
- **Rust** - Smart contract programming language

### Development Tools
- **[Anchor CLI](https://www.anchor-lang.com/)** - Program deployment
- **[Solana CLI](https://docs.solana.com/cli)** - Blockchain interaction
- **[Yarn](https://yarnpkg.com/)** - Package management

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Node.js 18+** installed
- **Rust and Cargo** installed
- **Solana CLI** installed and configured
- **Anchor CLI** installed
- **Git** for version control
- A **Solana wallet** (Phantom, Solflare, etc.)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/fruitninja-solana.git
cd fruitninja-solana
```

### 2. Install Dependencies

```bash
# Install root dependencies
yarn install

# Install frontend dependencies
cd frontend
yarn install
cd ..
```

### 3. Environment Setup

Create environment files:

```bash
# Root directory
cp .env.example .env

# Frontend directory
cd frontend
cp .env.example .env.local
cd ..
```

Configure your environment variables:

```env
# .env.local (frontend)
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret
```

### 4. Solana Configuration

```bash
# Set Solana to devnet
solana config set --url devnet

# Create a new keypair (if needed)
solana-keygen new

# Airdrop SOL for testing
solana airdrop 2
```

### 5. Build and Deploy Smart Contract

```bash
# Build the Anchor program
anchor build

# Deploy to devnet
anchor deploy

# Update program ID in Anchor.toml if needed
```

### 6. Initialize Game Configuration

```bash
# Run the admin initialization
cd frontend
npm run dev
```

Visit the admin panel at `http://localhost:3000/admin` and initialize the game configuration.

### 7. Start Development

```bash
# Start frontend development server
cd frontend
npm run dev
```

Visit `http://localhost:3000` to play the game!

## 🔧 Development Setup

### Project Structure

```
fruitninja/
├── 📁 frontend/                 # Next.js frontend application
│   ├── 📁 src/
│   │   ├── 📁 app/             # App router pages
│   │   ├── 📁 components/      # React components
│   │   ├── 📁 services/        # Blockchain services
│   │   ├── 📁 types/           # TypeScript definitions
│   │   └── 📁 utils/           # Utility functions
│   └── 📄 package.json
├── 📁 programs/                # Solana programs
│   └── 📁 fruitninja/         # Main game program
│       └── 📁 src/
│           └── 📄 lib.rs       # Program logic
├── 📁 tests/                   # Anchor tests
├── 📄 Anchor.toml             # Anchor configuration
└── 📄 package.json            # Root package.json
```

### Key Components

#### Game Engine ([`frontend/src/app/game/page.tsx`](frontend/src/app/game/page.tsx))
- Main game loop and physics
- Canvas rendering and animations
- Input handling (mouse/touch)
- Blockchain integration for scoring

#### Ephemeral Rollups Integration ([`frontend/src/services/session/sessionService.ts`](frontend/src/services/session/sessionService.ts))
- Session delegation to validators
- Periodic state commits
- Batch transaction processing
- State synchronization

#### Smart Contract ([`programs/fruitninja/src/lib.rs`](programs/fruitninja/src/lib.rs))
- Player profiles and sessions
- Score validation and storage
- Leaderboard management
- Admin configuration

### 🎮 Game Mechanics

#### Ephemeral Rollup Flow

1. **Session Start**: Player starts game, session delegated to ER validator
   ```rust
   pub fn delegate_session(ctx: Context<DelegateSession>) -> Result<()> {
       // Delegate to high-performance validator
   }
   ```

2. **Gameplay**: Actions processed instantly by validator
   ```rust
   pub fn slice_fruit(ctx: Context<SliceFruit>, points: u64) -> Result<()> {
       // Ultra-fast fruit slicing with immediate feedback
   }
   ```

3. **Periodic Commits**: State committed to Solana periodically
   ```rust
   pub fn checkpoint_session(ctx: Context<CheckpointSession>) -> Result<()> {
       // Ensure data persistence without interrupting gameplay
   }
   ```

4. **Session End**: Final state committed and session undelegated
   ```rust
   pub fn undelegate_session(ctx: Context<UndelegateSession>) -> Result<()> {
       // Return full control to Solana with final scores
   }
   ```

## 🧪 Testing

### Run Anchor Tests

```bash
anchor test
```

### Run Frontend Tests

```bash
cd frontend
npm run test
```

### Manual Testing Flow

1. **Connect Wallet** - Use Phantom or Solflare
2. **Create Profile** - Set username for leaderboard
3. **Start Game** - Delegate session to ER validator
4. **Play Game** - Slice fruits, earn points
5. **End Game** - Commit final score to blockchain
6. **View Scores** - Check leaderboard for rankings

## 📚 API Reference

### Smart Contract Instructions

| Instruction | Description | Accounts Required |
|-------------|-------------|------------------|
| `initialize_profile` | Create player profile | `player_profile`, `player` |
| `initialize_session` | Start new game session | `session`, `player` |
| `delegate_session` | Enable ER for session | `session`, `delegation_program` |
| `slice_fruit` | Record fruit slice | `session`, `config` |
| `lose_life` | Deduct player life | `session` |
| `end_session` | Finalize game session | `session`, `player_profile`, `config` |

### Frontend Services

- **[`sessionService.ts`](frontend/src/services/session/sessionService.ts)** - Game session management
- **[`profileService.ts`](frontend/src/services/profile/profileService.ts)** - Player profile operations
- **[`configService.ts`](frontend/src/services/config/configService.ts)** - Game configuration
- **[`gameActions.ts`](frontend/src/services/game/gameActions.ts)** - Blockchain game actions

---

## 🎃 Hacktoberfest Issues

<div align="center">

### 🌟 **Perfect for Hacktoberfest 2025!** 🌟

[![GitHub issues](https://img.shields.io/github/issues/yourusername/fruitninja-solana?style=for-the-badge&label=Open%20Issues&color=orange)](https://github.com/yourusername/fruitninja-solana/issues)
[![Good First Issues](https://img.shields.io/github/issues/yourusername/fruitninja-solana/good%20first%20issue?style=for-the-badge&label=Good%20First%20Issues&color=green)](https://github.com/yourusername/fruitninja-solana/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

</div>

### 🎯 **Beginner-Friendly Issues** (Good First Issue)

#### 🎨 **Frontend & UI**
- [ ] **[#1] Mobile Touch Controls** - Improve touch responsiveness for mobile devices
- [ ] **[#2] Dark/Light Theme Toggle** - Implement theme switching with localStorage
- [ ] **[#3] Loading Spinners** - Add loading states for blockchain operations
- [ ] **[#4] Fruit Animation Polish** - Enhance slicing animations with CSS/Canvas
- [ ] **[#5] Responsive Navigation** - Mobile-friendly hamburger menu
- [ ] **[#6] Toast Notification System** - Better UX feedback for transactions
- [ ] **[#7] Accessibility Improvements** - ARIA labels and keyboard navigation
- [ ] **[#8] PWA Manifest** - Convert to Progressive Web App
- [ ] **[#9] Error Boundary Component** - Graceful error handling

#### 🎮 **Gameplay Features**
- [ ] **[#10] Combo Visual Effects** - Particle effects for fruit combos
- [ ] **[#11] Sound Effects Integration** - Add audio feedback for slicing
- [ ] **[#12] Power-up Icons** - Visual indicators for active power-ups
- [ ] **[#13] Score Animation** - Animated score counters
- [ ] **[#16] Lives Visual System** - Heart icons for remaining lives

#### 📚 **Documentation**
- [ ] **[#17] Component Documentation** - JSDoc for React components
- [ ] **[#18] API Documentation** - Document all smart contract functions
- [ ] **[#21] Code Comments** - Add inline documentation for complex logic

### 🚀 **Intermediate Issues**

#### ⛓️ **Blockchain Integration**
- [ ] **[#23] Error Recovery** - Handle failed transactions gracefully

#### 🔧 **Performance & Testing**
- [ ] **[#26] Unit Test Coverage** - Jest tests for React components
- [ ] **[#28] Canvas Optimization** - Object pooling for game objects


### 🏷️ Issue Labels Guide

| Label | Description | Difficulty |
|-------|-------------|------------|
| 🟢 `good first issue` | Perfect for newcomers | Beginner |
| 🎨 `frontend` | UI/UX improvements | Beginner-Intermediate |
| ⛓️ `blockchain` | Smart contract work | Intermediate-Advanced |
| 📚 `documentation` | Docs and guides | Beginner |
| 🐛 `bug` | Bug fixes needed | All levels |
| ✨ `enhancement` | New features | Intermediate-Advanced |
| 🚀 `performance` | Optimization tasks | Intermediate |
| 🧪 `testing` | Test coverage | Intermediate |

---

## 🤝 Hacktoberfest Contribution Guide

### 🎯 **How to Contribute**

1. **🍴 Fork the Repository**
   ```bash
   # Click the "Fork" button on GitHub
   git clone https://github.com/YOUR_USERNAME/fruitninja-solana.git
   cd fruitninja-solana
   ```

2. **🌿 Create a Feature Branch**
   ```bash
   git checkout -b hacktoberfest/your-feature-name
   # Example: git checkout -b hacktoberfest/mobile-touch-controls
   ```

3. **🔨 Make Your Changes**
   - Pick an issue from the [Issues tab](https://github.com/yourusername/fruitninja-solana/issues)
   - Comment on the issue to claim it
   - Follow our [coding standards](#code-style-guidelines)
   - Test your changes thoroughly

4. **✅ Test Your Changes**
   ```bash
   # Test smart contracts
   anchor test
   
   # Test frontend
   cd frontend && npm run test
   
   # Run the app locally
   npm run dev
   ```

5. **📝 Commit with Conventional Commits**
   ```bash
   git add .
   git commit -m "feat: add mobile touch controls for better UX"
   # Or: fix:, docs:, style:, refactor:, test:, chore:
   ```

6. **🚀 Submit Pull Request**
   - Push to your fork: `git push origin hacktoberfest/your-feature-name`
   - Create a PR with a clear description
   - Link the related issue: `Fixes #issue-number`
   - Add screenshots for UI changes

### 🏆 **Contribution Guidelines**

#### ✅ **What We're Looking For**
- **🔍 Quality over Quantity** - Well-tested, documented changes
- **🎯 Issue-focused PRs** - One issue per pull request
- **📖 Clear Documentation** - Update docs for new features
- **🧪 Test Coverage** - Add tests for new functionality
- **♿ Accessibility** - Ensure features work for all users

#### ❌ **What to Avoid**
- Spam PRs or low-effort changes
- Breaking existing functionality
- Ignoring code style guidelines
- Submitting without testing

### 🎁 **Recognition for Contributors**

#### 🥇 **Hall of Fame** (Top Contributors)
<!-- Contributors will be added here -->
- 🥇 **@contributor1** - Mobile responsiveness + PWA implementation
- 🥈 **@contributor2** - Comprehensive testing suite
- 🥉 **@contributor3** - Documentation overhaul

#### 🏅 **All Contributors**
<!-- All contributors will be listed here -->
Thanks to these amazing people who have contributed to this project!

### Code Style Guidelines

- **TypeScript**: Use strict typing with proper interfaces
- **React**: Functional components with hooks, proper error boundaries
- **Rust**: Follow Anchor conventions with comprehensive error handling
- **Comments**: Document complex blockchain logic and game mechanics
- **Naming**: Use descriptive names that explain the purpose
- **Testing**: Write unit tests for new features and bug fixes

### 🆘 **Need Help?**

- **💬 Discussions**: Use [GitHub Discussions](https://github.com/yourusername/fruitninja-solana/discussions) for questions
- **🐛 Bug Reports**: Create detailed [GitHub Issues](https://github.com/yourusername/fruitninja-solana/issues)
- **💡 Feature Requests**: Suggest new ideas in [Issues](https://github.com/yourusername/fruitninja-solana/issues)
- **📖 Documentation**: Check our [Wiki](https://github.com/yourusername/fruitninja-solana/wiki)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **🎃 Hacktoberfest 2025** for promoting open source contributions
- **Solana Foundation** for the blockchain infrastructure
- **MagicBlock** for Ephemeral Rollups technology
- **Anchor Framework** for smart contract development
- **React/Next.js** community for frontend tools

## 📞 Support

- **💬 GitHub Discussions**: [Community discussions](https://github.com/yourusername/fruitninja-solana/discussions)
- **🐛 GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/fruitninja-solana/issues)
- **📖 Documentation**: [Check the wiki](https://github.com/yourusername/fruitninja-solana/wiki)
- **🐦 Twitter**: [@YourProject](https://twitter.com/yourproject) for updates

## 🚀 Deployment

### Mainnet Deployment

1. **Configure mainnet**:
   ```bash
   solana config set --url mainnet-beta
   ```

2. **Deploy program**:
   ```bash
   anchor deploy --provider.cluster mainnet
   ```

3. **Update frontend config**:
   ```env
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
   ```

4. **Deploy frontend**:
   ```bash
   cd frontend
   npm run build
   npm run start
   ```

### Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/fruitninja-solana)

---

<div align="center">

## 🎃 **Happy Hacktoberfest 2025!** 🎃

[![Hacktoberfest 2025](https://img.shields.io/badge/Hacktoberfest-2025-orange?style=for-the-badge&logo=hacktoberfest)](https://hacktoberfest.com)

**🥷 Let's slice through code together! ⚔️**

*Built with ❤️ for the Solana ecosystem and the open source community*

</div>