# SoberKey.org

A decentralized recovery community platform built on the Nostr protocol. SoberKey provides a safe, censorship-resistant space exclusively for recovery support and sobriety content.

![SoberKey](https://img.shields.io/badge/Nostr-Recovery-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

### Recovery-Focused Design
- **40+ Recovery Hashtags** integrated throughout the platform
- **Therapeutic Color Palette** - Calming blues (#1c93d4) and healing greens (#3cb77a)
- **Category Filtering** - All Posts, Programs, Wellness, Community
- **Featured Topics** - Quick access to key recovery themes

### Multi-Relay Architecture
- Queries **7 popular Nostr relays** simultaneously for rich content discovery
- Automatic event deduplication
- No manual relay switching required
- Maximum content availability from across the Nostr network

### Nostr Integration
- **Authentication** - Extension (NIP-07), Secret Key, or Bunker
- **Real-time Feed** - Live updates from the Nostr network
- **Author Profiles** - Display names, avatars, and metadata
- **Decentralized** - No central authority can censor content

### User Experience
- **Mobile-First Design** - Fully responsive across all devices
- **Accessible** - WCAG 2.1 AA compliant with screen reader support
- **Smooth Animations** - Gradient backgrounds, hover effects, transitions
- **Skeleton Loading** - Graceful content loading states

## 🚀 Tech Stack

- **React 18** - Modern React with hooks and concurrent rendering
- **TypeScript** - Type-safe development
- **Nostrify** - Nostr protocol implementation
- **TanStack Query** - Data fetching and caching
- **shadcn/ui** - Accessible UI components
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/spe1020/soberkey-org.git
cd soberkey-org

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔧 Configuration

### Relay Configuration
The app queries these Nostr relays by default:
- relay.nostr.band
- relay.damus.io
- relay.primal.net
- nos.lol
- relay.snort.social
- nostr.wine
- relay.mostr.pub

To modify relays, edit `/src/pages/Index.tsx`:

```typescript
const RECOVERY_RELAYS = [
  'wss://your-relay.com',
  // Add more relays...
];
```

### Theme Customization
Colors are defined in `/src/index.css` using CSS custom properties:

```css
:root {
  --primary: 195 85% 45%;     /* Calming blue */
  --secondary: 155 60% 50%;   /* Healing green */
  /* ... more color variables */
}
```

## 📚 Recovery Hashtags

The platform focuses on these recovery-related topics:

### Primary Recovery
`#recovery` `#sobriety` `#addiction` `#soberlife` `#odaat` `#recoveryispossible` `#soberliving` `#addictionrecovery` `#mentalhealth`

### Programs
`#12steps` `#aa` `#na` `#smartrecovery` `#celebraterecovery`

### Community
`#recoverycommunity` `#sober` `#cleanandserene` `#recoverywarrior` `#wedorecover` `#keepcoming` `#progressnotperfection`

### Substance-Specific
`#alcoholfree` `#drugfree` `#substanceabuse` `#opioidrecovery`

### Wellness
`#selfcare` `#healing` `#hope` `#gratitude` `#mindfulness` `#mentalhealthmatters` `#breakthestigma` `#youarenotalone`

## 🏗️ Project Structure

```
soberkey-org/
├── src/
│   ├── components/       # React components
│   │   ├── auth/        # Login/signup components
│   │   ├── ui/          # shadcn/ui components
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── contexts/        # React context providers
│   ├── lib/             # Utility functions
│   └── main.tsx         # App entry point
├── public/              # Static assets
├── docs/                # Documentation
└── package.json         # Dependencies
```

## 🤝 Contributing

Contributions are welcome! This is a community-driven platform.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📖 Documentation

- **Nostr Protocol**: [nostr.com](https://nostr.com)
- **NIP-01**: Text Notes
- **NIP-07**: Browser Extension Signer
- **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com)

## 🙏 Acknowledgments

- Built with [MKStack](https://soapbox.pub/mkstack)
- Powered by the Nostr protocol
- Inspired by the global recovery community

## ⚠️ Disclaimer

SoberKey is a community-driven platform. All content is created by users. If you're struggling with addiction or mental health issues, please reach out to professional help services in your area.

### Resources
- SAMHSA National Helpline: 1-800-662-4357
- Crisis Text Line: Text HOME to 741741
- National Suicide Prevention Lifeline: 988

## 📄 License

MIT License - see LICENSE file for details

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/spe1020/soberkey-org/issues)
- **Discussions**: [GitHub Discussions](https://github.com/spe1020/soberkey-org/discussions)

---

**One day at a time, together** 💙💚
